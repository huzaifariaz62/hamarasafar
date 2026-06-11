# 🌍 Hamara Safar — AI-Powered Trip Planner

**Hamara Safar** (ہمارا سفر — "Our Journey") is an intelligent trip planning web application that uses **Google Gemini AI**, real-time hotel data, weather forecasting, and interactive maps to create personalized travel itineraries within your budget.

![Made with JavaScript](https://img.shields.io/badge/Made%20with-JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Gemini AI](https://img.shields.io/badge/Gemini%20AI-4285F4?style=for-the-badge&logo=google&logoColor=white)

🔗 **Live Demo:** [https://hamara-safar.web.app](https://hamara-safar.web.app)

---

## ✨ Features

### 🤖 AI-Powered Planning
- **Google Gemini AI** generates personalized day-by-day itineraries
- Context-aware recommendations based on budget, duration, and travel priorities
- Smart hotel suggestions that respect your total budget allocation

### 💰 Intelligent Budget Engine
- **Total budget allocation** across fuel, food, and accommodation
- **Suzuki Alto fuel calculator** — 18 km/L economy, Rs 270/L fuel price, round-trip + local driving
- **Public transport auto-fallback** when driving distance exceeds 600 km
- Budget-filtered hotel results — only shows stays you can actually afford

### 🏨 Real-Time Hotel Search
- **Google Hotels integration** via SerpAPI with budget-aware filtering
- Hotels sorted by **lowest price first** with `max_price` ceiling from your budget
- Real hotel photos, ratings, reviews, and coordinates
- **Category-matched reviews** — hotels scored by your travel priority (scenery, adventure, food, safety)

### 🗺️ Interactive Maps & Navigation
- **Leaflet.js** interactive map with safe vs. risky route visualization
- **Weather-based re-routing** — switches to safer routes during rain forecasts
- **Google Maps directions** — one-click navigation with waypoints
- **Explore Local Spots** — nearby POIs (coffee shops, restaurants, attractions)

### 🔐 Authentication & Data
- **Firebase Google Sign-In** with popup + redirect fallback for mobile
- **Firestore database** — persistent user profiles, preferences, and onboarding data
- Gender-based avatar fallbacks (Google profile photo → Material icons)
- Sign-out with full session cleanup

### 🌐 Global Destination Support
- **OpenStreetMap Nominatim** autocomplete — search any destination worldwide
- Dynamic geocoding and country-code detection
- Localized hotel search (`gl: "pk"` for Pakistan, etc.)

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Vanilla JavaScript, HTML5, CSS3 |
| **Build Tool** | Vite |
| **AI Engine** | Google Gemini API |
| **Authentication** | Firebase Auth (Google Sign-In) |
| **Database** | Cloud Firestore |
| **Hotel Data** | SerpAPI (Google Hotels) |
| **Maps** | Leaflet.js + OpenStreetMap |
| **Geocoding** | OSM Nominatim |
| **Backend** | Node.js + Express |
| **Hosting** | Firebase Hosting |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/huzaifariaz62/hamarasafar.git
cd hamarasafar

# Install dependencies
npm install
```

### Environment Setup

Copy the example environment file and fill in your API keys:

```bash
cp .env.example .env
```

Edit `.env` with your keys:

```env
# Required
GEMINI_API_KEY=your_gemini_api_key
SERPAPI_API_KEY=your_serpapi_key

# Optional
RAPIDAPI_KEY=your_rapidapi_key

# Firebase (required for authentication)
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-app.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
```

### Running Locally

```bash
# Terminal 1: Start the backend server (port 3000)
npm start

# Terminal 2: Start the Vite dev server (port 5173)
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build

```bash
npm run build
```

---

## 📁 Project Structure

```
hamarasafar/
├── index.html          # Main SPA — all screens & UI templates
├── app.js              # Core application logic (routing, APIs, budget engine, maps)
├── styles.css          # Custom styles (glassmorphism, animations, theming)
├── server.js           # Express backend (API proxy, hotel search, image proxy)
├── vite.config.js      # Vite build configuration
├── firebase.json       # Firebase Hosting configuration
├── package.json        # Dependencies & scripts
├── .env.example        # Template for environment variables
├── .gitignore          # Git exclusions (protects .env, node_modules, dist)
├── public/
│   └── robots.txt      # SEO crawler configuration
└── newlogo.svg         # Hamara Safar brand logo
```

---

## 🔑 API Keys Required

| API | Purpose | Get Key |
|-----|---------|---------|
| **Google Gemini** | AI itinerary generation | [Google AI Studio](https://aistudio.google.com/apikey) |
| **SerpAPI** | Google Hotels search, photos, reviews | [SerpAPI](https://serpapi.com) |
| **Firebase** | Authentication & Firestore database | [Firebase Console](https://console.firebase.google.com) |
| **RapidAPI** *(optional)* | Airbnb listings fallback | [RapidAPI](https://rapidapi.com) |

> ⚠️ **Note:** All API keys are loaded from `.env` (server-side) and are **never exposed** in the frontend code. The Firebase config in `app.js` is public by design — Firebase security is enforced through Firebase Rules and authorized domain restrictions.

---

## 📸 Screenshots

The app features a modern glassmorphism UI with:
- Animated splash screen with travel card carousel
- Google Sign-In authentication
- Interactive trip planner with budget slider
- AI-generated day-by-day itinerary
- Real hotel cards with photos and ratings
- Leaflet.js interactive map with route visualization

---

## 👥 Team

- **Muhammad Huzaifa Riaz** — Full-Stack Developer
- **Muhammad Abdullah** — UI/UX Developer

---

## 📄 License

This project is built for educational and demonstration purposes.
