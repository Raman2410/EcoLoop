import axiosInstance from "../api/axiosInstance";
import { WALLET_ENDPOINTS } from "../api/endpoints";

export const getWalletDetails = async () => {
  const res = await axiosInstance.get(WALLET_ENDPOINTS.DETAILS);
  return res.data;
};
