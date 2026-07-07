// Hamara Safar - Core Application Logic

// -------------------------------------------------------------
// Global App State
// -------------------------------------------------------------
const state = {
    user: {
        loggedIn: false,
        name: "Alex Carter",
        currency: "PKR"
    },
    activeScreen: "screen-splash",
    carouselIndex: 0,
    currentTrip: null, // Stores active input values
    mapInstance: null,
    weatherForecast: null,
    selectedStays: [],
    itineraryData: null,
    googleAutocompleteActive: false
};

// -------------------------------------------------------------
// Database (Mock data for fallback and interactive logic)
// -------------------------------------------------------------
const DESTINATIONS_DB = {
    "murree, pakistan": {
        name: "Murree Hills",
        country: "Pakistan",
        lat: 33.9042,
        lng: 73.3903,
        startLat: 33.6844, // Islamabad starting point
        startLng: 73.0479,
        baseCurrency: "PKR",
        stateCode: "pk",
        zipcode: "44000",
        weatherPatterns: {
            rainy: {
                summary: "Day 1-2: Rain Storm Warning",
                icon: "🌧️",
                badge: "Hazard Warning",
                badgeColor: "bg-red-500/10 text-red-600 border border-red-200",
                description: "Heavy downpour predicted in Murree hills. Risk of landslides on Old Murree Road. Expressway (N-75) is monitored and declared SAFE.",
                safeRouteName: "Islamabad-Murree Expressway (N-75)",
                safeRoutePath: [
                    [33.6844, 73.0479], // Islamabad
                    [33.7120, 73.1820], // Bhara Kahu Bypass
                    [33.7650, 73.2840], // Salgran
                    [33.8200, 73.3450], // Lower Topa
                    [33.9042, 73.3903]  // Murree Mall Road
                ],
                riskyRoutePath: [
                    [33.6844, 73.0479], // Islamabad
                    [33.7380, 73.1510], // Old Chatla
                    [33.7920, 73.2420], // Tret Old Road
                    [33.8540, 73.3100], // Ghora Gali Mountain Path
                    [33.9042, 73.3903]  // Murree
                ],
                isRainy: true
            },
            sunny: {
                summary: "Day 1-3: Clear Mountain Skies",
                icon: "☀️",
                badge: "Perfect Weather",
                badgeColor: "bg-primary/10 text-primary border border-primary/20",
                description: "Sunny and cool mountain weather. Ideal road conditions. Standard scenic paths are fully accessible.",
                safeRouteName: "Scenic Old Ghora Gali Route",
                safeRoutePath: [
                    [33.6844, 73.0479],
                    [33.7380, 73.1510],
                    [33.7920, 73.2420],
                    [33.8540, 73.3100],
                    [33.9042, 73.3903]
                ],
                riskyRoutePath: [],
                isRainy: false
            }
        },
        stays: [
            {
                name: "Pine Heights Residency",
                desc: "Unbelievable forest views! The balcony faces the deep valley pines. Extremely cozy rooms and fireplace.",
                rating: 4.8,
                reviews: "Best view in Murree. Highly recommended if you want to look at sunset peaks.",
                lat: 33.9105,
                lng: 73.3950,
                price: 85,
                image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=400"
            },
            {
                name: "The Grand Lockwood Manor",
                desc: "Heritage living with colonial style views. Overlooks Kashmir Point peaks and misty pine forest.",
                rating: 4.9,
                reviews: "Outstanding view of snowy hills in winter. Friendly staff, vintage interior.",
                lat: 33.9175,
                lng: 73.4080,
                price: 150,
                image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=400"
            },
            {
                name: "Expressway Transit Lodge",
                desc: "Modern budget rooms right next to Expressway. Highly accessible, safe during rain bypass.",
                rating: 4.2,
                reviews: "Standard clean rooms, perfect safety accessibility but average valley view.",
                lat: 33.8820,
                lng: 73.3750,
                price: 45,
                image: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80&w=400"
            },
            {
                name: "Murree Backpackers Haven",
                desc: "Super budget-friendly rooms near Mall Road. Clean, cozy, and highly secure for students and solo travelers.",
                rating: 4.5,
                reviews: "Unbelievably cheap! Safe location, walking distance from the main market.",
                lat: 33.9050,
                lng: 73.3920,
                price: 9,
                image: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80&w=400"
            }
        ],
        photoSpots: [
            { name: "Kashmir Point Vista", description: "Highest peak viewpoint in Murree offering snow peak photography spots.", lat: 33.9189, lng: 73.4116 },
            { name: "Pindi Point Chairlift", description: "Provides bird's eye panoramic views of Pine Valleys and cities.", lat: 33.8967, lng: 73.3820 },
            { name: "Patriata Misty Forest", description: "Incredible pine forest photography spots with frequent clouds floating through.", lat: 33.8824, lng: 73.4542 }
        ],
        fallbackPlan: {
            itinerary: [
                {
                    day: 1,
                    title: "Arrival via Safe Expressway",
                    description: "Drive safely from Islamabad using the N-75 Expressway to bypass old winding road hazards. Check into your valley view room.",
                    activities: [
                        { name: "Drive Expressway", detail: "Enjoy safe wide roads with rain-safe parameters." },
                        { name: "Mall Road Stroll", detail: "Grab hot tea and famous local Murree sweets." }
                    ]
                },
                {
                    day: 2,
                    title: "Balcony Sightseeing & Kashmir Point",
                    description: "Enjoy peaceful misty photography sessions from Kashmir Point and capture the pine forest colors.",
                    activities: [
                        { name: "Misty Valley Shoots", detail: "Early morning photography from Kashmir Point view peaks." },
                        { name: "Lockwood Tea Lounge", detail: "Cozy local tea tasting while watching downpour." }
                    ]
                },
                {
                    day: 3,
                    title: "Patriata Chairlift & Safe Return",
                    description: "Take the cable cars if wind parameters are safe, and proceed to drive back to Islamabad via the secure expressway route.",
                    activities: [
                        { name: "Patriata Pine Forest", detail: "Walk along pine needle pathways under safety umbrellas." },
                        { name: "Expressway Return", detail: "Complete your safe trip back to Islamabad." }
                    ]
                }
            ]
        }
    },
    "kyoto, japan": {
        name: "Kyoto",
        country: "Japan",
        lat: 35.0116,
        lng: 135.7681,
        startLat: 34.6937, // Osaka starting point
        startLng: 135.5023,
        baseCurrency: "USD",
        stateCode: "jp",
        zipcode: "600-8216",
        weatherPatterns: {
            sunny: {
                summary: "Day 1-3: Cherry Blossom Sun",
                icon: "🌸",
                badge: "Pleasant",
                badgeColor: "bg-primary/10 text-primary border border-primary/20",
                description: "Warm, clear weather with excellent visibility. Cherry trees in full bloom.",
                safeRouteName: "Keihan Highway Link",
                safeRoutePath: [
                    [34.6937, 135.5023], // Osaka
                    [34.8010, 135.6320], // Hirakata
                    [34.9010, 135.7010], // Uji
                    [35.0116, 135.7681]  // Kyoto
                ],
                riskyRoutePath: [],
                isRainy: false
            }
        },
        stays: [
            {
                name: "Gion Heritage Ryokan",
                desc: "Stunning view of Yasaka Pagoda! Relax on traditional tatami mats with garden views.",
                rating: 4.9,
                reviews: "Absolute zen. The sliding panels reveal a private moss garden and a wooden bridge.",
                lat: 34.9995,
                lng: 135.7750,
                price: 180,
                image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&q=80&w=400"
            },
            {
                name: "Kamo River Glass Loft",
                desc: "Modern glass architectural house facing Kamo River. Incredible city light reflection views.",
                rating: 4.7,
                reviews: "Beautiful morning sun reflections on the river. High-end modern styling.",
                lat: 35.0080,
                lng: 135.7710,
                price: 120,
                image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=400"
            }
        ],
        photoSpots: [
            { name: "Fushimi Inari Torii Path", description: "Thousands of vermillion torii gates cascading down the forest hills.", lat: 34.9671, lng: 135.7727 },
            { name: "Arashiyama Bamboo Path", description: "Towering bamboo stalks reflecting soft sunlight during early morning.", lat: 35.0156, lng: 135.6715 }
        ],
        fallbackPlan: {
            itinerary: [
                {
                    day: 1,
                    title: "Arrival & Riverwalk Gion",
                    description: "Transit safely into Kyoto and explore the traditional historic Gion lantern pathways.",
                    activities: [
                        { name: "Ryokan check-in", detail: "Drink matcha tea in the private garden." },
                        { name: "Lantern photography", detail: "Capture geisha history along the river canals." }
                    ]
                },
                {
                    day: 2,
                    title: "Golden Pavilion & Bamboo Groves",
                    description: "Wake up early to shoot reflections at Kinkaku-ji and wander the green Arashiyama hills.",
                    activities: [
                        { name: "Zen Golden Temple", detail: "Capture pure mirror reflections of gold architecture." },
                        { name: "Bamboo Walkway", detail: "Experience wind whispering through bamboo forests." }
                    ]
                }
            ]
        }
    },
    "hunza, pakistan": {
        name: "Hunza Valley",
        country: "Pakistan",
        lat: 36.3167,
        lng: 74.6500,
        startLat: 33.6844,
        startLng: 73.0479,
        baseCurrency: "PKR",
        stateCode: "pk",
        zipcode: "15700",
        weatherPatterns: {
            rainy: {
                summary: "Day 1-2: Landslide Warning KKH",
                icon: "🌧️",
                badge: "Road Hazard Alert",
                badgeColor: "bg-red-500/10 text-red-600 border border-red-200",
                description: "Misty rains causing minor rockfall warnings on parts of KKH. Scenic Karakoram Highway is heavily monitored and cleared by FWO. Safe transit active.",
                safeRouteName: "Karakoram Highway (KKH) Secure Link",
                safeRoutePath: [
                    [33.6844, 73.0479],
                    [34.1463, 73.2117],
                    [35.4128, 74.1023],
                    [35.9208, 74.3144],
                    [36.3167, 74.6500]
                ],
                riskyRoutePath: [
                    [33.6844, 73.0479],
                    [34.5000, 73.5000],
                    [35.0000, 73.8000],
                    [35.7000, 74.0000],
                    [36.3167, 74.6500]
                ],
                isRainy: true
            },
            sunny: {
                summary: "Day 1-3: Pure Rakaposhi Sunshine",
                icon: "☀️",
                badge: "Excellent Skies",
                badgeColor: "bg-primary/10 text-primary border border-primary/20",
                description: "Spectacular clear views of Rakaposhi, Ultar Sar, and Golden Peak. Perfect highway conditions.",
                safeRouteName: "Scenic Karakoram Highway",
                safeRoutePath: [
                    [33.6844, 73.0479],
                    [34.1463, 73.2117],
                    [35.4128, 74.1023],
                    [35.9208, 74.3144],
                    [36.3167, 74.6500]
                ],
                riskyRoutePath: [],
                isRainy: false
            }
        },
        stays: [
            {
                name: "Luxus Hunza Resort",
                desc: "Luxury glass chalets overlooking the emerald green waters of Attabad Lake.",
                rating: 4.9,
                reviews: "Absolute heaven. Waking up to the view of Attabad Lake from bed is unforgettable.",
                lat: 36.3195,
                lng: 74.7890,
                price: 160,
                image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=400"
            },
            {
                name: "Darbar Hotel Hunza",
                desc: "Spacious boutique rooms with private balconies facing the majesty of Rakaposhi peak.",
                rating: 4.6,
                reviews: "Excellent rooftop restaurant with direct peak views. Traditional food is fantastic.",
                lat: 36.3210,
                lng: 74.6450,
                price: 65,
                image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=400"
            },
            {
                name: "Eagles Nest Hotel Duiker",
                desc: "Highest vantage point hotel in Hunza offering 360-degree panoramic sunrise and sunset views.",
                rating: 4.8,
                reviews: "Best sunset spot in all of northern Pakistan. Cozy rooms and friendly local hosting.",
                lat: 36.3350,
                lng: 74.6710,
                price: 90,
                image: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80&w=400"
            },
            {
                name: "Hunza Valley Guest House",
                desc: "Extremely budget-friendly rooms in Karimabad town with views of Ultar peak.",
                rating: 4.4,
                reviews: "Warm hosts, beautiful views, and cheapest rooms you'll find in Karimabad.",
                lat: 36.3220,
                lng: 74.6470,
                price: 9,
                image: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80&w=400"
            }
        ],
        photoSpots: [
            { name: "Attabad Lake Boating", description: "Vibrant turquoise glacial waters flanked by steep rocky peaks.", lat: 36.3190, lng: 74.7880 },
            { name: "Passu Cones Cathedral Peaks", description: "Most famous pointed rock formations reflecting late afternoon amber sun.", lat: 36.4710, lng: 74.8870 },
            { name: "Baltit Fort Lookout", description: "700-year-old historic fort sitting atop Karimabad with panoramic valley views.", lat: 36.3225, lng: 74.6675 }
        ],
        fallbackPlan: {
            itinerary: [
                {
                    day: 1,
                    title: "Karakoram Highway Drive",
                    description: "Drive along the legendary Karakoram Highway, crossing Babusar or Abbottabad. Check into Karimabad.",
                    activities: [
                        { name: "KKH Road Trip", detail: "Witness the convergence of 3 mountain ranges." },
                        { name: "Baltit Fort Tour", detail: "Learn ancient Tibetan-style history." }
                    ]
                },
                {
                    day: 2,
                    title: "Attabad Lake & Passu Cones",
                    description: "Enjoy boat rides on Attabad Lake and take iconic photography shoots of the Passu Cathedral Cones.",
                    activities: [
                        { name: "Turquoise Water Cruise", detail: "Boat rides between mountain canyons." },
                        { name: "Passu Suspension Bridge", detail: "A thrilling walk on historic suspension cables." }
                    ]
                }
            ]
        }
    },
    "skardu, pakistan": {
        name: "Skardu Desert",
        country: "Pakistan",
        lat: 35.2913,
        lng: 75.6338,
        startLat: 33.6844,
        startLng: 73.0479,
        baseCurrency: "PKR",
        stateCode: "pk",
        zipcode: "16100",
        weatherPatterns: {
            sunny: {
                summary: "Day 1-3: Cold Desert Sun",
                icon: "☀️",
                badge: "Perfect Skies",
                badgeColor: "bg-primary/10 text-primary border border-primary/20",
                description: "Sunny and clear weather. Crisp mountain air. Ideal conditions for exploring Deosai Plains.",
                safeRouteName: "Jaglot-Skardu Highway Link",
                safeRoutePath: [
                    [33.6844, 73.0479],
                    [35.4128, 74.1023],
                    [35.4200, 75.7300],
                    [35.2913, 75.6338]
                ],
                riskyRoutePath: [],
                isRainy: false
            }
        },
        stays: [
            {
                name: "Shangrila Resort Skardu",
                desc: "Famous heart-shaped lake cottages surrounded by orchards and red roofs.",
                rating: 4.9,
                reviews: "Legendary resort. Extremely peaceful with gorgeous flower gardens and pure lake views.",
                lat: 35.3100,
                lng: 75.5200,
                price: 180,
                image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=400"
            },
            {
                name: "Serena Shigar Fort",
                desc: "Historic 17th-century Raja Palace restored as a premium luxury resort hotel.",
                rating: 4.9,
                reviews: "A living museum. Outstanding Shigar valley organic food and vintage woodwork.",
                lat: 35.4215,
                lng: 75.7295,
                price: 150,
                image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=400"
            },
            {
                name: "Deosai Base Camp Tents & Rooms",
                desc: "Budget stay at the gates of Deosai Plains. Cozy, authentic wooden lodge and tent camping options.",
                rating: 4.3,
                reviews: "Unforgettable bonfire night! Super affordable for backpackers visiting Deosai.",
                lat: 35.3010,
                lng: 75.6410,
                price: 9,
                image: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80&w=400"
            }
        ],
        photoSpots: [
            { name: "Sarfaranga Cold Desert", description: "Sand dunes surrounded by snow-capped peaks. Unique photography spots.", lat: 35.3050, lng: 75.6800 },
            { name: "Sheosar Lake Deosai", description: "High-altitude alpine lake in the Land of Giants.", lat: 34.9950, lng: 75.2450 }
        ],
        fallbackPlan: {
            itinerary: [
                {
                    day: 1,
                    title: "Arrival in Skardu Valley",
                    description: "Check into Shangrila Resort. Take a peaceful walk around Lower Kachura Lake.",
                    activities: [
                        { name: "Lower Kachura walk", detail: "Capture red pagoda roofs against clear blue lake." },
                        { name: "Shangrila dining", detail: "Enjoy fresh local trout by the lake." }
                    ]
                }
            ]
        }
    },
    "swat, pakistan": {
        name: "Swat Valley",
        country: "Pakistan",
        lat: 35.2227,
        lng: 72.4258,
        startLat: 33.6844,
        startLng: 73.0479,
        baseCurrency: "PKR",
        stateCode: "pk",
        zipcode: "19100",
        weatherPatterns: {
            sunny: {
                summary: "Day 1-3: Clear Valley Sunshine",
                icon: "☀️",
                badge: "Mild & Sunny",
                badgeColor: "bg-primary/10 text-primary border border-primary/20",
                description: "Sunny days in Kalam and Mingora. Excellent highway visibility. Ideal for Malam Jabba chairlift.",
                safeRouteName: "Swat Expressway Motorway",
                safeRoutePath: [
                    [33.6844, 73.0479],
                    [34.7717, 72.3602],
                    [34.7989, 72.5714],
                    [35.2227, 72.4258]
                ],
                riskyRoutePath: [],
                isRainy: false
            }
        },
        stays: [
            {
                name: "Kalam Serena Hotel",
                desc: "Lush green gardens facing Swat River and snow-covered Kalam mountains.",
                rating: 4.8,
                reviews: "Beautiful architecture, warm fire logs, and river sounds all night.",
                lat: 35.4810,
                lng: 72.5850,
                price: 110,
                image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=400"
            },
            {
                name: "Swat Riverside Hotel",
                desc: "Comfortable riverside rooms in Mingora Swat at an unbeatable budget rate.",
                rating: 4.1,
                reviews: "Right on the river bank, clean, and highly economical.",
                lat: 34.7810,
                lng: 72.3550,
                price: 8,
                image: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80&w=400"
            }
        ],
        photoSpots: [
            { name: "Mahodand Alpine Lake", description: "Scenic pine trees growing directly inside calm glacial lake water.", lat: 35.7120, lng: 72.6320 },
            { name: "Malam Jabba Ski Slope", description: "Breathtaking views of valley pine peaks from the high chairlift.", lat: 34.7990, lng: 72.5710 }
        ],
        fallbackPlan: {
            itinerary: [
                {
                    day: 1,
                    title: "Swat Motorway & Kalam Entry",
                    description: "Drive safely via the Swat Expressway. Enter the pine forests of Kalam.",
                    activities: [
                        { name: "Mingora Tea Stop", detail: "Taste delicious local Peshawari Kahwa." },
                        { name: "Kalam Forest Walk", detail: "Walk among towering cedars and pines." }
                    ]
                }
            ]
        }
    },
    "naran, pakistan": {
        name: "Naran Valley",
        country: "Pakistan",
        lat: 34.9085,
        lng: 73.6521,
        startLat: 33.6844,
        startLng: 73.0479,
        baseCurrency: "PKR",
        stateCode: "pk",
        zipcode: "21300",
        weatherPatterns: {
            sunny: {
                summary: "Day 1-3: Bright Alpine Weather",
                icon: "☀️",
                badge: "Pleasant",
                badgeColor: "bg-primary/10 text-primary border border-primary/20",
                description: "Sunny and clear. Perfect conditions for Saif-ul-Muluk jeep tracks.",
                safeRouteName: "Kaghan Valley Scenic Highway",
                safeRoutePath: [
                    [33.6844, 73.0479],
                    [34.5492, 73.3512],
                    [34.9085, 73.6521]
                ],
                riskyRoutePath: [],
                isRainy: false
            }
        },
        stays: [
            {
                name: "Pine Park Hotel Naran",
                desc: "Spacious green lawns with cozy cottages facing the surrounding cliffs.",
                rating: 4.7,
                reviews: "Excellent gardens. Kids loved playing on lawns. Close to main jeep stands.",
                lat: 34.9120,
                lng: 73.6550,
                price: 95,
                image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&q=80&w=400"
            },
            {
                name: "Kunhar View Guest House",
                desc: "Clean budget rooms near Kunhar river and Saif-ul-Muluk jeep tracks.",
                rating: 4.2,
                reviews: "Budget rooms with helpful local guide services. Value for money.",
                lat: 34.9080,
                lng: 73.6510,
                price: 9,
                image: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80&w=400"
            }
        ],
        photoSpots: [
            { name: "Saif-ul-Muluk Reflection Pool", description: "Stunning mirror reflection of Malika Parbat snow peak in the lake.", lat: 34.8790, lng: 73.6960 }
        ],
        fallbackPlan: {
            itinerary: [
                {
                    day: 1,
                    title: "Balakot to Naran Gorge",
                    description: "Drive along the Kunhar River gorge and check into your cottage.",
                    activities: [
                        { name: "River Rafting Stop", detail: "Watch rafters tackle wild river waves." }
                    ]
                }
            ]
        }
    },
    "fairy meadows, pakistan": {
        name: "Fairy Meadows",
        country: "Pakistan",
        lat: 35.3853,
        lng: 74.5843,
        startLat: 33.6844,
        startLng: 73.0479,
        baseCurrency: "PKR",
        stateCode: "pk",
        zipcode: "15200",
        weatherPatterns: {
            sunny: {
                summary: "Day 1-3: Clear Peak Sunshine",
                icon: "☀️",
                badge: "Crisp & Sunny",
                badgeColor: "bg-primary/10 text-primary border border-primary/20",
                description: "Unobstructed views of Nanga Parbat (Killer Mountain). Perfect trekking paths.",
                safeRouteName: "Raikot Jeep Track + Trek",
                safeRoutePath: [
                    [33.6844, 73.0479],
                    [35.4128, 74.1023],
                    [35.5012, 74.4512],
                    [35.3853, 74.5843]
                ],
                riskyRoutePath: [],
                isRainy: false
            }
        },
        stays: [
            {
                name: "Fairy Meadows Broad View Cottages",
                desc: "Cozy log cabins sitting directly in front of Nanga Parbat's giant snowy face.",
                rating: 4.9,
                reviews: "Spectacular! Watching the moonlight illuminate Nanga Parbat from the cottage deck is magical.",
                lat: 35.3860,
                lng: 74.5850,
                price: 80,
                image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=400"
            },
            {
                name: "Fairy Meadows Trekker Camps",
                desc: "Secure, weather-proof alpine dome tents set up directly on the grassy meadows facing Nanga Parbat.",
                rating: 4.6,
                reviews: "Sleeping under the stars facing the Killer Mountain! Pure adventure on a shoestring budget.",
                lat: 35.3840,
                lng: 74.5830,
                price: 7,
                image: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80&w=400"
            }
        ],
        photoSpots: [
            { name: "Nanga Parbat Reflection Pool", description: "Lush meadows with a small clear water pool mirroring the giant peak face.", lat: 35.3850, lng: 74.5840 }
        ],
        fallbackPlan: {
            itinerary: [
                {
                    day: 1,
                    title: "Raikot Jeep ride & Trek",
                    description: "Take the thrilling jeep road to Tato Village, then trek up to the meadows.",
                    activities: [
                        { name: "Jeep Trail ride", detail: "Ride one of the world's most famous adventure roads." },
                        { name: "Meadow Forest hike", detail: "Hike through lush pine forests to the meadows." }
                    ]
                }
            ]
        }
    }
};

