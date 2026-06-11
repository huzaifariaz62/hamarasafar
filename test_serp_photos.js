import { getJson } from "serpapi";
import dotenv from 'dotenv';

dotenv.config();

const serpApiKey = process.env.SERPAPI_API_KEY;
if (!serpApiKey) {
    console.error("SERPAPI_API_KEY not set in .env");
    process.exit(1);
}

// Viceroy Bali property token from previous google_hotels test response
const propertyToken = "ChgIgo6sz8bq_9kLGgwvZy8xMjR0NjNscGIQAQ";

getJson({
  engine: "google_hotels_photos",
  property_token: propertyToken,
  api_key: serpApiKey
}, (json) => {
  console.log("Keys in photos json:", Object.keys(json));
  if (json.photos) {
    console.log("Number of categories/photos:", json.photos.length);
    console.log("Sample photo category:", JSON.stringify(json.photos[0], null, 2));
  } else {
    console.log("No photos key found. Full JSON:", JSON.stringify(json, null, 2));
  }
});
