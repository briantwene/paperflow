use serde_json::Value;

use self::reddit::do_token_action;

pub(crate) mod reddit;
pub(crate) mod models;
pub(crate) mod auth_status;
pub(crate) mod errors;
pub(crate) mod config;
pub(crate) mod storage;
pub(crate) mod http_client;
pub(crate) mod provider;
pub(crate) mod reddit_provider;
pub(crate) mod reddit_auth;
pub(crate) mod oauth_session;
pub(crate) mod tests;


#[tauri::command]
pub async fn disconnect(provider: String) -> Result<Value, ()> {
    println!("DISCONNECT: {provider}");
    match provider.to_lowercase().as_str() {
        "reddit" => {
            match do_token_action(models::TokenContext::Revoke, None).await {
                Ok(_) => Ok(serde_json::json!({
                    "status": "success",
                    "message": "Successfully disconnected from Reddit"
                })),
                Err(_) => Err(()),
            }
        },
        _ => Ok(invalid_provider_response()),
    }
}


fn invalid_provider_response() -> Value {
    serde_json::json!({
        "status": "error",
        "message": "Invalid provider"
    })
}

// New improved commands using the refactored architecture
#[tauri::command]
pub async fn start_reddit_auth_v2(app_handle: tauri::AppHandle) -> Result<String, String> {
    use crate::auth::{reddit_auth::RedditAuth, oauth_session::OAuthSession};
    
    let auth = RedditAuth::new();
    
    // Get auth URL
    let auth_url = auth.initiate_login().await
        .map_err(|e| format!("Failed to initiate login: {}", e))?;
    
    // Start OAuth session
    let oauth_session = OAuthSession::new(app_handle, auth_url).await
        .map_err(|e| format!("Failed to create OAuth session: {}", e))?;
    
    // Wait for callback
    let auth_code = oauth_session.wait_for_callback().await
        .map_err(|e| format!("OAuth callback failed: {}", e))?;
    
    // Complete authentication
    auth.complete_auth(auth_code).await
        .map_err(|e| format!("Failed to complete authentication: {}", e))?;
    
    Ok("Authentication successful".to_string())
}

#[tauri::command]
pub async fn get_reddit_token_v2() -> Result<String, String> {
    use crate::auth::reddit_auth::RedditAuth;
    
    let auth = RedditAuth::new();
    auth.ensure_valid_token().await
        .map_err(|e| format!("Failed to get valid token: {}", e))
}

// Internal function for provider usage - not exposed to frontend
pub async fn get_reddit_token_for_provider() -> Result<String, crate::auth::errors::AuthError> {
    use crate::auth::reddit_auth::RedditAuth;
    
    let auth = RedditAuth::new();
    auth.ensure_valid_token().await
}

#[tauri::command]
pub async fn revoke_reddit_auth_v2() -> Result<String, String> {
    use crate::auth::reddit_auth::RedditAuth;
    
    let auth = RedditAuth::new();
    auth.revoke_auth().await
        .map_err(|e| format!("Failed to revoke authentication: {}", e))?;
    
    Ok("Authentication revoked successfully".to_string())
}

#[tauri::command]
pub async fn check_reddit_auth_status_v2() -> Result<bool, String> {
    use crate::auth::reddit_auth::RedditAuth;
    
    let auth = RedditAuth::new();
    Ok(auth.is_authenticated().await)
}

#[tauri::command]
pub async fn get_reddit_user_info() -> Result<serde_json::Value, String> {
    use crate::auth::reddit_auth::RedditAuth;
    use crate::utils::create_http;
    
    let auth = RedditAuth::new();
    
    // Check if authenticated
    if !auth.is_authenticated().await {
        return Err("Not authenticated with Reddit".to_string());
    }
    
    // Get valid token
    let token = auth.ensure_valid_token().await
        .map_err(|e| format!("Failed to get valid token: {}", e))?;
    
    // Make API call to get user info using the existing HTTP client pattern
    let client = create_http();
    let response = client
        .get("https://oauth.reddit.com/api/v1/me")
        .bearer_auth(&token)
        .send()
        .await
        .map_err(|e| format!("Failed to fetch user info: {}", e))?;
    
    if !response.status().is_success() {
        return Err(format!("Reddit API error: {}", response.status()));
    }
    
    let user_data: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse user info response: {}", e))?;
    
    // Extract username
    if let Some(username) = user_data.get("name").and_then(|v| v.as_str()) {
        Ok(serde_json::json!({
            "username": username
        }))
    } else {
        Err("Could not extract username from Reddit response".to_string())
    }
}

#[tauri::command]
pub async fn demo_auth_flow_v2() -> Result<String, String> {
    use crate::auth::tests;
    
    tests::demonstrate_auth_flow().await;
    Ok("Demo completed - check console output".to_string())
}
