import axiosInstance from "../api/axiosInstance";

// Get all pending pickup requests (collector)
export const getPendingPickups = async () => {
  const res = await axiosInstance.get("/pickups/pending");
  return res.data;
};

// Accept a pickup (collector)
export const acceptPickup = async (pickupId) => {
  const res = await axiosInstance.put(`/pickups/accept/${pickupId}`);
  return res.data;
};

// Complete a pickup (collector)
export const completePickup = async (pickupId) => {
  const res = await axiosInstance.patch(`/pickups/complete/${pickupId}`);
  return res.data;
};
