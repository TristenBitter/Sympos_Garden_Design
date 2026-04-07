# Sympos_Garden_Design

<img width="1404" height="506" alt="image" src="https://github.com/user-attachments/assets/06c69b15-f364-48f7-9b08-80c5056db7fe" />


<img width="668" height="692" alt="Permaculture_land_design_drawing" src="https://github.com/user-attachments/assets/e874060b-2b9e-4413-ba2b-237e7dbff925" />

Sympos Garden Design is an intelligent garden planning application designed to help users grow plants more successfully by combining data-driven insights, climate awareness, and interactive design tools. The goal of this project is to simplify gardening for beginners while still providing meaningful depth for more experienced users.

The application allows users to create and manage multiple gardens by specifying their location, size, and layout. Using location data, the system determines the user’s gardening zone and climate, then generates personalized plant recommendations tailored to those conditions. Users can explore a rich plant database, view detailed growing requirements, and select plants to include in their garden.

A key feature of Sympos Garden Design is its interactive grid-based layout system, inspired by games like Plants vs Zombies, where users visually design their garden by placing plants and hardscape elements. Each plant is dynamically evaluated based on factors such as sunlight, spacing, and companion planting relationships. The system provides real-time feedback using a color-coded health indicator (green, yellow, red), helping users understand how well their garden design will perform before planting in real life.

The project also integrates AI to enhance decision-making, including climate zone detection and intelligent plant recommendations. By combining user-friendly design with smart analytics, Sympos Garden Design aims to bridge the gap between planning and successful gardening outcomes.


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

The overall goal of this project is to build a full-stack, data-driven application that demonstrates practical use of databases, API design, and AI integration, while delivering a genuinely useful and engaging user experience.

>>>>>>> 2aca7125efa7d04522acfdd6ce9551bbb9dd525d
