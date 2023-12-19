use std::env;
use dotenv::dotenv;

pub struct AppConfig {
    pub server_url: String,
    pub base_url: String,
    // Add other configuration variables as needed
}

impl AppConfig {
    pub fn load() -> Self {

        dotenv().ok();

        let server_url = env::var("AUTH_URL").expect("SERVER_URL not set");
        let base_url  =  env::var("LOCAL_BASE_URL").expect("BASE_URL not set");

        // Load other configuration variables similarly

        AppConfig { server_url, base_url }
    }
}




