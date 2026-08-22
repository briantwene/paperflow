// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use base64::Engine;
use std::collections::HashMap;

use provider::{
    models::{DownloadInfo, ImageInfo, Wallpaper},
    reddit::download,
};
use serde_json::Value;
use tauri::{AppHandle, Manager};
use tauri_plugin_store::StoreExt;

use crate::auth::reddit::start_reddit_login;
use auth::auth_status::get_auth_status;
use auth::disconnect;
use serde_json::Value as JsonValue;

mod auth;
mod organiser;
mod provider;

mod config;
mod utils;
mod wallpaper;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            fetch,
            view_img,
            start_reddit_login,
            auth_status,
            disconnect,
            reddit_download,
            download_image_as_base64,
            // New improved auth commands
            auth::start_reddit_auth_v2,
            auth::get_reddit_token_v2,
            auth::revoke_reddit_auth_v2,
            auth::check_reddit_auth_status_v2,
            auth::get_reddit_user_info,
            auth::demo_auth_flow_v2
        ])
        .setup(|app| {
            let mut defaults = HashMap::new();

            // Get the pictures directory using the new v2 API
            let pictures_dir = app
                .path()
                .picture_dir()
                .map(|dir| dir.join("paperflow"))
                .unwrap_or_else(|_| std::path::PathBuf::from("paperflow"));

            defaults.insert("path".to_string(), pictures_dir.to_str().unwrap().into());

            defaults.insert("theme".to_string(), "dark".into());
            // Create store using new v2 API
            let store = app
                .store_builder("settings.json")
                .defaults(defaults)
                .build()?;

            store.reset();
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
async fn fetch(subreddit: String, sort: String) -> Result<Vec<Wallpaper>, String> {
    // get images
    match provider::reddit::get_images(subreddit, sort).await {
        Ok(images) => Ok(images),
        Err(_err) => Err("There was an error in getting the data".to_string()),
    }
}

#[tauri::command]
async fn view_img(id: String) -> Result<ImageInfo, String> {
    println!("{}", id);
    match provider::reddit::get_info(id).await {
        Ok(images) => Ok(images),
        Err(_err) => Err("There was an error in getting the data".to_string()),
    }
}

#[tauri::command]
fn auth_status() -> Value {
    let providers = vec!["reddit", "example_provider1", "example_provider2"];
    let result = get_auth_status(providers);

    result
}

#[tauri::command]
async fn reddit_download(app_handle: AppHandle, info: DownloadInfo) -> Result<JsonValue, String> {
    let result = download(info, app_handle).await.unwrap();
    println!("{}", result);
    return Ok(serde_json::json!({ "status": result }));
}

#[tauri::command]
async fn download_image_as_base64(url: String) -> Result<String, String> {
    println!("Downloading image for color extraction: {}", url);

    match reqwest::get(&url).await {
        Ok(response) => {
            if response.status().is_success() {
                match response.bytes().await {
                    Ok(bytes) => {
                        let base64_string =
                            base64::engine::general_purpose::STANDARD.encode(&bytes);
                        Ok(base64_string)
                    }
                    Err(e) => {
                        eprintln!("Failed to read response bytes: {}", e);
                        Err(format!("Failed to read image data: {}", e))
                    }
                }
            } else {
                Err(format!("HTTP error: {}", response.status()))
            }
        }
        Err(e) => {
            eprintln!("Failed to download image: {}", e);
            Err(format!("Failed to download image: {}", e))
        }
    }
}
