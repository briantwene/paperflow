use chrono::{TimeZone, Utc};

use log::info;
use serde::{Deserialize, Deserializer, Serialize};

#[derive(Debug, Deserialize, Serialize)]
pub struct Image {
    pub id: String,
    pub url: String,
    pub title: String,
    pub author: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct ImageInfo {
    url: String,
    title: String,
    author: String,
    #[serde(deserialize_with = "generate_date")]
    created: String,
    score: i32,
    subreddit_name_prefixed: String,
   
  
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
