import voucherService from "../services/voucherService.js";

/**
 * POST /api/vouchers/redeem
 * Body: { amount: 20 | 50 | 100 }
 */
const redeemVoucher = async (req, res) => {
  try {
    const amount = Number(req.body.amount);

    if (!amount || isNaN(amount)) {
      return res.status(400).json({
        success: false,
        message: "amount is required and must be a number (20, 50, or 100).",
      });
    }

    const voucher = await voucherService.redeemVoucher(
      req.user._id.toString(),
      amount
    );

    return res.status(201).json({
      success: true,
      message: "Voucher created successfully!",
      voucher: {
        id: voucher._id,
        code: voucher.code,
        value: voucher.value,
        ecoCoinsUsed: voucher.ecoCoinsUsed,
        expiresAt: voucher.expiresAt,
        isUsed: voucher.isUsed,
        createdAt: voucher.createdAt,
      },
    });
  } catch (err) {
    console.error("redeemVoucher error:", err.message);

    // Known business errors
    if (err.status === 400) {
      return res.status(400).json({
        success: false,
        message: err.message,
        ...(err.code === "INSUFFICIENT_COINS" && {
          code: err.code,
          required: err.required,
          available: err.available,
        }),
      });
    }

    if (err.status === 404) {
      return res.status(404).json({ success: false, message: err.message });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error. Please try again.",
    });
  }
};

/**
 * GET /api/vouchers/my
 */
const getMyVouchers = async (req, res) => {
  try {
    const vouchers = await voucherService.getUserVouchers(
      req.user._id.toString()
    );
    return res.json({ success: true, vouchers });
  } catch (err) {
    console.error("getMyVouchers error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error. Please try again.",
    });
  }
};

export default {
  redeemVoucher,
  getMyVouchers,
};
