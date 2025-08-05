// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::collections::HashMap;

use provider::{
    models::{DownloadInfo, Image, ImageInfo},
    reddit::download,
};
use serde_json::Value;
use tauri::{api::path, AppHandle, Manager, Wry};
use tauri_plugin_log::LogTarget;
use tauri_plugin_store::{StoreBuilder, StoreCollection};


use crate::auth::reddit::start_reddit_login;
use auth::disconnect;
use auth::auth_status::get_auth_status;
use serde_json::Value as JsonValue;

mod auth;
mod organiser;
mod provider;

mod config;
mod utils;
mod wallpaper;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            fetch,
            view_img,
            start_reddit_login,
            auth_status,
           disconnect,
            reddit_download
        ])
        .plugin(
            tauri_plugin_log::Builder::default()
                .targets([LogTarget::LogDir, LogTarget::Stdout])
                .build(),
        )
        .setup(|app| {
            let mut defaults = HashMap::new();
            defaults.insert(
                "path".to_string(),
                path::picture_dir()
                    .unwrap()
                    .join("paperflow")
                    .to_str()
                    .unwrap()
                    .into(),
            );

            defaults.insert("theme".to_string(), "dark".into());
            // create hashmap of defaults
            let mut store = StoreBuilder::new(app.handle(), "settings.json".parse().unwrap())
                .defaults(defaults)
                .build();

            store.reset()?;

            app.handle()
                .plugin(tauri_plugin_store::Builder::default().store(store).build());
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
async fn fetch(subreddit: String, sort: String) -> Result<Vec<Image>, String> {
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
async fn reddit_download(app_handle: AppHandle, state: tauri::State<'_, StoreCollection<Wry>>, info: DownloadInfo) -> Result<JsonValue, String> {
    let result = download(info, app_handle, state).await.unwrap();
    println!("{}", result);
    return Ok(serde_json::json!({ "status": result }));
}

