use crate::{
    auth::errors::{AuthError, AuthResult},
    config::AppConfig,
};
use std::{
    collections::HashMap,
    sync::mpsc::{channel, Sender},
    thread,
    time::Duration,
};
use tiny_http::{Request, Response, Server, StatusCode};
use url::Url;
use tauri::Manager;

pub struct OAuthSession {
    server: Server,
    app_handle: tauri::AppHandle,
    auth_url: String,
    window_label: String,
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
            window_label: "reddit_auth".to_string(),
        })
    }
    
    pub async fn wait_for_callback(self) -> AuthResult<String> {
        // Open auth window
        Self::open_auth_window(&self.app_handle, &self.auth_url, &self.window_label).await?;
        
        // Set up communication channel
        let (sender, receiver) = channel();
        
        // Clone app_handle and window_label for the cleanup thread
        let app_handle_clone = self.app_handle.clone();
        let window_label_clone = self.window_label.clone();
        
        // Start server in background thread
        let server_handle = thread::spawn(move || {
            Self::run_server(self.server, sender)
        });
        
        // Wait for auth code
        let auth_code = receiver.recv()
            .map_err(|_| AuthError::Config("Failed to receive auth code".to_string()))?;
            
        // Close the auth window after a short delay
        let close_handle = thread::spawn(move || {
            thread::sleep(Duration::from_secs(3)); // Wait 3 seconds
            if let Some(window) = app_handle_clone.get_webview_window(&window_label_clone) {
                if let Err(e) = window.close() {
                    log::warn!("Failed to close auth window: {}", e);
                } else {
                    log::info!("Auth window closed automatically");
                }
            }
        });
        
        // Clean up
        server_handle.join()
            .map_err(|_| AuthError::Config("Server thread failed".to_string()))?;
            
        // Don't wait for the close thread to complete as it's just cleanup
        let _ = close_handle.join();
            
        log::info!("OAuth callback received successfully");
        Ok(auth_code)
    }
      async fn open_auth_window(app_handle: &tauri::AppHandle, auth_url: &str, window_label: &str) -> AuthResult<()> {
        let webview_url = tauri::WebviewUrl::External(
            auth_url.parse()
                .map_err(|e| AuthError::Config(format!("Invalid auth URL: {}", e)))?
        );
        
        let window = tauri::WebviewWindowBuilder::new(app_handle, window_label, webview_url)
            .fullscreen(false)
            .resizable(true)
            .title("Reddit Authentication")
            .center()
            .build()
            .map_err(|e| AuthError::Config(format!("Failed to create auth window: {}", e)))?;
            
        window.show()
            .map_err(|e| AuthError::Config(format!("Failed to show auth window: {}", e)))?;
            
        log::info!("Authentication window opened successfully");
        Ok(())
    }
    
    fn run_server(server: Server, sender: Sender<String>) {
        loop {
            match Self::handle_request(&server, &sender) {
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
    
    fn handle_request(server: &Server, sender: &Sender<String>) -> AuthResult<bool> {
        let request = server.recv()
            .map_err(|e| AuthError::Config(format!("Server recv error: {}", e)))?;
            
        let url = request.url();
        log::debug!("Received request: {}", url);
        
        if url.starts_with("/callback") {
            let auth_code = Self::handle_callback(request)?;
            sender.send(auth_code)
                .map_err(|e| AuthError::Config(format!("Failed to send auth code: {}", e)))?;
            Ok(false) // Stop server
        } else {
            log::debug!("Unhandled route: {}", url);
            Self::send_404_response(request)?;
            Ok(true) // Continue server
        }
    }    fn handle_callback(request: Request) -> AuthResult<String> {
        let base_url = AppConfig::load().server_url;
        let url = request.url();
        let parsed_url = Url::parse(&format!("{}{}", base_url, url))
            .map_err(|e| AuthError::Config(format!("Failed to parse callback URL: {}", e)))?;
            
        let query_map: HashMap<String, String> = parsed_url.query_pairs().into_owned().collect();
        
        // Check for error parameter first
        if let Some(error) = query_map.get("error") {
            let error_description = query_map.get("error_description")
                .map(|s| s.as_str())
                .unwrap_or("Unknown error");
            return Err(AuthError::AuthenticationFailed {
                message: format!("OAuth error: {} - {}", error, error_description)
            });
        }
        
        let code = query_map.get("code")
            .ok_or_else(|| AuthError::AuthenticationFailed {
                message: "No authorization code received".to_string()
            })?
            .clone();
            
        log::debug!("Authorization code received");
        
        // Send success response
        let page = r#"
            <html>
                <head>
                    <title>Authentication Complete</title>
                    <style>
                        body { 
                            font-family: 'Segoe UI', Arial, sans-serif; 
                            text-align: center; 
                            padding: 50px;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white;
                            margin: 0;
                            min-height: 100vh;
                            display: flex;
                            flex-direction: column;
                            justify-content: center;
                            align-items: center;
                        }
                        .container {
                            background: rgba(255, 255, 255, 0.1);
                            backdrop-filter: blur(10px);
                            border-radius: 20px;
                            padding: 40px;
                            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
                            border: 1px solid rgba(255, 255, 255, 0.2);
                        }
                        .success { 
                            color: #4CAF50; 
                            font-size: 3em;
                            margin-bottom: 20px;
                            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
                        }
                        h1 {
                            margin: 20px 0;
                            font-size: 2em;
                            font-weight: 300;
                        }
                        p {
                            font-size: 1.2em;
                            line-height: 1.6;
                            margin: 15px 0;
                            opacity: 0.9;
                        }
                        .countdown {
                            font-weight: bold;
                            color: #FFD700;
                            font-size: 1.1em;
                        }
                    </style>
                    <script>
                        let countdown = 3;
                        function updateCountdown() {
                            const element = document.getElementById('countdown');
                            if (element) {
                                element.textContent = countdown;
                                countdown--;
                                if (countdown >= 0) {
                                    setTimeout(updateCountdown, 1000);
                                } else {
                                    element.textContent = 'Closing...';
                                }
                            }
                        }
                        window.onload = updateCountdown;
                    </script>
                </head>
                <body>
                    <div class="container">
                        <div class="success">✓</div>
                        <h1>Authentication Complete</h1>
                        <p>You have successfully authenticated with Reddit!</p>
                        <p>You can now return to PaperFlow to start browsing.</p>
                        <p class="countdown">This window will close automatically in <span id="countdown">3</span> seconds.</p>
                    </div>
                </body>
            </html>
        "#;
        
        let response = Response::new(StatusCode(200), vec![], page.as_bytes(), None, None);
        request.respond(response)
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
        request.respond(response)
            .map_err(|e| AuthError::Config(format!("Failed to send 404 response: {}", e)))?;
            
        Ok(())
    }
}
