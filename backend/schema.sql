-- Sympos Garden Design Database Schema

CREATE DATABASE IF NOT EXISTS sympos_db;
USE sympos_db;

-- Users table
CREATE TABLE IF NOT EXISTS Users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Plants table
CREATE TABLE IF NOT EXISTS Plants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category ENUM('tree','bush','leafy','root_crop','herb','ground_cover','aquatic') NOT NULL,
  is_nitrogen_fixing BOOLEAN DEFAULT FALSE,
  min_zone VARCHAR(10),
  max_zone VARCHAR(10),
  climate_type ENUM('tundra','temperate','subtropical','tropical') NOT NULL,
  sun_hours INT NOT NULL COMMENT 'minimum sun hours per day',
  water_needs ENUM('low','moderate','high') NOT NULL,
  soil_preferences VARCHAR(255),
  yield_info VARCHAR(255),
  planting_time VARCHAR(100),
  harvest_time VARCHAR(100),
  maintenance_level ENUM('low','moderate','high') NOT NULL,
  fun_facts TEXT,
  emoji VARCHAR(10) DEFAULT '🌿',
  color VARCHAR(20) DEFAULT '#4a7c59'
);

-- Companion plants relationship
CREATE TABLE IF NOT EXISTS CompanionPlants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  plant_id INT NOT NULL,
  companion_plant_id INT NOT NULL,
  relationship_type ENUM('beneficial','antagonistic','neutral') NOT NULL,
  FOREIGN KEY (plant_id) REFERENCES Plants(id),
  FOREIGN KEY (companion_plant_id) REFERENCES Plants(id)
);

-- Hardscape items
CREATE TABLE IF NOT EXISTS HardscapeItems (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  emoji VARCHAR(10) DEFAULT '🪨'
);

-- Gardens table
CREATE TABLE IF NOT EXISTS Gardens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  latitude FLOAT,
  longitude FLOAT,
  zone VARCHAR(20),
  climate_type VARCHAR(50),
  width FLOAT NOT NULL DEFAULT 10,
  height FLOAT NOT NULL DEFAULT 10,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES Users(id)
);

-- Garden layout items
CREATE TABLE IF NOT EXISTS GardenLayoutItems (
  id INT AUTO_INCREMENT PRIMARY KEY,
  garden_id INT NOT NULL,
  type ENUM('plant','hardscape') NOT NULL,
  ref_id INT NOT NULL,
  pos_x INT NOT NULL,
  pos_y INT NOT NULL,
  tile VARCHAR(20) DEFAULT 'soil',
  FOREIGN KEY (garden_id) REFERENCES Gardens(id)
);

-- Garden plants (selected for a garden)
CREATE TABLE IF NOT EXISTS GardenPlants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  garden_id INT NOT NULL,
  plant_id INT NOT NULL,
  pos_x INT,
  pos_y INT,
  health_status ENUM('happy','okay','unhappy') DEFAULT 'okay',
  FOREIGN KEY (garden_id) REFERENCES Gardens(id),
  FOREIGN KEY (plant_id) REFERENCES Plants(id)
);

-- User search history
CREATE TABLE IF NOT EXISTS UserSearchHistory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  search_query VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES Users(id)
);

-- =========================================
-- SEED DATA
-- =========================================

INSERT INTO Users (name, email, password_hash) VALUES
('Demo User', 'demo@sympos.com', '$2b$10$demo_hash_placeholder');

-- PLANTS SEED DATA
INSERT INTO Plants (name, category, is_nitrogen_fixing, min_zone, max_zone, climate_type, sun_hours, water_needs, soil_preferences, yield_info, planting_time, harvest_time, maintenance_level, fun_facts, emoji, color) VALUES

