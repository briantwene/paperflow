use chrono::{Duration, TimeZone, Utc};
use futures::executor;
use keyring::{Entry, Error};
use serde_json::Value;
use std::{sync::mpsc::{channel, Sender}, i64};
use url::Url;

use super::models::{
    AccessTokenResponse, RefreshTokenResponse, TokenContext, TokenData, TokenResponses,
};
use crate::utils::{create_http, generate_user_agent};
use std::{collections::HashMap, env::var, thread};
use tiny_http::{Request, Response, Server, StatusCode};
use webbrowser;
use TokenContext::{Expire, Initial};

const BASE_URL: &str = "http://localhost:32463";
// const TOKEN_URL: &str = "https://www.reddit.com/api/v1/access_token";
const TOKEN_URL: &str = "http://localhost:3000/reddit/auth";
async fn store_token<T: TokenData>(data: T, context: TokenContext) -> Result<(), Error> {
    match context {
        Initial => {
            //get the access token, refresh token
            let access_token = data.get_access_token();
            let refresh_token = data.get_refresh_token();

            //convert expiry time to date time format
            let token_expiry = data.get_token_expiry();
            //create new entries to the secure store
            let access_entry = Entry::new("PaperFlow", "reddit_token")?;
            let expiry_entry = Entry::new("PaperFlow", "reddit_expiry")?;
            let refresh = Entry::new("PaperFlow", "reddit_refresh")?;

            access_entry.set_password(&access_token)?;
            expiry_entry.set_password(&token_expiry)?;
            refresh.set_password(&refresh_token)?;

            Ok(())
        }
        Expire => {
            //get the access token, refresh token
            let access_token = data.get_access_token();

            //convert expiry time to date time format
            let token_expiry = data.get_token_expiry();

            //create new entries to the secure store
            let access_entry = Entry::new("PaperFlow", "reddit_token")?;
            let expiry_entry = Entry::new("PaperFlow", "reddexpiry")?;

            access_entry.set_password(&access_token)?;
            expiry_entry.set_password(&token_expiry)?;

            Ok(())
        }
    }
}

pub async fn get_access_token(
    context: TokenContext,
    code: Option<String>,
) -> Result<(), Box<dyn std::error::Error>> {
    let client = create_http();
    let user_agent = generate_user_agent();
    println!("this function is running");

    match context {
        Initial => {
            let params = [("code", code.unwrap())];

            // Send POST request to get the access token

            // TODO: Make sure to later authenticate the route with JWT maybe for external auth service
            let response = client
                .post(TOKEN_URL)
                // .basic_auth(client_id, Some(""))
                .header("User-Agent", user_agent)
                .form(&params)
                .send()
                .await?;

            // if the response is successful
            if response.status().is_success() {
                // parse the response
                let token_response = response
                    .json::<AccessTokenResponse>()
                    .await
                    .expect("there was an error here fr sure");

                store_token(token_response, Initial).await?;

                Ok(())
            } else {
                // Handle the case where the response status is not successful
                // could do more matching here to handle the error
                let status_code = response.status();
                let response_text = response.text().await?;
                eprintln!("Request failed with status code: {}", status_code);
                eprintln!("Response: {}", response_text);
                Err("Request failed".into())
            }
        }
        Expire => {
            let refresh = Entry::new("PaperFlow", "refresh")?.get_password()?;
            let params = [("grant_type", "refresh_token"), ("refresh_token", &refresh)];

            // Send POST request to get the access token
        println!("refreshing the token");
            // TODO: Make sure to later authenticate the route with JWT maybe for external auth service
            let response = client
                .post(TOKEN_URL)
                // .basic_auth(client_id, Some(""))
                .header("User-Agent", user_agent)
                .form(&params)
                .send()
                .await?;

            // if the response is successful
            if response.status().is_success() {
                // parse the response
                let token_response = response
                    .json::<RefreshTokenResponse>()
                    .await
                    .expect("there was an error here fr sure");

                store_token(token_response, Expire).await?;

                Ok(())
            } else {
                // Handle the case where the response status is not successful
                // could do more matching here to handle the error
                let status_code = response.status();
                let response_text = response.text().await?;
                eprintln!("Request failed with status code: {}", status_code);
                eprintln!("Response: {}", response_text);
                Err("Request failed".into())
            }
        }
    }
}

