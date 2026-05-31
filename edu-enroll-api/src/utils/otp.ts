export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const getOTPExpiry = (): Date => {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + 1);
  return expiry;
};

export const isOTPExpired = (expiresAt: Date | string): boolean => {
  return new Date() > new Date(expiresAt);
};