-- Temperate trees
('Apple Tree', 'tree', FALSE, '3a', '8b', 'temperate', 6, 'moderate', 'Well-drained, slightly acidic', 'Medium to large harvest', 'Spring', 'Fall (Aug-Oct)', 'moderate', 'Apple trees can live for over 100 years and produce fruit annually!', '🍎', '#c0392b'),
('Pear Tree', 'tree', FALSE, '4a', '9a', 'temperate', 6, 'moderate', 'Well-drained, fertile', 'Prolific harvest', 'Spring', 'Late Summer', 'moderate', 'Pears ripen from the inside out — pick them before fully ripe!', '🍐', '#a8b820'),
('Walnut Tree', 'tree', FALSE, '4a', '9b', 'temperate', 6, 'low', 'Deep, well-drained', 'High-value nut crop', 'Fall/Spring', 'Fall', 'low', 'Walnut trees release juglone, which inhibits many nearby plants.', '🌰', '#8b6914'),
('Alder Tree', 'tree', TRUE, '3a', '8b', 'temperate', 4, 'high', 'Moist, near water', 'Nitrogen enrichment', 'Spring', 'N/A (support tree)', 'low', 'Alders fix up to 320 lbs of nitrogen per acre per year!', '🌳', '#2d6a2d'),

-- Subtropical trees
('Avocado Tree', 'tree', FALSE, '9a', '12a', 'subtropical', 6, 'moderate', 'Well-drained, slightly acidic', 'Large harvest of rich fruit', 'Spring', 'Year-round', 'moderate', 'It takes 3-5 years for an avocado tree to fruit from seed!', '🥑', '#4a7c3f'),
('Fig Tree', 'tree', FALSE, '7a', '11b', 'subtropical', 7, 'low', 'Well-drained, tolerates poor soil', 'Up to 20 lbs per season', 'Spring', 'Summer-Fall', 'low', 'Figs are actually inverted flowers — the fruit IS the flower!', '🫐', '#7b2d8b'),

-- Tropical trees  
('Banana Plant', 'tree', FALSE, '9b', '13a', 'tropical', 8, 'high', 'Rich, moist, well-drained', 'Large clusters every 9 months', 'Anytime', 'Year-round', 'moderate', 'Bananas are technically berries, and banana plants are the world\'s largest herb!', '🍌', '#f1c40f'),
('Mango Tree', 'tree', FALSE, '10a', '13a', 'tropical', 8, 'moderate', 'Deep, well-drained', 'Abundant fruit harvest', 'Spring', 'Summer', 'low', 'A mango tree can live and produce fruit for over 300 years!', '🥭', '#e67e22'),

-- Bushes
('Blueberry Bush', 'bush', FALSE, '4a', '7b', 'temperate', 6, 'moderate', 'Acidic (pH 4.5-5.5), well-drained', '5-10 lbs per bush', 'Spring', 'Summer', 'moderate', 'Blueberries are one of the few fruits native to North America!', '🫐', '#5b5ea6'),
('Raspberry Bush', 'bush', FALSE, '3a', '9a', 'temperate', 6, 'moderate', 'Well-drained, fertile, slightly acidic', '1-2 quarts per plant', 'Spring', 'Summer-Fall', 'moderate', 'Each raspberry is made of 100+ tiny fruits called drupelets!', '🍓', '#c0392b'),
('Rosemary Bush', 'bush', FALSE, '7a', '11a', 'subtropical', 6, 'low', 'Well-drained, sandy', 'Aromatic herb harvest', 'Spring', 'Year-round', 'low', 'Rosemary was once called "dew of the sea" by ancient Romans!', '🌿', '#7daa6c'),
('Elderberry Bush', 'bush', TRUE, '3a', '9b', 'temperate', 4, 'moderate', 'Moist, fertile', 'High-yield berry clusters', 'Spring', 'Late Summer', 'low', 'Elderberry has been used medicinally for thousands of years and the flowers make excellent cordial!', '🌸', '#6c3483'),

-- Leafy plants
('Kale', 'leafy', FALSE, '2a', '9b', 'temperate', 4, 'moderate', 'Rich, well-drained', 'Cut-and-come-again harvest', 'Spring/Fall', 'Year-round', 'low', 'Kale was the most common green vegetable in Europe until the Middle Ages!', '🥬', '#27ae60'),
('Swiss Chard', 'leafy', FALSE, '3a', '10a', 'temperate', 4, 'moderate', 'Fertile, moist', 'Continual leaf harvest', 'Spring/Fall', 'Year-round', 'low', 'Chard is actually related to beets — you can eat the roots too!', '🌿', '#16a085'),
('Spinach', 'leafy', FALSE, '3a', '9a', 'temperate', 3, 'moderate', 'Rich, moist', 'Quick harvest in 6 weeks', 'Spring/Fall', 'Spring/Fall', 'low', 'Popeye was right — spinach has 3x more iron than other greens when cooked!', '🥬', '#1e8449'),
('Comfrey', 'leafy', FALSE, '3a', '9b', 'temperate', 3, 'low', 'Any soil, deep-rooted', 'Mulch & compost material', 'Spring', 'All season', 'low', 'Comfrey roots can penetrate 6 feet deep, mining minerals unavailable to other plants!', '🌿', '#145a32'),

