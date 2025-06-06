use thiserror::Error;

#[derive(Error, Debug)]
pub enum AuthError {
    #[error("Keyring operation failed: {0}")]
    Keyring(#[from] keyring::Error),
    
    #[error("HTTP request failed: {0}")]
    Http(#[from] reqwest::Error),
    
    #[error("Token has expired")]
    TokenExpired,
    
    #[error("Authentication failed: {message}")]
    AuthenticationFailed { message: String },
    
    #[error("Configuration error: {0}")]
    Config(String),
    
    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),
    
    #[error("Parse error: {0}")]
    Parse(String),
    
    #[error("Token not found")]
    TokenNotFound,
    
    #[error("Invalid token format")]
    InvalidTokenFormat,
    
    #[error("Server communication error: {status} - {message}")]
    ServerError { status: u16, message: String },
}

impl From<std::num::ParseIntError> for AuthError {
    fn from(err: std::num::ParseIntError) -> Self {
        AuthError::Parse(err.to_string())
    }
}

// Result type alias for convenience
pub type AuthResult<T> = Result<T, AuthError>;
