export const isValidEgyptianPhone = (phone: string): boolean => {
  const cleaned = phone.replace(/[\s-]/g, "");
  const regex = /^(?:\+20|0020|0)1[0125]\d{8}$/;
  return regex.test(cleaned);
};