-- Root crops
('Carrot', 'root_crop', FALSE, '3a', '10a', 'temperate', 6, 'moderate', 'Deep, loose, sandy', '50-75 per sq ft', 'Spring/Fall', '70-80 days after planting', 'low', 'The original carrots were purple and white — orange carrots were bred in the Netherlands!', '🥕', '#e67e22'),
('Garlic', 'root_crop', FALSE, '3a', '9b', 'temperate', 6, 'low', 'Well-drained, rich', 'High-value culinary crop', 'Fall', 'Summer', 'low', 'Garlic deters over 200 species of insects and has natural antibiotic properties!', '🧄', '#f0e68c'),
('Sweet Potato', 'root_crop', FALSE, '8a', '12a', 'subtropical', 6, 'moderate', 'Sandy, well-drained', '10-20 lbs per plant', 'Summer', 'Fall', 'low', 'Sweet potato leaves are edible too — and incredibly nutritious!', '🍠', '#e74c3c'),
('Ginger', 'root_crop', FALSE, '9a', '12a', 'tropical', 3, 'high', 'Rich, moist, well-drained', 'Aromatic culinary rhizome', 'Spring', '8-10 months', 'moderate', 'Ginger is not a root — it\'s a rhizome, and it takes a full year to mature!', '🫚', '#d4a017'),

-- Herbs
('Basil', 'herb', FALSE, '9a', '13a', 'subtropical', 6, 'moderate', 'Rich, moist, well-drained', 'Continual harvest', 'After last frost', 'All summer', 'moderate', 'Basil is sacred in many cultures and was used in ancient Egypt for embalming!', '🌿', '#27ae60'),
('Mint', 'herb', FALSE, '3a', '11a', 'temperate', 3, 'moderate', 'Moist, fertile', 'Abundant aromatic harvest', 'Spring', 'All season', 'low', 'Mint spreads underground aggressively — container planting is recommended!', '🌿', '#1abc9c'),
('Lavender', 'herb', FALSE, '5a', '8b', 'temperate', 6, 'low', 'Well-drained, alkaline, sandy', 'Aromatic flowers & leaves', 'Spring', 'Summer', 'low', 'Lavender has been found in Egyptian tombs and was used by Romans for bathing!', '💜', '#9b59b6'),
('Chamomile', 'herb', FALSE, '3a', '9a', 'temperate', 4, 'low', 'Well-drained, slightly acidic', 'Calming herbal tea flowers', 'Spring', 'Summer', 'low', 'Chamomile is called the "plant doctor" because it improves nearby plants\' health!', '🌼', '#f39c12'),
('Yarrow', 'herb', FALSE, '3a', '9a', 'temperate', 4, 'low', 'Well-drained, poor to average', 'Medicinal & companion herb', 'Spring', 'Summer', 'low', 'Yarrow is an incredible companion plant that attracts predatory insects that eat pests!', '🌸', '#e8daef'),

-- Ground covers
('Clover (White)', 'ground_cover', TRUE, '3a', '9a', 'temperate', 3, 'low', 'Tolerates poor soil', 'Living mulch & nitrogen', 'Spring/Fall', 'N/A (support plant)', 'low', 'White clover can fix 200 lbs of nitrogen per acre per year, feeding nearby plants!', '☘️', '#27ae60'),
('Strawberry', 'ground_cover', FALSE, '3a', '10a', 'temperate', 6, 'moderate', 'Sandy, well-drained, slightly acidic', '1-2 quarts per plant', 'Spring', 'Summer', 'moderate', 'Strawberries are technically not berries — the red part is the receptacle!', '🍓', '#c0392b'),
('Thyme (Creeping)', 'ground_cover', FALSE, '4a', '9a', 'temperate', 6, 'low', 'Well-drained, rocky, poor', 'Aromatic ground cover herb', 'Spring', 'All season', 'low', 'Creeping thyme can handle foot traffic and releases a wonderful aroma when walked on!', '🌿', '#7daa6c'),
('Nasturtium', 'ground_cover', FALSE, '9a', '13a', 'subtropical', 4, 'low', 'Poor to average, well-drained', 'Edible flowers & pest trap', 'Spring', 'All summer', 'low', 'Nasturtiums are edible — flowers taste peppery and leaves add zest to salads!', '🌸', '#e74c3c');