// Default database fallback for unlisted locations
const DEFAULT_DESTINATION = {
    name: "Global Explorer Spot",
    country: "World",
    lat: 36.4166,
    lng: 25.4324, // Santorini coordinates as default mockup
    startLat: 37.9838, // Athens starting point
    startLng: 23.7275,
    baseCurrency: "USD",
    stateCode: "gr",
    zipcode: "84700",
    weatherPatterns: {
        sunny: {
            summary: "Day 1-3: Clear Coastal Breezes",
            icon: "☀️",
            badge: "Clear Skies",
            badgeColor: "bg-primary/10 text-primary border border-primary/20",
            description: "Beautiful clear ocean views, calm wind, and great conditions.",
            safeRouteName: "Coastal Scenic Expressway",
            safeRoutePath: [
                [37.9838, 23.7275], // Athens
                [37.5000, 24.1000],
                [36.8000, 24.8000],
                [36.4166, 25.4324]  // Santorini
            ],
            riskyRoutePath: [],
            isRainy: false
        }
    },
    stays: [
        {
            name: "Caldera Cliffside Suites",
            desc: "Breathtaking infinity pool overlooking the Aegean Sea volcanic crater. Famous sunset views.",
            rating: 4.9,
            reviews: "Stellar view of the blue dome chapels and white houses. Best photography location.",
            lat: 36.4620,
            lng: 25.3750,
            price: 210,
            image: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&q=80&w=400"
        },
        {
            name: "Oia Sunset Hostel",
            desc: "Pill-shaped budget rooms nestled into the cliffside with beautiful panoramic ocean sunset terraces.",
            rating: 4.5,
            reviews: "Affordable stay with direct access to classic Santorini photography lanes.",
            lat: 36.4635,
            lng: 25.3730,
            price: 95,
            image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=400"
        }
    ],
    photoSpots: [
        { name: "Blue Dome Chapels Oia", description: "Iconic white buildings with blue domes framing the volcanic ocean backdrop.", lat: 36.4618, lng: 25.3753 },
        { name: "Amoudi Bay Cliffside", description: "Spectacular ocean sunset view showing red rocks dropping into turquoise waves.", lat: 36.4589, lng: 25.3702 }
    ],
    fallbackPlan: {
        itinerary: [
            {
                day: 1,
                title: "Caldera Check-In & Sunset Walk",
                description: "Arrive at the beautiful island, check into your cliffside room, and walk the iconic cobblestone pathways.",
                activities: [
                    { name: "Check-in at Caldera Suite", detail: "Sip regional juices on the private sunbed." },
                    { name: "Sunset Photoshoot", detail: "Capture the golden rays hitting the whitewashed houses." }
                ]
            },
            {
                day: 2,
                title: "Oia Exploration & Scenic Spots",
                description: "Head down to the blue chapels early to beat the crowd and enjoy sunset dinner at Amoudi Bay.",
                activities: [
                    { name: "Blue Dome Shoots", detail: "Capture perfect high-end postcards with deep blue color matches." },
                    { name: "Seafood at Bay", detail: "Eat fresh local catch right beside the splashing waves." }
                ]
            }
        ]
    }
};

// Firebase state variables and API base URL helper
let auth = null;
let db = null;
let googleProvider = null;
let isRealFirebase = false;

function getApiBaseUrl() {
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
        return "http://localhost:3000/api";
    }
    return "https://hamara-safar.onrender.com/api";
}

// -------------------------------------------------------------
// Firebase Initialization & Database Setup
// -------------------------------------------------------------
async function initFirebase() {
    try {
        // Fetch Firebase config from backend (keeps API keys out of client source code)
        let config = null;
        try {
            const configRes = await fetch(`${getApiBaseUrl()}/firebase-config`);
            if (configRes.ok) {
                config = await configRes.json();
            }
        } catch (fetchErr) {
            console.warn("[Firebase] Could not fetch config from backend:", fetchErr.message);
        }

        // If backend config fetch failed or returned empty keys, fall back to hardcoded client config
        if (!config || !config.apiKey) {
            console.warn("[Firebase] Could not fetch config from backend. Using client fallback config.");
            config = {
                apiKey: "AIzaSyAIvUX0c1hP2TLfSzLYNQULpERAZBPLcmk",
                authDomain: "hamara-safar.firebaseapp.com",
                projectId: "hamara-safar",
                storageBucket: "hamara-safar.firebasestorage.app",
                messagingSenderId: "741589550702",
                appId: "1:741589550702:web:bb4d2526f6cc64ecc5487f"
            };
        }

        if (typeof firebase === "undefined") {
            console.warn("[Firebase] Firebase SDK not loaded. Falling back to mock.");
            setupMockFirebase();
            return;
        }

        if (firebase.apps.length === 0) {
            firebase.initializeApp(config);
        }
        auth = firebase.auth();
        db = firebase.firestore();
        googleProvider = new firebase.auth.GoogleAuthProvider();
        isRealFirebase = true;
        console.log("[Firebase] Successfully initialized Firebase Auth and Firestore.");
        
        // Handle redirect result (for mobile/popup-blocked environments)
        auth.getRedirectResult()
            .then(async (result) => {
                if (result && result.user) {
                    console.log("[Firebase Auth] Successful Google Redirect Sign-In:", result.user.email);
                    const user = result.user;
                    state.user.name = user.displayName || "Google User";
                    state.user.email = user.email;
                    state.user.photoURL = user.photoURL || "";
                    state.user.uid = user.uid;
                    
                    // Profile document check (wrapped in try-catch to be fail-safe)
                    let docSnap = null;
                    try {
                        const userDocRef = db.collection("users").doc(user.uid);
                        docSnap = await userDocRef.get();
                    } catch (dbErr) {
                        console.warn("[Firebase DB] Redirect Firestore check failed (offline or database not created yet):", dbErr.message);
                    }
                    
                    if (docSnap && docSnap.exists) {
                        await loadUserProfileFromFirestore(user.uid);
                    } else {
                        const hasLocalSettings = localStorage.getItem("zen_logged_in") === "true";
                        if (hasLocalSettings) {
                            state.user.loggedIn = true;
                            state.user.name = localStorage.getItem("zen_user_name") || state.user.name;
                            state.user.currency = localStorage.getItem("zen_currency") || "PKR";
                            state.user.gender = localStorage.getItem("zen_user_gender") || "Male";
                            state.user.age = parseInt(localStorage.getItem("zen_user_age")) || 25;
                            updateUserAvatarUI();
                            
                            // Sync local settings back to Firestore so it exists in DB
                            if (db) {
                                try {
                                    await db.collection("users").doc(user.uid).set({
                                        uid: user.uid,
                                        name: state.user.name,
                                        email: state.user.email,
                                        photoURL: state.user.photoURL,
                                        gender: state.user.gender,
                                        age: state.user.age,
                                        currency: state.user.currency,
                                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                                    }, { merge: true });
                                    console.log("[Firebase DB] Synced local profile to Firestore successfully via redirect.");
                                } catch (syncErr) {
                                    console.warn("[Firebase DB] Failed to sync local profile on redirect login:", syncErr.message);
                                }
                            }
                            
                            showScreen("screen-home");
                        } else {
                            document.getElementById("user-display-name").textContent = state.user.name;
                            const settingsName = document.getElementById("settings-user-name") || document.getElementById("settings-display-name");
                            if (settingsName) settingsName.value = state.user.name;
                            showScreen("screen-onboarding");
                        }
                    }
                }
            })
            .catch((err) => {
                console.error("[Firebase Auth] Redirect Sign-In Error:", err.message);
            });
        
        // Listen for auth state changes
        auth.onAuthStateChanged(async (firebaseUser) => {
            if (firebaseUser) {
                console.log("[Firebase] User is signed in:", firebaseUser.email);
                state.user.loggedIn = true;
                state.user.uid = firebaseUser.uid;
                state.user.email = firebaseUser.email;
                state.user.photoURL = firebaseUser.photoURL;
                
                // Fetch user settings/profile from Firestore database
                await loadUserProfileFromFirestore(firebaseUser.uid);
            } else {
                console.log("[Firebase] No user is signed in.");
                // Check if local storage says logged in (for offline testing)
                const loggedIn = localStorage.getItem("zen_logged_in") === "true";
                if (!loggedIn) {
                    state.user.loggedIn = false;
                    showScreen("screen-splash");
                } else {
                    setupMockFirebase(false);
                }
            }
        });
    } catch (err) {
        console.warn("[Firebase] Failed to initialize Firebase:", err.message);
        setupMockFirebase();
    }
}

function setupMockFirebase(forceMock = true) {
    if (forceMock) {
        isRealFirebase = false;
    }
    console.log("[Firebase Mock] Mock Firebase Provider activated.");
    
    // Check if user is logged in according to localStorage
    const loggedIn = localStorage.getItem("zen_logged_in") === "true";
    if (loggedIn) {
        state.user.loggedIn = true;
        state.user.name = localStorage.getItem("zen_user_name") || "Huzaifa Ahmad";
        state.user.gender = localStorage.getItem("zen_user_gender") || "Male";
        state.user.age = parseInt(localStorage.getItem("zen_user_age")) || 25;
        state.user.currency = localStorage.getItem("zen_currency") || "PKR";
        state.user.photoURL = localStorage.getItem("zen_user_photo") || ""; 
        
        document.getElementById("user-display-name").textContent = state.user.name;
        const settingsName = document.getElementById("settings-user-name") || document.getElementById("settings-display-name");
        if (settingsName) settingsName.value = state.user.name;
        const settingsCurr = document.getElementById("settings-currency") || document.getElementById("settings-currency-select");
        if (settingsCurr) settingsCurr.value = state.user.currency;
        
        updateUserAvatarUI();
        showScreen("screen-home");
    } else {
        state.user.loggedIn = false;
        showScreen("screen-splash");
    }
}

async function loadUserProfileFromFirestore(uid) {
    if (!db) {
        console.warn("[Firebase DB] Firestore not initialized.");
        fallbackToAuthOrMock();
        return;
    }
    try {
        const userDocRef = db.collection("users").doc(uid);
        const docSnap = await userDocRef.get();
        
        if (docSnap.exists) {
            const data = docSnap.data();
            console.log("[Firebase DB] Loaded user profile:", data);
            
            state.user.name = data.name || state.user.name || "Huzaifa Ahmad";
            state.user.gender = data.gender || "Male";
            state.user.age = data.age || 25;
            state.user.currency = data.currency || "PKR";
            state.user.photoURL = data.photoURL || state.user.photoURL || "";
            
            saveUserProfileLocally();
            updateUserProfileUI();
            
            // If we are currently on splash/login/onboarding, go to home
            if (state.activeScreen === "screen-splash" || state.activeScreen === "screen-login" || state.activeScreen === "screen-onboarding") {
                showScreen("screen-home");
            }
        } else {
            console.log("[Firebase DB] No user profile document found. Redirecting to Onboarding...");
            fallbackToAuthOrMock(true); // Treat as new user: onboarding screen
        }
    } catch (err) {
        console.error("[Firebase DB] Error loading user profile:", err.message);
        fallbackToAuthOrMock(false);
    }

    function fallbackToAuthOrMock(isNewUser = false) {
        if (auth && auth.currentUser) {
            console.log("[Firebase Auth] Falling back to Firebase Auth credentials.");
            const user = auth.currentUser;
            state.user.name = user.displayName || state.user.name || "Google User";
            state.user.email = user.email;
            state.user.photoURL = user.photoURL || state.user.photoURL || "";
            state.user.gender = localStorage.getItem("zen_user_gender") || "Male";
            state.user.age = parseInt(localStorage.getItem("zen_user_age")) || 25;
            state.user.currency = localStorage.getItem("zen_currency") || "PKR";
            
            saveUserProfileLocally();
            updateUserProfileUI();
            
            if (isNewUser || state.activeScreen === "screen-splash" || state.activeScreen === "screen-login") {
                document.getElementById("user-display-name").textContent = state.user.name;
                const settingsName = document.getElementById("settings-user-name") || document.getElementById("settings-display-name");
                if (settingsName) settingsName.value = state.user.name;
                showScreen("screen-onboarding"); // Let user complete onboarding if new or loading fresh
            } else {
                showScreen("screen-home");
            }
        } else {
            setupMockFirebase();
        }
    }

    function saveUserProfileLocally() {
        localStorage.setItem("zen_logged_in", "true");
        localStorage.setItem("zen_user_name", state.user.name);
        localStorage.setItem("zen_user_gender", state.user.gender);
        localStorage.setItem("zen_user_age", state.user.age.toString());
        localStorage.setItem("zen_currency", state.user.currency);
        if (state.user.photoURL) {
            localStorage.setItem("zen_user_photo", state.user.photoURL);
        }
    }

    function updateUserProfileUI() {
        document.getElementById("user-display-name").textContent = state.user.name;
        const settingsName = document.getElementById("settings-user-name") || document.getElementById("settings-display-name");
        if (settingsName) settingsName.value = state.user.name;
        const settingsCurr = document.getElementById("settings-currency") || document.getElementById("settings-currency-select");
        if (settingsCurr) settingsCurr.value = state.user.currency;
        updateUserAvatarUI();
    }
}

function updateUserAvatarUI() {
    const avatarContainer = document.getElementById("user-avatar-container");
    if (!avatarContainer) return;
    
    const photoURL = state.user.photoURL || state.user.avatar || "";
    const gender = state.user.gender || "Male";
    
    if (photoURL && photoURL.trim() !== "") {
        // Render Google image
        avatarContainer.innerHTML = `<img src="${photoURL}" class="w-full h-full object-cover" alt="User Profile"/>`;
    } else {
        // Render fallback male/female/other icons using Material Symbols
        avatarContainer.innerHTML = "";
        const iconDiv = document.createElement("div");
        iconDiv.className = "w-full h-full flex items-center justify-center transition-colors duration-200";
        
        let iconName = "person";
        if (gender === "Male") {
            iconName = "face";
            iconDiv.className = "w-full h-full flex items-center justify-center bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 transition-colors duration-200";
        } else if (gender === "Female") {
            iconName = "face_3";
            iconDiv.className = "w-full h-full flex items-center justify-center bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400 transition-colors duration-200";
        } else {
            iconName = "person";
            iconDiv.className = "w-full h-full flex items-center justify-center bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 transition-colors duration-200";
        }
        
        iconDiv.innerHTML = `<span class="material-symbols-outlined text-2xl filled-icon">${iconName}</span>`;
        avatarContainer.appendChild(iconDiv);
    }
}
window.updateUserAvatarUI = updateUserAvatarUI;

// -------------------------------------------------------------
// On App Initial Load
// -------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initFirebase();
    initScreenNavigation();
    initSplashCarousel();
    initPlannerEvents();
    initSettingsEvents();
    fetchConfigAndInitAutocomplete();
    requestUserLocation();
    initNearbyPlacesEvents();
    initAiAssistantEvents();
    updateFeaturedSpot(33.9042, 73.3903, "Murree Hills");
});

// -------------------------------------------------------------
// Onboarding / Splash Carousel Logic
// -------------------------------------------------------------
function initSplashCarousel() {
    const cards = document.querySelectorAll(".carousel-card");
    const dotElements = [
        document.getElementById("dot-0"),
        document.getElementById("dot-1"),
        document.getElementById("dot-2")
    ];

    const rotateCarousel = () => {
        state.carouselIndex = (state.carouselIndex + 1) % cards.length;
        
        cards.forEach((card, idx) => {
            card.className = "carousel-card";
            dotElements[idx].className = "w-2.5 h-2.5 rounded-full bg-outline-variant";

            if (idx === state.carouselIndex) {
                card.classList.add("active");
                dotElements[idx].className = "w-2.5 h-2.5 rounded-full bg-primary";
            } else if (idx === (state.carouselIndex - 1 + cards.length) % cards.length) {
                card.classList.add("prev");
            } else if (idx === (state.carouselIndex + 1) % cards.length) {
                card.classList.add("next");
            } else {
                card.classList.add("hidden-right");
            }
        });
    };

    // Auto rotate every 4 seconds
    const intervalId = setInterval(rotateCarousel, 4000);

    // Stop rotation when leaving splash screen
    document.getElementById("btn-get-started").addEventListener("click", () => {
        clearInterval(intervalId);
        showScreen("screen-login");
    });
}

