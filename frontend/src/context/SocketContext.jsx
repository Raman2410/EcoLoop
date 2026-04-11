import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import { useAuthContext } from "./AuthContext";

const SocketContext = createContext(null);

const SOCKET_URL =
  import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:3000";

export const SocketProvider = ({ children }) => {
  const { user } = useAuthContext();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  // Registry of external listeners for "new-pickup".
  // Components call subscribeToNewPickup() to register a callback,
  // and the returned cleanup removes it.
  const newPickupListenersRef = useRef(new Set());

  const subscribeToNewPickup = useCallback((fn) => {
    newPickupListenersRef.current.add(fn);
    return () => newPickupListenersRef.current.delete(fn);
  }, []);

  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setConnected(false);
      }
      return;
    }

    // Determine Socket URL: Try to extract from VITE_API_URL or fallback to origin
    let socketUrl = SOCKET_URL;
    if (!import.meta.env.VITE_API_URL && window.location.origin.includes("localhost")) {
      socketUrl = "http://localhost:8000";
    }

    console.log("[Socket] Attempting connection to:", socketUrl);

    const socket = io(socketUrl, {
      path: "/api/socket.io", // Matches backend and passes through most proxies
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      console.log("[Socket] Connected:", socket.id);

      // Register by ID (private room) — every logged-in user should have this
      const userId = user._id || user.id;
      if (userId) {
        socket.emit("register-user", userId);
        console.log(`[Socket] Registered user room for: ${userId}`);
      }

      // Register by Area (collector only)
      if (user.role === "collector") {
        const areas = user.serviceAreas?.length
          ? user.serviceAreas
          : user.serviceArea
          ? [user.serviceArea]
          : [];
        if (areas.length > 0) {
          socket.emit("register-collector", areas);
          console.log("[Socket] Registered collector areas:", areas);
        }
      }
    });

    socket.on("connect_error", (err) => {
      console.error("[Socket] Connection error:", err.message);
    });

    socket.on("disconnect", (reason) => {
      setConnected(false);
      console.log("[Socket] Disconnected:", reason);
    });

    // ── Collectors: log events ───────────────────────────────────────────────
    socket.on("new-pickup", (payload) => {
      console.log("[Socket] EVENT: new-pickup", payload);
      const { scrapType, approxLoad, area } = payload;
      toast(`📦 New pickup in ${area}: ${scrapType} (${approxLoad} load)`, {
        duration: 8000,
        icon: "🔔",
      });
      newPickupListenersRef.current.forEach((fn) => {
        try { fn(payload); } catch (err) { console.error(err); }
      });
    });

    // ── Users: log events ────────────────────────────────────────────────────
    socket.on("pickup-accepted", (data) => {
      console.log("[Socket] EVENT: pickup-accepted", data);
      const { collectorName } = data;
      toast.success(`✅ ${collectorName} accepted your pickup!`, { duration: 6000 });
    });

    socket.on("otp-generated", (data) => {
      console.log("[Socket] EVENT: otp-generated", data);
      const { otp } = data;
      if (otp) {
        toast(
          (t) => (
            <div className="flex flex-col gap-1">
              <span className="font-bold text-gray-800">🚛 Collector has arrived!</span>
              <span className="text-gray-600">
                Your Pickup OTP is: <span className="text-2xl font-black tracking-widest text-green-600 bg-green-50 px-2 py-1 rounded ml-1">{otp}</span>
              </span>
              <span className="text-xs text-gray-500 mt-1">Provide this code to your collector to verify the pickup.</span>
            </div>
          ),
          { duration: 40000, id: "otp-toast" }
        );
      }
    });

    socket.on("pickup-completed", (data) => {
      console.log("[Socket] EVENT: pickup-completed", data);
      const { ecoCoinsEarned } = data;
      toast.success(`🌱 Pickup complete! +${ecoCoinsEarned} EcoCoins earned.`, { duration: 8000 });
    });

    return () => {
      console.log("[Socket] Cleaning up connection...");
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [user]);

  return (
    <SocketContext.Provider
      value={{
        socketRef,
        connected,
        subscribeToNewPickup,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used within SocketProvider");
  return ctx;
};