-- Companion plant relationships
INSERT INTO CompanionPlants (plant_id, companion_plant_id, relationship_type) VALUES
-- Tomato companions (using IDs we know)
(13, 21, 'beneficial'), -- Kale + Basil
(13, 25, 'beneficial'), -- Kale + Yarrow  
(17, 22, 'beneficial'), -- Carrot + Mint
(17, 18, 'beneficial'), -- Carrot + Garlic (garlic deters carrot fly)
(21, 27, 'beneficial'), -- Basil + Strawberry
(26, 13, 'beneficial'), -- Clover + Kale
(24, 14, 'beneficial'), -- Chamomile + Swiss Chard
(1, 26, 'beneficial'),  -- Apple + Clover (nitrogen fixing)
(9, 24, 'beneficial'),  -- Blueberry + Chamomile
(3, 26, 'antagonistic'); -- Walnut is antagonistic to many (juglone)

-- Hardscape items
INSERT INTO HardscapeItems (name, description, emoji) VALUES
('Stone Path', 'Decorative stone walkway through the garden', '🪨'),
('Raised Bed', 'Elevated planting box for better drainage', '📦'),
('Compost Bin', 'Converts organic waste into garden gold', '♻️'),
('Watering Trough', 'Water collection and distribution point', '🪣'),
('Garden Bench', 'Seating area to enjoy your garden', '🪑'),
('Trellis', 'Support structure for climbing plants', '🌐'),
('Greenhouse', 'Protected growing space for sensitive plants', '🏠'),
('Pond', 'Water feature supporting biodiversity', '💧'),
('Beehive', 'Supports pollination and honey production', '🍯'),
('Tool Shed', 'Storage for garden equipment', '🏚️');

-- =========================================
-- ADDITIONAL PLANTS (Phase 2)
-- =========================================

-- Moss & lichen (tundra/temperate ground covers)
INSERT INTO Plants (name, category, is_nitrogen_fixing, min_zone, max_zone, climate_type, sun_hours, water_needs, soil_preferences, yield_info, planting_time, harvest_time, maintenance_level, fun_facts, emoji, color) VALUES
('Sphagnum Moss', 'ground_cover', FALSE, '2a', '7b', 'tundra', 1, 'high', 'Acidic, waterlogged', 'Soil building, water retention', 'Spring', 'N/A', 'low', 'Sphagnum moss can hold up to 20 times its dry weight in water and has been used as wound dressing!', '🌿', '#5d8a5e'),
('Reindeer Lichen', 'ground_cover', FALSE, '1a', '5b', 'tundra', 2, 'low', 'Poor, acidic, sandy', 'Erosion control, wildlife fodder', 'Any', 'N/A', 'low', 'Reindeer lichen grows only 3-5mm per year and can live for hundreds of years!', '🌱', '#c8d5b9'),
('Hair Grass', 'leafy', FALSE, '2a', '7a', 'tundra', 3, 'moderate', 'Moist, acidic, peaty', 'Ground cover, erosion control', 'Spring', 'N/A', 'low', 'Hair grass is one of the few plants that can survive in Antarctic conditions!', '🌾', '#8fad60'),
('Crowberry', 'ground_cover', FALSE, '1a', '5b', 'tundra', 3, 'moderate', 'Acidic, peaty, well-drained', 'Edible dark berries', 'Spring', 'Late Summer', 'low', 'Crowberries are a staple food of Arctic peoples and are among the northernmost fruiting plants!', '🫐', '#2c1654'),
('Fireweed', 'leafy', FALSE, '2a', '7b', 'temperate', 4, 'moderate', 'Disturbed, well-drained', 'Edible shoots; first colonizer after fire', 'Spring', 'Summer', 'low', 'Fireweed is usually the very first plant to grow after a wildfire, earning its name!', '🌸', '#c0392b'),

