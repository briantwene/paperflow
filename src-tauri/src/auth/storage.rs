use crate::auth::{
    config::{KeyType, RedditAuthConfig},
    errors::{AuthError, AuthResult},
    models::TokenData,
};
use chrono::Utc;

pub struct TokenStorage {
    config: &'static RedditAuthConfig,
}

impl TokenStorage {
    pub fn new() -> Self {
        Self {
            config: &RedditAuthConfig::REDDIT,
        }
    }
    
    pub async fn store_initial_tokens<T: TokenData>(&self, data: T) -> AuthResult<()> {
        let access_entry = self.config.create_entry(KeyType::Access)?;
        let refresh_entry = self.config.create_entry(KeyType::Refresh)?;
        let expiry_entry = self.config.create_entry(KeyType::Expiry)?;
        
        access_entry.set_password(data.get_access_token())?;
        refresh_entry.set_password(data.get_refresh_token())?;
        expiry_entry.set_password(&data.get_token_expiry())?;
        
        log::info!("Initial tokens stored successfully");
        Ok(())
    }
    
    pub async fn store_refreshed_tokens<T: TokenData>(&self, data: T) -> AuthResult<()> {
        let access_entry = self.config.create_entry(KeyType::Access)?;
        let expiry_entry = self.config.create_entry(KeyType::Expiry)?;
        
        access_entry.set_password(data.get_access_token())?;
        expiry_entry.set_password(&data.get_token_expiry())?;
        
        log::info!("Refreshed tokens stored successfully");
        Ok(())
    }
    
    pub async fn revoke_all_tokens(&self) -> AuthResult<()> {
        let access_entry = self.config.create_entry(KeyType::Access)?;
        let refresh_entry = self.config.create_entry(KeyType::Refresh)?;
        let expiry_entry = self.config.create_entry(KeyType::Expiry)?;
        
        // Attempt to delete all tokens, collect any errors
        let mut errors = Vec::new();
        
        if let Err(e) = access_entry.delete_password() {
            errors.push(format!("access token: {}", e));
        }
        
        if let Err(e) = refresh_entry.delete_password() {
            errors.push(format!("refresh token: {}", e));
        }
        
        if let Err(e) = expiry_entry.delete_password() {
            errors.push(format!("expiry token: {}", e));
        }
        
        if !errors.is_empty() {
            log::warn!("Some tokens failed to delete: {}", errors.join(", "));
        } else {
            log::info!("All tokens revoked successfully");
        }
        
        Ok(())
    }
    
    pub async fn get_access_token(&self) -> AuthResult<String> {
        let entry = self.config.create_entry(KeyType::Access)?;
        entry.get_password().map_err(|_| AuthError::TokenNotFound)
    }
    
    pub async fn get_refresh_token(&self) -> AuthResult<String> {
        let entry = self.config.create_entry(KeyType::Refresh)?;
        entry.get_password().map_err(|_| AuthError::TokenNotFound)
    }
    
    pub async fn check_token_validity(&self) -> AuthResult<TokenStatus> {
        // Check if access token exists
        let access_result = self.get_access_token().await;
        if access_result.is_err() {
            return Ok(TokenStatus::Missing);
        }
        
        // Check expiry
        let expiry_entry = self.config.create_entry(KeyType::Expiry)?;
        let expiry_str = expiry_entry.get_password()
            .map_err(|_| AuthError::TokenNotFound)?;
        
        let expiry = expiry_str.parse::<i64>()?;
        let current_time = Utc::now().timestamp();
        
        if current_time < expiry {
            Ok(TokenStatus::Valid(access_result.unwrap()))
        } else {
            Ok(TokenStatus::Expired)
        }
    }
}

#[derive(Debug)]
pub enum TokenStatus {
    Valid(String),
    Expired,
    Missing,
}