// -------------------------------------------------------------
// Screen Routing & Navigation
// -------------------------------------------------------------
function initScreenNavigation() {
    // Buttons
    document.getElementById("btn-google-login").addEventListener("click", async () => {
        if (isRealFirebase && auth && googleProvider) {
            const loginBtn = document.getElementById("btn-google-login");
            const originalHTML = loginBtn.innerHTML;
            loginBtn.disabled = true;
            loginBtn.innerHTML = `<span class="animate-spin material-symbols-outlined text-sm">progress_activity</span> Authenticating...`;
            
            try {
                const result = await auth.signInWithPopup(googleProvider);
                const user = result.user;
                console.log("[Firebase Auth] Successful Google Sign-In:", user.email);
                
                state.user.name = user.displayName || "Google User";
                state.user.email = user.email;
                state.user.photoURL = user.photoURL || "";
                state.user.uid = user.uid;
                
                // Check if user profile already exists in Firestore (wrapped in try-catch to be fail-safe)
                let docSnap = null;
                try {
                    const userDocRef = db.collection("users").doc(user.uid);
                    docSnap = await userDocRef.get();
                } catch (dbErr) {
                    console.warn("[Firebase DB] Google Sign-In Firestore check failed (offline or database not created yet):", dbErr.message);
                }
                
                if (docSnap && docSnap.exists) {
                    // Profile exists, load it directly and go to dashboard
                    await loadUserProfileFromFirestore(user.uid);
                } else {
                    const hasLocalSettings = localStorage.getItem("zen_logged_in") === "true";
                    if (hasLocalSettings) {
                        state.user.loggedIn = true;
                        state.user.name = localStorage.getItem("zen_user_name") || state.user.name;
                        state.user.currency = localStorage.getItem("zen_currency") || "PKR";
                        state.user.gender = localStorage.getItem("zen_user_gender") || "Male";
                        state.user.age = parseInt(localStorage.getItem("zen_user_age")) || 25;
                        updateUserAvatarUI();
                        
                        // Sync local settings back to Firestore so it exists in DB
                        if (db) {
                            try {
                                await db.collection("users").doc(user.uid).set({
                                    uid: user.uid,
                                    name: state.user.name,
                                    email: state.user.email,
                                    photoURL: state.user.photoURL,
                                    gender: state.user.gender,
                                    age: state.user.age,
                                    currency: state.user.currency,
                                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                                }, { merge: true });
                                console.log("[Firebase DB] Synced local profile to Firestore successfully.");
                            } catch (syncErr) {
                                console.warn("[Firebase DB] Failed to sync local profile on login:", syncErr.message);
                            }
                        }
                        
                        showScreen("screen-home");
                    } else {
                        // New user or offline, redirect to onboarding
                        document.getElementById("user-display-name").textContent = state.user.name;
                        const settingsName = document.getElementById("settings-user-name") || document.getElementById("settings-display-name");
                        if (settingsName) settingsName.value = state.user.name;
                        showScreen("screen-onboarding");
                    }
                }
            } catch (err) {
                console.error("[Firebase Auth] Google Sign-In Failed:", err.message);
                
                // Fallback to redirect sign-in if popup is blocked or cancelled/closed
                if (err.code === 'auth/popup-blocked' || err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
                    console.log("[Firebase Auth] Popup blocked/closed. Trying Redirect Sign-In...");
                    try {
                        await auth.signInWithRedirect(googleProvider);
                        return; // Page will redirect
                    } catch (redirectErr) {
                        console.error("[Firebase Auth] Google Redirect failed:", redirectErr.message);
                        alert("Sign-In Failed: " + redirectErr.message + ". Falling back to mock login.");
                        triggerMockLogin();
                    }
                } else {
                    alert("Sign-In Failed: " + err.message + ". Falling back to mock login.");
                    triggerMockLogin();
                }
            } finally {
                // Only run finally if we didn't redirect away
                if (loginBtn) {
                    loginBtn.disabled = false;
                    loginBtn.innerHTML = originalHTML;
                }
            }
        } else {
            // Real Firebase not initialized, trigger mock login
            triggerMockLogin();
        }
    });

    function triggerMockLogin() {
        console.log("[Mock login] Fetching user.json for mock authentication.");
        fetch('/user.json')
            .then(res => res.json())
            .then(data => {
                state.user.name = data.name || "Huzaifa Ahmad";
                state.user.photoURL = data.avatar || "";
                localStorage.setItem("zen_user_name", state.user.name);
                if (state.user.photoURL) {
                    localStorage.setItem("zen_user_photo", state.user.photoURL);
                }
                document.getElementById("user-display-name").textContent = state.user.name;
                const settingsName = document.getElementById("settings-user-name") || document.getElementById("settings-display-name");
                if (settingsName) settingsName.value = state.user.name;
            })
            .catch(err => {
                console.warn("Could not fetch user.json, using default 'Huzaifa Ahmad'.", err);
                state.user.name = "Huzaifa Ahmad";
                state.user.photoURL = "";
                localStorage.setItem("zen_user_name", "Huzaifa Ahmad");
                localStorage.setItem("zen_user_photo", "");
                document.getElementById("user-display-name").textContent = "Huzaifa Ahmad";
                const settingsName = document.getElementById("settings-user-name") || document.getElementById("settings-display-name");
                if (settingsName) settingsName.value = "Huzaifa Ahmad";
            })
            .finally(() => {
                showScreen("screen-onboarding");
            });
    }

    // Gender Chips events in Onboarding Screen
    const genderChips = document.querySelectorAll(".gender-chip");
    const genderInput = document.getElementById("input-gender");
    genderChips.forEach(chip => {
        chip.addEventListener("click", () => {
            genderChips.forEach(c => {
                c.className = "gender-chip flex-1 py-3 text-sm font-semibold rounded-2xl bg-white border border-outline-variant text-on-surface-variant hover:bg-surface-container-low transition-all";
            });
            chip.className = "gender-chip active flex-1 py-3 text-sm font-semibold rounded-2xl bg-primary text-white border-0 transition-all shadow-sm";
            genderInput.value = chip.getAttribute("data-val");
        });
    });

    // Age Scroller Picker highlighting & tracking
    const agePicker = document.getElementById("age-scroll-picker");
    let selectedAge = 25; // Default center selection

    if (agePicker) {
        // Center scroll on default 25
        setTimeout(() => {
            const initialItem = agePicker.querySelector('[data-val="25"]');
            if (initialItem) {
                initialItem.scrollIntoView({ block: 'center', inline: 'nearest' });
            }
        }, 400);

        agePicker.addEventListener("scroll", () => {
            const items = agePicker.querySelectorAll("[data-val]");
            const pickerRect = agePicker.getBoundingClientRect();
            const centerLine = pickerRect.top + pickerRect.height / 2;

            let closestEl = null;
            let minDiff = Infinity;

            items.forEach(item => {
                const rect = item.getBoundingClientRect();
                const itemCenter = rect.top + rect.height / 2;
                const diff = Math.abs(itemCenter - centerLine);

                if (diff < minDiff) {
                    minDiff = diff;
                    closestEl = item;
                }
            });

            if (closestEl) {
                items.forEach(item => {
                    item.className = "h-8 snap-center flex items-center justify-center text-outline-variant text-sm font-medium";
                });
                closestEl.className = "h-8 snap-center flex items-center justify-center text-on-surface font-bold text-lg";
                selectedAge = parseInt(closestEl.getAttribute("data-val"));
            }
        });
    }

    // Complete Onboarding profile button
    document.getElementById("btn-complete-onboarding").addEventListener("click", async () => {
        const onboardingBtn = document.getElementById("btn-complete-onboarding");
        const originalHTML = onboardingBtn.innerHTML;
        onboardingBtn.disabled = true;
        onboardingBtn.innerHTML = `<span class="animate-spin material-symbols-outlined text-sm">progress_activity</span> Saving Profile...`;
        
        state.user.gender = genderInput.value;
        state.user.age = selectedAge;
        state.user.loggedIn = true;
        
        // Persist to local storage
        localStorage.setItem("zen_logged_in", "true");
        localStorage.setItem("zen_user_age", selectedAge.toString());
        localStorage.setItem("zen_user_gender", state.user.gender);
        localStorage.setItem("zen_user_name", state.user.name);
        if (state.user.photoURL) {
            localStorage.setItem("zen_user_photo", state.user.photoURL);
        }
        
        if (isRealFirebase && db && auth && auth.currentUser) {
            try {
                const uid = auth.currentUser.uid;
                await db.collection("users").doc(uid).set({
                    uid: uid,
                    name: state.user.name,
                    email: state.user.email || auth.currentUser.email,
                    photoURL: state.user.photoURL || "",
                    gender: state.user.gender,
                    age: state.user.age,
                    currency: state.user.currency || "PKR",
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
                console.log("[Firebase DB] Profile saved to Firestore successfully.");
            } catch (err) {
                console.error("[Firebase DB] Failed to save profile to Firestore:", err.message);
                alert("Failed to save profile to database: " + err.message + ". Saved locally.");
            }
        }
        
        updateUserAvatarUI();
        onboardingBtn.disabled = false;
        onboardingBtn.innerHTML = originalHTML;
        showScreen("screen-home");
    });

    document.getElementById("btn-start-planning").addEventListener("click", () => {
        showScreen("screen-planner");
    });

    const searchTrigger = document.getElementById("home-search-trigger");
    if (searchTrigger) {
        searchTrigger.addEventListener("click", () => {
            openAiAssistantChat("");
        });
    }

    document.getElementById("btn-planner-back").addEventListener("click", () => {
        showScreen("screen-home");
    });

    document.getElementById("btn-results-back").addEventListener("click", () => {
        showScreen("screen-planner");
    });

    // Navigation Bar Links
    document.getElementById("nav-btn-home").addEventListener("click", () => {
        showScreen("screen-home");
    });
    document.getElementById("nav-btn-planner").addEventListener("click", () => {
        showScreen("screen-planner");
    });
    document.getElementById("nav-btn-results").addEventListener("click", () => {
        if (state.itineraryData) {
            showScreen("screen-results");
        }
    });

    // Preset dates in planner
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + 3);

    document.getElementById("input-start-date").value = today.toISOString().split("T")[0];
    document.getElementById("input-end-date").value = futureDate.toISOString().split("T")[0];
}

// Global Screen switcher function
export function showScreen(screenId) {
    const screens = document.querySelectorAll(".app-screen");
    screens.forEach(s => s.classList.remove("active"));

    const target = document.getElementById(screenId);
    if (target) {
        target.classList.add("active");
        state.activeScreen = screenId;
    }

    // Toggle navigation bar display
    const bottomNav = document.getElementById("bottom-nav");
    if (screenId === "screen-home" || screenId === "screen-planner" || screenId === "screen-results") {
        bottomNav.style.display = "flex";
    } else {
        bottomNav.style.display = "none";
    }

    // Update bottom nav button active states
    const homeBtn = document.getElementById("nav-btn-home");
    const plannerBtn = document.getElementById("nav-btn-planner");
    const resultsBtn = document.getElementById("nav-btn-results");

    homeBtn.className = "flex flex-col items-center justify-center p-3 text-white/60 hover:text-white transition-all";
    plannerBtn.className = "flex flex-col items-center justify-center p-3 text-white/60 hover:text-white transition-all";
    resultsBtn.className = "flex flex-col items-center justify-center p-3 text-white/60 hover:text-white transition-all";

    const homeIcon = homeBtn.querySelector("span");
    const plannerIcon = plannerBtn.querySelector("span");
    const resultsIcon = resultsBtn.querySelector("span");

    if (homeIcon) homeIcon.classList.remove("filled-icon");
    if (plannerIcon) plannerIcon.classList.remove("filled-icon");
    if (resultsIcon) resultsIcon.classList.remove("filled-icon");

    if (screenId === "screen-home") {
        homeBtn.className = "flex flex-col items-center justify-center p-3 text-primary-fixed bg-white/10 rounded-full transition-all scale-95 duration-200";
        if (homeIcon) homeIcon.classList.add("filled-icon");
    } else if (screenId === "screen-planner") {
        plannerBtn.className = "flex flex-col items-center justify-center p-3 text-primary-fixed bg-white/10 rounded-full transition-all scale-95 duration-200";
        if (plannerIcon) plannerIcon.classList.add("filled-icon");
    } else if (screenId === "screen-results") {
        resultsBtn.className = "flex flex-col items-center justify-center p-3 text-primary-fixed bg-white/10 rounded-full transition-all scale-95 duration-200";
        if (resultsIcon) resultsIcon.classList.add("filled-icon");
    }

    // Enable/disable results button based on loaded plans
    if (state.itineraryData) {
        resultsBtn.classList.remove("opacity-40", "cursor-not-allowed");
        resultsBtn.removeAttribute("disabled");
    } else {
        resultsBtn.classList.add("opacity-40", "cursor-not-allowed");
        resultsBtn.setAttribute("disabled", "true");
    }
}
window.showScreen = showScreen;

// -------------------------------------------------------------
// Interactive Planner Form Events
// -------------------------------------------------------------
function initPlannerEvents() {
    // Budget range and custom input updates
    const budgetInput = document.getElementById("input-budget");
    const budgetDisplay = document.getElementById("budget-display");
    const budgetCustomInput = document.getElementById("input-budget-custom");

    const updateBudgetUI = (val) => {
        const sign = state.user.currency === "PKR" ? "Rs " : "$";
        budgetDisplay.textContent = `${sign}${Number(val).toLocaleString()}`;
    };

    // Initialize custom input value
    if (budgetCustomInput && budgetInput) {
        budgetCustomInput.value = budgetInput.value;
    }

    budgetInput.addEventListener("input", (e) => {
        const val = e.target.value;
        if (budgetCustomInput) budgetCustomInput.value = val;
        updateBudgetUI(val);
    });

    if (budgetCustomInput) {
        budgetCustomInput.addEventListener("input", (e) => {
            const val = parseInt(e.target.value) || 0;
            if (budgetInput) {
                if (val >= parseInt(budgetInput.min) && val <= parseInt(budgetInput.max)) {
                    budgetInput.value = val;
                } else if (val > parseInt(budgetInput.max)) {
                    budgetInput.value = budgetInput.max;
                } else {
                    budgetInput.value = budgetInput.min;
                }
            }
            updateBudgetUI(val);
        });
    }

    // Autocomplete dropdowns for Start and Destination search
    const startLocInput = document.getElementById("input-start-location");
    const startDropdown = document.getElementById("start-location-suggestions");
    if (startLocInput && startDropdown) {
        bindLocalSuggestions(startLocInput, startDropdown, true);
    }

    const destInput = document.getElementById("input-destination");
    const dropdown = document.getElementById("destination-suggestions");
    if (destInput && dropdown) {
        bindLocalSuggestions(destInput, dropdown, false);
    }

    document.addEventListener("click", (e) => {
        if (state.googleAutocompleteActive) return;
        const currentDestInput = document.getElementById("input-destination");
        if (currentDestInput && dropdown && !currentDestInput.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.add("hidden");
        }
        const currentStartInput = document.getElementById("input-start-location");
        if (currentStartInput && startDropdown && !currentStartInput.contains(e.target) && !startDropdown.contains(e.target)) {
            startDropdown.classList.add("hidden");
        }
    });

    // Traveler Count Increments
    const travelersInput = document.getElementById("input-travelers");
    const travelersText = document.getElementById("travelers-count-text");
    
    document.getElementById("btn-traveler-inc").addEventListener("click", () => {
        let val = parseInt(travelersInput.value);
        if (val < 10) {
            val += 1;
            travelersInput.value = val;
            travelersText.textContent = `${val} ${val === 1 ? 'Traveler' : 'Travelers'}`;
        }
    });

    document.getElementById("btn-traveler-dec").addEventListener("click", () => {
        let val = parseInt(travelersInput.value);
        if (val > 1) {
            val -= 1;
            travelersInput.value = val;
            travelersText.textContent = `${val} ${val === 1 ? 'Traveler' : 'Travelers'}`;
        }
    });

    // Priorities Click Chips
    const chips = document.querySelectorAll(".priority-chip");
    const priorityInput = document.getElementById("input-priority");
    
    chips.forEach(chip => {
        chip.addEventListener("click", () => {
            chips.forEach(c => {
                c.className = "priority-chip bg-white border border-outline-variant text-on-surface-variant px-4 py-2.5 rounded-full text-xs font-semibold hover:bg-surface-container-low transition-all flex items-center gap-1.5";
            });
            
            chip.className = "priority-chip active bg-primary text-white border-0 px-4 py-2.5 rounded-full text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5";
            priorityInput.value = chip.getAttribute("data-val");
        });
    });

    // Submit Plan Trigger
    document.getElementById("form-trip-planner").addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const submitBtn = e.target.querySelector("button[type='submit']");
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span class="animate-spin material-symbols-outlined text-xs">progress_activity</span> Geocoding Start Location...`;

        const startLocVal = document.getElementById("input-start-location").value.trim();
        if (startLocVal) {
            const coordsMatch = startLocVal.match(/GPS Coordinates \(([^,]+),\s*([^)]+)\)/);
            if (coordsMatch) {
                state.userLocation = {
                    lat: parseFloat(coordsMatch[1]),
                    lng: parseFloat(coordsMatch[2])
                };
            } else if (!state.userLocation || state.lastStartGeocodedAddress !== startLocVal) {
                const coords = await geocodeAddress(startLocVal);
                if (coords) {
                    state.userLocation = coords;
                    state.lastStartGeocodedAddress = startLocVal;
                    console.log("[Submit Geocoding] Resolved starting location coordinates:", state.userLocation);
                } else {
                    console.warn("Could not geocode starting location. Falling back to default.");
                }
            }
        } else {
            state.userLocation = null;
        }

        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
        
        const budgetVal = (budgetCustomInput && parseInt(budgetCustomInput.value)) || parseInt(budgetInput.value) || 80000;
        state.currentTrip = {
            destination: document.getElementById("input-destination").value,
            startDate: document.getElementById("input-start-date").value,
            endDate: document.getElementById("input-end-date").value,
            budget: budgetVal,
            travelers: parseInt(travelersInput.value),
            priority: priorityInput.value
        };

        generateItinerary(state.currentTrip);
    });
}

// Global scope triggers for pre-select and autocomplete
window.quickSelectDestination = (destName) => {
    document.getElementById("input-destination").value = destName;
    const key = destName.toLowerCase();
    
    // Find matching default budget values (scaled by currency)
    const conversionRate = state.user.currency === "PKR" ? 278 : 1;
    if (key.includes("murree")) {
        document.getElementById("input-budget").value = Math.round(400 * conversionRate);
    } else if (key.includes("kyoto")) {
        document.getElementById("input-budget").value = Math.round(1200 * conversionRate);
    } else {
        document.getElementById("input-budget").value = Math.round(800 * conversionRate);
    }
    
    // Trigger slider update
    const event = new Event('input');
    document.getElementById("input-budget").dispatchEvent(event);
    
    showScreen("screen-planner");
};

window.selectSuggestion = (destName) => {
    document.getElementById("input-destination").value = destName;
    document.getElementById("destination-suggestions").classList.add("hidden");
    
    // Also dynamically update featured spot if suggestion matches one of our DB entries
    const key = destName.toLowerCase();
    const dbKey = Object.keys(DESTINATIONS_DB).find(k => key.includes(k.split(",")[0].trim()));
    if (dbKey && DESTINATIONS_DB[dbKey]) {
        const dest = DESTINATIONS_DB[dbKey];
        updateFeaturedSpot(dest.lat, dest.lng, dest.name);
    }
};
window.selectSuggestion = selectSuggestion;

window.selectShowcaseLocation = (btnEl, destName) => {
    // Style active button
    document.querySelectorAll(".showcase-btn").forEach(btn => {
        btn.className = "snap-start shrink-0 px-5 py-3 bg-surface border border-outline-variant/50 hover:bg-secondary-container hover:border-primary/20 rounded-full flex items-center gap-2.5 transition-all shadow-sm showcase-btn";
    });
    if (btnEl) {
        btnEl.className = "snap-start shrink-0 px-5 py-3 bg-primary/10 border border-primary/30 hover:bg-secondary-container hover:border-primary/20 rounded-full flex items-center gap-2.5 transition-all shadow-sm showcase-btn active";
    }

    // Find coordinates from DESTINATIONS_DB
    const key = destName.toLowerCase();
    const dbKey = Object.keys(DESTINATIONS_DB).find(k => key.includes(k.split(",")[0].trim()));
    if (dbKey && DESTINATIONS_DB[dbKey]) {
        const dest = DESTINATIONS_DB[dbKey];
        updateFeaturedSpot(dest.lat, dest.lng, dest.name);
    } else {
        updateFeaturedSpot(33.9042, 73.3903, destName);
    }
};

window.quickSelectFromFeatured = () => {
    const title = document.getElementById("featured-spot-title").textContent;
    // Pre-populate input and redirect to planner
    quickSelectDestination(title + ", Pakistan");
};

async function updateFeaturedSpot(lat, lng, placeName = "this area") {
    const cardEl = document.getElementById("featured-spot-card");
    if (!cardEl) return;
    
    console.log(`[Featured Spot] Dynamic update request near: ${lat}, ${lng} (${placeName})`);
    
    // Default static fallback items inside database for each destination
    const defaultSpots = {
        "murree": {
            name: "Kashmir Point Vista",
            desc: "Highest viewpoint in Murree offering snow peak photography spots.",
            rating: 4.9,
            thumbnail: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=800"
        },
        "hunza": {
            name: "Attabad Lake Turquoise Boating",
            desc: "Stunning turquoise waters flanked by steep Cathedral Peak cones.",
            rating: 4.9,
            thumbnail: "https://images.unsplash.com/photo-1562016600-ece13e8ba570?auto=format&fit=crop&q=80&w=800"
        },
        "skardu": {
            name: "Sarfaranga Cold Desert Glamping",
            desc: "Sandy dunes surrounded by high snow-capped Karakoram peaks.",
            rating: 4.8,
            thumbnail: "https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&q=80&w=800"
        },
        "swat": {
            name: "Malam Jabba Ski Slope",
            desc: "Breathtaking views of valley pine peaks from the high chairlift.",
            rating: 4.7,
            thumbnail: "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&q=80&w=800"
        },
        "naran": {
            name: "Lake Saif-ul-Muluk Jeep Track",
            desc: "Winding adventure tracks heading up to the pristine alpine lake.",
            rating: 4.9,
            thumbnail: "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&q=80&w=800"
        },
        "fairy": {
            name: "Nanga Parbat Reflection Pool",
            desc: "Lush meadows with a small clear water pool mirroring the giant peak face.",
            rating: 4.9,
            thumbnail: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80&w=800"
        }
    };
    
    // Scale image/content based on closest match
    const normName = placeName.toLowerCase();
    let defaultSpot = defaultSpots["murree"];
    if (normName.includes("hunza")) defaultSpot = defaultSpots["hunza"];
    else if (normName.includes("skardu")) defaultSpot = defaultSpots["skardu"];
    else if (normName.includes("swat")) defaultSpot = defaultSpots["swat"];
    else if (normName.includes("naran")) defaultSpot = defaultSpots["naran"];
    else if (normName.includes("fairy")) defaultSpot = defaultSpots["fairy"];

    // Set fallback immediately so card changes instantly for great responsiveness
    const imgEl = document.getElementById("featured-spot-img");
    if (imgEl) imgEl.src = defaultSpot.thumbnail;
    
    const titleEl = document.getElementById("featured-spot-title");
    if (titleEl) titleEl.textContent = defaultSpot.name;
    
    const descEl = document.getElementById("featured-spot-desc");
    if (descEl) descEl.textContent = defaultSpot.desc;
    
    const ratingEl = document.getElementById("featured-spot-rating");
    if (ratingEl) ratingEl.textContent = defaultSpot.rating.toFixed(1);
    
    const tagEl = document.getElementById("featured-spot-tag");
    if (tagEl) {
        tagEl.textContent = "Trending Near " + placeName;
        tagEl.className = "bg-primary text-white text-xs px-2.5 py-1 rounded-full uppercase tracking-wider font-semibold";
    }

    try {
        const response = await fetch(`${getApiBaseUrl()}/nearby`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                q: "Attractions",
                lat: lat,
                lng: lng,
                zoom: 13
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            const spots = data.data || [];
            if (spots.length > 0) {
                // Find best attraction spot
                spots.sort((a, b) => b.rating - a.rating);
                const bestSpot = spots[0];
                
                if (imgEl && bestSpot.thumbnail) imgEl.src = bestSpot.thumbnail;
                if (titleEl) titleEl.textContent = bestSpot.name;
                if (descEl) descEl.textContent = bestSpot.address || `Hot trending spot near ${placeName}.`;
                if (ratingEl && bestSpot.rating) ratingEl.textContent = bestSpot.rating.toFixed(1);
            }
        }
    } catch (err) {
        console.warn("[Featured Spot] Failed to fetch live nearby spots:", err.message);
    }
}
window.updateFeaturedSpot = updateFeaturedSpot;

// -------------------------------------------------------------
// Settings / Configuration Modal Logic
// -------------------------------------------------------------
function initSettingsEvents() {
    const modal = document.getElementById("settings-modal");
    const container = document.getElementById("settings-modal-card");

    const openModal = () => {
        // Populate inputs from state.user
        document.getElementById("settings-display-name").value = state.user.name || "";
        document.getElementById("settings-avatar-url").value = state.user.photoURL || "";
        document.getElementById("settings-currency-select").value = state.user.currency || "PKR";
        document.getElementById("settings-profile-name").textContent = state.user.name || "Hamara Safar User";
        document.getElementById("settings-profile-email").textContent = state.user.email || "explorer@hamarasafar.com";

        // Set initials fallback
        const nameParts = (state.user.name || "HA").split(" ");
        const initials = nameParts.map(n => n[0]).join("").substring(0, 2).toUpperCase();
        const photoContainer = document.getElementById("settings-profile-photo-container");
        if (state.user.photoURL) {
            photoContainer.innerHTML = `<img class="w-full h-full object-cover" src="${state.user.photoURL}" alt="Profile Photo">`;
        } else {
            photoContainer.innerHTML = `<span id="settings-photo-fallback">${initials}</span>`;
        }

        // Set toggle states
        document.getElementById("toggle-dark-theme").checked = document.documentElement.classList.contains("dark");
        document.getElementById("toggle-2fa").checked = localStorage.getItem("zen_2fa_enabled") === "true";
        document.getElementById("toggle-location-permission").checked = localStorage.getItem("zen_location_enabled") === "true";

        openOverlayModal("settings-modal", "settings-modal-card");
    };

    const closeModal = () => {
        closeOverlayModal("settings-modal", "settings-modal-card");
    };

    document.getElementById("btn-settings-open").addEventListener("click", openModal);
    document.getElementById("btn-settings-close").addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal();
    });

    // Save configurations
    document.getElementById("btn-settings-save").addEventListener("click", async () => {
        const name = document.getElementById("settings-display-name").value.trim() || "Hamara Safar User";
        const avatarUrl = document.getElementById("settings-avatar-url").value.trim();
        const currency = document.getElementById("settings-currency-select").value;
        const isDark = document.getElementById("toggle-dark-theme").checked;
        const is2fa = document.getElementById("toggle-2fa").checked;
        const isLocation = document.getElementById("toggle-location-permission").checked;

        // Save locally
        localStorage.setItem("zen_user_name", name);
        localStorage.setItem("zen_user_photo", avatarUrl);
        localStorage.setItem("zen_currency", currency);
        localStorage.setItem("zen_dark_mode", isDark);
        localStorage.setItem("zen_2fa_enabled", is2fa);
        localStorage.setItem("zen_location_enabled", isLocation);

        state.user.name = name;
        state.user.photoURL = avatarUrl;
        state.user.currency = currency;

        // Apply dark mode immediately
        if (isDark) {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }

        // Apply Location preference if toggled on
        if (isLocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    state.userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    document.getElementById("input-start-location").value = `GPS Coordinates (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`;
                    console.log("[Geolocation] Updated coordinates from Settings:", state.userLocation);
                },
                (err) => console.warn("[Geolocation] Could not fetch starting location:", err.message)
            );
        }

        // Update main dashboard user displays
        document.getElementById("user-display-name").textContent = name;
        updateUserAvatarUI();

        // Save to Firebase Firestore if logged in
        if (isRealFirebase && db && auth && auth.currentUser) {
            try {
                const uid = auth.currentUser.uid;
                await db.collection("users").doc(uid).set({
                    name: name,
                    photoURL: avatarUrl,
                    currency: currency,
                    darkMode: isDark,
                    twoFactorEnabled: is2fa,
                    locationEnabled: isLocation
                }, { merge: true });
                console.log("[Firebase DB] Settings synchronized to Firestore.");
            } catch (err) {
                console.warn("[Firebase DB] Failed to sync settings changes:", err.message);
            }
        }

        // Trigger budget display slider currency update
        const budgetEvent = new Event('input');
        document.getElementById("input-budget").dispatchEvent(budgetEvent);

        closeModal();
    });

    // Sign Out
    document.getElementById("btn-logout").addEventListener("click", async () => {
        console.log("[Auth] User requested Sign Out.");
        if (isRealFirebase && auth) {
            try {
                await auth.signOut();
                console.log("[Firebase Auth] Signed out successfully.");
            } catch (err) {
                console.error("[Firebase Auth] Sign out error:", err.message);
            }
        }
        
        // Clear local storage
        localStorage.removeItem("zen_logged_in");
        localStorage.removeItem("zen_user_name");
        localStorage.removeItem("zen_user_gender");
        localStorage.removeItem("zen_user_age");
        localStorage.removeItem("zen_currency");
        localStorage.removeItem("zen_user_photo");
        localStorage.removeItem("zen_2fa_enabled");
        localStorage.removeItem("zen_location_enabled");
        
        state.user.loggedIn = false;
        state.user.name = "";
        state.user.email = "";
        state.user.photoURL = "";
        state.user.uid = "";
        state.itineraryData = null;
        
        const resultsBtn = document.getElementById("nav-btn-results");
        if (resultsBtn) {
            resultsBtn.classList.add("opacity-40", "cursor-not-allowed");
            resultsBtn.setAttribute("disabled", "true");
        }
        
        closeModal();
        showScreen("screen-splash");
    });

    // Sub-modal triggers
    // Password Change
    document.getElementById("btn-change-password").addEventListener("click", () => {
        const curPass = document.getElementById("settings-password-current").value;
        const newPass = document.getElementById("settings-password-new").value;
        if (!curPass || !newPass) {
            alert("Please fill in both current and new password fields.");
            return;
        }
        // Mock success
        alert("Password updated successfully! (Demo environment)");
        document.getElementById("settings-password-current").value = "";
        document.getElementById("settings-password-new").value = "";
    });

    // Geolocation toggle listener
    document.getElementById("toggle-location-permission").addEventListener("change", (e) => {
        if (e.target.checked) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    localStorage.setItem("zen_location_enabled", "true");
                    state.userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    document.getElementById("input-start-location").value = `GPS Coordinates (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`;
                },
                (err) => {
                    alert("Location access denied. Please allow location permissions in your browser.");
                    e.target.checked = false;
                    localStorage.setItem("zen_location_enabled", "false");
                }
            );
        } else {
            localStorage.setItem("zen_location_enabled", "false");
        }
    });

    // Support Modal
    document.getElementById("btn-support-modal").addEventListener("click", () => {
        openOverlayModal("support-ticket-modal");
    });
    document.getElementById("btn-support-cancel").addEventListener("click", () => {
        closeOverlayModal("support-ticket-modal");
    });
    document.getElementById("btn-support-submit").addEventListener("click", () => {
        const msg = document.getElementById("support-message").value.trim();
        if (!msg) {
            alert("Please enter your support request message.");
            return;
        }
        alert("Support Ticket submitted successfully! A representative will contact you shortly.");
        document.getElementById("support-message").value = "";
        closeOverlayModal("support-ticket-modal");
    });

    // Bug Modal
    document.getElementById("btn-bug-modal").addEventListener("click", () => {
        openOverlayModal("bug-report-modal");
    });
    document.getElementById("btn-bug-cancel").addEventListener("click", () => {
        closeOverlayModal("bug-report-modal");
    });
    document.getElementById("btn-bug-submit").addEventListener("click", () => {
        const title = document.getElementById("bug-title").value.trim();
        const steps = document.getElementById("bug-steps").value.trim();
        if (!title || !steps) {
            alert("Please fill in the bug title and steps to reproduce.");
            return;
        }
        alert("Thank you! Your bug report has been submitted to our QA dashboard.");
        document.getElementById("bug-title").value = "";
        document.getElementById("bug-steps").value = "";
        closeOverlayModal("bug-report-modal");
    });

    // Privacy Modal
    document.getElementById("btn-privacy-settings").addEventListener("click", () => {
        openOverlayModal("privacy-settings-modal");
    });
    document.getElementById("btn-privacy-close").addEventListener("click", () => {
        closeOverlayModal("privacy-settings-modal");
    });
    document.getElementById("btn-clear-history").addEventListener("click", () => {
        if (confirm("Are you sure you want to clear your local travel planning history?")) {
            localStorage.removeItem("zen_logged_in");
            state.itineraryData = null;
            alert("History cleared successfully!");
            closeOverlayModal("privacy-settings-modal");
            closeModal();
            showScreen("screen-splash");
        }
    });

    // Delete Account Confirmation
    document.getElementById("btn-delete-account").addEventListener("click", () => {
        openOverlayModal("delete-confirm-modal");
    });
    document.getElementById("btn-cancel-delete-action").addEventListener("click", () => {
        closeOverlayModal("delete-confirm-modal");
    });
    document.getElementById("btn-confirm-delete-action").addEventListener("click", async () => {
        const btn = document.getElementById("btn-confirm-delete-action");
        btn.innerHTML = `<span class="animate-spin material-symbols-outlined text-xs">sync</span> Erasing Profile Data...`;
        
        // Firestore delete
        if (isRealFirebase && db && auth && auth.currentUser) {
            try {
                const uid = auth.currentUser.uid;
                await db.collection("users").doc(uid).delete();
                await auth.currentUser.delete();
            } catch (err) {
                console.warn("[Firebase DB] Deletion error:", err.message);
            }
        }
        
        setTimeout(() => {
            alert("Account permanently deleted. Hope to see you again soon!");
            localStorage.clear();
            state.user.loggedIn = false;
            state.user.name = "";
            state.user.email = "";
            state.user.photoURL = "";
            state.user.uid = "";
            state.itineraryData = null;
            
            closeOverlayModal("delete-confirm-modal");
            closeModal();
            showScreen("screen-splash");
        }, 1500);
    });
}

// -------------------------------------------------------------
// ITINERARY GENERATOR ENGINE (API Pipeline)
// -------------------------------------------------------------
async function generateItinerary(trip) {
    showScreen("screen-results");
    
    const loadingSection = document.getElementById("results-loading");
    const contentSection = document.getElementById("results-content");
    const progress = document.getElementById("loading-progress-bar");
    const statusText = document.getElementById("loading-status-text");

    loadingSection.classList.remove("hidden");
    contentSection.classList.add("hidden");

    // Clear previous data
    state.itineraryData = null;
    progress.style.width = "10%";

    try {
        // STEP 1: Fetch Weather prediction (API 1)
        statusText.textContent = "Connecting to Google Weather & Maps API...";
        await new Promise(r => setTimeout(r, 1200));
        progress.style.width = "35%";

        const normalizedDest = trip.destination.toLowerCase();
        let destinationMeta = DEFAULT_DESTINATION;
        
        // Match listed destinations in DB
        for (const key in DESTINATIONS_DB) {
            if (normalizedDest.includes(key) || key.includes(normalizedDest)) {
                destinationMeta = DESTINATIONS_DB[key];
                break;
            }
        }

        // Determine weather condition based on dates (simulate rain on even start dates, sunny on odd)
        const dateNum = new Date(trip.startDate).getDate();
        const weatherMode = (dateNum % 2 === 0 && destinationMeta.weatherPatterns.rainy) ? "rainy" : "sunny";
        const weatherInfo = destinationMeta.weatherPatterns[weatherMode] || destinationMeta.weatherPatterns["sunny"];
        state.weatherForecast = weatherInfo;

        // Apply Weather advisory to UI
        document.getElementById("weather-icon-container").textContent = weatherInfo.icon;
        document.getElementById("weather-summary-text").textContent = weatherInfo.summary;
        document.getElementById("weather-badge").textContent = weatherInfo.isRainy ? "Hazard Alert" : "Clear Skies";
        document.getElementById("weather-badge").className = `text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 ${weatherInfo.badgeColor}`;
        document.getElementById("weather-description-text").textContent = weatherInfo.description;

        const reRouteText = document.getElementById("route-re-routing-text");
        if (weatherInfo.isRainy) {
            reRouteText.classList.remove("hidden");
            reRouteText.innerHTML = `<span class="material-symbols-outlined text-sm">navigation</span> Safety Re-Routing: ${weatherInfo.safeRouteName}`;
        } else {
            reRouteText.classList.add("hidden");
        }

        // STEP 2: Fetch Lodging stays & Reviews (API 2 - RapidAPI Airbnb)
        statusText.textContent = "Connecting to Airbnb API via RapidAPI...";
        progress.style.width = "55%";
        let selectedStays = await fetchAirbnbListings(trip, destinationMeta);
        
        // If RapidAPI fetch fails, use fallback static lodgings matching budget
        if (!selectedStays || selectedStays.length === 0) {
            console.log("RapidAPI fetch returned no listings, executing fallback.");
            selectedStays = destinationMeta.stays;
        }
        state.selectedStays = selectedStays;

        // Calculate nights and days
        const start = new Date(trip.startDate);
        const end = new Date(trip.endDate);
        const nights = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
        const days = nights + 1;
        state.currentTrip.nights = nights;
        state.currentTrip.days = days;

        // Calculate travel distance
        const routePath = weatherInfo.safeRoutePath || [];
        state.currentTrip.distance = getRoadDistance(state.userLocation, destinationMeta, routePath);


        // Update cost allocation (which also filters and renders stays)
        updateCostAllocation(destinationMeta);

        progress.style.width = "70%";

        // STEP 3: Generate Itinerary Plan via Gemini API (API 3)
        statusText.textContent = "Invoking Gemini AI to build your day schedule...";
        progress.style.width = "85%";

        // Pass only the budget-filtered stays to Gemini, falling back to the cheapest stay if none match
        let staysForAI = state.filteredStays || [];
        if (staysForAI.length === 0 && selectedStays.length > 0) {
            const cheapestStay = selectedStays.reduce((min, s) => s.price < min.price ? s : min, selectedStays[0]);
            staysForAI = [cheapestStay];
        }

        const geminiResult = await callGeminiAPI(trip, weatherInfo, staysForAI, destinationMeta);
        state.itineraryData = geminiResult;

        renderItinerary(geminiResult);
        renderPhotoSpots(destinationMeta.photoSpots);

        // Render Leaflet map
        renderLeafletMap(destinationMeta, weatherInfo);

        // Setup directions buttons
        setupDirectionsLinks(destinationMeta, weatherInfo);

        // Update Title Headers
        document.getElementById("results-title-dest").textContent = destinationMeta.name;
        
        const formatOptions = { month: 'short', day: 'numeric' };
        const sD = new Date(trip.startDate).toLocaleDateString('en-US', formatOptions);
        const eD = new Date(trip.endDate).toLocaleDateString('en-US', formatOptions);
        document.getElementById("results-title-dates").textContent = `${sD} - ${eD} • ${trip.travelers} Guests`;

        // Loading Complete
        progress.style.width = "100%";
        await new Promise(r => setTimeout(r, 500));
        loadingSection.classList.add("hidden");
        contentSection.classList.remove("hidden");

        // Force Leaflet map layout updates
        if (state.mapInstance) {
            setTimeout(() => {
                state.mapInstance.invalidateSize();
            }, 300);
        }

        // Enable results navbar trigger
        const resultsBtn = document.getElementById("nav-btn-results");
        resultsBtn.classList.remove("opacity-40", "cursor-not-allowed");
        resultsBtn.removeAttribute("disabled");

    } catch (err) {
        console.error(err);
        statusText.textContent = "Error assembling Hamara Safar plan. Try check your internet connection.";
        progress.style.width = "100%";
        alert("Failed to build itinerary: " + err.message);
        showScreen("screen-planner");
    }
}

// -------------------------------------------------------------
// RAPIDAPI AIRBNB API FETCH CLIENT (Via Secure Backend Proxy)
// -------------------------------------------------------------
async function fetchAirbnbListings(trip, meta) {
    const stateCode = meta.stateCode || "pk";
    const zip = meta.zipcode || "44000";
    
    console.log(`Requesting stays via secure backend proxy...`);
    
    try {
        const response = await fetch(`${getApiBaseUrl()}/stays`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ 
                stateCode, 
                zipcode: zip,
                destination: meta.name || trip.destination,
                check_in_date: trip.startDate,
                check_out_date: trip.endDate,
                adults: trip.travelers,
                currency: state.user.currency || "USD",
                priority: trip.priority,
                budget: trip.budget || 15000,
                nights: trip.nights || Math.max(1, Math.round((new Date(trip.endDate) - new Date(trip.startDate)) / (1000 * 60 * 60 * 24))),
                countryCode: meta.countryCode || meta.stateCode || "pk"
            })
        });
        
        if (!response.ok) {
            throw new Error(`Backend proxy returned status error ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Stays proxy response:", data);
        
        // Parse the raw listing objects
        const rawListings = data.data || data.listings || [];
        if (!rawListings || rawListings.length === 0) {
            return null;
        }
        
        // Map elements to the format expected by our UI stays list
        const stays = rawListings.map(item => {
            let priceNum = 85;
            if (item.price) {
                if (typeof item.price === "object" && item.price.rate) {
                    priceNum = item.price.rate;
                } else if (typeof item.price === "number") {
                    priceNum = item.price;
                } else if (typeof item.price === "string") {
                    priceNum = parseInt(item.price.replace(/[^0-9]/g, "")) || 85;
                }
            }
            
            // Random offset for coordinates so they cluster nicely around our map focus
            const stayLat = item.lat || (meta.lat + (Math.random() - 0.5) * 0.02);
            const stayLng = item.lng || (meta.lng + (Math.random() - 0.5) * 0.02);
            
            return {
                name: item.name || item.title || "Charming Safar Stay",
                desc: item.description || item.type || "Beautiful cozy rooms with great ambient surroundings.",
                rating: item.rating || (4.2 + Math.random() * 0.7).toFixed(1),
                reviews: item.reviewsCount ? `${item.reviewsCount} guests ratings mention great views.` : "Highly rated for cleanliness and majestic panoramas.",
                lat: stayLat,
                lng: stayLng,
                price: priceNum,
                tag: item.tag || "Scenic Balcony",
                image: item.thumbnail || item.images?.[0] || "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=400"
            };
        });
        
        return stays.slice(0, 10);
        
    } catch (e) {
        console.warn("Backend stays proxy fetch failed: ", e);
        return null;
    }
}

// -------------------------------------------------------------
// GEMINI API CALL HANDLER (Via Secure Backend Proxy)
// -------------------------------------------------------------
async function callGeminiAPI(trip, weather, stays, meta) {
    const prompt = `
    You are an expert travel coordinator. Plan a high-end, relaxing travel itinerary.
    Destination: ${trip.destination} (${meta.country})
    Dates: From ${trip.startDate} to ${trip.endDate}
    Travelers count: ${trip.travelers}
    Budget target: ${trip.budget} USD
    Priority theme: ${trip.priority}
    Weather Advisory: ${weather.summary}. Description: ${weather.description}
    Route Parameters: Driving on route "${weather.safeRouteName}"
    Selected Hotel: ${stays[0].name} (Balcony review notes: "${stays[0].reviews}")

    Instructions:
    Generate a Day-by-Day itinerary that directly integrates the selected hotel and addresses weather conditions. If raining, recommend indoor activities or the safe highway route. Outline two key points of interest. 

    Provide the output strictly in a valid JSON format. Do not write markdown tags outside, do not write code blocks wrapper. 
    Strict JSON Structure required:
    {
      "itinerary": [
        {
          "day": 1,
          "title": "Day title",
          "description": "General description",
          "activities": [
            { "name": "Activity name", "detail": "Specific detail of what to do" }
          ]
        }
      ]
    }`;

    console.log('[API Itinerary] Requesting itinerary via secure backend proxy...');
    
    try {
        const response = await fetch(`${getApiBaseUrl()}/itinerary`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ prompt })
        });

        if (!response.ok) {
            throw new Error(`Itinerary backend proxy status error ${response.status}`);
        }

        const data = await response.json();
        const responseText = data.candidates[0].content.parts[0].text;
        
        // Clean any code blocks formatting if present
        const jsonString = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(jsonString);

    } catch (e) {
        console.warn("Live backend Gemini API call failed. Falling back to simulated itinerary: ", e);
        
        // Local simulation fallback
        const mockItinerary = JSON.parse(JSON.stringify(meta.fallbackPlan.itinerary));
        mockItinerary.forEach((d) => {
            d.description = d.description.replace("[Hotel]", stays[0].name);
            d.activities.forEach(a => {
                if (a.name.includes("check-in")) {
                    a.detail = `Check in at ${stays[0].name}. ${stays[0].reviews}`;
                }
            });
        });
        return { itinerary: mockItinerary };
    }
}

