use std::collections::HashMap;

use serde_json::{json, value, Value};

use crate::fetcher;

// can expand this to be one function that could hold multiple sources??
pub async fn fetch_images(subreddit: String, sort: String) -> String {
    let mut client = fetcher::Fetcher::default();
    client.setup();
    client.get_posts(subreddit, sort).await
}

// function that will get the raw json, extract the images and return them
pub fn image_parser(image_data: String) -> Value {
    // convert the data into a JSON format
    let parsed_response: Value =
        serde_json::from_str(&image_data).expect("there was an error converting response to json");

    return parsed_response;
}

pub fn extract_images(parsed_images: Value) -> Value {
    // get data from HTTP JSON response
    let images = parsed_images["data"]["children"].as_array().unwrap();

    let mut extracted: Vec<HashMap<&str, &Value>> = vec![];

    // loop over each reddit post
    for image in images.iter() {
        //create Map to store collected data
        let mut img_item = HashMap::new();

        let img_data = &image["data"].as_object().unwrap();
        let img_url = &img_data["url"].as_str().unwrap();

        if img_url.contains("https://i.redd.it/") {
        // add needed data from post into Map
        img_item.insert("id", &img_data["id"]);
        img_item.insert("title", &img_data["title"]);
        img_item.insert("url", &img_data["url"]);
        img_item.insert("author", &img_data["author"]);

        //add the map to vector
        extracted.push(img_item);
        } else {
            continue;
        }


    }

    //convert the map into JSON and return to frontend
    return json!(extracted);
}

pub async fn get_image_info(image: String, author: String) -> Value {
    let mut img_map = HashMap::new();
    //get and setup fetcher
    let mut client = fetcher::Fetcher::default();
    client.setup();

    //run then get info method
    let img = client.get_info(image, author).await;
    let parsed_image: Value = serde_json::from_str(&img).expect("error parsing img info data");
    let image = parsed_image[0]["data"]["children"][0]["data"]
        .as_object()
        .unwrap();

    img_map.insert("url", &image["url"]);
    img_map.insert("author", &image["author"]);
    img_map.insert("title", &image["title"]);
    img_map.insert("created", &image["created_utc"]);

    return json!(img_map);
}
