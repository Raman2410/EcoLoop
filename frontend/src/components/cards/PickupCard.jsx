const PickupCard = ({ pickup }) => {
  const isCompleted = pickup.status?.toLowerCase() === "completed";

  return (
    <div
      className="
        bg-white rounded-2xl
        shadow-sm hover:shadow-lg
        transition-all duration-200
        p-6 flex flex-col
        hover:-translate-y-0.5
      "
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-semibold text-gray-800 leading-snug">
          {pickup.scrapType}
        </h3>

        <span
          className={`flex items-center gap-1 text-xs px-3 py-1 rounded-full font-medium ${
            isCompleted
              ? "bg-green-100 text-green-700"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isCompleted ? "bg-green-600" : "bg-yellow-600"
            }`}
          />
          {pickup.status}
        </span>
      </div>

      {/* Address */}
      <div className="flex items-start gap-2 text-sm text-gray-600 mb-4">
        <span className="mt-0.5">📍</span>
        <p className="leading-relaxed">{pickup.address}</p>
      </div>

      {/* Footer */}
      <div className="mt-auto pt-4 border-t flex justify-between items-center text-sm">
        <span className="text-gray-500">Pickup details</span>

        <span className="text-green-700 font-medium cursor-pointer hover:underline">
          View →
        </span>
      </div>
    </div>
  );
};

export default PickupCard;
