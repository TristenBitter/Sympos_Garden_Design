# 🌿 Sympos Garden Design

> Plan, design, and grow your permaculture garden with AI-powered plant recommendations.

---

## Features

- **🔐 Auth** — Register/login, demo mode
- **🗺️ Garden Wizard** — Name your garden, enter your location, and Claude AI detects your USDA hardiness zone automatically
- **🌿 Plant Database** — 30+ plants across trees, bushes, herbs, root crops, ground covers — filterable by climate type (tundra / temperate / subtropical / tropical) and category
- **🔍 Search** — Full-text search across the plant database
- **ℹ️ Plant Info Modals** — Sun hours, water needs, zones, soil, yield, harvest time, maintenance, and fun facts for every plant
- **🤝 Companion Suggestions** — Database-driven companion plant relationships
- **🤖 AI Recommendations** — Claude analyzes your zone + selections and suggests complementary plants
- **🗺️ Pixel Garden Builder** — Drag-and-paint grid layout (Plants vs. Zombies style aerial view)
- **🔴🟡🟢 Health Badges** — Each placed plant shows a color-coded happiness badge based on sun exposure simulation
- **💾 Layout Saving** — Garden layouts are persisted to MySQL

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript |
| Backend | Node.js + Express |
| Database | MySQL |
| AI | Anthropic Claude API |
| Styling | CSS Variables + Google Fonts |

---

## Quick Start

```bash
# Run setup script
chmod +x setup.sh && ./setup.sh
```

Or manually:

### 1. Database Setup
```bash
mysql -u root -p < backend/schema.sql
```

### 2. Backend Configuration
```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=sympos_db
ANTHROPIC_API_KEY=your_key_here
PORT=3001
```

Get your Anthropic API key at: https://console.anthropic.com

### 3. Start Backend
```bash
cd backend
npm install
npm start
# Runs on http://localhost:3001
```

### 4. Start Frontend
```bash
cd frontend
npm install
# Create .env file:
echo "REACT_APP_API_URL=http://localhost:3001/api" > .env
npm start
# Opens http://localhost:3000
```

---

## Database Schema

```
Users          — auth accounts
Plants         — 30+ plants with full growing data
CompanionPlants — beneficial/antagonistic relationships
HardscapeItems — paths, beds, compost bins, etc.
Gardens        — user garden spaces
GardenPlants   — plants selected per garden
GardenLayoutItems — grid cell placements
UserSearchHistory — search tracking
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/register` | Register |
| GET | `/api/plants` | Get plants (filter: climate_type, category, search) |
| GET | `/api/plants/:id` | Plant detail + companions |
| GET | `/api/plants/companions/:ids` | Companion suggestions |
| POST | `/api/zone/detect` | AI zone detection |
| GET | `/api/gardens/user/:userId` | User's gardens |
| POST | `/api/gardens` | Create garden |
| GET | `/api/gardens/:id` | Garden + plants + layout |
| POST | `/api/gardens/:id/plants` | Save plant selections |
| PUT | `/api/gardens/:id/layout` | Save grid layout |
| GET | `/api/hardscape` | Hardscape items |
| POST | `/api/ai/recommendations` | AI plant recommendations |

---

## Adding More Plants

Add rows to the `Plants` table in `schema.sql` or directly in MySQL:

```sql
INSERT INTO Plants (name, category, is_nitrogen_fixing, min_zone, max_zone, climate_type,
  sun_hours, water_needs, soil_preferences, yield_info, planting_time, harvest_time,
  maintenance_level, fun_facts, emoji, color)
VALUES ('Your Plant', 'herb', FALSE, '5a', '9b', 'temperate',
  4, 'moderate', 'Well-drained', 'Great yield', 'Spring', 'Summer',
  'low', 'Fun fact here!', '🌿', '#27ae60');
```

---

## Project Structure

```
sympos/
├── backend/
│   ├── server.js          # Express API
│   ├── schema.sql         # DB schema + 30 seed plants
│   ├── .env.example       # Config template
│   └── package.json
├── frontend/
│   └── src/
│       ├── App.tsx        # Router + Auth context
│       ├── api.ts         # API client
│       ├── index.css      # Design system
│       └── pages/
│           ├── AuthPage.tsx
│           ├── Dashboard.tsx
│           ├── NewGardenWizard.tsx
│           ├── PlantSelection.tsx
│           └── GardenBuilder.tsx
├── setup.sh               # Quick setup script
└── README.md
```

---

## Extending the App

**Add plant images:** Add an `image_url` column to Plants and display in modals.

**Real geocoding:** Replace the fallback lat/lon in NewGardenWizard with a geocoding API call (OpenStreetMap Nominatim is free).

**Water zones:** Add a water simulation to the builder similar to the sun simulation.

**Mobile:** The grid builder needs touch event handlers — add `onTouchStart`/`onTouchMove` equivalents.

**More AI:** Use Claude to generate personalized garden plans, seasonal planting calendars, or companion planting explanations.
