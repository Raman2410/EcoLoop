const baseUrl = process.env.API_BASE_URL || "http://localhost:3000";

if (typeof fetch !== "function") {
  console.error("Global fetch is not available. Use Node 18+ to run this test.");
  process.exit(1);
}

const jsonHeaders = {
  "Content-Type": "application/json",
};

const randomEmail = (prefix) => {
  const rand = Math.floor(Math.random() * 10000);
  return `${prefix}.${Date.now()}.${rand}@example.com`;
};

const randomPhone = () => {
  const rand = Math.floor(Math.random() * 10000000000);
  return rand.toString().padStart(10, '0');
};

const request = async (method, path, { token, body } = {}) => {
  const headers = { ...jsonHeaders };
  if (!body) {
    delete headers["Content-Type"];
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await res.json() : await res.text();

  return { status: res.status, data };
};

const expectStatus = (res, expected, name) => {
  const ok = Array.isArray(expected) ? expected.includes(res.status) : res.status === expected;
  if (!ok) {
    const details = typeof res.data === "string" ? res.data : JSON.stringify(res.data);
    throw new Error(`${name} failed with status ${res.status}. Response: ${details}`);
  }
};

const run = async () => {
  console.log(`API Smoke Test -> ${baseUrl}`);
  console.log("Testing Unified Role-Based Authentication System\n");

  // 0. Setup: Clean and seed database
  try {
    const mongoose = await import("mongoose");
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/ecoloop";
    await mongoose.default.connect(mongoUri);
    
    // Import models with new naming convention
    const { default: ScrapPrice } = await import("../models/ScrapPrice.model.js");
    const { default: User } = await import("../models/User.model.js");
    const { default: Pickup } = await import("../models/Pickup.model.js");
    
    // Clean up previous test data
    console.log("🧹 Cleaning up previous test data...");
    await User.deleteMany({ email: /@example\.com$/ });
    await Pickup.deleteMany({});
    console.log("✓ Test data cleaned\n");
    
    // Find or create admin
    let adminUser = await User.findOne({ role: "admin" });
    if (!adminUser) {
      const bcrypt = await import("bcryptjs");
      adminUser = await User.create({
        name: "System Admin",
        email: "admin@ecoloop.system",
        password: await bcrypt.default.hash("AdminPass123", 10),
        role: "admin",
      });
    }
    
    // Seed scrap prices
    const scrapTypes = ["PLASTIC", "PAPER", "CARDBOARD"];
    const defaultPrices = { PLASTIC: 15, PAPER: 8, CARDBOARD: 5 };
    
    for (const scrapType of scrapTypes) {
      const existing = await ScrapPrice.findOne({ scrapType });
      if (!existing) {
        await ScrapPrice.create({
          scrapType,
          pricePerKg: defaultPrices[scrapType],
          updatedBy: adminUser._id,
        });
      }
    }
    
    await mongoose.default.disconnect();
    console.log("✓ Database seeded (admin + scrap prices)\n");
  } catch (seedError) {
    console.error("Seeding warning:", seedError.message);
  }

  // 1. Health Check
  console.log("=== HEALTH CHECK ===");
  const rootRes = await request("GET", "/");
  expectStatus(rootRes, 200, "GET /");
  console.log("✓ GET /\n");

  // 2. Test Unified Registration Endpoint (User)
  console.log("=== UNIFIED REGISTRATION (USER) ===");
  const userEmail = randomEmail("user");
  const userPassword = "StrongPass123";
  const regUserRes = await request("POST", "/api/auth/register", {
    body: { 
      name: "Test User", 
      email: userEmail, 
      password: userPassword,
      role: "user"
    },
  });
  expectStatus(regUserRes, 201, "POST /api/auth/register (user)");
  const userToken = regUserRes.data?.token;
  const userRole = regUserRes.data?.role;
  if (!userToken) {
    throw new Error("User registration did not return a token.");
  }
  if (userRole !== "user") {
    throw new Error(`Expected role 'user', got '${userRole}'`);
  }
  console.log("✓ POST /api/auth/register (role: user)");
  console.log(`  User ID: ${regUserRes.data._id}`);
  console.log(`  Role: ${userRole}\n`);

  // 3. Test Unified Login Endpoint (User)
  console.log("=== UNIFIED LOGIN (USER) ===");
  const loginUserRes = await request("POST", "/api/auth/login", {
    body: { email: userEmail, password: userPassword },
  });
  expectStatus(loginUserRes, 200, "POST /api/auth/login (user)");
  const userLoginToken = loginUserRes.data?.token;
  if (!userLoginToken) {
    throw new Error("User login did not return a token.");
  }
  if (loginUserRes.data.role !== "user") {
    throw new Error(`Expected role 'user', got '${loginUserRes.data.role}'`);
  }
  console.log("✓ POST /api/auth/login (user)");
  console.log(`  Role: ${loginUserRes.data.role}`);
  console.log(`  EcoCoins: ${loginUserRes.data.ecoCoins}\n`);

  // 4. Test Unified Registration Endpoint (Collector)
  console.log("=== UNIFIED REGISTRATION (COLLECTOR) ===");
  const collectorEmail = randomEmail("collector");
  const collectorPassword = "StrongPass123";
  const collectorPhone = randomPhone(); // Generate random phone number
  const regCollectorRes = await request("POST", "/api/auth/register", {
    body: {
      name: "Test Collector",
      email: collectorEmail,
      password: collectorPassword,
      role: "collector",
      phone: collectorPhone,
      businessName: "Green Recycling Co",
      serviceArea: "Downtown District",
      vehicleType: "truck",
      vehicleNumber: "ECO-2024"
    },
  });
  expectStatus(regCollectorRes, 201, "POST /api/auth/register (collector)");
  const collectorUserId = regCollectorRes.data?.userId;
  const collectorRole = regCollectorRes.data?.role;

  if (!collectorUserId) {
    throw new Error("Collector registration did not return userId.");
  }

  if (collectorRole !== "collector") {
    throw new Error(`Expected role 'collector', got '${collectorRole}'`);
  }

  if (regCollectorRes.data?.isVerified !== false) {
    throw new Error("Collector should be unverified after registration.");
  }

  console.log("✓ POST /api/auth/register (role: collector)");
  console.log(`  Collector UserId: ${collectorUserId}`);
  console.log(`  Role: ${collectorRole}`);
  console.log(`  Verified: ${regCollectorRes.data.isVerified}\n`);

  console.log("=== INVALID OTP TEST (COLLECTOR) ===");

  const invalidOtpRes = await request("POST", "/api/auth/verify-otp", {
    body: {
      userId: collectorUserId,
      otp: "000000",
    },
  });

  expectStatus(invalidOtpRes, 400, "POST /api/auth/verify-otp (invalid otp)");
  console.log("✓ Invalid OTP rejected\n");

  // 5. OTP VERIFICATION (COLLECTOR)
  console.log("=== OTP VERIFICATION (COLLECTOR) ===");

  const mongoose = await import("mongoose");
  const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/ecoloop";
  await mongoose.default.connect(mongoUri);
  const { default: User } = await import("../models/User.model.js");

  // Fetch OTP directly from DB (test-only)
  const collectorFromDb = await User.findById(collectorUserId);
  if (!collectorFromDb?.otp) {
    throw new Error("OTP not found in DB for collector.");
  }

  const otp = collectorFromDb.otp;
  await mongoose.default.disconnect();

  // Verify OTP
  const verifyOtpRes = await request("POST", "/api/auth/verify-otp", {
    body: {
      userId: collectorUserId,
      otp,
    },
  });

  expectStatus(verifyOtpRes, 200, "POST /api/auth/verify-otp");

  // Token is issued ONLY here
  const collectorLoginToken = verifyOtpRes.data?.token;
  if (!collectorLoginToken) {
    throw new Error("OTP verification did not return a token.");
  }

  console.log("✓ OTP verified successfully");
  console.log("✓ Collector token issued\n");


  // 6. Test Legacy Endpoints (Backward Compatibility)
  console.log("=== LEGACY ENDPOINTS (BACKWARD COMPATIBILITY) ===");
  
  const legacyUserEmail = randomEmail("legacy-user");
  const legacyUserRes = await request("POST", "/api/auth/register/user", {
    body: { 
      name: "Legacy User", 
      email: legacyUserEmail, 
      password: "LegacyPass123"
    },
  });
  expectStatus(legacyUserRes, 201, "POST /api/auth/register/user");
  console.log("✓ POST /api/auth/register/user (legacy endpoint works)");
  
  const legacyLoginRes = await request("POST", "/api/auth/login/user", {
    body: { email: legacyUserEmail, password: "LegacyPass123" },
  });
  expectStatus(legacyLoginRes, 200, "POST /api/auth/login/user");
  console.log("✓ POST /api/auth/login/user (legacy endpoint works)\n");

  // 7. Create Pickup
  console.log("=== PICKUP WORKFLOW ===");
  const scheduledDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const createPickupRes = await request("POST", "/api/pickups", {
    token: userLoginToken,
    body: {
      scrapType: "plastic",
      approxLoad: "small",
      address: "123 Main St",
      scheduledDate,
    },
  });
  expectStatus(createPickupRes, 201, "POST /api/pickups");
  const pickupId = createPickupRes.data?._id;
  if (!pickupId) {
    throw new Error("Pickup creation did not return an id.");
  }
  console.log("✓ POST /api/pickups");
  console.log(`  Pickup ID: ${pickupId}\n`);

  // 8. Get My Pickups
  const myPickupsRes = await request("GET", "/api/pickups/my", {
    token: userLoginToken,
  });
  expectStatus(myPickupsRes, 200, "GET /api/pickups/my");
  if (!Array.isArray(myPickupsRes.data)) {
    throw new Error("My pickups response is not an array.");
  }
  console.log("✓ GET /api/pickups/my");
  console.log(`  Total pickups: ${myPickupsRes.data.length}\n`);

  // 9. Get Pending Pickups (Collector)
  const pendingRes = await request("GET", "/api/pickups/pending", {
    token: collectorLoginToken,
  });
  expectStatus(pendingRes, 200, "GET /api/pickups/pending");
  console.log("✓ GET /api/pickups/pending");
  console.log(`  Pending pickups: ${pendingRes.data.length}\n`);

  // 10. Accept Pickup
  const acceptRes = await request("PUT", `/api/pickups/accept/${pickupId}`, {
    token: collectorLoginToken,
  });
  expectStatus(acceptRes, 200, "PUT /api/pickups/accept/:id");
  console.log("✓ PUT /api/pickups/accept/:id\n");

  // 11. Complete Pickup
  const completeRes = await request("PATCH", `/api/pickups/complete/${pickupId}`, {
    token: collectorLoginToken,
  });
  expectStatus(completeRes, 200, "PATCH /api/pickups/complete/:id");
  console.log("✓ PATCH /api/pickups/complete/:id\n");

  // 12. Get Wallet
  console.log("=== WALLET ===");
  const walletRes = await request("GET", "/api/wallet", {
    token: userLoginToken,
  });
  expectStatus(walletRes, 200, "GET /api/wallet");
  console.log("✓ GET /api/wallet");
  console.log(`  Balance: ₹${walletRes.data.balance || 0}\n`);

  // 13. Test Unified Logout (User)
  console.log("=== UNIFIED LOGOUT (USER) ===");
  const userLogoutRes = await request("POST", "/api/auth/logout", {
    token: userLoginToken,
  });
  expectStatus(userLogoutRes, 200, "POST /api/auth/logout (user)");
  console.log("✓ POST /api/auth/logout (user)\n");

  // 14. Verify User Token Invalid After Logout
  const walletAfterLogoutRes = await request("GET", "/api/wallet", {
    token: userLoginToken,
  });
  if (walletAfterLogoutRes.status === 200) {
    throw new Error("User token still valid after logout (EXPECTED FAILURE)");
  }
  console.log("✓ User token invalidated after logout\n");

  // 15. Test Unified Logout (Collector)
  console.log("=== UNIFIED LOGOUT (COLLECTOR) ===");
  const collectorLogoutRes = await request("POST", "/api/auth/logout", {
    token: collectorLoginToken,
  });
  expectStatus(collectorLogoutRes, 200, "POST /api/auth/logout (collector)");
  console.log("✓ POST /api/auth/logout (collector)\n");

  // 16. Verify Collector Token Invalid After Logout
  const pendingAfterLogoutRes = await request("GET", "/api/pickups/pending", {
    token: collectorLoginToken,
  });
  if (pendingAfterLogoutRes.status === 200) {
    throw new Error("Collector token still valid after logout (EXPECTED FAILURE)");
  }
  console.log("✓ Collector token invalidated after logout\n");

  // 17. Test Legacy Logout Endpoints
  console.log("=== LEGACY LOGOUT ENDPOINTS ===");
  const legacyUserToken = legacyLoginRes.data?.token;
  const legacyLogoutRes = await request("POST", "/api/auth/logout/user", {
    token: legacyUserToken,
  });
  expectStatus(legacyLogoutRes, 200, "POST /api/auth/logout/user");
  console.log("✓ POST /api/auth/logout/user (legacy endpoint works)\n");

  // 18. Test Role Validation
  console.log("=== ROLE VALIDATION TESTS ===");
  
  // Try to register collector without required fields
  const invalidCollectorRes = await request("POST", "/api/auth/register", {
    body: {
      name: "Invalid Collector",
      email: randomEmail("invalid"),
      password: "Pass123456",
      role: "collector"
      // Missing: businessName, serviceArea, vehicleType, vehicleNumber, phone
    },
  });
  expectStatus(invalidCollectorRes, 400, "POST /api/auth/register (invalid collector)");
  console.log("✓ Collector registration validates required fields");
  console.log(`  Error: ${invalidCollectorRes.data.message}\n`);

  // Try to register with invalid vehicle type
  const invalidVehicleRes = await request("POST", "/api/auth/register", {
    body: {
      name: "Invalid Vehicle",
      email: randomEmail("invalid-vehicle"),
      password: "Pass123456",
      role: "collector",
      phone: randomPhone(),
      businessName: "Test Business",
      serviceArea: "Zone A",
      vehicleType: "airplane", // Invalid
      vehicleNumber: "XYZ-123"
    },
  });
  expectStatus(invalidVehicleRes, 400, "POST /api/auth/register (invalid vehicle)");
  console.log("✓ Vehicle type validation works");
  console.log(`  Error: ${invalidVehicleRes.data.message}\n`);

  console.log("=".repeat(50));
  console.log("✅ ALL API SMOKE TESTS PASSED!");
  console.log("=".repeat(50));
  console.log("\nSummary:");
  console.log("• Unified registration endpoint: ✓");
  console.log("• Unified login endpoint: ✓");
  console.log("• Unified logout endpoint: ✓");
  console.log("• Role-based field validation: ✓");
  console.log("• Collector verification flow: ✓");
  console.log("• Legacy endpoint compatibility: ✓");
  console.log("• Token invalidation: ✓");
  console.log("• Pickup workflow: ✓");
  console.log("• Wallet operations: ✓");
};

run().catch((err) => {
  console.error("\n❌ TEST FAILED:");
  console.error(err.message || err);
  process.exit(1);
});