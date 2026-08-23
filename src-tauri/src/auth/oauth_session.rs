use crate::{
    auth::errors::{
        AuthError::{self, AuthenticationFailed},
        AuthResult,
    },
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

enum CallbackOutcome {
    Success(String),
    Failure(String),
}

enum CallbackPageKind {
    Success,
    Cancelled,
    Invalid,
    NotFound,
}

struct ParsedCallback {
    error: Option<String>,
    error_description: Option<String>,
    state: Option<String>,
    code: Option<String>,
}

impl ParsedCallback {
    fn parse(url: &str) -> Self {
        let parsed_url = Url::parse(url).unwrap();
        let query_map: HashMap<String, String> = parsed_url.query_pairs().into_owned().collect();

        Self {
            error: query_map.get("error").cloned(),
            error_description: query_map.get("error_description").cloned(),
            state: query_map.get("state").cloned(),
            code: query_map.get("code").cloned(),
        }
    }
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
        app_handle
            .opener()
            .open_url(auth_url, None::<&str>)
            .map_err(|error| AuthError::Config(format!("Failed to open browser: {error}")))?;

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
        let server_url = AppConfig::load().server_url;
        let base_url = server_url;
        let url = request.url();

        let parsed = ParsedCallback::parse(&format!("{}{}", base_url, url));

        let outcome = match &parsed {
            ParsedCallback {
                error: Some(error),
                ..
            } => {
                Self::send_declined_response(request, error)?;
                CallbackOutcome::Failure("OAuth error: {error}".to_string())
            }

            ParsedCallback {
                state: Some(state),
                code: Some(code),
                ..
            } if state == expected_state => {
                Self::send_success_response(request)?;
                CallbackOutcome::Success(code.to_string())
            }

            ParsedCallback {
                state: Some(state), ..
            } if state != expected_state => {
                Self::send_invalid_response(request)?;
                CallbackOutcome::Failure("OAuth state mismatch".to_string())
            }

            _ => CallbackOutcome::Failure("Invalid OAuth callback".to_string()),
        };

        return match outcome {
            CallbackOutcome::Success(code) => Ok(code),
            CallbackOutcome::Failure(message) => Err(AuthenticationFailed { message }),
        };
    }

    fn send_success_response(request: Request) -> AuthResult<()> {
        Self::send_callback_page(request, CallbackPageKind::Success, None)
    }

    fn send_404_response(request: Request) -> AuthResult<()> {
        Self::send_callback_page(request, CallbackPageKind::NotFound, None)
    }

    fn send_declined_response(request: Request, error: &String) -> AuthResult<()> {
        Self::send_callback_page(request, CallbackPageKind::Cancelled, Some(error))
    }

    fn send_invalid_response(request: Request) -> AuthResult<()> {
        Self::send_callback_page(request, CallbackPageKind::Invalid, None)
    }

    fn send_callback_page(
        request: Request,
        kind: CallbackPageKind,
        details: Option<&str>,
    ) -> AuthResult<()> {
        let (title, headline, message, accent, status_code, include_auto_close) = match kind {
            CallbackPageKind::Success => (
                "Authentication Complete",
                "Authentication successful",
                "You can close this tab and return to Paperflow.",
                "#0ea5e9",
                StatusCode(200),
                true,
            ),
            CallbackPageKind::Cancelled => (
                "Authentication Cancelled",
                "Authentication cancelled",
                "You can close this tab and return to Paperflow.",
                "#f59e0b",
                StatusCode(200),
                false,
            ),
            CallbackPageKind::Invalid => (
                "Invalid Authentication Callback",
                "Invalid authentication callback",
                "Please return to Paperflow and try again.",
                "#ef4444",
                StatusCode(200),
                false,
            ),
            CallbackPageKind::NotFound => (
                "404 Not Found",
                "404 Not Found",
                "This route is not handled by the OAuth callback server.",
                "#64748b",
                StatusCode(404),
                false,
            ),
        };

        let detail_html = details
            .map(|value| {
                format!(
                    "<p class=\"detail\">Details: {}</p>",
                    Self::escape_html(value)
                )
            })
            .unwrap_or_default();

        let auto_close_script = if include_auto_close {
            "<script>setTimeout(() => { window.close(); }, 1000);</script>"
        } else {
            ""
        };

        let page = format!(
            r#"
            <html>
                <head>
                    <title>{}</title>
                    <style>
                        body {{
                            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            min-height: 100vh;
                            margin: 0;
                            background: linear-gradient(135deg, #f8fafc, #e2e8f0);
                            color: #0f172a;
                        }}
                        .card {{
                            width: min(560px, calc(100vw - 32px));
                            border-radius: 14px;
                            background: #ffffff;
                            border: 1px solid #e2e8f0;
                            box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12);
                            padding: 24px;
                        }}
                        .badge {{
                            width: 12px;
                            height: 12px;
                            border-radius: 999px;
                            background: {};
                            margin-bottom: 12px;
                        }}
                        h1 {{
                            margin: 0 0 10px 0;
                            font-size: 1.25rem;
                            font-weight: 650;
                        }}
                        p {{
                            margin: 0;
                            line-height: 1.55;
                            color: #334155;
                        }}
                        .detail {{
                            margin-top: 12px;
                            font-size: 0.9rem;
                            color: #64748b;
                        }}
                        @media (prefers-color-scheme: dark) {{
                            body {{
                                background: linear-gradient(135deg, #020617, #0f172a);
                                color: #e2e8f0;
                            }}
                            .card {{
                                background: #111827;
                                border-color: #1f2937;
                            }}
                            p {{
                                color: #cbd5e1;
                            }}
                            .detail {{
                                color: #94a3b8;
                            }}
                        }}
                    </style>
                    {}
                </head>
                <body>
                    <main class="card">
                        <div class="badge"></div>
                        <h1>{}</h1>
                        <p>{}</p>
                        {}
                    </main>
                </body>
            </html>
        "#,
            title, accent, auto_close_script, headline, message, detail_html
        );

        let response = Response::new(status_code, vec![], page.as_bytes(), None, None);
        request
            .respond(response)
            .map_err(|e| AuthError::Config(format!("Failed to send callback response: {}", e)))?;

        Ok(())
    }

    fn escape_html(value: &str) -> String {
        value
            .replace('&', "&amp;")
            .replace('<', "&lt;")
            .replace('>', "&gt;")
            .replace('"', "&quot;")
            .replace('\'', "&#39;")
    }
}
