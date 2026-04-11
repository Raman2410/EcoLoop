import axiosInstance from "../api/axiosInstance";
import { VOUCHER_ENDPOINTS } from "../api/endpoints";

/**
 * Redeem EcoCoins for a cash voucher.
 * @param {20 | 50 | 100} amount - Voucher value in ₹
 * @returns {Promise<{ success: boolean, voucher: object }>}
 */
export const redeemVoucher = async (amount) => {
  const res = await axiosInstance.post(VOUCHER_ENDPOINTS.REDEEM, { amount });
  return res.data;
};

/**
 * Fetch all vouchers belonging to the logged-in user.
 * @returns {Promise<{ success: boolean, vouchers: object[] }>}
 */
export const getMyVouchers = async () => {
  const res = await axiosInstance.get(VOUCHER_ENDPOINTS.MY_VOUCHERS);
  return res.data;
};
