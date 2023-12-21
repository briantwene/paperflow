// use std::env;
// use dotenv::dotenv;

pub struct AppConfig {
    pub server_url: String,
    pub base_url: String,
    // Add other configuration variables as needed
}

impl AppConfig {
    pub fn load() -> Self {


        let server_url = "https://auth-paperflow.koyeb.app".to_string();
        let base_url  =  "http://localhost:32463".to_string();

        // Load other configuration variables similarly

        AppConfig { server_url, base_url }
    }
}




