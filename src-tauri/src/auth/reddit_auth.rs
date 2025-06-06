use crate::{
    auth::{
        errors::{AuthError, AuthResult},
        http_client::AuthHttpClient,
        provider::AuthProvider,
        reddit_provider::RedditProvider,
        storage::{TokenStatus, TokenStorage},
    },
    config::AppConfig,
};

pub struct RedditAuth {
    provider: RedditProvider,
    storage: TokenStorage,
}

impl RedditAuth {
    pub fn new() -> Self {
        let config = AppConfig::load();
        let http_client = AuthHttpClient::new(&config);
        let storage = TokenStorage::new();
        
        Self {
            provider: RedditProvider::new(http_client),
            storage,
        }
    }
    
    pub async fn initiate_login(&self) -> AuthResult<String> {
        self.provider.initiate_auth().await
    }
    
    pub async fn complete_auth(&self, code: String) -> AuthResult<()> {
        let tokens = self.provider.exchange_code(&code).await?;
        self.storage.store_initial_tokens(tokens).await?;
        log::info!("Reddit authentication completed successfully");
        Ok(())
    }
    
    pub async fn ensure_valid_token(&self) -> AuthResult<String> {
        match self.storage.check_token_validity().await? {
            TokenStatus::Valid(token) => {
                log::debug!("Token is valid");
                Ok(token)
            }
            TokenStatus::Expired => {
                log::info!("Token expired, refreshing...");
                self.refresh_token().await?;
                self.storage.get_access_token().await
            }
            TokenStatus::Missing => {
                log::error!("No token found, authentication required");
                Err(AuthError::TokenNotFound)
            }
        }
    }
    
    pub async fn revoke_auth(&self) -> AuthResult<()> {
        // Get refresh token for revocation
        let refresh_token = self.storage.get_refresh_token().await?;
        
        // Revoke token on server
        self.provider.revoke_token(&refresh_token).await?;
        
        // Clear local storage
        self.storage.revoke_all_tokens().await?;
        
        log::info!("Reddit authentication revoked successfully");
        Ok(())
    }
    
    pub async fn is_authenticated(&self) -> bool {
        matches!(
            self.storage.check_token_validity().await,
            Ok(TokenStatus::Valid(_)) | Ok(TokenStatus::Expired)
        )
    }
    
    async fn refresh_token(&self) -> AuthResult<()> {
        let refresh_token = self.storage.get_refresh_token().await?;
        let new_tokens = self.provider.refresh_token(&refresh_token).await?;
        self.storage.store_refreshed_tokens(new_tokens).await?;
        log::info!("Token refreshed successfully");
        Ok(())
    }
}
