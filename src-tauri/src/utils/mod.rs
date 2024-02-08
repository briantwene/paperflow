use reqwest::Client;

pub fn create_http() -> Client {
    let ua = generate_user_agent();
    return reqwest::Client::builder()
        .user_agent(ua)
        .build()
        .expect("Failed to create client");
}

pub fn generate_user_agent() -> String {
    let app_version: String = String::from("v0.1.0");
    let os_info = format!("{} {}", std::env::consts::OS, std::env::consts::ARCH);

    return format!("{}:PaperFlow:{} (by /u/Abalone_shot)", os_info, app_version);
}
