use crate::auth::{
    config::RedditAuthConfig,
    errors::AuthError,
    reddit_auth::RedditAuth,
    storage::{TokenStorage, TokenStatus},
};

// Integration example function that demonstrates the workflow
pub async fn demonstrate_auth_flow() {
    println!("=== Reddit Auth Flow Demonstration ===");
    
    let auth = RedditAuth::new();
    
    // 1. Check current auth status
    println!("1. Checking authentication status...");
    let is_authenticated = auth.is_authenticated().await;
    println!("   Authenticated: {}", is_authenticated);
    
    // 2. Try to get a valid token
    println!("2. Attempting to get valid token...");
    match auth.ensure_valid_token().await {
        Ok(token) => {
            println!("   ✓ Got valid token (length: {})", token.len());
        }
        Err(AuthError::TokenNotFound) => {
            println!("   ⚠ No token found - user needs to authenticate");
        }
        Err(e) => {
            println!("   ✗ Error: {}", e);
        }
    }
    
    // 3. Generate auth URL for manual testing
    println!("3. Auth URL for manual testing:");
    match auth.initiate_login().await {
        Ok(url) => println!("   {}", url),
        Err(e) => println!("   Error generating URL: {}", e),
    }
    
    println!("=== End Demonstration ===");
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]
    async fn test_reddit_config() {
        let config = &RedditAuthConfig::REDDIT;
        assert_eq!(config.service_name, "PaperFlow");
        assert_eq!(config.client_id, "auCw6dQt_04k1hUxwc_HrA");
        assert_eq!(config.redirect_port, 32463);
        
        let auth_url = config.build_auth_url();
        assert!(auth_url.contains("reddit.com"));
        assert!(auth_url.contains("client_id="));
        assert!(auth_url.contains("scope=identity,save,read"));
    }
    
    #[tokio::test]
    async fn test_auth_initialization() {
        let auth = RedditAuth::new();
        // Should not panic and should be able to check authentication status
        let _is_authenticated = auth.is_authenticated().await;
    }
    
    #[tokio::test]
    async fn test_token_storage_missing() {
        let storage = TokenStorage::new();
        
        // Should return Missing when no tokens are stored
        match storage.check_token_validity().await {
            Ok(TokenStatus::Missing) => {}, // Expected
            Ok(_) => panic!("Expected Missing status"),
            Err(AuthError::TokenNotFound) => {}, // Also acceptable
            Err(e) => panic!("Unexpected error: {}", e),
        }
    }
}

// Remove the duplicate function that was moved up
