use crate::provider::models::ImageInfo;
use crate::utils::create_http;

use serde_json::{from_value, Value};

use std::error::Error;

use super::models::Image;

const HOST_URL: &str = "https://www.reddit.com";
const FETCH_LIMIT: i32 = 75;

//fetch images 
pub async fn get_images(subreddit: String, sort: String) -> Result<Vec<Image>, Box<dyn Error>> {
    let url = format!(
        "{}/r/{}.json?sort={}&limit={}",
        HOST_URL, subreddit, sort, FETCH_LIMIT
    );
    let fetcher = create_http();

    // Make HTTP request and get the response
    let response = fetcher.get(url).send().await?;
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
    let url = format!("{}/{}.json", HOST_URL, image_id);
    println!("{url}");

    // let mut img_map = Map::new();
    // let mut info_map = Map::new();
    //get and setup fetcher
    let fetcher = create_http();

    //run then get info method
    let response = fetcher.get(url).send().await?;
    let response = response.json::<Value>().await?;

    let image = &response[0]["data"]["children"][0]["data"];

    let  info: ImageInfo = from_value(image.clone()).unwrap();
 



    // //somehow get the image size and resoultion in rust
    println!("{:#?}", info);

    Ok(info)
}