// -------------------------------------------------------------
// TRIP BUDGET ALLOCATION & TRAVEL COST ENGINE
// -------------------------------------------------------------

// -------------------------------------------------------------
// TRIP BUDGET ALLOCATION & TRAVEL COST ENGINE (Background Engine)
// -------------------------------------------------------------

function updateCostAllocation(meta) {
    if (!state.currentTrip) return;

    const conversionRate = state.user.currency === "PKR" ? 278 : 1;
    const sign = state.user.currency === "PKR" ? "Rs " : "$";

    const totalBudget = state.currentTrip.budget; // in user currency
    const distance = state.currentTrip.distance || 0; // in km
    const travelers = state.currentTrip.travelers || 1;
    const days = state.currentTrip.days || 1;
    const nights = state.currentTrip.nights || 1;

    // 1. Determine travel mode and calculate Travel Cost
    // If distance > 600km, Alto is not suitable, use public transport
    const travelMode = distance > 600 ? "public" : "alto";
    let travelCost = 0; // in user currency
    let travelCostDetail = "";

    if (travelMode === "alto") {
        const fuelPricePerLiter = state.user.currency === "PKR" ? 270 : (270 / 278);
        const roundTripDistance = distance * 2;
        const localDriving = 50 * days;
        const totalDrivingDistance = roundTripDistance + localDriving;
        const litersNeeded = totalDrivingDistance / 18;
        travelCost = Math.round(litersNeeded * fuelPricePerLiter);
        travelCostDetail = `Alto Fuel: ${sign}${Number(travelCost).toLocaleString()} (${Math.round(totalDrivingDistance)} km total)`;
    } else {
        const isDomestic = meta.country && meta.country.toLowerCase().includes("pakistan");
        const ticketCost = isDomestic 
            ? (state.user.currency === "PKR" ? 3500 : (3500 / 278))
            : (state.user.currency === "PKR" ? 15000 : (15000 / 278));
        travelCost = Math.round(ticketCost * travelers);
        travelCostDetail = `Public Transport: ${sign}${Number(travelCost).toLocaleString()} (${travelers} travelers)`;
    }

    // 2. Calculate Food Cost (1500 PKR / $6 USD per traveler per day)
    const dailyFoodCost = state.user.currency === "PKR" ? 1500 : Math.round(1500 / 278);
    const foodCost = dailyFoodCost * travelers * days;
    const foodCostDetail = `Food Cost: ${sign}${Number(foodCost).toLocaleString()} (${sign}${dailyFoodCost}/day per person)`;

    // 3. Calculate Lodging Cost
    let lodgingCost = totalBudget - travelCost - foodCost;
    if (lodgingCost < 0) lodgingCost = 0;

    const nightlyLimit = nights > 0 ? Math.round(lodgingCost / nights) : lodgingCost;
    const nightlyLimitUSD = nightlyLimit / conversionRate;

    // Filter stays matching budget
    const filteredStays = (state.selectedStays || []).filter(s => s.price <= nightlyLimitUSD);
    state.filteredStays = filteredStays;
    renderStays(filteredStays, meta);

    // Update advisory text and status
    const advisory = document.getElementById("budget-advisory-alert");
    const advisoryContent = document.getElementById("advisory-content");
    const advisoryIcon = document.getElementById("advisory-icon");

    if (advisory && advisoryContent) {
        advisory.className = "p-4 rounded-2xl flex items-start gap-3 text-left text-xs transition-all border";
        advisory.classList.remove("hidden");

        const breakdownHTML = `
            <div class="mt-2 pt-2 border-t border-current/10 grid grid-cols-2 sm:grid-cols-4 gap-2 opacity-90 text-[10px] font-semibold">
                <div>🚗 ${travelCostDetail}</div>
                <div>🍔 ${foodCostDetail}</div>
                <div>🏨 Lodging Pool: ${sign}${Number(lodgingCost).toLocaleString()}</div>
                <div>🌙 Nightly Limit: ${sign}${Number(nightlyLimit).toLocaleString()}</div>
            </div>
        `;

        if (lodgingCost <= 0) {
            // Insufficient budget
            advisory.classList.add("border-red-200", "bg-red-50/70", "text-red-900");
            if (advisoryIcon) advisoryIcon.textContent = "error";
            advisoryContent.innerHTML = `
                <p class="font-bold">Insufficient Trip Budget</p>
                <p class="mt-0.5 leading-relaxed">
                    Your estimated travel and food costs (${sign}${Number(travelCost + foodCost).toLocaleString()}) exceed your total budget of ${sign}${Number(totalBudget).toLocaleString()}. 
                    Please increase your budget to enable accommodation searches.
                </p>
                ${breakdownHTML}
            `;
        } else if (filteredStays.length === 0 && state.selectedStays && state.selectedStays.length > 0) {
            // Budget too low for stays
            const cheapestStay = state.selectedStays.reduce((min, s) => s.price < min.price ? s : min, state.selectedStays[0]);
            const cheapestCostPKR = Math.round(cheapestStay.price * conversionRate);
            const extraNeeded = Math.round((cheapestStay.price * nights * conversionRate) - lodgingCost);

            advisory.classList.add("border-red-200", "bg-red-50/70", "text-red-900");
            if (advisoryIcon) advisoryIcon.textContent = "warning";
            advisoryContent.innerHTML = `
                <p class="font-bold">Stays Exceed Lodging Budget</p>
                <p class="mt-0.5 leading-relaxed">
                    No available stays fit your nightly lodging limit of ${sign}${Number(nightlyLimit).toLocaleString()}. 
                    The cheapest option is <strong>${cheapestStay.name}</strong> at ${sign}${Number(cheapestCostPKR).toLocaleString()}/night. 
                    Consider increasing your total budget by at least <strong>${sign}${Number(extraNeeded).toLocaleString()}</strong>.
                </p>
                ${breakdownHTML}
            `;
        } else {
            // Stays found within budget, check if upgrade is recommended
            const betterStays = (state.selectedStays || []).filter(s => s.price > nightlyLimitUSD);
            let upsellHTML = "";

            if (betterStays.length > 0) {
                const bestUpsell = betterStays.reduce((max, s) => s.rating > max.rating ? s : max, betterStays[0]);
                const affordBestRating = filteredStays.reduce((max, s) => s.rating > max ? s.rating : max, 0);

                if (bestUpsell.rating > affordBestRating) {
                    const upsellPricePKR = Math.round(bestUpsell.price * conversionRate);
                    const nightDiff = Math.round((bestUpsell.price * conversionRate) - nightlyLimit);
                    const totalDiff = nightDiff * nights;
                    
                    upsellHTML = `
                        <p class="mt-1 font-semibold text-[#00694c] flex items-center gap-1">
                            <span class="material-symbols-outlined text-sm">stars</span> 
                            Concierge Tip: Increase budget by ${sign}${Number(totalDiff).toLocaleString()} (${sign}${Number(nightDiff).toLocaleString()}/night) 
                            to upgrade to <strong>${bestUpsell.name}</strong> (★ ${bestUpsell.rating}) with superior scenery views!
                        </p>
                    `;
                }
            }

            if (travelMode === "public" && distance > 600) {
                // Public Transport suggestion instead of Alto
                advisory.classList.add("border-amber-200", "bg-amber-50/70", "text-amber-900");
                if (advisoryIcon) advisoryIcon.textContent = "train";
                advisoryContent.innerHTML = `
                    <p class="font-bold">Public Transport Auto-Routing</p>
                    <p class="mt-0.5 leading-relaxed">
                        The destination is ${Math.round(distance)} km away. Driving a Suzuki Alto this distance is not recommended. 
                        We automatically switched travel parameters to public transport and successfully filtered stays matching your remaining budget!
                    </p>
                    ${upsellHTML}
                    ${breakdownHTML}
                `;
            } else {
                // Standard Success
                advisory.classList.add("border-primary/20", "bg-primary/5", "text-primary");
                if (advisoryIcon) advisoryIcon.textContent = "check_circle";
                advisoryContent.innerHTML = `
                    <p class="font-bold">Trip Budget Allocation Success</p>
                    <p class="mt-0.5 leading-relaxed">
                        We successfully allocated your budget for Alto car fuel, food, and stays. The hotels displayed below fit your nightly lodging budget!
                    </p>
                    ${upsellHTML}
                    ${breakdownHTML}
                `;
            }
        }
    }
}

