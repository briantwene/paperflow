use crate::{
    auth::{
        errors::{AuthError, AuthResult},
        models::{AccessTokenResponse, RefreshTokenResponse},
    },
    config::AppConfig,
    utils::{create_http, generate_user_agent},
};

pub struct AuthHttpClient {
    client: reqwest::Client,
    base_url: String,
    user_agent: String,
}

impl AuthHttpClient {
    pub fn new(config: &AppConfig) -> Self {
        Self {
            client: create_http(),
            base_url: config.server_url.clone(),
            user_agent: generate_user_agent(),
        }
    }
    
    pub async fn exchange_code(&self, code: &str) -> AuthResult<AccessTokenResponse> {
        let params = [("code", code)];
        
        let response = self
            .client
            .post(format!("{}/reddit/auth", self.base_url))
            .header("User-Agent", &self.user_agent)
            .form(&params)
            .send()
            .await?;
            
        self.handle_auth_response(response).await
    }
    
    pub async fn refresh_token(&self, refresh_token: &str) -> AuthResult<RefreshTokenResponse> {
        let params = [("refresh_token", refresh_token)];
        
        let response = self
            .client
            .post(format!("{}/reddit/refresh", self.base_url))
            .header("User-Agent", &self.user_agent)
            .form(&params)
            .send()
            .await?;
            
        self.handle_refresh_response(response).await
    }
    
    pub async fn revoke_token(&self, token: &str) -> AuthResult<()> {
        let params = [("token", token)];
        
        let response = self
            .client
            .post(format!("{}/reddit/revoke", self.base_url))
            .header("User-Agent", &self.user_agent)
            .form(&params)
            .send()
            .await?;
            
        if response.status().is_success() {
            log::info!("Token revoked successfully");
            Ok(())
        } else {
            let status = response.status().as_u16();
            let text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            Err(AuthError::ServerError { 
                status, 
                message: format!("Token revocation failed: {}", text) 
            })
        }
    }
    
    async fn handle_auth_response(&self, response: reqwest::Response) -> AuthResult<AccessTokenResponse> {
        if response.status().is_success() {
            let token_response = response.json::<AccessTokenResponse>().await?;
            log::info!("Authentication successful");
            Ok(token_response)
        } else {
            let status = response.status().as_u16();
            let text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            log::error!("Authentication failed: {} - {}", status, text);
            Err(AuthError::ServerError { 
                status, 
                message: format!("Authentication failed: {}", text) 
            })
        }
    }
    
    async fn handle_refresh_response(&self, response: reqwest::Response) -> AuthResult<RefreshTokenResponse> {
        if response.status().is_success() {
            let token_response = response.json::<RefreshTokenResponse>().await?;
            log::info!("Token refresh successful");
            Ok(token_response)
        } else {
            let status = response.status().as_u16();
            let text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            log::error!("Token refresh failed: {} - {}", status, text);
            Err(AuthError::ServerError { 
                status, 
                message: format!("Token refresh failed: {}", text) 
            })
        }
    }
}