// function for checking if the token is valid
pub async fn is_valid_token() -> Result<(), Box<dyn std::error::Error>> {
    // Check the token expiry to see if it has passed
    let expiry_str = Entry::new("PaperFlow", "reddit_expiry")
        .map_err(|err| {
            // Handle the error, e.g., log it
            eprintln!("Error accessing token: {}", err);
            err
        })?
        .get_password()
        .map_err(|err| {
            // Handle the error, e.g., log it
            eprintln!("Error getting token password: {}", err);
            err
        })?;

    println!("{expiry_str}");

    let expiry = expiry_str.parse::<i64>().map_err(|err| {
        // Handle the error, e.g., log it
        eprintln!("Error parsing expiry: {}", err);
        err
    })?;
    let current_time = chrono::Utc::now().timestamp();

    if current_time < expiry {
        println!("The token is not expired");
        Ok(()) // Token is still valid
    } else {
        println!("The token is expired");
        get_access_token(Expire, None).await?;
        Ok(()) // Refresh the token
    }
}


// get token function
pub async fn get_token() -> Result<String, Error> {
    let entry = Entry::new("PaperFlow", "reddit_token").unwrap();
    match entry.get_password() {
        Ok(token) => Ok(token),
        Err(err) => Err(err),
    }
}

#[tauri::command]
pub async fn start_reddit_login(app_handle: tauri::AppHandle) {
    //start the server in here on a thread separate to the main app
    match Server::http("127.0.0.1:32463") {
        Ok(server) => {
            println!("server has successfully started");

            let (sender, rx) = channel();

            let server_app_handle = app_handle.clone();
            let server_handle = thread::spawn(move || {
                run(server, &server_app_handle, sender);
            });

            let _ = open_login_window(&app_handle).await;

            let recieved = rx.recv().unwrap();
            // this will run after the code is fetched from the function
            get_access_token(Initial, Some(recieved)).await;

            server_handle.join().unwrap();
        }
        Err(error) => {
            log::error!("Error starting oauth server: {}", error)
        }
    }
}

async fn open_login_window(app_handle: &tauri::AppHandle) -> Result<(), String> {
    // generate random string for the code each time
    let client = format!("auCw6dQt_04k1hUxwc_HrA");
    let redirect_url = format!("http://localhost:32463/callback");
    let url = format!("https://www.reddit.com/api/v1/authorize?client_id={client}&response_type=code&state=yooo&redirect_uri={redirect_url}&duration=permanent&scope=identity,save,read");

    let window_url = tauri::WindowUrl::External(url.parse().unwrap());

    let some_window = tauri::WindowBuilder::new(app_handle, "random", window_url)
        .fullscreen(false)
        .resizable(true)
        .title("Settings")
        .center()
        .build();

    match some_window {
        Ok(wind) => {
            println!("Window Created Successfully!");
            let _ = wind.show();
            Ok(())
        }
        Err(err) => {
            println!("Failed to Create Window {}", err);
            Err("Failed to create Window".to_string())
        }
    }

    // if webbrowser::open(&url).is_ok() {
    //     println!("browser open")
    //     // here we can start a webserver on the specific port to complete the process
    // }
}

fn run(server: Server, app_handle: &tauri::AppHandle, sender: Sender<String>) {
    loop {
        match run_loop(&server, &app_handle, sender.clone()) {
            Ok(status) => {
                if status != "not done".to_string() {
                    continue;
                } else {
                    break;
                }
            }

            Err(err) => log::error!("oauth server error: {:?}", err),
        }
    }

    log::warn!("server has stopped Oauth successful");
}

fn run_loop(
    server: &Server,
    app_handle: &tauri::AppHandle,
    sender: Sender<String>,
) -> Result<String, Box<dyn std::error::Error>> {
    let request = server.recv()?;

    let url = request.url();

    println!("{url}");

    if url.starts_with("/callback") {
        let _ = handle_callback(request, sender)?;
        return Ok(String::from("done"));
    } else {
        log::debug!("this route wasnt handled {url}");
    }

    return Ok(String::from("not done"));
}

fn handle_callback(
    request: Request,
    sender: Sender<String>,
) -> Result<(), Box<dyn std::error::Error>> {
    let url = request.url();
    let parsed_url = Url::parse(&format!("{BASE_URL}{url}"))?;
    let query_map: HashMap<String, String> = parsed_url.query_pairs().into_owned().collect();
    let code = query_map.get("code").unwrap().to_string();
    println!("{code}");
    log::debug!("callback host header: {code}");
    let page = format!(
        r#"
        <html>
            <body>Auth code received complete, you can now close this window</body>
        </html>
    "#
    );

    let response = Response::new(StatusCode(200), vec![], page.as_bytes(), None, None);

    request.respond(response)?;

    //make the call to the server
    sender.send(code);

    Ok(())
}
