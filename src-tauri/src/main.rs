// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]


use serde_json::Value;
use tauri_plugin_log::{LogTarget, fern::colors::ColoredLevelConfig};
use provider::models::{Image, ImageInfo};

use crate::auth::reddit::start_reddit_login;
use auth::auth_status::get_auth_status;


mod organiser;
mod provider;
mod auth;

mod utils;
mod wallpaper;
mod config;

fn main() {
    tauri::Builder::default().plugin(tauri_plugin_log::Builder::default().targets([
        LogTarget::LogDir,
        LogTarget::Stdout,
        LogTarget::Webview,
    ]) .with_colors(ColoredLevelConfig::default()).build())
        .invoke_handler(tauri::generate_handler![fetch, view_img, start_reddit_login, auth_status, revoke_token])
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
    let _result = auth::reddit::do_token_action(auth::models::TokenContext::Revoke, None).await.unwrap();
    return serde_json::json!({
        "status": "success",
        "message": "Successfully logged out of Reddit"
    })
}

fn invalid_provider_response() -> Value {
    serde_json::json!({
        "status": "error",
        "message": "Invalid provider"
    })
}