// Backend base URL. Override with NEXT_PUBLIC_API_URL at build time.
// In the Tauri desktop build the FastAPI sidecar listens on localhost:8000.
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
