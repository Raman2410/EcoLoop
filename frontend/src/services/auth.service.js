import axiosInstance from "../api/axiosInstance";
import { AUTH_ENDPOINTS } from "../api/endpoints";

export const loginUser = async (data) => {
  const res = await axiosInstance.post(AUTH_ENDPOINTS.LOGIN, data);
  return res.data;
};

export const registerUser = async (data) => {
  const res = await axiosInstance.post(AUTH_ENDPOINTS.REGISTER, data);
  return res.data;
};
