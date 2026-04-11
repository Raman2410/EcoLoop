import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPickupById } from "../../services/pickup.service";
import { useSocket } from "../../context/SocketContext";
import {
  CheckCircle2,
  Clock,
  MapPin,
  Package,
  Truck,
  ShieldCheck,
} from "lucide-react";
import Button from "../../components/common/Button";
import RatingModal from "../../components/pickups/RatingModel";
import toast from "react-hot-toast";
import PickupMap from "../../components/common/PickupMap";

const PickupDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { socketRef, connected } = useSocket();
  const [pickup, setPickup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRatingModal, setShowRatingModal] = useState(false);

  // OTP shown to user when collector triggers completion
  const [otpData, setOtpData] = useState(null); // { otp, otpExpiresAt }
  const [otpTimeLeft, setOtpTimeLeft] = useState(null); // seconds remaining
  const [collectorCoords, setCollectorCoords] = useState(null);

  // Countdown timer for OTP expiry
  useEffect(() => {
    if (!otpData?.otpExpiresAt) return;
    const tick = () => {
      const secs = Math.max(
        0,
        Math.floor((new Date(otpData.otpExpiresAt) - Date.now()) / 1000),
      );
      setOtpTimeLeft(secs);
      if (secs === 0) setOtpData(null); // hide when expired
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [otpData]);

  useEffect(() => {
    fetchPickup();
  }, [id]);

  // Listen for real-time status updates.
  // IMPORTANT: `connected` (not `socketRef`) is the reactive dep here.
  // socketRef is a ref — its identity never changes, so React would never
  // re-run the effect when the socket connects. Using `connected` ensures
  // listeners are attached as soon as the socket is live.
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !connected) return;

    const handlePickupAccepted = (data) => {
      if (String(data.pickupId) === String(id)) {
        setPickup((prev) => ({
          ...prev,
          status: "assigned",
          statusTimestamps: {
            ...prev.statusTimestamps,
            assigned: data.timestamp,
          },
        }));
        toast.success(`✅ ${data.collectorName} accepted your pickup!`);
      }
    };

    const handleOtpGenerated = (data) => {
      if (String(data.pickupId) === String(id)) {
        setPickup((prev) => ({
          ...prev,
          status: "in_progress",
          statusTimestamps: {
            ...prev.statusTimestamps,
            in_progress: data.timestamp,
          },
        }));
        // Store OTP for in-app display
        if (data.otp) {
          setOtpData({ otp: data.otp, otpExpiresAt: data.otpExpiresAt });
        }
      }
    };

    const handlePickupCompleted = (data) => {
      if (String(data.pickupId) === String(id)) {
        setPickup((prev) => ({
          ...prev,
          status: "completed",
          statusTimestamps: {
            ...prev.statusTimestamps,
            completed: data.timestamp,
          },
          ecoCoins: data.ecoCoinsEarned,
          co2Saved: data.co2Saved,
        }));
        setOtpData(null); // clear OTP after completion
        setShowRatingModal(true);
        toast.success(
          `🌱 Pickup complete! +${data.ecoCoinsEarned} EcoCoins earned.`,
        );
      }
    };

    const handleCollectorLocation = (data) => {
      if (String(data.pickupId) === String(id)) {
        setCollectorCoords([data.lat, data.lng]);
      }
    };

    socket.on("pickup-accepted", handlePickupAccepted);
    socket.on("otp-generated", handleOtpGenerated);
    socket.on("pickup-completed", handlePickupCompleted);
    socket.on("collector-location", handleCollectorLocation);

    return () => {
      socket.off("pickup-accepted", handlePickupAccepted);
      socket.off("otp-generated", handleOtpGenerated);
      socket.off("pickup-completed", handlePickupCompleted);
      socket.off("collector-location", handleCollectorLocation);
    };
  }, [socketRef, connected, id]);

  const fetchPickup = async () => {
    try {
      const { data } = await getPickupById(id);
      setPickup({ ...data.pickup, isReviewed: data.isReviewed });

      // Show rating modal if pickup is completed and not yet rated
      if (data.pickup.status === "completed" && !data.isReviewed) {
        setShowRatingModal(true);
      }
    } catch (error) {
      toast.error("Failed to load pickup details");
      navigate("/pickups");
    } finally {
      setLoading(false);
    }
  };

  const getStepStatus = (step) => {
    const statusOrder = ["pending", "assigned", "in_progress", "completed"];
    const currentIndex = statusOrder.indexOf(pickup?.status);
    const stepIndex = statusOrder.indexOf(step);

    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "active";
    return "upcoming";
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "—";
    return new Date(timestamp).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const timelineSteps = [
    {
      key: "pending",
      label: "Pickup Requested",
      icon: Package,
      timestamp: pickup?.statusTimestamps?.pending,
    },
    {
      key: "assigned",
      label: "Collector Assigned",
      icon: Truck,
      timestamp: pickup?.statusTimestamps?.assigned,
    },
    {
      key: "in_progress",
      label: "Collector En Route",
      icon: MapPin,
      timestamp: pickup?.statusTimestamps?.in_progress,
    },
    {
      key: "completed",
      label: "Pickup Completed",
      icon: CheckCircle2,
      timestamp: pickup?.statusTimestamps?.completed,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading pickup details...</p>
        </div>
      </div>
    );
  }

  if (!pickup) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Pickup Details
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Track your pickup status in real-time
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate("/pickups")}
            >
              Back to Pickups
            </Button>
          </div>

          {/* Pickup Info */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <div>
              <p className="text-xs text-gray-500">Scrap Type</p>
              <p className="font-semibold text-gray-800">{pickup.scrapType}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Load Size</p>
              <p className="font-semibold text-gray-800 capitalize">
                {pickup.approxLoad}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Scheduled</p>
              <p className="font-semibold text-gray-800">
                {new Date(pickup.scheduledDate).toLocaleDateString()}
              </p>
            </div>
            {pickup.ecoCoins > 0 && (
              <div>
                <p className="text-xs text-gray-500">EcoCoins Earned</p>
                <p className="font-semibold text-green-600">
                  +{pickup.ecoCoins}
                </p>
              </div>
            )}
          </div>

          {/* Review Button (only if completed and not reviewed) */}
          {pickup.status === "completed" && (
            <div className="mt-6 flex justify-end border-t pt-4">
              <Button
                variant={pickup.isReviewed ? "secondary" : "primary"}
                onClick={() => setShowRatingModal(true)}
                disabled={pickup.isReviewed}
              >
                {pickup.isReviewed ? "Already Reviewed" : "Review Collector"}
              </Button>
            </div>
          )}
        </div>

        {/* ── OTP Card: shown when collector triggers completion ─────────── */}
        {otpData && (
          <div className="bg-orange-50 border-2 border-orange-400 rounded-2xl p-6 mb-6 shadow-md animate-pulse-once">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-orange-800 text-lg">
                  🚛 Collector is at your door!
                </p>
                <p className="text-sm text-orange-600">
                  Share this OTP with the collector to confirm pickup
                </p>
              </div>
            </div>

            {/* Big OTP digits */}
            <div className="flex justify-center gap-2 my-4">
              {String(otpData.otp)
                .split("")
                .map((digit, i) => (
                  <div
                    key={i}
                    className="w-12 h-14 bg-white border-2 border-orange-400 rounded-xl flex items-center justify-center text-2xl font-bold text-orange-700 shadow-sm"
                  >
                    {digit}
                  </div>
                ))}
            </div>

            {/* Countdown */}
            {otpTimeLeft !== null && (
              <div className="flex items-center justify-center gap-2 text-sm text-orange-600">
                <Clock className="w-4 h-4" />
                <span>
                  Expires in{" "}
                  <span
                    className={`font-bold ${otpTimeLeft < 60 ? "text-red-600" : ""}`}
                  >
                    {Math.floor(otpTimeLeft / 60)}:
                    {String(otpTimeLeft % 60).padStart(2, "0")}
                  </span>
                </span>
              </div>
            )}

            <p className="text-xs text-orange-500 text-center mt-3">
              ⚠️ Do not share this OTP with anyone other than the verified
              collector
            </p>
          </div>
        )}

        {(pickup.status === "assigned" || pickup.status === "in_progress") &&
          pickup.address && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                {collectorCoords
                  ? "🛵 Collector En Route"
                  : "📍 Pickup Location"}
              </h2>
              <PickupMap
                address={pickup.address}
                area={pickup.area}
                coords={
                  pickup.lat && pickup.lng ? [pickup.lat, pickup.lng] : null
                }
                collectorCoords={collectorCoords}
                height="280px"
              />
              {!collectorCoords && (
                <p className="text-sm text-gray-500 mt-2 text-center">
                  Live collector location will appear here once they start
                  heading your way.
                </p>
              )}
            </div>
          )}

        {/* Timeline */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">
            Pickup Timeline
          </h2>

          <div className="relative">
            {timelineSteps.map((step, index) => {
              const status = getStepStatus(step.key);
              const Icon = step.icon;
              const isLast = index === timelineSteps.length - 1;

              return (
                <div key={step.key} className="relative flex gap-4 pb-8">
                  {/* Vertical line */}
                  {!isLast && (
                    <div
                      className={`absolute left-4 top-9 w-0.5 h-full ${
                        status === "completed" ? "bg-green-500" : "bg-gray-200"
                      }`}
                    />
                  )}

                  {/* Icon */}
                  <div
                    className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                      status === "completed"
                        ? "bg-green-500 border-green-500 text-white"
                        : status === "active"
                          ? "bg-white border-green-500 text-green-500 animate-pulse"
                          : "bg-white border-gray-300 text-gray-400"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-0.5">
                    <div className="flex items-center justify-between">
                      <p
                        className={`font-medium ${
                          status === "active"
                            ? "text-green-600"
                            : status === "completed"
                              ? "text-gray-800"
                              : "text-gray-400"
                        }`}
                      >
                        {step.label}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatTimestamp(step.timestamp)}
                      </p>
                    </div>

                    {status === "active" && (
                      <p className="text-sm text-gray-600 mt-1">
                        {step.key === "pending" &&
                          "Waiting for a collector to accept..."}
                        {step.key === "assigned" &&
                          "Collector is preparing for pickup"}
                        {step.key === "in_progress" &&
                          "Collector is on the way!"}
                        {step.key === "completed" &&
                          "Verifying pickup completion..."}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {pickup.co2Saved > 0 && (
            <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm font-medium text-green-800">
                🌱 You saved{" "}
                <span className="font-bold">{pickup.co2Saved} kg CO₂</span> by
                recycling this item!
              </p>
              <p className="text-xs text-green-600 mt-1">
                Source: WRAP.org Recycling CO₂ data
              </p>
            </div>
          )}
        </div>
      </div>

      {showRatingModal && pickup.collectorId && (
        <RatingModal
          pickupId={pickup._id}
          collectorId={pickup.collectorId}
          onClose={() => setShowRatingModal(false)}
          onSuccess={() => {
            setShowRatingModal(false);
            setPickup((prev) => ({ ...prev, isReviewed: true }));
            toast.success("Thank you for your feedback!");
          }}
        />
      )}
    </div>
  );
};

export default PickupDetails;
