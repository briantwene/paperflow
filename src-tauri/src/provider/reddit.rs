use crate::auth::get_reddit_token_for_provider;
use crate::utils::{create_http, sanitize_filename};
use crate::provider::models::ImageInfo;
use image::ImageReader;
use serde_json::{from_value, Value};
use tauri::AppHandle;
use tauri_plugin_store::StoreExt;
use chrono::{TimeZone, Utc};

use core::panic;
use std::error::Error;
use std::fs::create_dir_all;
use std::io::Cursor;
use std::path::{Path, PathBuf};

use super::models::{DownloadInfo, Wallpaper};

const HOST_URL: &str = "https://oauth.reddit.com";
const FETCH_LIMIT: i32 = 75;

//fetch images
pub async fn get_images(subreddit: String, sort: String) -> Result<Vec<Wallpaper>, Box<dyn Error>> {
    let url = format!(
        "{}/r/{}?limit={}&sort={}",
        HOST_URL, subreddit, FETCH_LIMIT, sort
    );

    // Use the new v2 auth system to get a valid token
    let token = get_reddit_token_for_provider().await
        .map_err(|e| format!("Authentication failed: {}", e))?;

    let fetcher = create_http();
    // Make HTTP request and get the response
    let response = fetcher.get(url).bearer_auth(token).send().await?;
    let response = response.json::<Value>().await?;

    // Extract image data from response
    let images = response["data"]["children"].as_array().unwrap();

    let mut extracted: Vec<Wallpaper> = vec![];    // loop over each reddit post
    for image in images.iter() {
        let img_data = &image["data"];
        let img_url = &img_data["url"].as_str().unwrap();

        if img_url.contains("https://i.redd.it/") {
            // Extract dimensions from preview.images if available
            let (width, height) = if let Some(preview) = img_data.get("preview") {
                if let Some(images_array) = preview.get("images") {
                    if let Some(first_image) = images_array.get(0) {
                        if let Some(source) = first_image.get("source") {
                            let width = source.get("width").and_then(|w| w.as_u64()).map(|w| w as u32);
                            let height = source.get("height").and_then(|h| h.as_u64()).map(|h| h as u32);
                            (width, height)
                        } else {
                            (None, None)
                        }
                    } else {
                        (None, None)
                    }
                } else {
                    (None, None)
                }
            } else {
                (None, None)
            };

            // Extract subreddit name
            let subreddit = img_data.get("subreddit").and_then(|s| s.as_str()).map(|s| s.to_string());            // Create Wallpaper struct with manual field assignment to include new fields
            let image = Wallpaper {
                id: img_data.get("id").and_then(|v| v.as_str()).unwrap_or("").to_string(),
                url: img_url.to_string(),
                title: img_data.get("title").and_then(|v| v.as_str()).unwrap_or("").to_string(),
                author: img_data.get("author").and_then(|v| v.as_str()).unwrap_or("").to_string(),
                width,
                height,
                subreddit,
            };

            //add the image to vector
            extracted.push(image);
        } else {
            continue;
        }
    }

    //convert the map into JSON and return to frontend
    Ok(extracted)
}

//fetch image info
pub async fn get_info(image_id: String) -> Result<ImageInfo, Box<dyn Error>> {
    let url = format!("https://reddit.com/{}.json", image_id);
    println!("{url}");

    //get and setup fetcher
    let fetcher = create_http();

    //run then get info method
    let response = fetcher.get(url).send().await?;
    let response = response.json::<Value>().await?;

    let image_data = &response[0]["data"]["children"][0]["data"];

    // Extract image dimensions from preview data if available
    let (width, height) = if let Some(preview) = image_data.get("preview") {
        if let Some(images) = preview.get("images").and_then(|i| i.as_array()) {
            if let Some(first_image) = images.first() {
                if let Some(source) = first_image.get("source") {
                    let width = source.get("width").and_then(|w| w.as_i64()).map(|w| w as i32);
                    let height = source.get("height").and_then(|h| h.as_i64()).map(|h| h as i32);
                    (width, height)
                } else {
                    (None, None)
                }
            } else {
                (None, None)
            }
        } else {
            (None, None)
        }
    } else {
        (None, None)
    };

    // Manually construct ImageInfo with the additional fields
    let info = ImageInfo {
        url: image_data.get("url").and_then(|v| v.as_str()).unwrap_or("").to_string(),
        permalink: format!("https://reddit.com{}", 
            image_data.get("permalink").and_then(|v| v.as_str()).unwrap_or("")),
        title: image_data.get("title").and_then(|v| v.as_str()).unwrap_or("").to_string(),
        author: image_data.get("author").and_then(|v| v.as_str()).unwrap_or("").to_string(),
        created: {
            let created_utc = image_data.get("created_utc").and_then(|v| v.as_f64()).unwrap_or(0.0) * 1000.0;
            let created_utc = chrono::Utc.timestamp_millis_opt(created_utc as i64).unwrap();
            created_utc.to_rfc2822()
        },
        score: image_data.get("score").and_then(|v| v.as_i64()).unwrap_or(0) as i32,
        subreddit_name_prefixed: image_data.get("subreddit_name_prefixed")
            .and_then(|v| v.as_str()).unwrap_or("").to_string(),
        width,
        height,
    };

    println!("{:#?}", info);

    Ok(info)
}


pub async fn download(
    info: DownloadInfo,
    app_handle: AppHandle,
) -> Result<String, Box<dyn Error>> {    // Get the save path from the store using new v2 API
    let store = app_handle.store("settings.json")?;
    let save_path = store.get("path")
        .and_then(|v| v.as_str().map(|s| s.to_string()))
        .unwrap_or_else(|| "paperflow".to_string());

    let path_url = Path::new(&info.url);
    let save_path = PathBuf::from(&save_path);

    create_dir_all(&save_path)?;

    let ext = path_url.extension().unwrap().to_str().unwrap();

    // Create the client and download the image
    let fetcher = create_http();
    let response = fetcher.get(&info.url).send().await?;
    let response = response.bytes().await?;

    // convert the bytes to an image
    let image = ImageReader::new(Cursor::new(response))
        .with_guessed_format()?
        .decode()?;

        let name = sanitize_filename(&info.name);
        let file_path = save_path.join(format!("{}.{}", &name, ext));


    // save the file
    let file_path = file_path.to_str().unwrap();


    image.save(file_path)?;

    Ok(format!("{}", "Successful"))
}
