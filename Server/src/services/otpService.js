export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const getOtpExpiry = () => {
  return new Date(Date.now() + 5 * 60 * 1000); // ✓ Returns a Date object
};