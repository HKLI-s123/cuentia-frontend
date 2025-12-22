export const API_URL = (() => {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    throw new Error("❌ NEXT_PUBLIC_API_URL no está definida");
  }
  return url;
})();
