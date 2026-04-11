import { useEffect, useRef } from "react";

const VoucherSuccessModal = ({ voucher, onClose }) => {
  const overlayRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Close on backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  if (!voucher) return null;

  const expiryDate = new Date(voucher.expiresAt).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div
      ref={overlayRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full mx-4 animate-in zoom-in-95 duration-200">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-3xl animate-bounce">
            🎉
          </div>
        </div>

        {/* Title */}
        <h3 className="text-center text-xl font-bold text-gray-800 mb-1">
          Voucher Created!
        </h3>
        <p className="text-center text-sm text-gray-500 mb-6">
          Your EcoCoins have been redeemed successfully.
        </p>

        {/* Voucher Card */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-5 text-white mb-6 relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
          <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white/10" />

          <p className="text-xs uppercase tracking-widest text-green-100 mb-1">
            EcoLoop Cash Voucher
          </p>
          <p className="text-4xl font-extrabold mb-3">₹{voucher.value}</p>

          {/* Code */}
          <div className="bg-white/20 rounded-xl px-4 py-2 inline-block mb-3">
            <p className="text-xs text-green-100 mb-0.5">Voucher Code</p>
            <p className="font-mono font-bold tracking-widest text-lg">
              {voucher.code}
            </p>
          </div>

          <div className="flex justify-between text-xs text-green-100 mt-2">
            <span>🌿 {voucher.ecoCoinsUsed} EcoCoins used</span>
            <span>Expires {expiryDate}</span>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={onClose}
          className="w-full bg-green-600 hover:bg-green-700 active:scale-95 text-white font-semibold py-3 rounded-xl transition-all duration-150"
        >
          Done
        </button>

        <p className="text-center text-xs text-gray-400 mt-3">
          Save the code before closing this window.
        </p>
      </div>
    </div>
  );
};

export default VoucherSuccessModal;