// -------------------------------------------------------------
// UI RENDERING FUNCTIONS
// -------------------------------------------------------------

function decodeEntities(str) {
    if (!str) return "";
    const txt = document.createElement("textarea");
    txt.innerHTML = str;
    let val = txt.value;
    if (val.includes("&amp;")) {
        txt.innerHTML = val;
        val = txt.value;
    }
    return val;
}

function renderStays(stays, meta) {
    const container = document.getElementById("lodging-container");
    container.innerHTML = "";

    const sign = state.user.currency === "PKR" ? "Rs " : "$";
    const conversionRate = state.user.currency === "PKR" ? 278 : 1;

    if (stays.length === 0) {
        const emptyCard = document.createElement("div");
        emptyCard.className = "col-span-full py-10 px-6 text-center text-on-surface-variant/70 bg-surface-container-low rounded-3xl border border-dashed border-outline-variant/60 flex flex-col items-center justify-center space-y-2.5";
        emptyCard.innerHTML = `
            <span class="material-symbols-outlined text-4xl text-outline-variant">hotel_class</span>
            <p class="font-bold text-sm">No accommodations fit your nightly lodging limit</p>
            <p class="text-xs text-outline max-w-sm">Adjust your trip budget slider or select different travel choices to discover matching lodgings.</p>
        `;
        container.appendChild(emptyCard);
        return;
    }

    stays.forEach((stay, index) => {
        const convertedPrice = Math.round(stay.price * conversionRate);
        const card = document.createElement("div");
        card.className = "bg-surface rounded-2xl overflow-hidden border border-outline-variant/30 hover:shadow-md transition-all flex flex-col";
        
        const stayImgId = `stay-img-${index}-${Math.floor(Math.random() * 1000)}`;
        const isFallback = stay.image && (stay.image.includes("unsplash.com") || stay.image.includes("loremflickr.com"));

        card.innerHTML = `
            <div class="h-[180px] relative ${isFallback ? 'shimmer bg-surface-container-low' : ''}">
                <img class="w-full h-full object-cover ${isFallback ? 'opacity-0 transition-opacity duration-300' : ''}" 
                     id="${stayImgId}" 
                     alt="${stay.name}" 
                     referrerpolicy="no-referrer"
                     src="${isFallback ? '' : stay.image}"/>
                <div class="absolute top-3 right-3 bg-surface/90 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                    <span class="material-symbols-outlined text-[#FFB800] text-sm filled-icon">star</span>
                    <span class="text-xs font-bold text-on-surface">${stay.rating}</span>
                </div>
                <span class="absolute bottom-3 left-3 bg-primary-container/90 text-on-primary-container text-xs px-2.5 py-1 rounded-full uppercase tracking-wider font-semibold">${stay.tag || "Scenic Balcony"}</span>
            </div>
            <div class="p-5 flex-grow flex flex-col justify-between text-left space-y-3">
                <div class="space-y-1">
                    <h4 class="font-bold text-base text-on-surface">${decodeEntities(stay.name)}</h4>
                    <p class="text-xs text-outline flex items-center gap-1">
                        <span class="material-symbols-outlined text-xs">location_on</span> View scenery near ${meta.name}
                    </p>
                </div>
                <p class="text-xs text-on-surface-variant italic line-clamp-2">
                    "${decodeEntities(stay.desc)}"
                </p>
                <div class="flex justify-between items-center border-t border-outline-variant/10 pt-3">
                    <div>
                        <span class="text-xs text-outline font-medium">Rate:</span>
                        <p class="font-bold text-primary text-base">${sign}${convertedPrice} <span class="text-xs text-outline font-normal">/ night</span></p>
                    </div>
                    <button onclick="openStayOnMap(${stay.lat}, ${stay.lng}, '${stay.name}')" class="bg-secondary-container hover:bg-secondary text-primary hover:text-white font-bold text-xs px-4 py-2 rounded-full transition-all flex items-center gap-1">
                        Show Map <span class="material-symbols-outlined text-xs">location_searching</span>
                    </button>
                </div>
            </div>
        `;
        container.appendChild(card);

        if (isFallback) {
            // Load custom place photo
            fetch(`${getApiBaseUrl()}/place-photo`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: `${stay.name} ${meta.name}` })
            })
            .then(res => res.json())
            .then(data => {
                const imgEl = document.getElementById(stayImgId);
                if (imgEl && data.photoUrl) {
                    imgEl.src = data.photoUrl;
                    imgEl.onload = () => {
                        imgEl.classList.remove("opacity-0");
                        imgEl.parentNode.classList.remove("shimmer");
                    };
                }
            })
            .catch(err => {
                console.warn("Failed to load custom stay image:", stay.name, err);
                const imgEl = document.getElementById(stayImgId);
                if (imgEl) {
                    imgEl.src = stay.image;
                    imgEl.classList.remove("opacity-0");
                    imgEl.parentNode.classList.remove("shimmer");
                }
            });
        }
    });
}

function renderItinerary(data) {
    const container = document.getElementById("itinerary-days-container");
    container.innerHTML = "";

    data.itinerary.forEach((day, index) => {
        const dayDiv = document.createElement("div");
        dayDiv.className = "relative";
        
        let activitiesHTML = "";
        day.activities.forEach((act, actIdx) => {
            activitiesHTML += `
                <div class="flex items-start gap-3">
                    <span class="w-7 h-7 rounded-lg bg-secondary-container/50 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">${actIdx + 1}</span>
                    <div>
                        <p class="text-sm font-semibold text-on-surface">${act.name}</p>
                        <p class="text-xs text-outline mt-0.5">${act.detail}</p>
                    </div>
                </div>
            `;
        });

        dayDiv.innerHTML = `
            <span class="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-primary border-4 border-background ring-4 ring-primary-container/20"></span>
            <div class="space-y-2">
                <h4 class="font-bold text-base text-primary uppercase tracking-wider">Day ${day.day}: ${day.title}</h4>
                <p class="text-sm text-on-surface-variant leading-relaxed">
                    ${day.description}
                </p>
                
                <div class="bg-surface p-4 rounded-2xl border border-outline-variant/20 shadow-sm space-y-4 mt-3">
                    ${activitiesHTML}
                </div>
            </div>
        `;
        
        container.appendChild(dayDiv);
    });
}

