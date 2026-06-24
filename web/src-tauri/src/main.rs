// Pediatric Care Platform — Tauri desktop entrypoint.
// The window loads the static Next.js bundle (../out). The FastAPI backend
// runs as a separate process on localhost:8000 (see README "Desktop" section).
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running Pediatric Care Platform");
}
