const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-700",
  assigned: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  recycled: "bg-purple-100 text-purple-700",
};

const StatusBadge = ({ status }) => {
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold ${
        STATUS_COLORS[status]
      }`}
    >
      {status.toUpperCase()}
    </span>
  );
};

export default StatusBadge;