-- Bamboo (temperate to tropical varieties)
('Golden Bamboo', 'bush', FALSE, '6a', '10b', 'temperate', 5, 'moderate', 'Well-drained, fertile', 'Structural material, shoots edible', 'Spring', 'Spring (shoots)', 'moderate', 'Golden bamboo can grow 4 feet per day during peak growth season!', '🎋', '#c8a951'),
('Moso Bamboo', 'tree', FALSE, '7a', '10b', 'temperate', 6, 'moderate', 'Deep, well-drained, fertile', 'Timber, edible shoots, building material', 'Spring', 'Spring (shoots)', 'low', 'Moso bamboo is the fastest-growing plant on Earth, growing up to 35 inches in a single day!', '🎋', '#4a7c3f'),
('Black Bamboo', 'bush', FALSE, '7a', '11a', 'subtropical', 4, 'moderate', 'Moist, well-drained', 'Ornamental, structural canes', 'Spring', 'Year-round (canes)', 'low', 'Black bamboo canes start green and turn glossy black in their second year!', '🎋', '#1c2833'),
('Clumping Bamboo', 'bush', FALSE, '8a', '12a', 'tropical', 6, 'moderate', 'Rich, well-drained', 'Non-invasive, edible shoots', 'Spring', 'Spring (shoots)', 'low', 'Unlike running bamboo, clumping bamboo stays in a manageable clump and won''t take over your yard!', '🎋', '#27ae60'),

-- Fruiting cacti (subtropical/tropical)
('Dragon Fruit Cactus', 'bush', FALSE, '9a', '12a', 'subtropical', 6, 'low', 'Sandy, well-drained, slightly acidic', '20-30 lbs per plant per year', 'Spring', 'Summer-Fall', 'moderate', 'Dragon fruit flowers only bloom at night and are pollinated by bats and moths!', '🐉', '#e91e8c'),
('Prickly Pear Cactus', 'bush', FALSE, '8a', '12a', 'subtropical', 6, 'low', 'Sandy, rocky, well-drained', 'Edible pads and fruit', 'Spring', 'Summer-Fall', 'low', 'Every part of the prickly pear is edible — pads, flowers, and fruit. Native Americans have eaten it for thousands of years!', '🌵', '#e74c3c'),
('Saguaro Cactus', 'tree', FALSE, '9a', '11b', 'subtropical', 8, 'low', 'Rocky, sandy, alkaline', 'Edible fruit and seeds', 'N/A (slow growing)', 'Summer', 'low', 'Saguaro cacti can absorb 200 gallons of water after a single rain and live over 150 years!', '🌵', '#27ae60'),
('Pitaya (Yellow Dragon Fruit)', 'bush', FALSE, '10a', '13a', 'tropical', 7, 'low', 'Sandy, well-drained', 'Sweet yellow fruit', 'Spring', 'Year-round', 'moderate', 'Yellow dragon fruit is sweeter than red and grows on a cactus that can reach 20 feet!', '🌟', '#f1c40f'),

