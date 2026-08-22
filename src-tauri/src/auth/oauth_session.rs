use crate::{
    auth::errors::{AuthError, AuthResult},
    config::AppConfig,
};
use std::{
    collections::HashMap,
    sync::mpsc::{channel, Sender},
    thread,
};

use tauri_plugin_opener::OpenerExt;
use tiny_http::{Request, Response, Server, StatusCode};
use url::Url;

pub struct OAuthSession {
    server: Server,
    app_handle: tauri::AppHandle,
    auth_url: String,
}

impl OAuthSession {
    pub async fn new(app_handle: tauri::AppHandle, auth_url: String) -> AuthResult<Self> {
        let server = Server::http("127.0.0.1:32463")
            .map_err(|e| AuthError::Config(format!("Failed to start OAuth server: {}", e)))?;

        log::info!("OAuth server started successfully on port 32463");

        Ok(Self {
            server,
            app_handle,
            auth_url,
        })
    }

    pub async fn wait_for_callback(self, expected_state: &str) -> AuthResult<String> {
        // Open auth window
        Self::open_auth_browser(&self.app_handle, &self.auth_url).await?;

        // Set up communication channel
        let (sender, receiver) = channel::<AuthResult<String>>();
        let expected_state = expected_state.to_string();

        // Start server in background thread
        let server_handle =
            thread::spawn(move || Self::run_server(self.server, sender, &expected_state));

        // Wait for auth code
        let auth_code = receiver
            .recv()
            .map_err(|_| AuthError::Config("Failed to receive auth code".to_string()))??;

        // Clean up
        server_handle
            .join()
            .map_err(|_| AuthError::Config("Server thread failed".to_string()))?;

        log::info!("OAuth callback received successfully");
        Ok(auth_code)
    }
    async fn open_auth_browser(app_handle: &tauri::AppHandle, auth_url: &str) -> AuthResult<()> {
        let _ = app_handle
            .opener()
            .open_url(auth_url, None::<&str>)
            .map_err(|error| AuthError::Config(format!("Failed to open browser: {error}")));

        log::info!("Authentication window opened successfully");
        Ok(())
    }

    fn run_server(server: Server, sender: Sender<AuthResult<String>>, expected_state: &String) {
        loop {
            match Self::handle_request(&server, &sender, expected_state) {
                Ok(should_continue) => {
                    if !should_continue {
                        break;
                    }
                }
                Err(err) => {
                    log::error!("OAuth server error: {:?}", err);
                    break;
                }
            }
        }
        log::info!("OAuth server stopped");
    }

    fn handle_request(
        server: &Server,
        sender: &Sender<AuthResult<String>>,
        expected_state: &String,
    ) -> AuthResult<bool> {
        let request = server
            .recv()
            .map_err(|e| AuthError::Config(format!("Server recv error: {}", e)))?;

        let url = request.url();
        log::debug!("Received request: {}", url);

        if url.starts_with("/callback") {
            let callback_result = Self::handle_callback(request, expected_state);
            sender
                .send(callback_result)
                .map_err(|_| AuthError::Config("Failed to deliver OAuth result".to_string()))?;
            Ok(false) // Stop server
        } else {
            log::debug!("Unhandled route: {}", url);
            Self::send_404_response(request)?;
            Ok(true) // Continue server
        }
    }
    fn handle_callback(request: Request, expected_state: &str) -> AuthResult<String> {
        let base_url = AppConfig::load().server_url;
        let url = request.url();
        let parsed_url = Url::parse(&format!("{}{}", base_url, url))
            .map_err(|e| AuthError::Config(format!("Failed to parse callback URL: {}", e)))?;

        let query_map: HashMap<String, String> = parsed_url.query_pairs().into_owned().collect();

        // Check for error parameter first
        if let Some(error) = query_map.get("error") {
            let error_description = query_map
                .get("error_description")
                .map(|s| s.as_str())
                .unwrap_or("Unknown error");

            Self::send_declined_response(request)?;
            return Err(AuthError::AuthenticationFailed {
                message: format!("OAuth error: {} - {}", error, error_description),
            });
        }

        let returned_state =
            query_map
                .get("state")
                .ok_or_else(|| AuthError::AuthenticationFailed {
                    message: "No OAuth state returned".to_string(),
                })?;

        if returned_state != expected_state {
            return Err(AuthError::AuthenticationFailed {
                message: "OAuth state mismatch".to_string(),
            });
        }

        let code = query_map
            .get("code")
            .ok_or_else(|| AuthError::AuthenticationFailed {
                message: "No authorization code received".to_string(),
            })?
            .clone();

        log::debug!("Authorization code received");

        // Send minimal success response with auto-close
        let page = r#"
            <html>
                <head>
                    <title>Authentication Complete</title>
                    <style>
                        body { 
                            font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            min-height: 100vh;
                            margin: 0;
                            background: hsl(220 25% 97%);
                            color: hsl(224 71% 4%);
                        }
                        .success {
                            text-align: center;
                            padding: 20px;
                        }
                        .checkmark {
                            font-size: 3em;
                            color: hsl(207 89% 50%);
                            margin-bottom: 10px;
                        }
                        @media (prefers-color-scheme: dark) {
                            body {
                                background: hsl(224 71% 4%);
                                color: hsl(213 31% 91%);
                            }
                        }
                    </style>
                    <script>
                        // Auto-close after 1 second
                        setTimeout(() => {
                            window.close();
                        }, 1000);
                    </script>
                </head>
                <body>
                    <div class="success">
                        <p>Authentication successful!</p>
                    </div>
                </body>
            </html>
        "#;

        let response = Response::new(StatusCode(200), vec![], page.as_bytes(), None, None);
        request
            .respond(response)
            .map_err(|e| AuthError::Config(format!("Failed to send response: {}", e)))?;

        Ok(code)
    }

    fn send_404_response(request: Request) -> AuthResult<()> {
        let page = r#"
            <html>
                <head><title>404 Not Found</title></head>
                <body><h1>404 Not Found</h1></body>
            </html>
        "#;

        let response = Response::new(StatusCode(404), vec![], page.as_bytes(), None, None);
        request
            .respond(response)
            .map_err(|e| AuthError::Config(format!("Failed to send 404 response: {}", e)))?;

        Ok(())
    }

    fn send_declined_response(request: Request) -> AuthResult<()> {
        let page = r#"
            <html>
                <head><title>Authentication Declined</title></head>
                <body><h1>404 Not Found</h1></body>
            </html>
        "#;

        let response = Response::new(StatusCode(404), vec![], page.as_bytes(), None, None);
        request
            .respond(response)
            .map_err(|e| AuthError::Config(format!("Failed to send 404 response: {}", e)))?;

        Ok(())
    }
}