function renderPhotoSpots(spots) {
    const container = document.getElementById("photo-spots-container");
    container.innerHTML = "";

    spots.forEach(async (spot, idx) => {
        const card = document.createElement("div");
        card.className = "bg-surface border border-outline-variant/35 rounded-2xl overflow-hidden p-2 flex flex-col space-y-2 hover:border-primary/45 hover:shadow-sm transition-all cursor-pointer";
        card.onclick = () => openSpotOnMaps(spot.lat, spot.lng);

        const spotImgId = `photo-spot-img-${idx}-${Math.floor(Math.random() * 1000)}`;

        card.innerHTML = `
            <div class="h-28 rounded-xl overflow-hidden relative bg-surface-container-low shimmer">
                <img class="w-full h-full object-cover opacity-0 transition-opacity duration-300" id="${spotImgId}" referrerpolicy="no-referrer" alt="${spot.name}"/>
                <div class="absolute bottom-2 right-2 bg-black/40 backdrop-blur-md rounded-lg p-1 text-white flex items-center justify-center">
                    <span class="material-symbols-outlined text-xs">navigation</span>
                </div>
            </div>
            <div class="px-1 py-0.5 text-left">
                <h4 class="font-semibold text-xs text-on-surface truncate">${spot.name}</h4>
                <p class="text-[10px] text-outline flex items-center gap-0.5 mt-0.5 leading-normal">
                    <span class="material-symbols-outlined text-[10px]">photo_camera</span> Photo Spot
                </p>
            </div>
        `;
        container.appendChild(card);

        // Fetch spot photo from backend proxy
        try {
            const res = await fetch(`${getApiBaseUrl()}/place-photo`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: `${spot.name}` })
            });
            const data = await res.json();
            const imgEl = document.getElementById(spotImgId);
            if (imgEl && data.photoUrl) {
                imgEl.src = data.photoUrl;
                imgEl.onload = () => {
                    imgEl.classList.remove("opacity-0");
                    imgEl.parentNode.classList.remove("shimmer");
                };
            }
        } catch (err) {
            console.warn("Failed to load photo for spot:", spot.name, err);
            // Revert shimmer on error
            const imgEl = document.getElementById(spotImgId);
            if (imgEl) imgEl.parentNode.classList.remove("shimmer");
        }
    });
}

// -------------------------------------------------------------
// LEAFLET MAP INTEGRATION
// -------------------------------------------------------------
function renderLeafletMap(meta, weather) {
    // Store active map center coordinates for nearby category queries
    state.mapCenter = { lat: meta.lat, lng: meta.lng };

    // Destroy previous Leaflet map if exists
    if (state.mapInstance) {
        state.mapInstance.remove();
        state.mapInstance = null;
    }

    // Initialize Leaflet map
    state.mapInstance = L.map("leaflet-map", {
        scrollWheelZoom: false
    }).setView([meta.lat, meta.lng], 8);

    // Add high quality modern map style layers
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap contributors',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(state.mapInstance);

    let startLat = meta.startLat;
    let startLng = meta.startLng;
    let safeRoutePath = weather.safeRoutePath ? JSON.parse(JSON.stringify(weather.safeRoutePath)) : [];
    let riskyRoutePath = weather.riskyRoutePath ? JSON.parse(JSON.stringify(weather.riskyRoutePath)) : [];
    let isUserLocationStart = false;

    if (state.userLocation) {
        const dist = calculateDistance(state.userLocation.lat, state.userLocation.lng, meta.lat, meta.lng);
        console.log(`[Distance Check] User location is ${dist.toFixed(1)} km from destination ${meta.name}`);
        if (dist < 1000) {
            startLat = state.userLocation.lat;
            startLng = state.userLocation.lng;
            isUserLocationStart = true;

            // Connect user location to predefined route start
            if (safeRoutePath && safeRoutePath.length > 0) {
                safeRoutePath.unshift([startLat, startLng]);
            } else {
                safeRoutePath = [[startLat, startLng], [meta.lat, meta.lng]];
            }

            if (riskyRoutePath && riskyRoutePath.length > 0) {
                riskyRoutePath.unshift([startLat, startLng]);
            }
        }
    }

    // Draw route path line
    if (safeRoutePath && safeRoutePath.length > 0) {
        // Safe Expressway Path (Green line)
        const polyline = L.polyline(safeRoutePath, {
            color: '#00694c',
            weight: 4,
            opacity: 0.85,
            dashArray: '2, 6' // Clean dashes
        }).addTo(state.mapInstance);
        
        // Auto zoom map to fit route bounds
        state.mapInstance.fitBounds(polyline.getBounds(), { padding: [30, 30] });
    }

    // Draw unsafe path if weather is rainy (Red line)
    if (weather.isRainy && riskyRoutePath && riskyRoutePath.length > 0) {
        L.polyline(riskyRoutePath, {
            color: '#ba1a1a',
            weight: 3.5,
            opacity: 0.7,
            dashArray: '5, 8'
        }).addTo(state.mapInstance);
    }

    // Create markers for stays
    meta.stays.forEach(stay => {
        const markerIcon = L.divIcon({
            html: `<div class="w-8 h-8 rounded-full bg-primary border-2 border-white shadow-md flex items-center justify-center text-white"><span class="material-symbols-outlined text-sm font-bold">home</span></div>`,
            className: '',
            iconSize: [32, 32],
            iconAnchor: [16, 32]
        });

        // Price conversion for popup
        const conversionRate = state.user.currency === "PKR" ? 278 : 1;
        const convertedPrice = Math.round(stay.price * conversionRate);
        const sign = state.user.currency === "PKR" ? "Rs " : "$";

        L.marker([stay.lat, stay.lng], { icon: markerIcon })
            .addTo(state.mapInstance)
            .bindPopup(`<b class="text-sm font-bold text-on-surface">${stay.name}</b><p class="text-xs text-outline mt-1">${sign}${convertedPrice.toLocaleString()} per night</p>`);
    });

    // Create start/end point markers
    const startIcon = L.divIcon({
        html: `<div class="w-6 h-6 rounded-full bg-[#1f2937] border-2 border-white shadow-md flex items-center justify-center text-white"><span class="w-2.5 h-2.5 rounded-full bg-white"></span></div>`,
        className: '',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    });
    L.marker([startLat, startLng], { icon: startIcon })
        .addTo(state.mapInstance)
        .bindPopup(isUserLocationStart ? "Your Real-time Location (Start Point)" : "Start Point");

    const endIcon = L.divIcon({
        html: `<div class="w-9 h-9 rounded-full bg-[#ff9900] border-2 border-white shadow-md flex items-center justify-center text-white"><span class="material-symbols-outlined text-sm font-bold">flag</span></div>`,
        className: '',
        iconSize: [36, 36],
        iconAnchor: [18, 36]
    });
    L.marker([meta.lat, meta.lng], { icon: endIcon })
        .addTo(state.mapInstance)
        .bindPopup(`Destination: ${meta.name}`);

    // Load initial nearby Coffee spots around destination
    fetchNearbyPlaces("Coffee", meta.lat, meta.lng);
}

// Map center pans on button click
window.openStayOnMap = (lat, lng, name) => {
    if (state.mapInstance) {
        state.mapInstance.setView([lat, lng], 14, { animate: true });
        // Find marker popup opening logic
    }
};

window.openSpotOnMaps = (lat, lng) => {
    // Click photo spots open coordinates in maps tab
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    window.open(url, "_blank");
};
window.openSpotOnMaps = openSpotOnMaps;

// -------------------------------------------------------------
// DIRECTIONS & GOOGLE MAPS REDIRECTION
// -------------------------------------------------------------
function setupDirectionsLinks(meta, weather) {
    // Generate driving directions route URL on Google Maps
    let directionsUrl = "";
    
    const startLoc = state.userLocation 
        ? `${state.userLocation.lat},${state.userLocation.lng}` 
        : `${meta.startLat},${meta.startLng}`;

    const dest = `${meta.lat},${meta.lng}`;

    if (weather.isRainy) {
        const waypoint = "33.8200,73.3450"; 
        directionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(startLoc)}&destination=${encodeURIComponent(dest)}&waypoints=${encodeURIComponent(waypoint)}&travelmode=driving`;
    } else {
        directionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(startLoc)}&destination=${encodeURIComponent(dest)}&travelmode=driving`;
    }

    // Set handlers
    const topBtn = document.getElementById("btn-directions-top");
    const bottomBtn = document.getElementById("btn-google-directions-bottom");

    topBtn.onclick = () => window.open(directionsUrl, "_blank");
    bottomBtn.onclick = () => window.open(directionsUrl, "_blank");
}

// -------------------------------------------------------------
// DYNAMIC GOOGLE PLACES AUTOCOMPLETE CONFIG & LOADER
// -------------------------------------------------------------
async function fetchConfigAndInitAutocomplete() {
    console.log("[Autocomplete] Google Places API bypassed to avoid billing/activation blocks. Using OpenStreetMap Nominatim search engine directly.");
    state.googleAutocompleteActive = false;
    
    const startLocInput = document.getElementById("input-start-location");
    const startDropdown = document.getElementById("start-location-suggestions");
    if (startLocInput && startDropdown) {
        bindLocalSuggestions(startLocInput, startDropdown, true);
    }

    const destInput = document.getElementById("input-destination");
    const dropdown = document.getElementById("destination-suggestions");
    if (destInput && dropdown) {
        bindLocalSuggestions(destInput, dropdown, false);
    }
}

function loadGoogleMapsScript(apiKey) {
    return new Promise((resolve, reject) => {
        if (window.google && window.google.maps && window.google.maps.places) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
            console.log("[Autocomplete] Google Places script appended and loaded.");
            resolve();
        };
        script.onerror = (err) => {
            console.error("[Autocomplete] Script load failed:", err);
            reject(err);
        };
        document.head.appendChild(script);
    });
}

function initGoogleAutocomplete() {
    const destInput = document.getElementById("input-destination");
    const dropdown = document.getElementById("destination-suggestions");
    
    if (!destInput) {
        console.warn("[Autocomplete] Destination input element not found in DOM.");
        return;
    }
    
    // Hide and disable local dropdown suggestions since Google Places is active
    if (dropdown) {
        dropdown.classList.add("hidden");
    }
    state.googleAutocompleteActive = true;
    
    console.log("[Autocomplete] Initializing google.maps.places.Autocomplete...");
    const autocomplete = new google.maps.places.Autocomplete(destInput, {
        types: ['(regions)'],
        fields: ['address_components', 'geometry', 'name', 'formatted_address']
    });

    autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place.geometry || !place.geometry.location) {
            console.warn("[Autocomplete] No geometry location data returned for selection:", place.name);
            return;
        }

        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const placeName = place.name || destInput.value;
        const formattedAddress = place.formatted_address || placeName;

        console.log(`[Autocomplete] Selection details: name="${placeName}", lat=${lat}, lng=${lng}`);

        let country = "World";
        let stateCode = "us";
        let zipcode = "10001";

        if (place.address_components) {
            for (const component of place.address_components) {
                if (component.types.includes("country")) {
                    country = component.long_name;
                    stateCode = component.short_name.toLowerCase();
                }
                if (component.types.includes("postal_code")) {
                    zipcode = component.long_name;
                }
                if (component.types.includes("administrative_area_level_1") && !zipcode) {
                    zipcode = "90210"; // Fallback zipcode for Airbnb stay lookup
                }
            }
        }

        const dbKey = placeName.toLowerCase();

        // Inject dynamic destination profile in DESTINATIONS_DB to enable global searches
        DESTINATIONS_DB[dbKey] = {
            name: placeName,
            country: country,
            lat: lat,
            lng: lng,
            startLat: lat - 0.22, // Simulating starting point 25km away
            startLng: lng - 0.31,
            baseCurrency: stateCode === "pk" ? "PKR" : "USD",
            stateCode: stateCode,
            zipcode: zipcode,
            weatherPatterns: {
                rainy: {
                    summary: `Day 1-2: Rain Forecast in ${placeName}`,
                    icon: "🌧️",
                    badge: "Hazard Warning",
                    badgeColor: "bg-[#ba1a1a]/10 text-[#ba1a1a] border border-[#ba1a1a]/20",
                    description: `Heavy downpour predicted in the ${placeName} area. Drive with caution. A high-visibility safe path is recommended.`,
                    safeRouteName: `Safe Bypass Route to ${placeName}`,
                    safeRoutePath: [
                        [lat - 0.22, lng - 0.31],
                        [lat - 0.14, lng - 0.20],
                        [lat - 0.07, lng - 0.09],
                        [lat, lng]
                    ],
                    riskyRoutePath: [
                        [lat - 0.22, lng - 0.31],
                        [lat - 0.18, lng - 0.25],
                        [lat - 0.10, lng - 0.15],
                        [lat, lng]
                    ],
                    isRainy: true
                },
                sunny: {
                    summary: `Day 1-3: Clear Skies in ${placeName}`,
                    icon: "☀️",
                    badge: "Perfect Weather",
                    badgeColor: "bg-primary/10 text-primary border border-primary/20",
                    description: `Sunny weather forecasted in ${placeName}. Ideal driving conditions. Standard scenic paths are fully accessible.`,
                    safeRouteName: `Scenic Drive to ${placeName}`,
                    safeRoutePath: [
                        [lat - 0.22, lng - 0.31],
                        [lat - 0.16, lng - 0.22],
                        [lat - 0.08, lng - 0.12],
                        [lat, lng]
                    ],
                    riskyRoutePath: [],
                    isRainy: false
                }
            },
            stays: [
                {
                    name: `Zen Resort ${placeName}`,
                    desc: `Beautiful panoramic stay overlooking the main landscapes of ${placeName}. Highly rated for serenity.`,
                    rating: (4.4 + Math.random() * 0.5).toFixed(1),
                    reviews: "Cozy rooms, excellent service, and direct balcony view of the sunrise.",
                    lat: lat + 0.006,
                    lng: lng - 0.005,
                    price: 110,
                    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=400"
                },
                {
                    name: `${placeName} Valley Lodge`,
                    desc: `Charming traditional accommodation in the heart of ${placeName} featuring stunning views.`,
                    rating: (4.2 + Math.random() * 0.6).toFixed(1),
                    reviews: "Wonderful food and vintage design parameters. Best sunset photos spot.",
                    lat: lat - 0.007,
                    lng: lng + 0.006,
                    price: 65,
                    image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=400"
                }
            ],
            photoSpots: [
                { name: `${placeName} Summit Outlook`, description: `Perfect high-altitude photography spot to capture the sunrise over ${placeName}.`, lat: lat + 0.012, lng: lng + 0.005 },
                { name: `${placeName} Historic Trail`, description: `Scenic path featuring local architectural styles and natural landmarks.`, lat: lat - 0.005, lng: lng - 0.011 }
            ],
            fallbackPlan: {
                itinerary: [
                    {
                        day: 1,
                        title: `Welcome & Arrival in ${placeName}`,
                        description: `Arrive safely in the scenic area of ${placeName} and settle into your room at [Hotel]. Relish the quiet sunset views.`,
                        activities: [
                            { name: "Check-in at Hotel", detail: "Unpack and relax with tea on the balcony." },
                            { name: "Scenic Evening Walk", detail: "Explore the quiet pine lanes and capture low-light views." }
                        ]
                    },
                    {
                        day: 2,
                        title: `Discovering ${placeName}`,
                        description: `Wake up early to experience the morning mist and proceed to the highest viewpoint in the region.`,
                        activities: [
                            { name: "Morning Photography", detail: `Head to the summit outlook for panoramic shots.` },
                            { name: "Delicacy Tasting", detail: "Enjoy authentic traditional cuisine in a cozy local tavern." }
                        ]
                    }
                ]
            }
        };

        // If the location matches "murree", copy the actual Murree routing path points so it displays the genuine Islamabad-Murree Expressway (N-75) bypass accurately!
        if (dbKey.includes("murree")) {
            DESTINATIONS_DB[dbKey].startLat = 33.6844;
            DESTINATIONS_DB[dbKey].startLng = 73.0479;
            DESTINATIONS_DB[dbKey].lat = 33.9042;
            DESTINATIONS_DB[dbKey].lng = 73.3903;
            DESTINATIONS_DB[dbKey].weatherPatterns.rainy.safeRoutePath = [
                [33.6844, 73.0479], // Islamabad
                [33.7120, 73.1820], // Bhara Kahu Bypass
                [33.7650, 73.2840], // Salgran
                [33.8200, 73.3450], // Lower Topa
                [33.9042, 73.3903]  // Murree Mall Road
            ];
            DESTINATIONS_DB[dbKey].weatherPatterns.rainy.riskyRoutePath = [
                [33.6844, 73.0479], // Islamabad
                [33.7380, 73.1510], // Old Chatla
                [33.7920, 73.2420], // Tret Old Road
                [33.8540, 73.3100], // Ghora Gali Mountain Path
                [33.9042, 73.3903]  // Murree
            ];
            DESTINATIONS_DB[dbKey].weatherPatterns.sunny.safeRoutePath = [
                [33.6844, 73.0479],
                [33.7380, 73.1510],
                [33.7920, 73.2420],
                [33.8540, 73.3100],
                [33.9042, 73.3903]
            ];
        } else if (dbKey.includes("kyoto")) {
            DESTINATIONS_DB[dbKey].startLat = 34.6937;
            DESTINATIONS_DB[dbKey].startLng = 135.5023;
            DESTINATIONS_DB[dbKey].lat = 35.0116;
            DESTINATIONS_DB[dbKey].lng = 135.7681;
            DESTINATIONS_DB[dbKey].weatherPatterns.sunny.safeRoutePath = [
                [34.6937, 135.5023], // Osaka
                [34.8010, 135.6320], // Hirakata
                [34.9010, 135.7010], // Uji
                [35.0116, 135.7681]  // Kyoto
            ];
        }

        // Update the input field value to match the formatted address
        destInput.value = formattedAddress;
    });
}

function bindLocalSuggestions(inputEl, dropdown, isStart = false) {
    if (!inputEl || !dropdown) return;
    
    inputEl.addEventListener("focus", () => {
        if (state.googleAutocompleteActive) return;
        const val = inputEl.value.trim();
        if (val.length >= 2) {
            dropdown.classList.remove("hidden");
        } else {
            if (isStart) {
                dropdown.innerHTML = `
                    <div class="px-4 py-3 hover:bg-secondary-container/30 cursor-pointer text-sm font-semibold text-primary text-left flex items-center gap-2" id="start-detect-btn">
                        <span class="material-symbols-outlined text-base">my_location</span> Detect & Use My Current Location
                    </div>
                `;
                dropdown.classList.remove("hidden");
                // Bind click to detect location
                const detectBtn = document.getElementById("start-detect-btn");
                if (detectBtn) {
                    detectBtn.addEventListener("click", (e) => {
                        e.stopPropagation();
                        dropdown.classList.add("hidden");
                        inputEl.value = "Detecting GPS location...";
                        if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition(
                                (pos) => {
                                    state.userLocation = {
                                        lat: pos.coords.latitude,
                                        lng: pos.coords.longitude
                                    };
                                    reverseGeocode(state.userLocation.lat, state.userLocation.lng);
                                },
                                (err) => {
                                    console.warn("Geolocation failed:", err.message);
                                    inputEl.value = "";
                                    inputEl.placeholder = "Enter starting location";
                                    alert("Could not access your location. Please check browser permissions or type a location manually.");
                                }
                            );
                        } else {
                            alert("Your browser does not support Geolocation.");
                            inputEl.value = "";
                        }
                    });
                }
            } else {
                // Display the 3 default options as sandbox starters
                dropdown.innerHTML = `
                    <div class="px-4 py-2 text-[10px] text-outline font-semibold uppercase tracking-wider bg-surface-container-low border-b border-outline-variant/10 text-left">Quick Sandbox Presets</div>
                    <div class="px-4 py-3 hover:bg-secondary-container/30 cursor-pointer text-sm font-medium border-b border-outline-variant/20 text-left" onclick="selectSuggestion('Murree, Pakistan')">🇵🇰 Murree, Pakistan</div>
                    <div class="px-4 py-3 hover:bg-secondary-container/30 cursor-pointer text-sm font-medium border-b border-outline-variant/20 text-left" onclick="selectSuggestion('Hunza, Pakistan')">🇵🇰 Hunza, Pakistan</div>
                    <div class="px-4 py-3 hover:bg-secondary-container/30 cursor-pointer text-sm font-medium text-left" onclick="selectSuggestion('Skardu, Pakistan')">🇵🇰 Skardu, Pakistan</div>
                `;
                dropdown.classList.remove("hidden");
            }
        }
    });

    inputEl.addEventListener("input", (e) => {
        if (state.googleAutocompleteActive) return;
        handleNominatimSearch(e, inputEl, dropdown, isStart);
    });
}