-- More vegetables and fruits
('Potato', 'root_crop', FALSE, '3a', '10b', 'temperate', 6, 'moderate', 'Loose, well-drained, slightly acidic', '5-10 lbs per plant', 'Spring', '70-120 days after planting', 'moderate', 'Potatoes were the first vegetable grown in space, aboard the Space Shuttle Columbia in 1995!', '🥔', '#d4a017'),
('Beet', 'root_crop', FALSE, '3a', '10a', 'temperate', 4, 'moderate', 'Deep, loose, well-drained', 'Both root and greens edible', 'Spring/Fall', '50-70 days', 'low', 'Beet juice is so intensely colored that ancient Romans used it as hair dye!', '🫀', '#c0392b'),
('Zucchini', 'leafy', FALSE, '4a', '10b', 'temperate', 6, 'moderate', 'Rich, well-drained, fertile', 'Prolific — can produce 10 lbs/week!', 'After frost', 'Summer', 'moderate', 'Zucchini plants grow so vigorously that gardeners often leave extra zucchini on neighbors'' doorsteps!', '🥒', '#27ae60'),
('Tomato', 'bush', FALSE, '5a', '10b', 'temperate', 7, 'moderate', 'Rich, well-drained, slightly acidic', 'Heavy harvest all summer', 'After frost', 'Summer-Fall', 'moderate', 'Tomatoes are botanically a fruit but legally a vegetable — the US Supreme Court ruled on this in 1893!', '🍅', '#e74c3c'),
('Corn', 'leafy', FALSE, '4a', '10b', 'temperate', 7, 'moderate', 'Rich, well-drained, fertile', '1-2 ears per stalk', 'After frost', 'Summer', 'moderate', 'Each silk strand on a corn cob corresponds to exactly one kernel — corn has been cultivated for 10,000 years!', '🌽', '#f1c40f'),
('Bean (Runner)', 'bush', TRUE, '4a', '10b', 'temperate', 6, 'moderate', 'Well-drained, fertile', 'Heavy yield, nitrogen-fixing', 'After frost', 'Summer', 'low', 'Runner beans fix nitrogen AND produce food — the ultimate permaculture plant! Native Americans called beans one of the Three Sisters.', '🫘', '#7d3c98'),
('Raspberry', 'bush', FALSE, '3a', '9a', 'temperate', 6, 'moderate', 'Well-drained, slightly acidic', '1-2 quarts per cane', 'Spring', 'Summer-Fall', 'moderate', 'Each raspberry is actually a cluster of 100 tiny drupelets, each containing its own seed!', '🍓', '#c0392b'),
('Honey Locust', 'tree', TRUE, '3b', '9a', 'temperate', 5, 'low', 'Tolerates poor, compacted soil', 'Sweet seed pods, timber, nitrogen', 'Spring', 'Fall (pods)', 'low', 'Honey locust seed pods contain a sweet pulp that was eaten by native Americans and is loved by deer and livestock — a true food forest tree!', '🌳', '#8b6914'),
('Acacia', 'tree', TRUE, '8a', '13a', 'subtropical', 6, 'low', 'Poor, sandy, well-drained', 'Nitrogen-fixing, timber, fodder', 'Spring', 'N/A (support tree)', 'low', 'Acacia trees communicate with each other through chemicals released into the air to warn neighbors of grazing animals!', '🌳', '#d4a017'),

-- Aquatic plants (new category)
('Rice', 'aquatic', FALSE, '9a', '13a', 'tropical', 7, 'high', 'Waterlogged, clay, fertile', 'Staple grain crop', 'Spring', 'Fall', 'high', 'Rice feeds more than half the world''s population and has over 40,000 known varieties!', '🌾', '#f0e68c'),
('Taro', 'aquatic', FALSE, '9a', '13a', 'tropical', 4, 'high', 'Waterlogged, rich, fertile', 'Large starchy corms', 'Spring', '7-12 months', 'moderate', 'Taro has been cultivated in Asia for over 10,000 years and is one of humanity''s oldest crop plants!', '🌿', '#145a32'),
('Water Lily', 'aquatic', FALSE, '4a', '12a', 'temperate', 5, 'high', 'Still or slow water, muddy bottom', 'Edible seeds and tubers; wildlife habitat', 'Spring', 'Summer', 'low', 'Water lily pads can grow up to 6 feet across and support the weight of a child!', '🌸', '#e91e8c'),
('Lotus', 'aquatic', FALSE, '5a', '12a', 'subtropical', 6, 'high', 'Still water, muddy, warm', 'Edible seeds, tubers, leaves and flowers', 'Spring', 'Summer-Fall', 'moderate', 'Lotus seeds can remain viable for over 1,000 years — scientists have grown lotus from 1,300-year-old seeds!', '🪷', '#f1948a'),
('Duckweed', 'aquatic', FALSE, '4a', '12a', 'temperate', 3, 'high', 'Still water, nutrient-rich', 'Rapid biomass producer, protein-rich food', 'Spring', 'All season', 'low', 'Duckweed is the world''s smallest flowering plant and doubles in mass every 24 hours — it''s 40% protein!', '💚', '#27ae60'),
('Water Cress', 'aquatic', FALSE, '5a', '9b', 'temperate', 4, 'high', 'Running water or wet soil', 'Peppery greens year-round', 'Spring', 'Year-round', 'low', 'Watercress was the first vegetable to be commercially cultivated in the UK and is one of the oldest known leaf vegetables!', '🌿', '#1abc9c'),
('Cattail', 'aquatic', FALSE, '3a', '10a', 'temperate', 5, 'high', 'Shallow water, wetlands', 'Edible pollen, shoots, tubers', 'Spring', 'All season', 'low', 'Virtually every part of the cattail is edible — pollen, shoots, hearts, and starchy roots. It''s the permaculture superplant of wetlands!', '🌾', '#8b6914');

