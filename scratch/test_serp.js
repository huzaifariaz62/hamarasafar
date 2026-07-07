import { getJson } from "serpapi";
import dotenv from "dotenv";

dotenv.config();

const serpApiKey = process.env.SERPAPI_API_KEY || "4a384b667efb2556052e67565dd0166ed4f75cd5e07b84ad77124e95347f788a";

async function test() {
    try {
        console.log("Testing SerpAPI with key:", serpApiKey);
        const params = {
            engine: "google_maps",
            q: "Coffee",
            ll: "@33.9042,73.3903,14z",
            api_key: serpApiKey
        };
        const json = await getJson(params);
        console.log("SUCCESS! Found local results:", json.local_results?.length);
    } catch (e) {
        console.error("ERROR CAUGHT:", e);
        console.error("ERROR keys:", Object.keys(e));
        console.error("ERROR JSON:", JSON.stringify(e));
    }
}

test();
