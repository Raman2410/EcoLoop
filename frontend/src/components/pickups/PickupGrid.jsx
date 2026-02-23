import PickupCard from "../cards/PickupCard";

const PickupGrid = ({ pickups }) => {
  if (!pickups || pickups.length === 0) {
    return (
      <div className="text-center text-gray-500 py-10">
        No pickups available 🚚
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {pickups.map((pickup) => (
        <PickupCard key={pickup._id} pickup={pickup} />
      ))}
    </div>
  );
};

export default PickupGrid;
