import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { getJson } from "serpapi";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const BACKEND_URL = process.env.RENDER_EXTERNAL_URL || '';

app.use(cors());
app.use(express.json());

// API Health Check Endpoint (useful for Docker healthchecks & container monitors)
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        service: 'hamarasafar-app',
        mode: process.env.NODE_ENV || 'development'
    });
});

// API Endpoint 1: Stays Proxy (RapidAPI Airbnb)
app.post('/api/stays', async (req, res) => {
    const { stateCode, zipcode, destination, check_in_date, check_out_date, adults, currency, priority, budget, nights, countryCode } = req.body;
    const key = process.env.RAPIDAPI_KEY;
    const serpApiKey = process.env.SERPAPI_API_KEY;
    
    // Attempt RapidAPI first if key is present
    if (key) {
        const hosts = [];
        if (process.env.RAPIDAPI_HOST) {
            hosts.push(process.env.RAPIDAPI_HOST);
        }
        if (!hosts.includes('airbnb19.p.rapidapi.com')) {
            hosts.push('airbnb19.p.rapidapi.com');
        }
        if (!hosts.includes('airbnb-listings.p.rapidapi.com')) {
            hosts.push('airbnb-listings.p.rapidapi.com');
        }

        for (const candidateHost of hosts) {
            const url = `https://${candidateHost}/api/v1/listingsByZipcode?state=${stateCode}&zipcode=${zipcode}&offset=0`;
            console.log(`[API Stays] Proxying request to RapidAPI host=${candidateHost} for zip=${zipcode}, state=${stateCode}`);
            
            try {
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'x-rapidapi-key': key,
                        'x-rapidapi-host': candidateHost
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    const rawListings = data.data || data.listings || [];
                    if (rawListings.length > 0) {
                        console.log(`[API Stays] Successfully retrieved stays from host=${candidateHost}`);
                        return res.json(data);
                    }
                } else {
                    console.error(`[API Stays] RapidAPI host=${candidateHost} error status: ${response.status}`);
                }
            } catch (e) {
                console.error(`[API Stays] RapidAPI host=${candidateHost} Exception:`, e.message);
            }
        }
    }

    // Fallback: Use Google Hotels search via SerpAPI if configured (Bypasses RapidAPI Airbnb 403 blocks)
    if (serpApiKey && destination) {
        try {
            console.log(`[API Stays] Fetching Google Hotels via SerpAPI for: "${destination}"`);
            
            // Format dates
            const checkIn = check_in_date || new Date().toISOString().split('T')[0];
            const future = new Date();
            future.setDate(future.getDate() + 3);
            const checkOut = check_out_date || future.toISOString().split('T')[0];
            
            // Avoid double suffixing search queries that already specify accommodation types
            let searchQuery = destination;
            if (!searchQuery.toLowerCase().includes("hotel") && !searchQuery.toLowerCase().includes("resort")) {
                searchQuery = `${searchQuery} Hotels`;
            }
            
            // Calculate max nightly price in USD from the user's total budget
            // Budget breakdown: subtract travel (~30%) and food (~15%) costs, then divide by nights
            const tripNights = nights || 1;
            const estimatedLodgingBudget = (budget || 50000) * 0.55; // ~55% of budget for lodging
            const nightlyLimitUserCurrency = estimatedLodgingBudget / tripNights;
            // Convert to USD for SerpAPI (which we query in USD)
            const isLocalPKR = currency === "PKR" || (countryCode && countryCode.toLowerCase() === "pk");
            const nightlyLimitUSD = isLocalPKR ? Math.round(nightlyLimitUserCurrency / 278) : Math.round(nightlyLimitUserCurrency);
            
            // Use country-appropriate localization for better local hotel results
            const glParam = (countryCode && countryCode.toLowerCase() === "pk") ? "pk" : "us";
            const hlParam = (countryCode && countryCode.toLowerCase() === "pk") ? "en" : "en";
            
            const params = {
                engine: "google_hotels",
                q: searchQuery,
                check_in_date: checkIn,
                check_out_date: checkOut,
                adults: adults || 2,
                currency: "USD",
                gl: glParam,
                hl: hlParam,
                sort_by: 3, // Sort by lowest price first — critical for budget travelers
                api_key: serpApiKey
            };
            
            // Add price ceiling filter if we have a meaningful budget limit
            if (nightlyLimitUSD > 0 && nightlyLimitUSD < 500) {
                params.max_price = Math.min(nightlyLimitUSD + 10, 500); // small buffer for edge cases
                console.log(`[API Stays] Filtering hotels with max_price=$${params.max_price}/night (nightly limit from budget: $${nightlyLimitUSD})`);
            }
            
            console.log("[API Stays] Querying SerpAPI google_hotels with params:", params);
            const json = await getJson(params);
            
            const properties = json.properties || [];
            if (properties.length > 0) {
                // Map properties to stays format expected by frontend.
                // Call google_hotels_photos and google_hotels_reviews APIs in parallel for the top properties.
                const sliceCount = Math.min(properties.length, 10);
                
                // Define priority keywords
                const priorityKeywords = {
                    scenery: ["view", "scenery", "mountain", "ocean", "landscape", "valley", "scenic", "balcony", "panorama", "sunset", "sunrise", "beautiful", "vista"],
                    safety: ["safe", "safety", "clean", "secure", "guard", "help", "friendly", "attentive", "care", "peace", "quiet"],
                    food: ["food", "dining", "restaurant", "breakfast", "dinner", "cuisine", "chef", "delicious", "tasty", "eat", "menu", "tea"],
                    adventure: ["adventure", "hiking", "climbing", "trekking", "explore", "trail", "outdoor", "nature", "sport", "cable car", "activity", "thrill", "rafting", "walk"]
                };
                
                const selectedPriority = priority || "scenery";
                const keywords = priorityKeywords[selectedPriority] || priorityKeywords["scenery"];
                
                const listings = await Promise.all(properties.slice(0, sliceCount).map(async (item) => {
                    let lowestPrice = 65;
                    if (item.rate_per_night && item.rate_per_night.lowest) {
                        const rateStr = item.rate_per_night.lowest;
                        let parsedPrice = parseInt(rateStr.replace(/[^0-9]/g, "")) || 65;
                        if (rateStr.toLowerCase().includes("rs") || rateStr.toLowerCase().includes("pkr") || parsedPrice > 1000) {
                            lowestPrice = Math.round(parsedPrice / 278);
                        } else {
                            lowestPrice = parsedPrice;
                        }
                    }
                    
                    let imageUrl = "";
                    let reviewHighlight = "";
                    let priorityScore = 0;
                    
                    // Call google_hotels_photos in parallel
                    if (serpApiKey && item.property_token) {
                        try {
                            const photoJson = await getJson({
                                engine: "google_hotels_photos",
                                property_token: item.property_token,
                                api_key: serpApiKey
                            });
                            const firstCategory = photoJson.photos?.[0];
                            const firstImage = firstCategory?.images?.[0];
                            if (firstImage && (firstImage.photo_url || firstImage.thumbnail_url)) {
                                imageUrl = firstImage.photo_url || firstImage.thumbnail_url;
                            }
                        } catch (err) {
                            console.warn(`[API Stays] Failed to fetch google_hotels_photos for ${item.name}:`, err.message);
                        }
                    }
                    
                    // Call google_hotels_reviews in parallel to find best review matching the category keywords
                    if (serpApiKey && item.property_token) {
                        try {
                            console.log(`[API Stays] Fetching google_hotels_reviews for: "${item.name}"`);
                            const reviewsJson = await getJson({
                                engine: "google_hotels_reviews",
                                property_token: item.property_token,
                                api_key: serpApiKey
                            });
                            
                            const reviews = reviewsJson.reviews || [];
                            let keywordMatches = 0;
                            let bestSnippet = "";
                            
                            reviews.forEach(rev => {
                                const snippet = rev.snippet || "";
                                const lowerSnippet = snippet.toLowerCase();
                                
                                // Count how many priority keywords match in this review
                                let matchCount = 0;
                                keywords.forEach(kw => {
                                    if (lowerSnippet.includes(kw)) {
                                        matchCount++;
                                    }
                                });
                                
                                if (matchCount > 0) {
                                    keywordMatches += matchCount;
                                    // Choose review snippet with most keyword matches as highlight
                                    if (!bestSnippet || matchCount > (bestSnippet.matchCount || 0)) {
                                        bestSnippet = { text: snippet, matchCount };
                                    }
                                }
                            });
                            
                            // Score formula: (keyword matches * 15) + overall rating value * 10
                            const overallRating = item.overall_rating || 4.5;
                            priorityScore = (keywordMatches * 15) + (overallRating * 10);
                            
                            if (bestSnippet) {
                                reviewHighlight = bestSnippet.text;
                            }
                        } catch (err) {
                            console.warn(`[API Stays] Failed to fetch google_hotels_reviews for ${item.name}:`, err.message);
                        }
                    }
                    
                    if (!imageUrl) {
                        imageUrl = item.images?.[0]?.original_image || item.images?.[0]?.thumbnail || item.thumbnail || "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=400";
                    }
                    
                    if (imageUrl.startsWith("https://lh3.googleusercontent.com") || 
                        imageUrl.startsWith("https://lh4.googleusercontent.com") || 
                        imageUrl.startsWith("https://lh5.googleusercontent.com") || 
                        imageUrl.startsWith("https://lh6.googleusercontent.com") || 
                        imageUrl.startsWith("https://googleusercontent.com") ||
                        imageUrl.startsWith("https://photos.hotelbeds.com")) {
                        imageUrl = `${BACKEND_URL}/api/proxy-hotel-image?url=${encodeURIComponent(imageUrl)}`;
                    }
                    
                    // Generate dynamic tag based on priority
                    let displayTag = "Scenic Balcony";
                    if (selectedPriority === "adventure") displayTag = "Adventure Basecamp";
                    if (selectedPriority === "food") displayTag = "Gourmet Dining";
                    if (selectedPriority === "safety") displayTag = "Peace & Safety";
                    
                    return {
                        name: item.name,
                        type: "Hotel / Resort",
                        rating: item.overall_rating || 4.5,
                        reviewsCount: item.reviews || 25,
                        lat: item.gps_coordinates?.latitude,
                        lng: item.gps_coordinates?.longitude,
                        price: lowestPrice,
                        thumbnail: imageUrl,
                        tag: displayTag,
                        priorityScore: priorityScore,
                        description: reviewHighlight || item.description || `Beautiful stay in ${destination}. Mapped from Google Hotels.`
                    };
                }));
                
                // Sort by priorityScore descending so the best category-matching hotels rise to the top!
                listings.sort((a, b) => b.priorityScore - a.priorityScore);
                
                console.log(`[API Stays] Scored and sorted ${listings.length} Google Hotels by priority="${selectedPriority}"`);
                return res.json({ data: listings });
            } else {
                console.log("[API Stays] SerpAPI google_hotels returned no properties, falling back to Google Maps search...");
                // Secondary Fallback: Use google_maps search
                const mapsJson = await getJson({
                    engine: "google_maps",
                    q: `hotels in ${destination}`,
                    type: "search",
                    api_key: serpApiKey
                });
                const localResults = mapsJson.local_results || [];
                if (localResults.length > 0) {
                    const listings = localResults.map(item => {
                        let imageUrl = item.thumbnail || "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=400";
                        if (imageUrl.startsWith("https://lh3.googleusercontent.com") || 
                            imageUrl.startsWith("https://lh4.googleusercontent.com") || 
                            imageUrl.startsWith("https://lh5.googleusercontent.com") || 
                            imageUrl.startsWith("https://lh6.googleusercontent.com") || 
                            imageUrl.startsWith("https://googleusercontent.com") ||
                            imageUrl.startsWith("https://photos.hotelbeds.com")) {
                            imageUrl = `${BACKEND_URL}/api/proxy-hotel-image?url=${encodeURIComponent(imageUrl)}`;
                        }
                        
                        let priceNum = 65;
                        if (item.price) {
                            priceNum = parseInt(item.price.replace(/[^0-9]/g, "")) || 65;
                            if (item.price.includes("Rs") || item.price.includes("PKR") || priceNum > 1000) {
                                priceNum = Math.round(priceNum / 278);
                            }
                        }
                        
                        return {
                            name: item.title,
                            type: "Hotel / Lodging",
                            rating: item.rating || 4.5,
                            reviewsCount: item.reviews || 20,
                            lat: item.gps_coordinates?.latitude,
                            lng: item.gps_coordinates?.longitude,
                            price: priceNum,
                            thumbnail: imageUrl,
                            description: `Excellent location in ${destination}. Rating ${item.rating || 4.5} stars.`
                        };
                    });
                    return res.json({ data: listings });
                }
            }
        } catch (serpErr) {
            const serpMsg = serpErr.error || serpErr.message || JSON.stringify(serpErr);
            console.error('[API Stays] SerpAPI fallback error:', serpMsg);
        }
    }

    // Ultimate Fallback: Return mock stays from local database matching the destination
    console.log(`[API Stays] Both RapidAPI and SerpAPI failed. Returning local fallback stays for: "${destination}"`);
    const normalizedDest = (destination || "").toLowerCase();
    let fallbackStays = [];
    
    if (normalizedDest.includes("hunza")) {
        fallbackStays = [
            { name: "Luxus Hunza Resort", type: "Hotel / Lodging", rating: 4.9, reviewsCount: 210, lat: 36.3195, lng: 74.7890, price: 160, thumbnail: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=400", description: "Luxury chalets overlooking Attabad Lake." },
            { name: "Darbar Hotel Hunza", type: "Hotel / Lodging", rating: 4.6, reviewsCount: 150, lat: 36.3210, lng: 74.6450, price: 65, thumbnail: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=400", description: "Boutique rooms facing Rakaposhi peak." },
            { name: "Eagles Nest Hotel Duiker", type: "Hotel / Lodging", rating: 4.8, reviewsCount: 180, lat: 36.3350, lng: 74.6710, price: 90, thumbnail: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80&w=400", description: "High vantage point sunset/sunrise views." },
            { name: "Hunza Valley Guest House", type: "Hotel / Lodging", rating: 4.4, reviewsCount: 95, lat: 36.3220, lng: 74.6470, price: 9, thumbnail: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80&w=400", description: "Budget rooms with Ultar peak views." }
        ];
    } else if (normalizedDest.includes("skardu")) {
        fallbackStays = [
            { name: "Shangrila Resort Skardu", type: "Hotel / Lodging", rating: 4.9, reviewsCount: 340, lat: 35.3100, lng: 75.5200, price: 180, thumbnail: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=400", description: "Cottages around heart-shaped Kachura Lake." },
            { name: "Serena Shigar Fort", type: "Hotel / Lodging", rating: 4.9, reviewsCount: 120, lat: 35.4215, lng: 75.7295, price: 150, thumbnail: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=400", description: "17th-century restored castle palace." },
            { name: "Deosai Base Camp Tents & Rooms", type: "Hotel / Lodging", rating: 4.3, reviewsCount: 40, lat: 35.3010, lng: 75.6410, price: 9, thumbnail: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80&w=400", description: "Camp and lodge rooms near Deosai Plains." }
        ];
    } else if (normalizedDest.includes("swat")) {
        fallbackStays = [
            { name: "Kalam Serena Hotel", type: "Hotel / Lodging", rating: 4.8, reviewsCount: 160, lat: 35.4810, lng: 72.5850, price: 110, thumbnail: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=400", description: "Gardens facing Swat River and Kalam peaks." },
            { name: "Swat Riverside Hotel", type: "Hotel / Lodging", rating: 4.1, reviewsCount: 30, lat: 34.7810, lng: 72.3550, price: 8, thumbnail: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80&w=400", description: "Clean budget rooms right on the river bank." }
        ];
    } else if (normalizedDest.includes("naran")) {
        fallbackStays = [
            { name: "Pine Park Hotel Naran", type: "Hotel / Lodging", rating: 4.7, reviewsCount: 110, lat: 34.9120, lng: 73.6550, price: 95, thumbnail: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&q=80&w=400", description: "Cottages with green lawns facing Naran peaks." },
            { name: "Kunhar View Guest House", type: "Hotel / Lodging", rating: 4.2, reviewsCount: 25, lat: 34.9080, lng: 73.6510, price: 9, thumbnail: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80&w=400", description: "Budget rooms near the main jeep stands." }
        ];
    } else if (normalizedDest.includes("fairy")) {
        fallbackStays = [
            { name: "Fairy Meadows Broad View Cottages", type: "Hotel / Lodging", rating: 4.9, reviewsCount: 140, lat: 35.3860, lng: 74.5850, price: 80, thumbnail: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=400", description: "Log cabins facing Nanga Parbat killer face." },
            { name: "Fairy Meadows Trekker Camps", type: "Hotel / Lodging", rating: 4.6, reviewsCount: 50, lat: 35.3840, lng: 74.5830, price: 7, thumbnail: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80&w=400", description: "Alpine camping tents facing Nanga Parbat." }
        ];
    } else {
        // Murree / Default Fallback
        fallbackStays = [
            { name: "Pine Heights Residency", type: "Hotel / Lodging", rating: 4.8, reviewsCount: 180, lat: 33.9105, lng: 73.3950, price: 85, thumbnail: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=400", description: "Forest views and cozy rooms in Murree." },
            { name: "The Grand Lockwood Manor", type: "Hotel / Lodging", rating: 4.9, reviewsCount: 95, lat: 33.9175, lng: 73.4080, price: 150, thumbnail: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=400", description: "Heritage living with Kashmir Point view." },
            { name: "Expressway Transit Lodge", type: "Hotel / Lodging", rating: 4.2, reviewsCount: 80, lat: 33.8820, lng: 73.3750, price: 45, thumbnail: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80&w=400", description: "Modern budget rooms near Murree Expressway." },
            { name: "Murree Backpackers Haven", type: "Hotel / Lodging", rating: 4.5, reviewsCount: 35, lat: 33.9050, lng: 73.3920, price: 9, thumbnail: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80&w=400", description: "Extremely cheap budget stay near Mall Road." }
        ];
    }
    
    return res.json({ data: fallbackStays });
});

// API Endpoint 2: Gemini Itinerary Planner
app.post('/api/itinerary', async (req, res) => {
    const { prompt } = req.body;
    const key = process.env.GEMINI_API_KEY;
    
    if (!key) {
        console.warn('[API Itinerary] Warning: GEMINI_API_KEY is not defined in .env');
        return res.status(500).json({ error: 'Gemini API key is not configured' });
    }
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
    console.log('[API Itinerary] Proxying prompt to Gemini API...');
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    responseMimeType: 'application/json'
                }
            })
        });
        
        if (!response.ok) {
            console.error(`[API Itinerary] Gemini error status: ${response.status}`);
            return res.status(response.status).json({ error: `Gemini API returned error status ${response.status}` });
        }
        
        const data = await response.json();
        return res.json(data);
    } catch (e) {
        console.error('[API Itinerary] Exception:', e.message);
        return res.status(500).json({ error: 'Failed to contact AI planner service' });
    }
});

// API Endpoint 3: Configuration Endpoint
app.get('/api/config', (req, res) => {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        console.warn('[API Config] Warning: GEMINI_API_KEY is not defined in .env');
        return res.status(500).json({ error: 'Google API key is not configured' });
    }
    return res.json({ googleApiKey: key });
});

// API Endpoint 3.5: Firebase Web Configuration Endpoint
app.get('/api/firebase-config', (req, res) => {
    return res.json({
        apiKey: process.env.FIREBASE_API_KEY || "",
        authDomain: process.env.FIREBASE_AUTH_DOMAIN || "",
        projectId: process.env.FIREBASE_PROJECT_ID || "",
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "",
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "",
        appId: process.env.FIREBASE_APP_ID || "",
        databaseURL: process.env.FIREBASE_DATABASE_URL || ""
    });
});

// API Endpoint 4: Place Photo Search Endpoint
app.post('/api/place-photo', async (req, res) => {
    const { query } = req.body;
    const key = process.env.GEMINI_API_KEY;
    const serpApiKey = process.env.SERPAPI_API_KEY;
    const lowerQuery = query.toLowerCase();

    // Hand-curated premium hotel/room images (Unsplash fallbacks)
    const premiumHotelImages = [
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&q=80&w=600"
    ];

    // Hand-curated premium scenic/landscape images (Unsplash fallbacks)
    const premiumScenicImages = [
        "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&q=80&w=600"
    ];

    // Primary: If SerpAPI key is present, fetch Google Images search results for the place!
    if (serpApiKey) {
        try {
            console.log(`[API Photo] Fetching Google Image from SerpAPI for: "${query}"`);
            const json = await getJson({
                engine: "google_images",
                q: query,
                api_key: serpApiKey
            });

            let image = json.images_results?.[0]?.original || json.images_results?.[0]?.thumbnail;
            if (image) {
                if (image.startsWith("https://lh3.googleusercontent.com") || 
                    image.startsWith("https://lh4.googleusercontent.com") || 
                    image.startsWith("https://lh5.googleusercontent.com") || 
                    image.startsWith("https://lh6.googleusercontent.com") || 
                    image.startsWith("https://googleusercontent.com") ||
                    image.startsWith("https://photos.hotelbeds.com")) {
                    image = `${BACKEND_URL}/api/proxy-hotel-image?url=${encodeURIComponent(image)}`;
                }
                console.log(`[API Photo] SerpAPI image found for "${query}":`, image);
                return res.json({ photoUrl: image });
            }
        } catch (e) {
            console.warn(`[API Photo] SerpAPI Google Images search failed:`, e.message);
        }
    }
    
    // Attempt Google Places API if key is present
    if (key && key.startsWith("AIzaSy")) {
        try {
            console.log(`[API Photo] Attempting Google Places search for: "${query}"`);
            const findUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=photos,name&key=${key}`;
            const findRes = await fetch(findUrl);
            
            if (findRes.ok) {
                const findData = await findRes.json();
                const candidate = findData.candidates?.[0];
                if (candidate && candidate.photos && candidate.photos.length > 0) {
                    const photoReference = candidate.photos[0].photo_reference;
                    return res.json({ photoUrl: `${BACKEND_URL}/api/proxy-image?ref=${photoReference}` });
                }
            }
        } catch (e) {
            console.warn(`[API Photo] Google Places lookup failed, moving to Wikipedia cascade:`, e.message);
        }
    }

    // Wikipedia Search Cascade
    try {
        console.log(`[API Photo] Running Wikipedia Search Cascade for: "${query}"`);
        const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
        const searchRes = await fetch(searchUrl);
        
        if (searchRes.ok) {
            const searchData = await searchRes.json();
            const firstResult = searchData.query?.search?.[0];
            
            if (firstResult && firstResult.title) {
                const title = firstResult.title;
                const imageFetchUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&piprop=thumbnail&pithumbsize=600&titles=${encodeURIComponent(title)}&format=json&origin=*`;
                const imageRes = await fetch(imageFetchUrl);
                
                if (imageRes.ok) {
                    const imageData = await imageRes.json();
                    const pages = imageData.query?.pages;
                    if (pages) {
                        const pageId = Object.keys(pages)[0];
                        const thumbnail = pages[pageId]?.thumbnail;
                        if (thumbnail && thumbnail.source) {
                            console.log(`[API Photo] Wikipedia image match found for "${title}":`, thumbnail.source);
                            return res.json({ photoUrl: thumbnail.source });
                        }
                    }
                }
            }
        }
    } catch (wikiErr) {
        console.warn(`[API Photo] Wikipedia search failed:`, wikiErr.message);
    }

    // Stable hash fallback to curated landscape/hotel photos
    const isLodgingQuery = lowerQuery.includes("resort") || 
                           lowerQuery.includes("hotel") || 
                           lowerQuery.includes("manor") || 
                           lowerQuery.includes("lodge") || 
                           lowerQuery.includes("stay") || 
                           lowerQuery.includes("residency") || 
                           lowerQuery.includes("suites") ||
                           lowerQuery.includes("villas");

    let hash = 0;
    for (let i = 0; i < query.length; i++) {
        hash = query.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    if (isLodgingQuery) {
        const index = Math.abs(hash) % premiumHotelImages.length;
        return res.json({ photoUrl: premiumHotelImages[index] });
    } else {
        const index = Math.abs(hash) % premiumScenicImages.length;
        return res.json({ photoUrl: premiumScenicImages[index] });
    }
});

// API Endpoint 5: Secure Google Image Proxy Stream (hides API key from client network inspect)
app.get('/api/proxy-image', async (req, res) => {
    const ref = req.query.ref;
    const key = process.env.GEMINI_API_KEY;
    
    if (!ref || !key) {
        return res.status(400).send('Missing photo reference or API key');
    }
    
    const googlePhotoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${ref}&key=${key}`;
    
    try {
        const response = await fetch(googlePhotoUrl);
        if (!response.ok) {
            return res.status(response.status).send('Failed to fetch image from Google');
        }
        
        res.setHeader('Content-Type', response.headers.get('content-type') || 'image/jpeg');
        const buffer = await response.arrayBuffer();
        return res.send(Buffer.from(buffer));
    } catch (e) {
        console.error('[API Proxy Image] Exception:', e.message);
        return res.status(500).send('Internal error proxying Google image');
    }
});

// API Endpoint 6: Proxy googleusercontent images to avoid 403 Referrer hotlinking blocks
app.get('/api/proxy-hotel-image', async (req, res) => {
    const imageUrl = req.query.url;
    if (!imageUrl) {
        return res.status(400).send('Missing url parameter');
    }
    
    // Safety check: only proxy googleusercontent domains and known hotel image hosts
    const allowed = imageUrl.startsWith('https://lh3.googleusercontent.com/') ||
                    imageUrl.startsWith('https://lh4.googleusercontent.com/') ||
                    imageUrl.startsWith('https://lh5.googleusercontent.com/') ||
                    imageUrl.startsWith('https://lh6.googleusercontent.com/') ||
                    imageUrl.startsWith('https://googleusercontent.com/') ||
                    imageUrl.startsWith('https://photos.hotelbeds.com/');
                    
    if (!allowed) {
        return res.status(400).send('Unauthorized image source');
    }
    
    try {
        const response = await fetch(imageUrl, {
            headers: {
                'Referer': '',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        
        if (!response.ok) {
            return res.status(response.status).send('Failed to fetch image');
        }
        
        res.setHeader('Content-Type', response.headers.get('content-type') || 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        
        const buffer = await response.arrayBuffer();
        return res.send(Buffer.from(buffer));
    } catch (e) {
        console.error('[API Proxy Hotel Image] Exception:', e.message);
        return res.status(500).send('Internal error proxying hotel image');
    }
});

// Helper: Get Mock POIs in case SerpAPI is depleted or not configured
function getMockPOIs(q, lat, lng) {
    const queryLower = (q || "Coffee").toLowerCase();
    
    const destinations = [
        { name: "Murree", lat: 33.9042, lng: 73.3903, pois: [
            { name: "Kashmir Point Vista", type: "Attraction", category: "attractions", rating: 4.7, reviews: 1200, lat: 33.9175, lng: 73.4080, address: "Kashmir Point, Murree", phone: "+92-51-1234567", thumbnail: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=200" },
            { name: "Pindi Point Chairlift", type: "Attraction", category: "attractions", rating: 4.4, reviews: 850, lat: 33.8970, lng: 73.3820, address: "Pindi Point, Murree", phone: "+92-51-7654321", thumbnail: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=200" },
            { name: "Patriata Forest Cafe", type: "Coffee", category: "coffee", rating: 4.5, reviews: 340, lat: 33.9010, lng: 73.3920, address: "Patriata Hills, Murree", phone: "+92-300-1234567", thumbnail: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=200" },
            { name: "Red Onion Restaurant", type: "Restaurant", category: "restaurants", rating: 4.3, reviews: 560, lat: 33.9040, lng: 73.3900, address: "Mall Road, Murree", phone: "+92-51-1112233", thumbnail: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=200" },
            { name: "Mall Road Inn", type: "Hotel", category: "hotels", rating: 4.2, reviews: 190, lat: 33.9050, lng: 73.3910, address: "Mall Road, Murree", phone: "+92-51-2223344", thumbnail: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=200" }
        ]},
        { name: "Hunza", lat: 36.3167, lng: 74.6500, pois: [
            { name: "Baltit Fort Cafe", type: "Coffee", category: "coffee", rating: 4.9, reviews: 150, lat: 36.3225, lng: 74.6675, address: "Karimabad, Hunza", phone: "+92-312-3456789", thumbnail: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=200" },
            { name: "Eagles Nest Sunrise Lookout", type: "Attraction", category: "attractions", rating: 4.9, reviews: 320, lat: 36.3350, lng: 74.6710, address: "Duiker Hills, Hunza", phone: "+92-315-1122334", thumbnail: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=200" },
            { name: "Yak Grill Hunza", type: "Restaurant", category: "restaurants", rating: 4.8, reviews: 480, lat: 36.3210, lng: 74.6460, address: "Karimabad Road, Hunza", phone: "+92-321-9876543", thumbnail: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=200" },
            { name: "Attabad Lake Boating Point", type: "Attraction", category: "attractions", rating: 4.9, reviews: 650, lat: 36.3190, lng: 74.7880, address: "Attabad Lake, Hunza", phone: "+92-345-5556667", thumbnail: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=200" },
            { name: "Luxus Hunza Chalets", type: "Hotel", category: "hotels", rating: 4.9, reviews: 210, lat: 36.3195, lng: 74.7890, address: "Attabad Lake, Hunza", phone: "+92-300-5551234", thumbnail: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=200" }
        ]},
        { name: "Skardu", lat: 35.2913, lng: 75.6338, pois: [
            { name: "Shangrila Lake Cafe", type: "Coffee", category: "coffee", rating: 4.9, reviews: 210, lat: 35.3100, lng: 75.5200, address: "Shangrila Resort, Skardu", phone: "+92-5815-123456", thumbnail: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=200" },
            { name: "Deosai National Park Gate", type: "Attraction", category: "attractions", rating: 4.9, reviews: 410, lat: 34.9950, lng: 75.2450, address: "Deosai Plains, Skardu", phone: "+92-5815-777888", thumbnail: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=200" },
            { name: "Dewan-e-Khas Skardu", type: "Restaurant", category: "restaurants", rating: 4.6, reviews: 320, lat: 35.2920, lng: 75.6340, address: "Main Bazaar, Skardu", phone: "+92-5815-456789", thumbnail: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=200" },
            { name: "Sarfaranga Desert Glamping", type: "Attraction", category: "attractions", rating: 4.8, reviews: 180, lat: 35.3050, lng: 75.6800, address: "Sarfaranga Cold Desert, Skardu", phone: "+92-311-2223344", thumbnail: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=200" }
        ]},
        { name: "Swat", lat: 35.2227, lng: 72.4258, pois: [
            { name: "Fizagat Park Riverside", type: "Attraction", category: "attractions", rating: 4.4, reviews: 390, lat: 34.7850, lng: 72.3650, address: "Fizagat, Mingora Swat", phone: "+92-946-123456", thumbnail: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=200" },
            { name: "Malam Jabba Ski Slope", type: "Attraction", category: "attractions", rating: 4.7, reviews: 720, lat: 34.7990, lng: 72.5710, address: "Malam Jabba, Swat", phone: "+92-946-999888", thumbnail: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=200" },
            { name: "Kalam River View Cafe", type: "Restaurant", category: "restaurants", rating: 4.5, reviews: 230, lat: 35.4810, lng: 72.5850, address: "Kalam, Swat", phone: "+92-946-777666", thumbnail: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=200" },
            { name: "Swat Trout House Cafe", type: "Coffee", category: "coffee", rating: 4.6, reviews: 180, lat: 35.2210, lng: 72.4240, address: "Main Road, Swat", phone: "+92-946-555444", thumbnail: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=200" }
        ]},
        { name: "Naran", lat: 34.9085, lng: 73.6521, pois: [
            { name: "Saif-ul-Muluk Jeep Track", type: "Attraction", category: "attractions", rating: 4.8, reviews: 590, lat: 34.8790, lng: 73.6960, address: "Lake Saif-ul-Muluk Road, Naran", phone: "+92-300-555999", thumbnail: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=200" },
            { name: "Babusar Top Lookout", type: "Attraction", category: "attractions", rating: 4.9, reviews: 810, lat: 35.0880, lng: 74.0280, address: "Babusar Pass, Kaghan Valley", phone: "+92-300-888777", thumbnail: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=200" },
            { name: "Naran Pine Park Restaurant", type: "Restaurant", category: "restaurants", rating: 4.4, reviews: 190, lat: 34.9120, lng: 73.6550, address: "Pine Park, Naran", phone: "+92-997-432109", thumbnail: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=200" },
            { name: "River Kunhar Tea Stall", type: "Coffee", category: "coffee", rating: 4.3, reviews: 110, lat: 34.9080, lng: 73.6510, address: "Kunhar Riverbank, Naran", phone: "+92-313-111222", thumbnail: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=200" }
        ]},
        { name: "Fairy Meadows", lat: 35.3853, lng: 74.5843, pois: [
            { name: "Raikot Bridge Jeep stand", type: "Attraction", category: "attractions", rating: 4.6, reviews: 210, lat: 35.5012, lng: 74.4512, address: "Raikot Bridge, KKH", phone: "+92-311-555666", thumbnail: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=200" },
            { name: "Tato Village Trek Start", type: "Attraction", category: "attractions", rating: 4.8, reviews: 320, lat: 35.3840, lng: 74.5830, address: "Tato Village, Raikot", phone: "+92-312-777888", thumbnail: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=200" },
            { name: "Nanga Parbat View Point", type: "Attraction", category: "attractions", rating: 4.9, reviews: 940, lat: 35.3850, lng: 74.5840, address: "Fairy Meadows Alpine Plain", phone: "+92-333-111000", thumbnail: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=200" },
            { name: "Broad View Cabin Cafe", type: "Coffee", category: "coffee", rating: 4.9, reviews: 150, lat: 35.3860, lng: 74.5850, address: "Fairy Meadows Plain", phone: "+92-344-999000", thumbnail: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=200" }
        ]}
    ];

    // Find closest destination using straight-line distance
    let closestDest = destinations[0];
    let minDist = Infinity;
    for (const dest of destinations) {
        const dist = Math.hypot(dest.lat - lat, dest.lng - lng);
        if (dist < minDist) {
            minDist = dist;
            closestDest = dest;
        }
    }

    // Filter POIs by category match
    let filteredPois = closestDest.pois;
    let targetCat = "";
    if (queryLower.includes("coffee") || queryLower.includes("cafe")) targetCat = "coffee";
    else if (queryLower.includes("restaurant") || queryLower.includes("food") || queryLower.includes("eat")) targetCat = "restaurants";
    else if (queryLower.includes("attraction") || queryLower.includes("place") || queryLower.includes("sight")) targetCat = "attractions";
    else if (queryLower.includes("hotel") || queryLower.includes("stay") || queryLower.includes("lodge")) targetCat = "hotels";

    if (targetCat) {
        filteredPois = closestDest.pois.filter(p => p.category === targetCat);
    }
    
    if (filteredPois.length === 0) {
        filteredPois = closestDest.pois;
    }

    return filteredPois;
}

// API Endpoint 7: Explore Nearby POIs using SerpAPI Google Maps search with ll coordinates
app.post('/api/nearby', async (req, res) => {
    const { q, lat, lng, zoom } = req.body;
    const serpApiKey = process.env.SERPAPI_API_KEY;
    
    if (!lat || !lng) {
        return res.status(400).json({ error: 'Missing coordinates (lat, lng)' });
    }
    
    if (!serpApiKey) {
        console.warn('[API Nearby] SerpAPI key not configured. Using local fallback POIs.');
        const mockPois = getMockPOIs(q, lat, lng);
        return res.json({ data: mockPois });
    }
    
    try {
        const params = {
            engine: "google_maps",
            q: q || "Coffee",
            ll: `@${lat},${lng},${zoom || 14}z`,
            api_key: serpApiKey
        };
        console.log(`[API Nearby] Querying google_maps for "${q || 'Coffee'}" near: ${lat},${lng}`);
        const json = await getJson(params);
        
        const localResults = json.local_results || [];
        const results = localResults.map(item => {
            let imageUrl = item.thumbnail || "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=200";
            if (imageUrl.startsWith("https://lh3.googleusercontent.com") || 
                imageUrl.startsWith("https://lh4.googleusercontent.com") || 
                imageUrl.startsWith("https://lh5.googleusercontent.com") || 
                imageUrl.startsWith("https://lh6.googleusercontent.com") || 
                imageUrl.startsWith("https://googleusercontent.com") ||
                imageUrl.startsWith("https://photos.hotelbeds.com")) {
                imageUrl = `${BACKEND_URL}/api/proxy-hotel-image?url=${encodeURIComponent(imageUrl)}`;
            }
            
            return {
                name: item.title,
                type: item.type || "POI",
                rating: item.rating || 4.5,
                reviews: item.reviews || 10,
                lat: item.gps_coordinates?.latitude,
                lng: item.gps_coordinates?.longitude,
                address: item.address,
                phone: item.phone,
                thumbnail: imageUrl
            };
        });
        
        return res.json({ data: results });
    } catch (e) {
        const errMsg = e.error || e.message || JSON.stringify(e);
        console.error('[API Nearby] google_maps search failed, falling back to local POIs. Error:', errMsg);
        const mockPois = getMockPOIs(q, lat, lng);
        return res.json({ data: mockPois });
    }
});

// Serve static frontend assets from 'dist' directory (for containerized and unified local production mode)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, 'dist');

if (fs.existsSync(distPath)) {
    console.log(`[Server] Serving compiled static frontend from: ${distPath}`);
    app.use(express.static(distPath));
    app.use((req, res, next) => {
        if (req.path.startsWith('/api')) return next();
        res.sendFile(path.join(distPath, 'index.html'));
    });
}

// Start the server
app.listen(PORT, () => {
    console.log(`[Server] Secure backend server listening on http://localhost:${PORT}`);
});