-- Add aquatic companion relationships
INSERT INTO CompanionPlants (plant_id, companion_plant_id, relationship_type)
SELECT p1.id, p2.id, 'beneficial'
FROM Plants p1, Plants p2
WHERE p1.name = 'Lotus' AND p2.name = 'Water Lily';

INSERT INTO CompanionPlants (plant_id, companion_plant_id, relationship_type)
SELECT p1.id, p2.id, 'beneficial'
FROM Plants p1, Plants p2
WHERE p1.name = 'Rice' AND p2.name = 'Duckweed';

INSERT INTO CompanionPlants (plant_id, companion_plant_id, relationship_type)
SELECT p1.id, p2.id, 'beneficial'
FROM Plants p1, Plants p2
WHERE p1.name = 'Bean (Runner)' AND p2.name = 'Corn';

INSERT INTO CompanionPlants (plant_id, companion_plant_id, relationship_type)
SELECT p1.id, p2.id, 'beneficial'
FROM Plants p1, Plants p2
WHERE p1.name = 'Bean (Runner)' AND p2.name = 'Tomato';

INSERT INTO CompanionPlants (plant_id, companion_plant_id, relationship_type)
SELECT p1.id, p2.id, 'beneficial'
FROM Plants p1, Plants p2
WHERE p1.name = 'Tomato' AND p2.name = 'Basil';

INSERT INTO CompanionPlants (plant_id, companion_plant_id, relationship_type)
SELECT p1.id, p2.id, 'beneficial'
FROM Plants p1, Plants p2
WHERE p1.name = 'Potato' AND p2.name = 'Bean (Runner)';

-- =========================================
-- NEW COMPANION RELATIONSHIPS (Phase 3)
-- =========================================

-- Garlic → boosts Zucchini, Tomato, Ginger
INSERT INTO CompanionPlants (plant_id, companion_plant_id, relationship_type)
SELECT p1.id, p2.id, 'beneficial'
FROM Plants p1, Plants p2
WHERE p1.name = 'Garlic' AND p2.name = 'Zucchini';

INSERT INTO CompanionPlants (plant_id, companion_plant_id, relationship_type)
SELECT p1.id, p2.id, 'beneficial'
FROM Plants p1, Plants p2
WHERE p1.name = 'Garlic' AND p2.name = 'Tomato';

INSERT INTO CompanionPlants (plant_id, companion_plant_id, relationship_type)
SELECT p1.id, p2.id, 'beneficial'
FROM Plants p1, Plants p2
WHERE p1.name = 'Garlic' AND p2.name = 'Ginger';

-- Ginger → boosts Basil, Sweet Potato
INSERT INTO CompanionPlants (plant_id, companion_plant_id, relationship_type)
SELECT p1.id, p2.id, 'beneficial'
FROM Plants p1, Plants p2
WHERE p1.name = 'Ginger' AND p2.name = 'Basil';

INSERT INTO CompanionPlants (plant_id, companion_plant_id, relationship_type)
SELECT p1.id, p2.id, 'beneficial'
FROM Plants p1, Plants p2
WHERE p1.name = 'Ginger' AND p2.name = 'Sweet Potato';

-- Also make the relationships reciprocal (both plants benefit)
INSERT INTO CompanionPlants (plant_id, companion_plant_id, relationship_type)
SELECT p1.id, p2.id, 'beneficial'
FROM Plants p1, Plants p2
WHERE p1.name = 'Zucchini' AND p2.name = 'Garlic';

INSERT INTO CompanionPlants (plant_id, companion_plant_id, relationship_type)
SELECT p1.id, p2.id, 'beneficial'
FROM Plants p1, Plants p2
WHERE p1.name = 'Tomato' AND p2.name = 'Garlic';

INSERT INTO CompanionPlants (plant_id, companion_plant_id, relationship_type)
SELECT p1.id, p2.id, 'beneficial'
FROM Plants p1, Plants p2
WHERE p1.name = 'Basil' AND p2.name = 'Ginger';

INSERT INTO CompanionPlants (plant_id, companion_plant_id, relationship_type)
SELECT p1.id, p2.id, 'beneficial'
FROM Plants p1, Plants p2
WHERE p1.name = 'Sweet Potato' AND p2.name = 'Ginger';