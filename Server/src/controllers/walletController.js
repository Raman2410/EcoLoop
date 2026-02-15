import walletService from "../services/walletService.js";

const getWallet = async (req, res) => {
  try {
    const wallet = await walletService.getWallet(req.user.id);
    res.json(wallet);
  } catch (err) {
    console.error("Get wallet error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export default {
  getWallet,
};
