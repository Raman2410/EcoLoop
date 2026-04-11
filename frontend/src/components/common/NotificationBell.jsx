import { useState, useEffect, useCallback, useRef } from "react";
import { Bell } from "lucide-react";
import { useSocket } from "../../context/SocketContext";
import { useAuthContext } from "../../context/AuthContext";

const MAX_NOTIFICATIONS = 10;

const formatTime = (date) => {
  const diff = Math.floor((Date.now() - date) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
};

const NotificationBell = () => {
  const { socket } = useSocket();
  const { user } = useAuthContext();
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const ref = useRef(null);

  const push = useCallback((msg, type = "info") => {
    setNotifications((prev) => [
      { id: Date.now(), msg, type, time: new Date() },
      ...prev.slice(0, MAX_NOTIFICATIONS - 1),
    ]);
    setUnread((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!socket) return;

    if (user?.role === "user") {
      socket.on("pickup-accepted", ({ collectorName }) =>
        push(`${collectorName} accepted your pickup`, "success")
      );
      socket.on("pickup-completed", ({ ecoCoinsEarned }) =>
        push(`Pickup done! +${ecoCoinsEarned} EcoCoins earned`, "success")
      );
    }

    if (user?.role === "collector") {
      socket.on("new-pickup", ({ scrapType, area }) =>
        push(`New ${scrapType} pickup in ${area}`, "info")
      );
    }

    return () => {
      socket.off("pickup-accepted");
      socket.off("pickup-completed");
      socket.off("new-pickup");
    };
  }, [socket, user, push]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = () => {
    setOpen((v) => !v);
    if (!open) setUnread(0);
  };

  const typeColor = {
    success: "#16a34a",
    info: "#2563eb",
    warn: "#d97706",
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={handleOpen}
        style={{
          position: "relative",
          background: "rgba(255,255,255,0.15)",
          border: "none",
          borderRadius: "8px",
          padding: "6px 8px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          color: "white",
        }}
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-4px",
              right: "-4px",
              background: "#ef4444",
              color: "white",
              borderRadius: "999px",
              fontSize: "10px",
              fontWeight: 500,
              minWidth: "16px",
              height: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 3px",
            }}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: "300px",
            background: "white",
            border: "0.5px solid #e5e7eb",
            borderRadius: "12px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
            zIndex: 100,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "10px 14px",
              borderBottom: "0.5px solid #e5e7eb",
              fontSize: "13px",
              fontWeight: 500,
              color: "#111",
            }}
          >
            Notifications
          </div>

          {notifications.length === 0 ? (
            <div
              style={{
                padding: "24px 14px",
                textAlign: "center",
                fontSize: "13px",
                color: "#9ca3af",
              }}
            >
              No notifications yet
            </div>
          ) : (
            <div style={{ maxHeight: "320px", overflowY: "auto" }}>
              {notifications.map((n) => (
                <div
                  key={n.id}
                  style={{
                    padding: "10px 14px",
                    borderBottom: "0.5px solid #f3f4f6",
                    display: "flex",
                    gap: "10px",
                    alignItems: "flex-start",
                  }}
                >
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: typeColor[n.type] || "#6b7280",
                      flexShrink: 0,
                      marginTop: "4px",
                    }}
                  />
                  <div>
                    <p style={{ fontSize: "13px", color: "#111", margin: 0 }}>
                      {n.msg}
                    </p>
                    <p style={{ fontSize: "11px", color: "#9ca3af", margin: "2px 0 0" }}>
                      {formatTime(n.time)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {notifications.length > 0 && (
            <button
              onClick={() => setNotifications([])}
              style={{
                width: "100%",
                padding: "8px",
                fontSize: "12px",
                color: "#6b7280",
                background: "none",
                border: "none",
                borderTop: "0.5px solid #e5e7eb",
                cursor: "pointer",
              }}
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;