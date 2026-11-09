export const foto = (url: string) => (url ? `/api/public/foto?u=${encodeURIComponent(url.replace("http://", "https://"))}` : "");
