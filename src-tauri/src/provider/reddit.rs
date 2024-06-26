use crate::auth::reddit::get_token;
use crate::utils::{create_http, sanitize_filename};
use crate::{auth::reddit::is_valid_token, provider::models::ImageInfo};
use image::io::Reader as ImageReader;

use serde_json::{from_value, Value};
use tauri::api::path::{self, picture_dir};
use tauri::{AppHandle, Wry};
use tauri_plugin_store::{with_store, StoreBuilder, StoreCollection};

use core::panic;
use std::error::Error;
use std::fs::create_dir_all;
use std::io::Cursor;
use std::path::{Path, PathBuf};

use super::models::{DownloadInfo, Image};

const HOST_URL: &str = "https://oauth.reddit.com";
const FETCH_LIMIT: i32 = 75;

//fetch images
pub async fn get_images(subreddit: String, sort: String) -> Result<Vec<Image>, Box<dyn Error>> {
    let url = format!(
        "{}/r/{}?limit={}&sort={}",
        HOST_URL, subreddit, FETCH_LIMIT, sort
    );

    is_valid_token().await?;
    let token = get_token().await?;

    let fetcher = create_http();
    // Make HTTP request and get the responsemood
    let response = fetcher.get(url).bearer_auth(token).send().await?;
    let response = response.json::<Value>().await?;

    // Extract image data from response
    let images = response["data"]["children"].as_array().unwrap();

    let mut extracted: Vec<Image> = vec![];

    // loop over each reddit post
    for image in images.iter() {
        let img_data = &image["data"];
        let img_url = &img_data["url"].as_str().unwrap();

        if img_url.contains("https://i.redd.it/") {
            let image: Image = from_value(img_data.clone()).unwrap();

            //add the map to vector
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

    // let mut img_map = Map::new();
    // let mut info_map = Map::new();
    //get and setup fetcher
    let fetcher = create_http();

    //run then get info method
    let response = fetcher.get(url).send().await?;
    let response = response.json::<Value>().await?;

    let image = &response[0]["data"]["children"][0]["data"];

    let info: ImageInfo = from_value(image.clone()).unwrap();

    // //somehow get the image size and resoultion in rust
    println!("{:#?}", info);

    Ok(info)
}


pub async fn download(
    info: DownloadInfo,
    app_handle: AppHandle,
    state: tauri::State<'_, StoreCollection<Wry>>,
) -> Result<String, Box<dyn Error>> {

    let path = PathBuf::from("settings.json");

    // get the url from the store
    let save_path_result = with_store(app_handle, state, path, |store| {
        let path: String = match store.get("path") {
            Some(path) => {
                print!("he {}", path.to_string());
                let string_path = path.as_str().expect("path is not a string").to_string();

                string_path
            }
            None => panic!("this is not in the store"),
        };
        Ok(path)
    });

    println!("work");
    let save_path = match save_path_result {
        Ok(path) => {
            let path_result = path.to_string();

            Ok(path_result)
        }
        Err(error) => Err(error),
    }
    .unwrap();

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
