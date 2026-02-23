import { useEffect, useState } from "react";
import { getMyPickups, cancelPickup } from "../../services/pickup.service";import Loader from "../../components/common/Loader";
import toast from "react-hot-toast";
import { getPickupWeightKg } from "../../utils/pickupWeight";

// ─── Scrap type → icon map ───────────────────────────────────────────────────
const SCRAP_ICONS = {
  metal: "🔩",
  plastic: "🧴",
  paper: "📄",
  glass: "🫙",
  ewaste: "💻",
  "e-waste": "💻",
  cardboard: "📦",
  rubber: "🔄",
  other: "♻",
};
const getIcon = (type = "") =>
  SCRAP_ICONS[type.toLowerCase()] ?? "♻";

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS = {
  completed: { bg: "#dcfce7", color: "#166534", dot: "#16a34a", label: "Completed" },
  pending:   { bg: "#fef9c3", color: "#854d0e", dot: "#ca8a04", label: "Pending"   },
  default:   { bg: "#f1f5f9", color: "#475569", dot: "#94a3b8", label: ""          },
};
const getStatus = (s = "") => STATUS[s.toLowerCase()] ?? { ...STATUS.default, label: s };

// ─── Tiny card for category impact ───────────────────────────────────────────
const ImpactTile = ({ type, kg }) => (
  <div
    style={{
      background: "#f0fdf4",
      border: "1px solid #bbf7d0",
      borderRadius: "14px",
      padding: "16px",
      display: "flex",
      flexDirection: "column",
      gap: "6px",
    }}
  >
    <span style={{ fontSize: "22px" }}>{getIcon(type)}</span>
    <p style={{ margin: 0, fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#86efac" }}>
      {type}
    </p>
    <p style={{ margin: 0, fontSize: "24px", fontWeight: 800, color: "#15803d", letterSpacing: "-0.5px" }}>
      {kg}<span style={{ fontSize: "13px", fontWeight: 600, color: "#4ade80", marginLeft: "3px" }}>kg</span>
    </p>
  </div>
);

// ─── Single pickup card ───────────────────────────────────────────────────────
const PickupCard = ({ pickup, onDelete, index }) => {
  const st = getStatus(pickup.status);
  const isPending = pickup.status?.toLowerCase() === "pending";
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        fontFamily: "'DM Sans', sans-serif",
        background: "#fff",
        borderRadius: "18px",
        overflow: "hidden",
        boxShadow: hovered
          ? "0 12px 40px rgba(0,0,0,0.10)"
          : "0 2px 12px rgba(0,0,0,0.06)",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        transition: "transform 0.22s ease, box-shadow 0.22s ease",
        display: "flex",
        flexDirection: "column",
        animationDelay: `${index * 60}ms`,
        animationFillMode: "both",
      }}
    >
      {/* Status accent strip */}
      <div style={{ height: "3px", background: st.dot }} />

      <div style={{ padding: "22px", flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Header row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "40px", height: "40px",
                borderRadius: "12px",
                background: "#f0fdf4",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "20px",
                flexShrink: 0,
              }}
            >
              {getIcon(pickup.scrapType)}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", color: "#a3a3a3" }}>
                Scrap Type
              </p>
              <h3 style={{ margin: "2px 0 0", fontSize: "16px", fontWeight: 700, color: "#171717", letterSpacing: "-0.2px" }}>
                {pickup.scrapType}
              </h3>
            </div>
          </div>

          {/* Status badge */}
          <span style={{
            display: "inline-flex", alignItems: "center", gap: "5px",
            fontSize: "11px", fontWeight: 600,
            padding: "4px 10px", borderRadius: "999px",
            background: st.bg, color: st.color,
          }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: st.dot, flexShrink: 0 }} />
            {pickup.status}
          </span>
        </div>

        {/* Detail rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
          <DetailRow icon="📍" label="Address" value={pickup.address} />
          <DetailRow icon="⚖️" label="Load" value={pickup.approxLoad} />
          <DetailRow
            icon="🗓"
            label="Scheduled"
            value={new Date(pickup.scheduledDate).toLocaleDateString("en-IN", {
              day: "2-digit", month: "short", year: "numeric",
            })}
          />
        </div>

        {/* Footer */}
        <div style={{
          marginTop: "auto",
          paddingTop: "14px",
          borderTop: "1px solid #f5f5f5",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#d4d4d4" }}>
            Pickup Request
          </span>

          {isPending && (
            <button
              onClick={() => onDelete(pickup._id)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: "12px", fontWeight: 600, color: "#ef4444",
                padding: "4px 8px", borderRadius: "6px",
                transition: "background 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#fef2f2"}
              onMouseLeave={e => e.currentTarget.style.background = "none"}
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const DetailRow = ({ icon, label, value }) => (
  <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
    <span style={{ fontSize: "13px", marginTop: "1px", flexShrink: 0 }}>{icon}</span>
    <p style={{ margin: 0, fontSize: "13px", color: "#737373", lineHeight: 1.5 }}>
      <span style={{ fontWeight: 600, color: "#404040" }}>{label}:</span>{" "}
      {value}
    </p>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────
const PickupList = () => {
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPickups = async () => {
      const data = await getMyPickups();
      setPickups(data);
      setLoading(false);
    };
    fetchPickups();
  }, []);

 const handleDelete = async (id) => {
  const confirm = window.confirm(
    "Are you sure you want to cancel this pickup request?"
  );
  if (!confirm) return;

  try {
    await cancelPickup(id);
    setPickups((prev) =>
      prev.map((p) => p._id === id ? { ...p, status: "cancelled" } : p)
    );
    toast.success("Pickup cancelled successfully");
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to cancel pickup");
  }
};

  if (loading) return <Loader text="Loading pickups..." />;

  // Category-wise impact (COMPLETED pickups only)
  const categoryImpact = pickups.reduce((acc, pickup) => {
    if (pickup.status?.toLowerCase() !== "completed") return acc;
    const type = pickup.scrapType || "Other";
    const kg = getPickupWeightKg(pickup);
    acc[type] = (acc[type] || 0) + kg;
    return acc;
  }, {});
  

  const totalKg = Object.values(categoryImpact).reduce((s, v) => s + v, 0);

  return (
    <div
      style={{
        fontFamily: "'DM Sans', sans-serif",
        background: "#fafafa",
        borderRadius: "24px",
        padding: "32px",
        border: "1px solid #f0f0f0",
        boxShadow: "0 2px 20px rgba(0,0,0,0.04)",
      }}
    >
      {/* ── Page header ── */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "26px", fontWeight: 800, color: "#111", letterSpacing: "-0.5px" }}>
              My Pickups
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#9ca3af" }}>
              View and manage all your pickup requests
            </p>
          </div>

          {pickups.length > 0 && (
            <div style={{
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              padding: "10px 18px",
              display: "flex", alignItems: "center", gap: "10px",
            }}>
              <span style={{ fontSize: "20px" }}>♻️</span>
              <div>
                <p style={{ margin: 0, fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9ca3af" }}>Total Recycled</p>
                <p style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "#16a34a", letterSpacing: "-0.3px" }}>
                  {totalKg} <span style={{ fontSize: "12px", fontWeight: 600 }}>kg</span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Recycling breakdown ── */}
      {Object.keys(categoryImpact).length > 0 && (
        <div style={{ marginBottom: "32px" }}>
          <p style={{ margin: "0 0 14px", fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9ca3af" }}>
            Your Recycling Breakdown
          </p>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
            gap: "12px",
          }}>
            {Object.entries(categoryImpact).map(([type, kg]) => (
              <ImpactTile key={type} type={type} kg={kg} />
            ))}
          </div>
          <p style={{ margin: "10px 0 0", fontSize: "11px", color: "#d1d5db" }}>
            * Calculated from completed pickups only
          </p>
        </div>
      )}

      {/* ── Empty state ── */}
      {pickups.length === 0 ? (
        <div style={{
          background: "#fff",
          border: "2px dashed #e5e7eb",
          borderRadius: "16px",
          padding: "56px 24px",
          textAlign: "center",
        }}>
          <span style={{ fontSize: "40px" }}>🚚</span>
          <p style={{ margin: "14px 0 4px", fontSize: "16px", fontWeight: 600, color: "#6b7280" }}>
            No pickups yet
          </p>
          <p style={{ margin: 0, fontSize: "13px", color: "#d1d5db" }}>
            Schedule a pickup to start recycling.
          </p>
        </div>
      ) : (
        /* ── Grid ── */
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "20px",
        }}>
          {pickups.map((pickup, i) => (
            <PickupCard
              key={pickup._id}
              pickup={pickup}
              onDelete={handleDelete}
              index={i}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PickupList;