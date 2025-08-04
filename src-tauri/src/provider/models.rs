use chrono::{TimeZone, Utc};

use log::info;
use serde::{Deserialize, Deserializer, Serialize};

#[derive(Debug, Deserialize, Serialize)]
pub struct Wallpaper {
    pub id: String,
    pub url: String,
    pub title: String,
    pub author: String,
    pub width: Option<u32>,
    pub height: Option<u32>,
    pub subreddit: Option<String>,
}




#[derive(Debug, Deserialize, Serialize)]
pub struct ImageInfo {
    pub url: String,                // This will be the image URL
    pub permalink: String,          // This will be the Reddit post URL
    pub title: String,
    pub author: String,
    #[serde(deserialize_with = "generate_date")]
    pub created: String,
    #[serde(rename(serialize = "karma"))]
    pub score: i32,
    #[serde(rename(serialize = "subreddit"))]
    pub subreddit_name_prefixed: String,
    pub width: Option<i32>,         // Image width
    pub height: Option<i32>,        // Image height
}

pub fn generate_date<'de, D>(deserializer: D) -> Result<String, D::Error>
where
    D: Deserializer<'de>,
{
    let created_utc: f64 = f64::deserialize(deserializer)? * 1000.0;
    let created_utc = Utc.timestamp_millis_opt(created_utc as i64).unwrap();

    info!("Deserialized created_utc: {}", created_utc);


    Ok(created_utc.to_rfc2822())
}


#[derive(Deserialize, Debug)]
pub struct DownloadInfo {
    pub url: String,
    pub name: String,
}