let nominatimTimeout = null;

function handleNominatimSearch(e, inputEl, dropdown, isStart = false) {
    if (state.googleAutocompleteActive) return;

    const val = e.target.value.trim();
    if (!val || val.length < 2) {
        dropdown.classList.add("hidden");
        return;
    }

    clearTimeout(nominatimTimeout);
    nominatimTimeout = setTimeout(async () => {
        try {
            console.log(`[Nominatim] Querying for: "${val}"`);
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(val)}&limit=5`, {
                headers: {
                    'Accept-Language': 'en',
                    'User-Agent': 'ZenTravel-AI'
                }
            });
            
            if (!response.ok) throw new Error("Search service failed");
            
            const results = await response.json();
            renderNominatimSuggestions(results, inputEl, dropdown, isStart);
        } catch (err) {
            console.warn("[Nominatim] Request failed:", err.message);
        }
    }, 350);
}

function renderNominatimSuggestions(results, inputEl, dropdown, isStart = false) {
    if (!results || results.length === 0) {
        dropdown.innerHTML = `<div class="px-4 py-3.5 text-xs text-outline italic text-left">No matching locations found</div>`;
        dropdown.classList.remove("hidden");
        return;
    }

    dropdown.innerHTML = "";
    results.forEach((item) => {
        const addr = item.address || {};
        const country = addr.country || "World";
        const countryCode = (addr.country_code || "us").toUpperCase();
        
        // Convert country code to Flag Emoji
        const flagEmoji = countryCode.replace(/./g, char => 
            String.fromCodePoint(char.charCodeAt(0) + 127397)
        );

        const displayName = item.display_name;
        const parts = displayName.split(", ");
        const shortName = parts.slice(0, 3).join(", ");

        const optionDiv = document.createElement("div");
        optionDiv.className = "px-4 py-3 hover:bg-secondary-container/30 cursor-pointer text-sm font-medium border-b border-outline-variant/20 last:border-b-0 flex items-center gap-2.5 transition-colors text-left";
        
        optionDiv.innerHTML = `<span class="text-base">${flagEmoji}</span> <span class="truncate">${displayName}</span>`;
        
        optionDiv.addEventListener("click", () => {
            inputEl.value = shortName;
            dropdown.classList.add("hidden");
            
            const lat = parseFloat(item.lat);
            const lng = parseFloat(item.lon);
            
            if (isStart) {
                state.userLocation = { lat, lng };
                state.lastStartGeocodedAddress = shortName;
                console.log("[Nominatim] Custom Start Point selected:", state.userLocation);
            } else {
                selectNominatimSuggestion(item, shortName);
            }
        });

        dropdown.appendChild(optionDiv);
    });

    dropdown.classList.remove("hidden");
}

function selectNominatimSuggestion(item, shortName) {
    const placeName = shortName;
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    const addr = item.address || {};
    const country = addr.country || "World";
    const stateCode = (addr.country_code || "us").toLowerCase();
    const zipcode = addr.postcode || "90210";

    console.log(`[Nominatim] Selected place: ${placeName} (${lat}, ${lng}), zip=${zipcode}`);

    const destInput = document.getElementById("input-destination");
    const dropdown = document.getElementById("destination-suggestions");
    
    destInput.value = shortName;
    dropdown.classList.add("hidden");

    const dbKey = shortName.toLowerCase();

    // Dynamically insert into DESTINATIONS_DB to allow Leaflet and Gemini to run on this location
    DESTINATIONS_DB[dbKey] = {
        name: placeName,
        country: country,
        lat: lat,
        lng: lng,
        startLat: lat - 0.22,
        startLng: lng - 0.31,
        baseCurrency: stateCode === "pk" ? "PKR" : "USD",
        stateCode: stateCode,
        zipcode: zipcode,
        weatherPatterns: {
            rainy: {
                summary: `Day 1-2: Rain Forecast in ${placeName}`,
                icon: "🌧️",
                badge: "Hazard Warning",
                badgeColor: "bg-[#ba1a1a]/10 text-[#ba1a1a] border border-[#ba1a1a]/20",
                description: `Heavy downpour predicted in the ${placeName} area. Drive with caution. A high-visibility safe path is recommended.`,
                safeRouteName: `Safe Bypass Route to ${placeName}`,
                safeRoutePath: [
                    [lat - 0.22, lng - 0.31],
                    [lat - 0.14, lng - 0.20],
                    [lat - 0.07, lng - 0.09],
                    [lat, lng]
                ],
                riskyRoutePath: [
                    [lat - 0.22, lng - 0.31],
                    [lat - 0.18, lng - 0.25],
                    [lat - 0.10, lng - 0.15],
                    [lat, lng]
                ],
                isRainy: true
            },
            sunny: {
                summary: `Day 1-3: Clear Skies in ${placeName}`,
                icon: "☀️",
                badge: "Perfect Weather",
                badgeColor: "bg-primary/10 text-primary border border-primary/20",
                description: `Sunny weather forecasted in ${placeName}. Ideal driving conditions. Standard scenic paths are fully accessible.`,
                safeRouteName: `Scenic Drive to ${placeName}`,
                safeRoutePath: [
                    [lat - 0.22, lng - 0.31],
                    [lat - 0.16, lng - 0.22],
                    [lat - 0.08, lng - 0.12],
                    [lat, lng]
                ],
                riskyRoutePath: [],
                isRainy: false
            }
        },
        stays: [
            {
                name: `Hamara Safar Resort ${placeName}`,
                desc: `Beautiful panoramic stay overlooking the main landscapes of ${placeName}. Highly rated for serenity.`,
                rating: (4.4 + Math.random() * 0.5).toFixed(1),
                reviews: "Cozy rooms, excellent service, and direct balcony view of the sunrise.",
                lat: lat + 0.006,
                lng: lng - 0.005,
                price: 110,
                image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=400"
            },
            {
                name: `${placeName} Valley Lodge`,
                desc: `Charming traditional accommodation in the heart of ${placeName} featuring stunning views.`,
                rating: (4.2 + Math.random() * 0.6).toFixed(1),
                reviews: "Wonderful food and vintage design parameters. Best sunset photos spot.",
                lat: lat - 0.007,
                lng: lng + 0.006,
                price: 65,
                image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=400"
            }
        ],
        photoSpots: [
            { name: `${placeName} Summit Outlook`, description: `Perfect high-altitude photography spot to capture the sunrise over ${placeName}.`, lat: lat + 0.012, lng: lng + 0.005 },
            { name: `${placeName} Historic Trail`, description: `Scenic path featuring local architectural styles and natural landmarks.`, lat: lat - 0.005, lng: lng - 0.011 }
        ],
        fallbackPlan: {
            itinerary: [
                {
                    day: 1,
                    title: `Welcome & Arrival in ${placeName}`,
                    description: `Arrive safely in the scenic area of ${placeName} and settle into your room at [Hotel]. Relish the quiet sunset views.`,
                    activities: [
                        { name: "Check-in at Hotel", detail: "Unpack and relax with tea on the balcony." },
                        { name: "Scenic Evening Walk", detail: "Explore the quiet pine lanes and capture low-light views." }
                    ]
                },
                {
                    day: 2,
                    title: `Discovering ${placeName}`,
                    description: `Wake up early to experience the morning mist and proceed to the highest viewpoint in the region.`,
                    activities: [
                        { name: "Morning Photography", detail: `Head to the summit outlook for panoramic shots.` },
                        { name: "Delicacy Tasting", detail: "Enjoy authentic traditional cuisine in a cozy local tavern." }
                    ]
                }
            ]
        }
    };
    
    // Copy real Murree or Kyoto paths if selected
    if (dbKey.includes("murree")) {
        DESTINATIONS_DB[dbKey].startLat = 33.6844;
        DESTINATIONS_DB[dbKey].startLng = 73.0479;
        DESTINATIONS_DB[dbKey].lat = 33.9042;
        DESTINATIONS_DB[dbKey].lng = 73.3903;
        DESTINATIONS_DB[dbKey].weatherPatterns.rainy.safeRoutePath = [
            [33.6844, 73.0479],
            [33.7120, 73.1820],
            [33.7650, 73.2840],
            [33.8200, 73.3450],
            [33.9042, 73.3903]
        ];
        DESTINATIONS_DB[dbKey].weatherPatterns.rainy.riskyRoutePath = [
            [33.6844, 73.0479],
            [33.7380, 73.1510],
            [33.7920, 73.2420],
            [33.8540, 73.3100],
            [33.9042, 73.3903]
        ];
        DESTINATIONS_DB[dbKey].weatherPatterns.sunny.safeRoutePath = [
            [33.6844, 73.0479],
            [33.7380, 73.1510],
            [33.7920, 73.2420],
            [33.8540, 73.3100],
            [33.9042, 73.3903]
        ];
    }
}

// Global hook for Google Maps API authentication failure (e.g. invalid key, API not enabled, no billing)
window.gm_authFailure = function() {
    console.warn("[Autocomplete] Google Maps API Authentication failed. Reverting to local suggestions.");
    
    // Deactivate Google Autocomplete flag
    state.googleAutocompleteActive = false;
    document.body.classList.add('google-auth-failed');
    
    // Hide the Google autocomplete dropdown containers
    const pacContainers = document.querySelectorAll('.pac-container');
    pacContainers.forEach(el => {
        el.style.display = 'none';
        el.classList.add('hidden');
    });

    const oldInput = document.getElementById("input-destination");
    const dropdown = document.getElementById("destination-suggestions");
    
    if (oldInput && dropdown) {
        // Clone the input element to strip Google Autocomplete listeners
        const newInput = oldInput.cloneNode(true);
        // Retain the current user input value
        newInput.value = oldInput.value;
        oldInput.parentNode.replaceChild(newInput, oldInput);

        // Re-bind local suggestions to the new input
        bindLocalSuggestions(newInput, dropdown);
    }
    
    showGoogleMapsAuthWarning();
};

function showGoogleMapsAuthWarning() {
    if (document.getElementById("google-maps-warning")) return;

    const destInput = document.getElementById("input-destination");
    if (!destInput) return;
    
    const inputContainer = destInput.parentNode.parentNode;
    const warningDiv = document.createElement("div");
    warningDiv.id = "google-maps-warning";
    warningDiv.className = "mt-2.5 p-4 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-2xl flex items-start gap-3 text-left shadow-sm";
    warningDiv.innerHTML = `
        <span class="material-symbols-outlined text-amber-600 text-lg shrink-0 mt-0.5 animate-bounce">warning</span>
        <div>
            <p class="font-bold text-sm text-amber-800">Google Places API Setup Required</p>
            <p class="mt-1 leading-relaxed text-amber-700">
                To use active autocomplete search, go to your <a href="https://console.cloud.google.com/" target="_blank" class="underline font-semibold text-primary">Google Cloud Console</a> and ensure the following APIs are **Enabled** for this key:
            </p>
            <ul class="list-disc pl-4 mt-1 space-y-0.5 text-amber-700">
                <li><strong>Maps JavaScript API</strong></li>
                <li><strong>Places API</strong> (or Places API (New))</li>
            </ul>
            <p class="mt-2 text-[10px] text-amber-600">
                Falling back to local database suggestions (Murree Hills, Hunza Valley, Skardu Desert) for sandbox testing.
            </p>
        </div>
    `;
    inputContainer.appendChild(warningDiv);
}

// -------------------------------------------------------------
// GEOLOCATION & NEARBY POI EXPLORATION (SerpAPI Google Maps)
// -------------------------------------------------------------

async function reverseGeocode(lat, lng) {
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=en`, {
            headers: {
                "User-Agent": "Hamara-Safar"
            }
        });
        if (res.ok) {
            const data = await res.json();
            const address = data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            const shortAddress = address.split(',').slice(0, 3).join(',').trim();
            const startLocInput = document.getElementById("input-start-location");
            if (startLocInput) {
                startLocInput.value = shortAddress;
            }
            console.log("[Reverse Geocoding] Resolved coordinates to:", shortAddress);
        }
    } catch (e) {
        console.warn("Reverse geocoding failed:", e);
        const startLocInput = document.getElementById("input-start-location");
        if (startLocInput) {
            startLocInput.value = `GPS Coordinates (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
        }
    }
}

async function geocodeAddress(address) {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`, {
            headers: {
                "User-Agent": "Hamara-Safar"
            }
        });
        if (response.ok) {
            const results = await response.json();
            if (results && results.length > 0) {
                return {
                    lat: parseFloat(results[0].lat),
                    lng: parseFloat(results[0].lon)
                };
            }
        }
    } catch (e) {
        console.warn("Geocoding failed:", e);
    }
    return null;
}

function requestUserLocation() {
    const startLocInput = document.getElementById("input-start-location");
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                state.userLocation = {
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude
                };
                console.log("[Geolocation] Real-time coordinates successfully captured:", state.userLocation);
                reverseGeocode(state.userLocation.lat, state.userLocation.lng);
            },
            (err) => {
                console.warn("[Geolocation] Permission denied or retrieval failed:", err.message);
                if (startLocInput) {
                    startLocInput.placeholder = "Enter starting location (e.g. Islamabad)";
                }
            },
            { enableHighAccuracy: true, timeout: 8000 }
        );
    } else {
        console.warn("[Geolocation] Browser does not support HTML5 geolocation API.");
        if (startLocInput) {
            startLocInput.placeholder = "Enter starting location (e.g. Islamabad)";
        }
    }
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function calculatePathDistance(path) {
    let total = 0;
    for (let i = 0; i < path.length - 1; i++) {
        total += calculateDistance(path[i][0], path[i][1], path[i+1][0], path[i+1][1]);
    }
    return total;
}

function getRoadDistance(userLoc, destMeta, safeRoutePath) {
    if (!userLoc) {
        if (safeRoutePath && safeRoutePath.length > 1) {
            return calculatePathDistance(safeRoutePath);
        }
        return calculateDistance(destMeta.startLat, destMeta.startLng, destMeta.lat, destMeta.lng) * 1.25;
    }

    const distToRouteStart = calculateDistance(userLoc.lat, userLoc.lng, destMeta.startLat, destMeta.startLng);
    
    if (safeRoutePath && safeRoutePath.length > 1) {
        const totalStraightDist = calculateDistance(userLoc.lat, userLoc.lng, destMeta.lat, destMeta.lng);
        if (totalStraightDist >= 1000) {
            return totalStraightDist;
        }
        const roadToStart = distToRouteStart * 1.25;
        const highwayDist = calculatePathDistance(safeRoutePath);
        return roadToStart + highwayDist;
    }

    return calculateDistance(userLoc.lat, userLoc.lng, destMeta.lat, destMeta.lng) * 1.25;
}

async function fetchNearbyPlaces(query, lat, lng) {
    const listContainer = document.getElementById("nearby-places-list");
    if (!listContainer) return;

    listContainer.innerHTML = `
        <div class="col-span-full py-6 text-center text-outline text-xs flex items-center justify-center gap-2">
            <span class="animate-spin material-symbols-outlined text-sm text-primary">progress_activity</span> Loading nearby ${query} spots...
        </div>
    `;

    try {
        console.log(`[POI Search] Querying nearby spots via API...`);
        const response = await fetch(`${getApiBaseUrl()}/nearby`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ q: query, lat, lng, zoom: 14 })
        });

        if (!response.ok) throw new Error(`Server returned error status ${response.status}`);
        
        const result = await response.json();
        const places = result.data || [];

        listContainer.innerHTML = "";

        // Remove previous nearby markers
        if (state.nearbyMarkers) {
            state.nearbyMarkers.forEach(marker => state.mapInstance.removeLayer(marker));
        }
        state.nearbyMarkers = [];

        if (places.length === 0) {
            listContainer.innerHTML = `<div class="col-span-full py-4 text-center text-outline text-xs">No spots found nearby. Try another category.</div>`;
            return;
        }

        places.slice(0, 4).forEach((place, idx) => {
            const card = document.createElement("div");
            card.className = "flex gap-2.5 bg-surface border border-outline-variant/20 rounded-2xl p-2.5 text-left items-start hover:border-primary/40 transition-all cursor-pointer shadow-sm";
            card.onclick = () => {
                if (state.mapInstance && place.lat && place.lng) {
                    state.mapInstance.setView([place.lat, place.lng], 15);
                }
            };

            card.innerHTML = `
                <img class="w-12 h-12 object-cover rounded-xl bg-surface-container-low shrink-0 border border-outline-variant/10" 
                     referrerpolicy="no-referrer" 
                     src="${place.thumbnail}" 
                     alt="${place.name}"/>
                <div class="min-w-0 flex-grow space-y-0.5">
                    <h4 class="font-bold text-xs text-on-surface truncate">${place.name}</h4>
                    <p class="text-[9px] text-outline truncate">${place.type} • ★ ${place.rating} (${place.reviews})</p>
                    <p class="text-[9px] text-on-surface-variant truncate">${place.address || 'Address not listed'}</p>
                </div>
            `;
            listContainer.appendChild(card);

            // Place custom Leaflet pin icon for spot
            if (state.mapInstance && place.lat && place.lng) {
                let iconChar = "local_cafe"; // Default Coffee Icon
                if (query.toLowerCase().includes("restaurant")) iconChar = "restaurant";
                if (query.toLowerCase().includes("attraction")) iconChar = "attractions";
                if (query.toLowerCase().includes("lodg") || query.toLowerCase().includes("hotel")) iconChar = "hotel";

                const pinIcon = L.divIcon({
                    html: `<div class="w-7 h-7 rounded-full bg-secondary border-2 border-white shadow-md flex items-center justify-center text-white"><span class="material-symbols-outlined text-xs font-bold">${iconChar}</span></div>`,
                    className: '',
                    iconSize: [28, 28],
                    iconAnchor: [14, 28]
                });

                const marker = L.marker([place.lat, place.lng], { icon: pinIcon })
                    .addTo(state.mapInstance)
                    .bindPopup(`<b class="text-xs font-bold text-on-surface">${place.name}</b><p class="text-[9px] text-outline mt-0.5">${place.address || ''}</p>`);
                state.nearbyMarkers.push(marker);
            }
        });

    } catch (err) {
        console.warn("Failed to load nearby places:", err.message);
        listContainer.innerHTML = `<div class="col-span-full py-4 text-center text-outline text-xs text-red-500">Could not fetch local spots.</div>`;
    }
}

