// import axios from "./utils/axios"; // or your axios config
import axiosInstance from "../api/axiosInstance";

export const createPickup = async (data) => {
  const res = await axiosInstance.post("/pickups", data);
  return res.data;
};

export const getMyPickups = async () => {
  const res = await axiosInstance.get("/pickups/my");
  return res.data;
};
export const getAllPickups = async () => {
  const res = await axiosInstance.get("/pickups");
  return res.data;
};

export const cancelPickup = async (pickupId) => {
  const res = await axiosInstance.patch(`/pickups/cancel/${pickupId}`);
  return res.data;
};