// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::collections::HashMap;

use provider::{
    models::{Image, ImageInfo},
    reddit::download,
};
use serde_json::Value;
use tauri::api::path;
use tauri_plugin_log::LogTarget;
use tauri_plugin_store::StoreBuilder;


use crate::auth::reddit::start_reddit_login;
use auth::auth_status::get_auth_status;

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
            revoke_token,
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
async fn revoke_token(provider: String) -> Value {
    match provider.as_str() {
        "reddit" => revoke_reddit_token().await,
        _ => invalid_provider_response(),
    }
}

async fn revoke_reddit_token() -> Value {
    let _result = auth::reddit::do_token_action(auth::models::TokenContext::Revoke, None)
        .await
        .unwrap();
    return serde_json::json!({
        "status": "success",
        "message": "Successfully logged out of Reddit"
    });
}

#[tauri::command]
async fn reddit_download(url: String, name: String) -> Value {
    let result = download(url, name).await.unwrap();
    println!("{}", result);
    return serde_json::json!({ "status": result });
}

fn invalid_provider_response() -> Value {
    serde_json::json!({
        "status": "error",
        "message": "Invalid provider"
    })
}
