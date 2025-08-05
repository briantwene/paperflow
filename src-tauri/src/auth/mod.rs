use serde_json::Value;

use self::reddit::do_token_action;

pub(crate) mod reddit;
pub(crate) mod models;
pub(crate) mod auth_status;


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
