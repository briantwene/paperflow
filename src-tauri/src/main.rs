// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde_json::Value;

mod services;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![fetch])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
async fn fetch() -> Value {
    // get images
    let thing = services::fetch_images().await;
    // parse images
    let parsed_images = services::image_parser(thing);
    return services::extract_images(parsed_images);
}