function initNearbyPlacesEvents() {
    // 1. Setup Chip selections
    const chips = document.querySelectorAll(".nearby-chip");
    const activeChipClasses = "nearby-chip active px-3.5 py-1.5 bg-primary text-white border-0 rounded-full text-xs font-semibold shrink-0 flex items-center gap-1 transition-all";
    const inactiveChipClasses = "nearby-chip px-3.5 py-1.5 bg-surface-container hover:bg-surface-variant/40 text-on-surface border border-outline-variant/30 rounded-full text-xs font-semibold shrink-0 flex items-center gap-1 transition-all";

    chips.forEach(chip => {
        chip.addEventListener("click", () => {
            chips.forEach(c => c.className = inactiveChipClasses);
            chip.className = activeChipClasses;

            // Fetch coords to search near: either my-location or destination center
            const targetLat = state.nearbyModeMyLocation && state.userLocation ? state.userLocation.lat : (state.mapCenter?.lat);
            const targetLng = state.nearbyModeMyLocation && state.userLocation ? state.userLocation.lng : (state.mapCenter?.lng);

            if (targetLat && targetLng) {
                fetchNearbyPlaces(chip.getAttribute("data-q"), targetLat, targetLng);
            }
        });
    });

    // 2. Setup "Use My Location" toggle
    const myLocationBtn = document.getElementById("btn-use-mylocation");
    if (myLocationBtn) {
        myLocationBtn.addEventListener("click", () => {
            const handleLocFound = () => {
                state.nearbyModeMyLocation = true;
                myLocationBtn.className = "text-[10px] font-bold text-white bg-primary px-3 py-1.5 rounded-full flex items-center gap-1 transition-all shadow-sm";

                if (state.mapInstance && state.userLocation) {
                    state.mapInstance.setView([state.userLocation.lat, state.userLocation.lng], 14);

                    // Add a dynamic user locator blue pin
                    const userIcon = L.divIcon({
                        html: `<div class="w-6 h-6 rounded-full bg-blue-500 border-2 border-white shadow-md flex items-center justify-center text-white ring-4 ring-blue-300/30 animate-pulse"><span class="w-2.5 h-2.5 rounded-full bg-white"></span></div>`,
                        className: '',
                        iconSize: [24, 24],
                        iconAnchor: [12, 12]
                    });
                    
                    if (state.userMarker) state.mapInstance.removeLayer(state.userMarker);
                    state.userMarker = L.marker([state.userLocation.lat, state.userLocation.lng], { icon: userIcon })
                        .addTo(state.mapInstance)
                        .bindPopup("Your Real-time Location")
                        .openPopup();
                }

                // Query for active chip category around user coordinates
                const activeChip = document.querySelector(".nearby-chip.active") || chips[0];
                fetchNearbyPlaces(activeChip.getAttribute("data-q"), state.userLocation.lat, state.userLocation.lng);
            };

            if (state.userLocation) {
                handleLocFound();
            } else {
                if (navigator.geolocation) {
                    myLocationBtn.innerHTML = `<span class="animate-spin material-symbols-outlined text-xs">progress_activity</span> Finding...`;
                    navigator.geolocation.getCurrentPosition(
                        (pos) => {
                            state.userLocation = {
                                lat: pos.coords.latitude,
                                lng: pos.coords.longitude
                            };
                            myLocationBtn.innerHTML = `<span class="material-symbols-outlined text-xs">my_location</span> Use My Location`;
                            handleLocFound();
                        },
                        (err) => {
                            console.warn("Geolocation lookup failed:", err.message);
                            myLocationBtn.innerHTML = `<span class="material-symbols-outlined text-xs">my_location</span> Use My Location`;
                            alert("Could not access your location. Please check browser permissions.");
                        }
                    );
                } else {
                    alert("Your browser does not support Geolocation.");
                }
            }
        });
    }
}

// -------------------------------------------------------------
// Theme Manager & Geolocation / Overlay Helpers
// -------------------------------------------------------------
function initTheme() {
    const isDark = localStorage.getItem("zen_dark_mode") === "true";
    if (isDark) {
        document.documentElement.classList.add("dark");
    } else {
        document.documentElement.classList.remove("dark");
    }
}
window.initTheme = initTheme;

function openOverlayModal(modalId, cardId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.remove("hidden");
    setTimeout(() => {
        modal.classList.remove("opacity-0", "pointer-events-none");
        if (cardId) {
            const card = document.getElementById(cardId);
            if (card) {
                card.classList.remove("translate-y-10");
                card.classList.add("translate-y-0");
            }
        }
    }, 10);
}
window.openOverlayModal = openOverlayModal;

function closeOverlayModal(modalId, cardId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.add("opacity-0", "pointer-events-none");
    if (cardId) {
        const card = document.getElementById(cardId);
        if (card) {
            card.classList.remove("translate-y-0");
            card.classList.add("translate-y-10");
        }
    }
    setTimeout(() => {
        modal.classList.add("hidden");
    }, 300);
}
window.closeOverlayModal = closeOverlayModal;

// -------------------------------------------------------------
// Conversational AI Assistant Logic
// -------------------------------------------------------------
const aiConciergeState = {
    destination: "",
    duration: 3,
    budget: 20000,
    travelers: 1,
    startDate: "",
    priority: "scenery",
    currentQuestion: "destination"
};

function initAiAssistantEvents() {
    const searchForm = document.getElementById("home-search-form");
    const searchInput = document.getElementById("home-search-input");
    const aiModal = document.getElementById("ai-assistant-modal");
    const aiClose = document.getElementById("btn-ai-close");
    const chatMessages = document.getElementById("ai-chat-messages");
    const chatInput = document.getElementById("ai-chat-input");
    const chatSend = document.getElementById("btn-ai-chat-send");
    const chatPickers = document.getElementById("ai-chat-pickers");

    if (!searchForm) return;

    // Handle home screen search form submission
    searchForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const query = searchInput.value.trim();
        openAiAssistantChat(query);
        searchInput.value = "";
    });

    aiClose.addEventListener("click", () => {
        closeOverlayModal("ai-assistant-modal", "ai-assistant-card");
    });

    aiModal.addEventListener("click", (e) => {
        if (e.target === aiModal) {
            closeOverlayModal("ai-assistant-modal", "ai-assistant-card");
        }
    });

    chatSend.addEventListener("click", () => {
        handleUserChatMessage();
    });

    chatInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            handleUserChatMessage();
        }
    });
}

function openAiAssistantChat(initialQuery) {
    // Reset state machine
    aiConciergeState.destination = "";
    aiConciergeState.duration = 0;
    aiConciergeState.budget = 0;
    aiConciergeState.travelers = 0;
    aiConciergeState.startDate = "";
    aiConciergeState.priority = "";
    aiConciergeState.currentQuestion = "destination";

    // Clear chat log
    const chatMessages = document.getElementById("ai-chat-messages");
    chatMessages.innerHTML = `
        <div class="flex items-start gap-2.5 max-w-[85%] mb-4 text-left">
            <div class="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs shrink-0 font-bold">AI</div>
            <div class="bg-surface border border-outline-variant/30 rounded-2xl rounded-tl-none p-3.5 text-xs text-on-surface shadow-sm leading-relaxed">
                Hello! I am your AI travel assistant. Where would you like to travel next? (e.g. 5 days in Hunza Valley with 30k budget)
            </div>
        </div>
    `;

    openOverlayModal("ai-assistant-modal", "ai-assistant-card");

    if (initialQuery) {
        appendUserMessage(initialQuery);
        processUserMessage(initialQuery);
    } else {
        askNextQuestion();
    }
}

function appendUserMessage(text) {
    const chatMessages = document.getElementById("ai-chat-messages");
    const msg = document.createElement("div");
    msg.className = "flex items-start gap-2.5 max-w-[85%] self-end justify-end mb-4 text-right ml-auto";
    msg.innerHTML = `
        <div class="bg-primary text-white rounded-2xl rounded-tr-none p-3.5 text-xs shadow-sm leading-relaxed">
            ${text}
        </div>
        <div class="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs shrink-0 font-bold">ME</div>
    `;
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function appendAiMessage(text) {
    const chatMessages = document.getElementById("ai-chat-messages");
    const msg = document.createElement("div");
    msg.className = "flex items-start gap-2.5 max-w-[85%] mb-4 text-left";
    msg.innerHTML = `
        <div class="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs shrink-0 font-bold">AI</div>
        <div class="bg-surface border border-outline-variant/30 rounded-2xl rounded-tl-none p-3.5 text-xs text-on-surface shadow-sm leading-relaxed">
            ${text}
        </div>
    `;
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function handleUserChatMessage() {
    const chatInput = document.getElementById("ai-chat-input");
    const query = chatInput.value.trim();
    if (!query) return;

    appendUserMessage(query);
    chatInput.value = "";
    processUserMessage(query);
}

function processUserMessage(text) {
    const lower = text.toLowerCase();

    // 1. If currently asking for destination
    if (aiConciergeState.currentQuestion === "destination") {
        const spots = ["murree", "hunza", "skardu", "swat", "naran", "fairy meadows"];
        let matched = "";
        for (const spot of spots) {
            if (lower.includes(spot)) {
                matched = spot.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") + ", Pakistan";
                break;
            }
        }
        if (matched) {
            aiConciergeState.destination = matched;
        } else {
            // Take the input directly if it looks like a place
            aiConciergeState.destination = text;
        }
    }
    // 2. If asking for duration
    else if (aiConciergeState.currentQuestion === "duration") {
        const days = parseInt(text.replace(/[^\d]/g, ""));
        if (days && days > 0 && days <= 30) {
            aiConciergeState.duration = days;
        }
    }
    // 3. If asking for budget
    else if (aiConciergeState.currentQuestion === "budget") {
        let budget = 0;
        if (lower.includes("k")) {
            const num = parseFloat(lower.replace(/[^\d.]/g, ""));
            if (num) budget = num * 1000;
        } else {
            budget = parseInt(lower.replace(/[^\d]/g, ""));
        }
        if (budget && budget >= 5000) {
            aiConciergeState.budget = budget;
        }
    }
    // 4. If asking for travelers
    else if (aiConciergeState.currentQuestion === "travelers") {
        const count = parseInt(text.replace(/[^\d]/g, ""));
        if (count && count > 0) {
            aiConciergeState.travelers = count;
        } else if (lower.includes("solo") || lower.includes("alone") || lower.includes("myself")) {
            aiConciergeState.travelers = 1;
        } else if (lower.includes("couple") || lower.includes("partner") || lower.includes("two")) {
            aiConciergeState.travelers = 2;
        }
    }
    // 5. If asking for startDate
    else if (aiConciergeState.currentQuestion === "startDate") {
        // Attempt parsing standard date formats (YYYY-MM-DD)
        const dateMatch = text.match(/\b\d{4}-\d{2}-\d{2}\b/);
        if (dateMatch) {
            aiConciergeState.startDate = dateMatch[0];
        } else {
            // Default to today
            const todayStr = new Date().toISOString().split("T")[0];
            aiConciergeState.startDate = todayStr;
        }
    }
    // 6. If asking for priority
    else if (aiConciergeState.currentQuestion === "priority") {
        if (lower.includes("safe") || lower.includes("road")) {
            aiConciergeState.priority = "safety";
        } else if (lower.includes("view") || lower.includes("scen") || lower.includes("photo")) {
            aiConciergeState.priority = "scenery";
        } else if (lower.includes("food") || lower.includes("rest") || lower.includes("eat")) {
            aiConciergeState.priority = "food";
        } else if (lower.includes("adven") || lower.includes("trek") || lower.includes("hike")) {
            aiConciergeState.priority = "adventure";
        }
    }

    // Try to parse *any* other attributes contained in user's prompt (to be helpful)
    parsePromptParameters(text);

    // Proceed to next question
    askNextQuestion();
}

function parsePromptParameters(text) {
    const lower = text.toLowerCase();
    
    // Parse duration
    const durationMatch = lower.match(/(\d+)\s*(day|night|nday)/);
    if (durationMatch) {
        aiConciergeState.duration = parseInt(durationMatch[1]);
    }
    
    // Parse budget
    const kMatch = lower.match(/(\d+)\s*k/);
    if (kMatch) {
        aiConciergeState.budget = parseInt(kMatch[1]) * 1000;
    } else {
        const numMatch = lower.match(/\b(\d{5,6})\b/);
        if (numMatch) {
            aiConciergeState.budget = parseInt(numMatch[1]);
        }
    }
    
    // Parse travelers
    const travelerMatch = lower.match(/(\d+)\s*(person|people|adult|member|traveler|guest)/);
    if (travelerMatch) {
        aiConciergeState.travelers = parseInt(travelerMatch[1]);
    } else if (lower.includes("solo") || lower.includes("myself") || lower.includes("alone")) {
        aiConciergeState.travelers = 1;
    }
}

function askNextQuestion() {
    const chatPickers = document.getElementById("ai-chat-pickers");
    chatPickers.innerHTML = ""; // Clear existing chips

    // 1. Verify Destination
    if (!aiConciergeState.destination) {
        aiConciergeState.currentQuestion = "destination";
        appendAiMessage("Sure! Where would you like to travel in Pakistan?");
        
        // Show beautiful showcase chips
        const spots = ["Hunza Valley", "Skardu Desert", "Swat Valley", "Naran Valley", "Fairy Meadows", "Murree Hills"];
        spots.forEach(spot => {
            const chip = document.createElement("button");
            chip.className = "px-3.5 py-1.5 bg-surface-container border border-outline-variant/30 text-on-surface text-xs font-semibold rounded-full hover:bg-primary/10 hover:text-primary transition-all active:scale-95";
            chip.textContent = spot;
            chip.addEventListener("click", () => {
                appendUserMessage(spot);
                aiConciergeState.destination = spot + ", Pakistan";
                askNextQuestion();
            });
            chatPickers.appendChild(chip);
        });
        return;
    }

    // 2. Verify Duration
    if (!aiConciergeState.duration) {
        aiConciergeState.currentQuestion = "duration";
        appendAiMessage(`${aiConciergeState.destination.split(",")[0]} sounds wonderful! How many days will you be staying?`);
        
        const days = [3, 5, 7];
        days.forEach(d => {
            const chip = document.createElement("button");
            chip.className = "px-4 py-1.5 bg-surface-container border border-outline-variant/30 text-on-surface text-xs font-semibold rounded-full hover:bg-primary/10 hover:text-primary transition-all active:scale-95";
            chip.textContent = `${d} Days`;
            chip.addEventListener("click", () => {
                appendUserMessage(`${d} Days`);
                aiConciergeState.duration = d;
                askNextQuestion();
            });
            chatPickers.appendChild(chip);
        });
        return;
    }

    // 3. Verify Budget
    if (!aiConciergeState.budget) {
        aiConciergeState.currentQuestion = "budget";
        appendAiMessage(`Understood. What is your total budget limit for this ${aiConciergeState.duration}-day trip (in PKR)?`);
        
        const options = ["20k PKR", "40k PKR", "60k PKR", "100k PKR"];
        const vals = [20000, 40000, 60000, 100000];
        options.forEach((opt, idx) => {
            const chip = document.createElement("button");
            chip.className = "px-3.5 py-1.5 bg-surface-container border border-outline-variant/30 text-on-surface text-xs font-semibold rounded-full hover:bg-primary/10 hover:text-primary transition-all active:scale-95";
            chip.textContent = opt;
            chip.addEventListener("click", () => {
                appendUserMessage(opt);
                aiConciergeState.budget = vals[idx];
                askNextQuestion();
            });
            chatPickers.appendChild(chip);
        });
        return;
    }

    // 4. Verify Travelers
    if (!aiConciergeState.travelers) {
        aiConciergeState.currentQuestion = "travelers";
        appendAiMessage("Great! How many people will be traveling?");
        
        const counts = [1, 2, 4];
        counts.forEach(c => {
            const chip = document.createElement("button");
            chip.className = "px-4 py-1.5 bg-surface-container border border-outline-variant/30 text-on-surface text-xs font-semibold rounded-full hover:bg-primary/10 hover:text-primary transition-all active:scale-95";
            chip.textContent = c === 1 ? "1 (Solo)" : `${c} People`;
            chip.addEventListener("click", () => {
                appendUserMessage(c === 1 ? "1 Traveler" : `${c} Travelers`);
                aiConciergeState.travelers = c;
                askNextQuestion();
            });
            chatPickers.appendChild(chip);
        });
        return;
    }

    // 5. Verify Start Date
    if (!aiConciergeState.startDate) {
        aiConciergeState.currentQuestion = "startDate";
        appendAiMessage("And when are you planning to start your journey?");
        
        // Render date picker input directly in pickers
        const dateInput = document.createElement("input");
        dateInput.type = "date";
        dateInput.className = "bg-surface border border-outline-variant/50 rounded-xl px-3 py-1.5 text-xs text-on-surface focus:outline-none focus:border-primary";
        
        // Preset value to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        dateInput.value = tomorrow.toISOString().split("T")[0];
        
        const submitBtn = document.createElement("button");
        submitBtn.className = "px-4 py-1.5 bg-primary text-white text-xs font-semibold rounded-full hover:bg-primary-container transition-all active:scale-95 shadow-sm";
        submitBtn.textContent = "Confirm Date";
        submitBtn.addEventListener("click", () => {
            appendUserMessage(dateInput.value);
            aiConciergeState.startDate = dateInput.value;
            askNextQuestion();
        });
        
        chatPickers.appendChild(dateInput);
        chatPickers.appendChild(submitBtn);
        return;
    }

    // 6. Verify Priority
    if (!aiConciergeState.priority) {
        aiConciergeState.currentQuestion = "priority";
        appendAiMessage("Almost done! What is your main travel priority?");
        
        const priorities = [
            { text: "Scenic Views", val: "scenery" },
            { text: "Safe Passage", val: "safety" },
            { text: "Foodie Spot", val: "food" },
            { text: "Adventure", val: "adventure" }
        ];
        
        priorities.forEach(p => {
            const chip = document.createElement("button");
            chip.className = "px-3.5 py-1.5 bg-surface-container border border-outline-variant/30 text-on-surface text-xs font-semibold rounded-full hover:bg-primary/10 hover:text-primary transition-all active:scale-95";
            chip.textContent = p.text;
            chip.addEventListener("click", () => {
                appendUserMessage(p.text);
                aiConciergeState.priority = p.val;
                askNextQuestion();
            });
            chatPickers.appendChild(chip);
        });
        return;
    }

    // GATHERED EVERYTHING — Submit Form automatically!
    appendAiMessage("Perfect! I've collected all the details. Formulating your safe route, weather forecast, hotel selections, and custom AI itinerary now...");
    
    setTimeout(() => {
        closeOverlayModal("ai-assistant-modal", "ai-assistant-card");
        
        // Fill form fields
        document.getElementById("input-destination").value = aiConciergeState.destination;
        
        // Set dates
        document.getElementById("input-start-date").value = aiConciergeState.startDate;
        const endDate = new Date(aiConciergeState.startDate);
        endDate.setDate(endDate.getDate() + aiConciergeState.duration);
        document.getElementById("input-end-date").value = endDate.toISOString().split("T")[0];
        
        // Set budget
        const slider = document.getElementById("input-budget");
        slider.value = aiConciergeState.budget;
        
        const customBudget = document.getElementById("input-budget-custom");
        if (customBudget) customBudget.value = aiConciergeState.budget;
        
        const budgetEvent = new Event("input");
        slider.dispatchEvent(budgetEvent);
        
        // Set travelers
        document.getElementById("input-travelers").value = aiConciergeState.travelers;
        document.getElementById("travelers-count-text").textContent = aiConciergeState.travelers === 1 ? "1 Traveler" : `${aiConciergeState.travelers} Travelers`;
        
        // Set priority
        document.getElementById("input-priority").value = aiConciergeState.priority;
        
        // Select active priority chip programmatically
        document.querySelectorAll(".priority-chip").forEach(chip => {
            if (chip.getAttribute("data-val") === aiConciergeState.priority) {
                chip.classList.add("active", "bg-primary", "text-white");
                chip.classList.remove("bg-white", "text-on-surface-variant");
            } else {
                chip.classList.remove("active", "bg-primary", "text-white");
                chip.classList.add("bg-white", "text-on-surface-variant");
            }
        });
        
        // If starting point is empty, preset to current location or default
        const startLoc = document.getElementById("input-start-location");
        if (!startLoc.value.trim()) {
            if (state.userLocation) {
                startLoc.value = `GPS Coordinates (${state.userLocation.lat.toFixed(4)}, ${state.userLocation.lng.toFixed(4)})`;
            } else {
                startLoc.value = "Islamabad, Pakistan";
            }
        }
        
        // Submit Form programmatically!
        const event = new Event("submit");
        document.getElementById("form-trip-planner").dispatchEvent(event);
    }, 1500);
}

