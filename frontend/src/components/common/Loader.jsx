import { memo } from "react";

const Loader = memo(({ text = "Loading..." }) => (
  <div className="flex flex-col items-center justify-center py-10 gap-3">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent" />
    <p className="text-sm text-gray-500">{text}</p>
  </div>
));

Loader.displayName = "Loader";
export default Loader;
