use crate::auth::{
    errors::AuthResult,
    models::TokenData,
};
use async_trait::async_trait;

#[async_trait]
pub trait AuthProvider {
    type TokenResponse: TokenData;
    type RefreshResponse: TokenData;
    
    async fn initiate_auth(&self) -> AuthResult<String>;
    async fn exchange_code(&self, code: &str) -> AuthResult<Self::TokenResponse>;
    async fn refresh_token(&self, refresh_token: &str) -> AuthResult<Self::RefreshResponse>;
    async fn revoke_token(&self, token: &str) -> AuthResult<()>;
    async fn get_stored_token(&self) -> AuthResult<String>;
}

pub trait ProviderConfig {
    fn service_name() -> &'static str;
    fn token_keys() -> TokenKeys;
}

#[derive(Debug, Clone)]
pub struct TokenKeys {
    pub access: &'static str,
    pub refresh: &'static str,
    pub expiry: &'static str,
}
