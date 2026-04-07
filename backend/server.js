const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "sympos_db",
  waitForConnections: true,
  connectionLimit: 10,
});

// ================== AUTH ==================

app.post("/api/auth/register", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const [existing] = await pool.query(
      "SELECT id FROM Users WHERE email = ?",
      [email],
    );
    if (existing.length > 0)
      return res.status(400).json({ error: "Email already registered" });

    const hash = Buffer.from(password).toString("base64");
    const [result] = await pool.query(
      "INSERT INTO Users (name, email, password_hash) VALUES (?, ?, ?)",
      [name, email, hash],
    );
    res.json({ id: result.insertId, name, email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const hash = Buffer.from(password).toString("base64");
    const [rows] = await pool.query(
      "SELECT id, name, email FROM Users WHERE email = ? AND password_hash = ?",
      [email, hash],
    );
    if (rows.length === 0)
      return res.status(401).json({ error: "Invalid credentials" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Demo login — creates the demo user if it doesn't exist, then returns it
app.post("/api/auth/demo", async (req, res) => {
  try {
    const demoEmail = "demo@sympos.com";
    const demoHash = Buffer.from("demo").toString("base64");

    const [existing] = await pool.query(
      "SELECT id, name, email FROM Users WHERE email = ?",
      [demoEmail],
    );
    if (existing.length > 0) {
      return res.json(existing[0]);
    }

    const [result] = await pool.query(
      "INSERT INTO Users (name, email, password_hash) VALUES (?, ?, ?)",
      ["Demo User", demoEmail, demoHash],
    );
    res.json({ id: result.insertId, name: "Demo User", email: demoEmail });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================== PLANTS ==================

app.get("/api/plants", async (req, res) => {
  const { zone, climate_type, category, search } = req.query;
  try {
    let query = "SELECT * FROM Plants WHERE 1=1";
    const params = [];

    if (climate_type) {
      query += " AND climate_type = ?";
      params.push(climate_type);
    }
    if (category) {
      query += " AND category = ?";
      params.push(category);
    }
    if (search) {
      query += " AND (name LIKE ? OR fun_facts LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }
    query += " ORDER BY name";

    const [rows] = await pool.query(query, params);

    // Attach companions to each plant
    const plantIds = rows.map((r) => r.id);
    let companionRows = [];
    if (plantIds.length > 0) {
      const [cr] = await pool.query(
        `SELECT cp.plant_id, cp.companion_plant_id, cp.relationship_type
         FROM CompanionPlants cp WHERE cp.plant_id IN (?)`,
        [plantIds],
      );
      companionRows = cr;
    }

    const companionsByPlant = {};
    for (const cr of companionRows) {
      if (!companionsByPlant[cr.plant_id]) companionsByPlant[cr.plant_id] = [];
      companionsByPlant[cr.plant_id].push({
        id: cr.companion_plant_id,
        companion_plant_id: cr.companion_plant_id,
        relationship_type: cr.relationship_type,
      });
    }

    const enriched = rows.map((r) => ({
      ...r,
      companions: companionsByPlant[r.id] || [],
    }));
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/plants/:id", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM Plants WHERE id = ?", [
      req.params.id,
    ]);
    if (rows.length === 0)
      return res.status(404).json({ error: "Plant not found" });

    // Get companions
    const [companions] = await pool.query(
      `
      SELECT p.*, cp.relationship_type 
      FROM CompanionPlants cp
      JOIN Plants p ON cp.companion_plant_id = p.id
      WHERE cp.plant_id = ?
    `,
      [req.params.id],
    );

    res.json({ ...rows[0], companions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/plants/companions/:ids", async (req, res) => {
  const plantIds = req.params.ids.split(",").map(Number);
  try {
    const [rows] = await pool.query(
      `
      SELECT DISTINCT p.*, cp.relationship_type 
      FROM CompanionPlants cp
      JOIN Plants p ON cp.companion_plant_id = p.id
      WHERE cp.plant_id IN (?) AND cp.relationship_type = 'beneficial'
      AND cp.companion_plant_id NOT IN (?)
    `,
      [plantIds, plantIds],
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================== ZONE DETECTION (AI) ==================

app.post("/api/zone/detect", async (req, res) => {
  const { latitude, longitude, location } = req.body;

  // Always try the AI first
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 200,
          messages: [
            {
              role: "user",
              content: `What is the USDA hardiness zone and climate type for: "${location}"?
Respond ONLY with valid JSON, no other text:
{"zone": "9b", "climate_type": "subtropical", "description": "one sentence about the climate"}
Climate type must be exactly one of: tundra, temperate, subtropical, tropical
Zone must be a real USDA zone like 3a, 5b, 9a, 10b, 12a etc.
Examples: Phoenix AZ = 9b subtropical, Rio de Janeiro = 12a tropical, Fairbanks AK = 2a tundra, London UK = 8b temperate`,
            },
          ],
        }),
      });

      const data = await response.json();
      if (data.content && data.content[0] && data.content[0].text) {
        const text = data.content[0].text.trim();
        // Strip any markdown fences if present
        const clean = text.replace(/```json|```/g, "").trim();
        const result = JSON.parse(clean);
        console.log("AI zone detection for", location, ":", result);
        return res.json(result);
      }
    } catch (err) {
      console.error(
        "AI zone detection failed:",
        err.message,
        "— falling back to latitude",
      );
    }
  } else {
    console.warn("No ANTHROPIC_API_KEY set — using latitude-based fallback");
  }

  // Fallback: latitude-based (only used if AI fails or no key)
  const lat = Math.abs(parseFloat(latitude) || 40);
  let zone, climate_type, description;
  if (lat > 66) {
    zone = "1a";
    climate_type = "tundra";
    description = "Arctic tundra climate";
  } else if (lat > 60) {
    zone = "2a";
    climate_type = "tundra";
    description = "Subarctic climate with very cold winters";
  } else if (lat > 55) {
    zone = "3b";
    climate_type = "tundra";
    description = "Cold northern climate";
  } else if (lat > 50) {
    zone = "5a";
    climate_type = "temperate";
    description = "Cool temperate climate with cold winters";
  } else if (lat > 45) {
    zone = "5b";
    climate_type = "temperate";
    description = "Temperate climate";
  } else if (lat > 40) {
    zone = "6b";
    climate_type = "temperate";
    description = "Moderate temperate climate";
  } else if (lat > 35) {
    zone = "7b";
    climate_type = "temperate";
    description = "Warm temperate climate";
  } else if (lat > 30) {
    zone = "9a";
    climate_type = "subtropical";
    description = "Warm subtropical climate";
  } else if (lat > 23) {
    zone = "10a";
    climate_type = "subtropical";
    description = "Hot subtropical climate";
  } else if (lat > 15) {
    zone = "11a";
    climate_type = "tropical";
    description = "Tropical climate";
  } else {
    zone = "12a";
    climate_type = "tropical";
    description = "Equatorial tropical climate";
  }

  console.log(
    "Latitude fallback zone for",
    location,
    "lat",
    lat,
    ":",
    zone,
    climate_type,
  );
  res.json({ zone, climate_type, description });
});

// ================== GARDENS ==================

app.get("/api/gardens/user/:userId", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM Gardens WHERE user_id = ? ORDER BY created_at DESC",
      [req.params.userId],
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/gardens", async (req, res) => {
  const {
    user_id,
    name,
    location,
    latitude,
    longitude,
    zone,
    climate_type,
    width,
    height,
  } = req.body;
  console.log("Creating garden for user_id:", user_id, typeof user_id);
  try {
    // Verify the user actually exists before inserting
    const [userCheck] = await pool.query("SELECT id FROM Users WHERE id = ?", [
      user_id,
    ]);
    if (userCheck.length === 0) {
      console.log("User not found in DB for id:", user_id);
      return res
        .status(400)
        .json({
          error: `User with id ${user_id} not found in database. Please log out and log back in.`,
        });
    }
    const [result] = await pool.query(
      "INSERT INTO Gardens (user_id, name, location, latitude, longitude, zone, climate_type, width, height) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        user_id,
        name,
        location,
        latitude,
        longitude,
        zone,
        climate_type,
        width || 10,
        height || 10,
      ],
    );
    const [rows] = await pool.query("SELECT * FROM Gardens WHERE id = ?", [
      result.insertId,
    ]);
    res.json(rows[0]);
  } catch (err) {
    console.error("Garden creation error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/gardens/:id", async (req, res) => {
  try {
    const [garden] = await pool.query("SELECT * FROM Gardens WHERE id = ?", [
      req.params.id,
    ]);
    if (garden.length === 0)
      return res.status(404).json({ error: "Garden not found" });

    // Return ALL plant fields
    const [plants] = await pool.query(
      `
      SELECT p.*
      FROM GardenPlants gp
      JOIN Plants p ON gp.plant_id = p.id
      WHERE gp.garden_id = ?
      ORDER BY p.category, p.name
    `,
      [req.params.id],
    );

    // Attach companions to each plant so the builder can compute happiness
    const plantIds = plants.map((p) => p.id);
    let companionRows = [];
    if (plantIds.length > 0) {
      const [cr] = await pool.query(
        `SELECT cp.plant_id, cp.companion_plant_id, cp.relationship_type
         FROM CompanionPlants cp WHERE cp.plant_id IN (?)`,
        [plantIds],
      );
      companionRows = cr;
    }
    const companionsByPlant = {};
    for (const cr of companionRows) {
      if (!companionsByPlant[cr.plant_id]) companionsByPlant[cr.plant_id] = [];
      companionsByPlant[cr.plant_id].push({
        id: cr.companion_plant_id,
        companion_plant_id: cr.companion_plant_id,
        relationship_type: cr.relationship_type,
      });
    }
    const enrichedPlants = plants.map((p) => ({
      ...p,
      companions: companionsByPlant[p.id] || [],
    }));

    const [layout] = await pool.query(
      "SELECT * FROM GardenLayoutItems WHERE garden_id = ?",
      [req.params.id],
    );

    res.json({ ...garden[0], plants: enrichedPlants, layout });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/gardens/:id/plants", async (req, res) => {
  const { plant_ids } = req.body;
  const gardenId = req.params.id;
  try {
    // Delete existing plants for this garden
    await pool.query("DELETE FROM GardenPlants WHERE garden_id = ?", [
      gardenId,
    ]);

    // Insert new ones
    for (const plantId of plant_ids) {
      await pool.query(
        "INSERT INTO GardenPlants (garden_id, plant_id) VALUES (?, ?)",
        [gardenId, plantId],
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/gardens/:gardenId/layout", async (req, res) => {
  const { layout } = req.body;
  const gardenId = req.params.gardenId;
  try {
    await pool.query("DELETE FROM GardenLayoutItems WHERE garden_id = ?", [
      gardenId,
    ]);

    for (const item of layout) {
      await pool.query(
        "INSERT INTO GardenLayoutItems (garden_id, type, ref_id, pos_x, pos_y, tile) VALUES (?, ?, ?, ?, ?, ?)",
        [
          gardenId,
          item.type,
          item.ref_id || 0,
          item.pos_x,
          item.pos_y,
          item.tile || "soil",
        ],
      );
    }

    // Update plant positions in GardenPlants
    for (const item of layout.filter((i) => i.type === "plant")) {
      await pool.query(
        "UPDATE GardenPlants SET pos_x = ?, pos_y = ? WHERE garden_id = ? AND plant_id = ?",
        [item.pos_x, item.pos_y, gardenId, item.ref_id],
      );
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================== HARDSCAPE ==================

app.get("/api/hardscape", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM HardscapeItems");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================== AI RECOMMENDATIONS ==================

app.post("/api/ai/recommendations", async (req, res) => {
  const { zone, climate_type, garden_size, selected_plants } = req.body;

  try {
    const [allPlants] = await pool.query(
      "SELECT id, name, category, emoji FROM Plants WHERE climate_type = ? LIMIT 20",
      [climate_type],
    );

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 400,
        messages: [
          {
            role: "user",
            content: `A gardener has a ${garden_size} sqft garden in zone ${zone} (${climate_type} climate). 
          They've selected these plants: ${selected_plants.join(", ")}.
          Available plants in our database: ${allPlants.map((p) => p.name).join(", ")}.
          Suggest 3-5 additional plants from the available list that would complement their selection.
          Respond ONLY with JSON: {"recommendations": [{"name": "plant name", "reason": "brief reason why"}]}`,
          },
        ],
      }),
    });

    const data = await response.json();
    const text = data.content[0].text;
    const clean = text.replace(/```json|```/g, "").trim();
    const result = JSON.parse(clean);

    // Match back to database plants
    const enriched = await Promise.all(
      result.recommendations.map(async (rec) => {
        const [plant] = await pool.query(
          "SELECT * FROM Plants WHERE name LIKE ?",
          [`%${rec.name}%`],
        );
        return plant.length > 0 ? { ...plant[0], ai_reason: rec.reason } : null;
      }),
    );

    res.json(enriched.filter(Boolean));
  } catch (err) {
    // Fallback: return database recommendations
    const [rows] = await pool.query(
      "SELECT * FROM Plants WHERE climate_type = ? ORDER BY RAND() LIMIT 5",
      [climate_type || "temperate"],
    );
    res.json(rows);
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Sympos API running on port ${PORT}`));
