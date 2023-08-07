
use reqwest::Client;


// parameters for search options
struct Params {
    limit: i32,
    include_over_18: bool,
}

// default fields when instance is created
impl Default for Params {
    fn default() -> Self {
        Params {
            limit: 75,
            include_over_18: true,
        }
    }
}

//struct for Fetcher
pub struct Fetcher {
    host: String,
    parameters: Params,
    client: Client,
}

impl Default for Fetcher {
    fn default() -> Self {
        Fetcher {
            host: String::from("https://www.reddit.com"),
            parameters: Params::default(),
            client: Client::new(),
        }
    }
}

impl Fetcher {
    //set up the fetcher with the HTTP client
    pub fn setup(&mut self) {
        self.client = reqwest::Client::builder()
            .user_agent("PaperFlow")
            .build()
            .expect("Failed to create client");
    }

    // Method for getting posts
    pub async fn get_posts(&self, subreddit: String, sort: String) -> String {
        let url = format!(
            "{}/r/{}.json?sort={}&limit={}",
            self.host, subreddit, sort, self.parameters.limit
        );
     
        match self.client.get(&url).send().await {
            Ok(response) => match response.text().await {
                Ok(body) => {
                    //println!("{:?}", body);
                    return body;
                }

                Err(e) => {
                    println!("error reading response body: {}", e);
                    return String::from("Error occured while reading response body");
                }
            },

            Err(e) => {
                println!("Error handling HTTP request: {}", e);
                return String::from("Error occured while sending HTTP request");
            }
        }
    }

    pub async fn get_info(&self, image: String) -> String {
        // make the request
        let url = format!("{}/{}.json", self.host, image);

        match self.client.get(url).send().await {
            Ok(response) => match response.text().await {
                Ok(body) => body,
                Err(e) => {
                   return String::from("error getting picture info");
                }
            },

            Err(e) => {
               return String::from("error getting picture info");
            }
        }
    }

   
}
