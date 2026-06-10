import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getJson } from "serpapi";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const BACKEND_URL = process.env.RENDER_EXTERNAL_URL || '';

app.use(cors());
app.use(express.json());

// API Endpoint 1: Stays Proxy (RapidAPI Airbnb)
app.post('/api/stays', async (req, res) => {
    const { stateCode, zipcode, destination, check_in_date, check_out_date, adults, currency, priority } = req.body;
    const key = process.env.RAPIDAPI_KEY;
    const host = 'airbnb19.p.rapidapi.com';
    const serpApiKey = process.env.SERPAPI_API_KEY;
    
    // Attempt RapidAPI first if key is present
    if (key) {
        const url = `https://${host}/api/v1/listingsByZipcode?state=${stateCode}&zipcode=${zipcode}&offset=0`;
        console.log(`[API Stays] Proxying request to RapidAPI for zip=${zipcode}, state=${stateCode}`);
        
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'x-rapidapi-key': key,
                    'x-rapidapi-host': host
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                const rawListings = data.data || data.listings || [];
                if (rawListings.length > 0) {
                    return res.json(data);
                }
            } else {
                console.error(`[API Stays] RapidAPI error status: ${response.status}`);
            }
        } catch (e) {
            console.error('[API Stays] RapidAPI Exception:', e.message);
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
            
            const params = {
                engine: "google_hotels",
                q: searchQuery,
                check_in_date: checkIn,
                check_out_date: checkOut,
                adults: adults || 2,
                currency: "USD", // Force USD from SerpAPI to maintain standard currency representation
                gl: "us",
                hl: "en",
                api_key: serpApiKey
            };
            
            console.log("[API Stays] Querying SerpAPI google_hotels with params:", params);
            const json = await getJson(params);
            
            const properties = json.properties || [];
            if (properties.length > 0) {
                // Map properties to stays format expected by frontend.
                // Call google_hotels_photos and google_hotels_reviews APIs in parallel for the top properties.
                const sliceCount = Math.min(properties.length, 5);
                
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
            console.error('[API Stays] SerpAPI fallback error:', serpErr.message);
        }
    }

    return res.status(500).json({ error: 'No stays available from RapidAPI or SerpAPI' });
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

// API Endpoint 7: Explore Nearby POIs using SerpAPI Google Maps search with ll coordinates
app.post('/api/nearby', async (req, res) => {
    const { q, lat, lng, zoom } = req.body;
    const serpApiKey = process.env.SERPAPI_API_KEY;
    
    if (!serpApiKey) {
        return res.status(500).json({ error: 'SerpAPI key not configured' });
    }
    
    if (!lat || !lng) {
        return res.status(400).json({ error: 'Missing coordinates (lat, lng)' });
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
        // Map local results to a clean format for Leaflet markers
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
        console.error('[API Nearby] google_maps search failed:', e.message);
        return res.status(500).json({ error: e.message });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`[Server] Secure backend server listening on http://localhost:${PORT}`);
});
