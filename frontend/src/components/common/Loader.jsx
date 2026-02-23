const Loader = ({ text = "Loading..." }) => {
  return (
    <div className="flex flex-col items-center justify-center py-6">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
      <p className="mt-2 text-sm text-gray-600">{text}</p>
    </div>
  );
};

export default Loader;
