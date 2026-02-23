import { useRef } from "react";

const ImageUpload = ({ image, setImage }) => {
  const inputRef = useRef(null);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-2">
        Scrap Image (optional)
      </label>

      <div
        onClick={() => inputRef.current.click()}
        className="
          border-2 border-dashed rounded-xl p-4
          cursor-pointer
          hover:border-green-400
          transition
          bg-gray-50
          flex items-center gap-4
        "
      >
        {image ? (
          <img
            src={URL.createObjectURL(image)}
            alt="Scrap preview"
            className="w-20 h-20 object-cover rounded-lg border"
          />
        ) : (
          <div className="w-20 h-20 flex items-center justify-center rounded-lg bg-white border text-gray-400 text-xl">
            📷
          </div>
        )}

        <div className="text-sm text-gray-600">
          <p className="font-medium text-gray-700">
            Add a photo
          </p>
          <p className="text-xs text-gray-500">
            Take a photo or choose from gallery
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            setImage(e.target.files[0]);
          }
        }}
      />
    </div>
  );
};

export default ImageUpload;
