// import axios from "./utils/axios"; // or your axios config
import axiosInstance from "../api/axiosInstance";

export const createPickup = async (data) => {
  const res = await axiosInstance.post("/pickups", data);
  return res.data;
};

export const getMyPickups = async (page = 1, limit = 10, status = "") => {
  const params = { page, limit };
  if (status) params.status = status;
  const res = await axiosInstance.get("/pickups/my", { params });
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

export const getPickupById = async (pickupId) => {
  const res = await axiosInstance.get(`/pickups/${pickupId}`);
  return res.data;
};
