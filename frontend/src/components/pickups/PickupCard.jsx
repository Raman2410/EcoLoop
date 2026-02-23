import StatusBadge from "../common/StatusBadge";

const PickupCard = ({ pickup }) => {
  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold text-gray-800">
          {pickup.scrapType}
        </h3>
        <StatusBadge status={pickup.status} />
      </div>

      <p className="text-sm text-gray-600">
        📍 {pickup.address}
      </p>

      <div className="flex justify-between text-xs text-gray-500 mt-3">
        <span>Load: {pickup.approxLoad}</span>
        <span>
          {new Date(pickup.createdAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
};

export default PickupCard;
