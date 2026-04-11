import { useEffect, useRef } from "react";
import { useSocket } from "../context/SocketContext";

const BROADCAST_INTERVAL_MS = 20_000; // every 20 seconds

/**
 * useCollectorTracking
 *
 * When a collector has an active pickup (pickupId provided), this hook:
 *   1. Requests the browser's geolocation
 *   2. Emits "collector-location" via socket every 20 seconds
 *   3. The server relays this to the pickup owner's user room
 *
 * @param {string|null} pickupId — active pickup being worked on (null = disabled)
 */
const useCollectorTracking = (pickupId) => {
  const { socket } = useSocket();
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!pickupId || !socket || !navigator.geolocation) return;

    const broadcast = () => {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          socket.emit("collector-location", {
            pickupId,
            lat: coords.latitude,
            lng: coords.longitude,
          });
        },
        (err) => console.warn("[Tracking] Geolocation error:", err.message),
        { enableHighAccuracy: true, timeout: 8000 },
      );
    };

    // Broadcast immediately, then on interval
    broadcast();
    intervalRef.current = setInterval(broadcast, BROADCAST_INTERVAL_MS);

    return () => {
      clearInterval(intervalRef.current);
    };
  }, [pickupId, socket]);
};

export default useCollectorTracking;
