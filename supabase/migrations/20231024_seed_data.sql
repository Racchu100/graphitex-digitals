-- ─────────────────────────────────────────────────────────────
-- SEED DATA: Countries, States, Cities, Categories
-- Run this in Supabase SQL Editor after all migrations
-- ─────────────────────────────────────────────────────────────

-- 1. Country (India)
INSERT INTO countries (name, iso_code, phone_code) VALUES
('India', 'IN', '+91')
ON CONFLICT (iso_code) DO NOTHING;

-- 2. States of India (country_id = 1)
-- Note: uses GENERATED ALWAYS AS IDENTITY, so we let Postgres assign IDs
-- But we insert with a specific order so we can reference states by name in cities
INSERT INTO states (country_id, name)
SELECT 1, s_name
FROM unnest(ARRAY[
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi',
  'Jammu & Kashmir', 'Ladakh', 'Chandigarh', 'Puducherry',
  'Andaman & Nicobar', 'Dadra & Nagar Haveli', 'Lakshadweep'
]) AS s_name
WHERE NOT EXISTS (SELECT 1 FROM states WHERE country_id = 1 AND name = s_name);

-- 3. Cities — insert by state name lookup
-- Andhra Pradesh
INSERT INTO cities (state_id, name)
SELECT s.id, c.name FROM states s, 
  (VALUES ('Visakhapatnam'),('Vijayawada'),('Guntur'),('Tirupati'),
          ('Kakinada'),('Rajahmundry'),('Nellore'),('Kurnool'),('Anantapur')) AS c(name)
WHERE s.name = 'Andhra Pradesh' AND NOT EXISTS (SELECT 1 FROM cities WHERE state_id = s.id);

-- Assam
INSERT INTO cities (state_id, name)
SELECT s.id, c.name FROM states s,
  (VALUES ('Guwahati'),('Silchar'),('Dibrugarh'),('Jorhat'),('Tezpur')) AS c(name)
WHERE s.name = 'Assam' AND NOT EXISTS (SELECT 1 FROM cities WHERE state_id = s.id);

-- Bihar
INSERT INTO cities (state_id, name)
SELECT s.id, c.name FROM states s,
  (VALUES ('Patna'),('Gaya'),('Muzaffarpur'),('Bhagalpur'),('Darbhanga')) AS c(name)
WHERE s.name = 'Bihar' AND NOT EXISTS (SELECT 1 FROM cities WHERE state_id = s.id);

-- Chhattisgarh
INSERT INTO cities (state_id, name)
SELECT s.id, c.name FROM states s,
  (VALUES ('Raipur'),('Bhilai'),('Bilaspur'),('Durg'),('Korba')) AS c(name)
WHERE s.name = 'Chhattisgarh' AND NOT EXISTS (SELECT 1 FROM cities WHERE state_id = s.id);

-- Goa
INSERT INTO cities (state_id, name)
SELECT s.id, c.name FROM states s,
  (VALUES ('Panaji'),('Margao'),('Vasco da Gama'),('Mapusa'),('Ponda')) AS c(name)
WHERE s.name = 'Goa' AND NOT EXISTS (SELECT 1 FROM cities WHERE state_id = s.id);

-- Gujarat
INSERT INTO cities (state_id, name)
SELECT s.id, c.name FROM states s,
  (VALUES ('Ahmedabad'),('Surat'),('Vadodara'),('Rajkot'),('Gandhinagar'),
          ('Bhavnagar'),('Jamnagar'),('Anand'),('Morbi'),('Navsari')) AS c(name)
WHERE s.name = 'Gujarat' AND NOT EXISTS (SELECT 1 FROM cities WHERE state_id = s.id);

-- Haryana
INSERT INTO cities (state_id, name)
SELECT s.id, c.name FROM states s,
  (VALUES ('Gurugram'),('Faridabad'),('Panipat'),('Ambala'),('Hisar'),
          ('Rohtak'),('Karnal'),('Sonipat')) AS c(name)
WHERE s.name = 'Haryana' AND NOT EXISTS (SELECT 1 FROM cities WHERE state_id = s.id);

-- Himachal Pradesh
INSERT INTO cities (state_id, name)
SELECT s.id, c.name FROM states s,
  (VALUES ('Shimla'),('Manali'),('Dharamshala'),('Solan'),('Mandi'),('Kullu')) AS c(name)
WHERE s.name = 'Himachal Pradesh' AND NOT EXISTS (SELECT 1 FROM cities WHERE state_id = s.id);

-- Jharkhand
INSERT INTO cities (state_id, name)
SELECT s.id, c.name FROM states s,
  (VALUES ('Ranchi'),('Jamshedpur'),('Dhanbad'),('Bokaro'),('Hazaribagh')) AS c(name)
WHERE s.name = 'Jharkhand' AND NOT EXISTS (SELECT 1 FROM cities WHERE state_id = s.id);

-- Karnataka
INSERT INTO cities (state_id, name)
SELECT s.id, c.name FROM states s,
  (VALUES ('Bengaluru'),('Mysuru'),('Hubballi'),('Mangaluru'),('Belagavi'),
          ('Davangere'),('Ballari'),('Kalaburagi'),('Tumakuru'),
          ('Udupi'),('Shivamogga'),('Hassan'),('Vijayapura')) AS c(name)
WHERE s.name = 'Karnataka' AND NOT EXISTS (SELECT 1 FROM cities WHERE state_id = s.id AND name = c.name);

-- Kerala
INSERT INTO cities (state_id, name)
SELECT s.id, c.name FROM states s,
  (VALUES ('Thiruvananthapuram'),('Kochi'),('Kozhikode'),('Thrissur'),
          ('Kollam'),('Kannur'),('Alappuzha'),('Palakkad'),('Kottayam'),('Malappuram')) AS c(name)
WHERE s.name = 'Kerala' AND NOT EXISTS (SELECT 1 FROM cities WHERE state_id = s.id);

-- Madhya Pradesh
INSERT INTO cities (state_id, name)
SELECT s.id, c.name FROM states s,
  (VALUES ('Indore'),('Bhopal'),('Jabalpur'),('Gwalior'),('Ujjain'),
          ('Sagar'),('Rewa'),('Satna')) AS c(name)
WHERE s.name = 'Madhya Pradesh' AND NOT EXISTS (SELECT 1 FROM cities WHERE state_id = s.id);

-- Maharashtra
INSERT INTO cities (state_id, name)
SELECT s.id, c.name FROM states s,
  (VALUES ('Mumbai'),('Pune'),('Nagpur'),('Nashik'),('Aurangabad'),
          ('Solapur'),('Kolhapur'),('Thane'),('Navi Mumbai'),
          ('Amravati'),('Nanded'),('Satara'),('Latur')) AS c(name)
WHERE s.name = 'Maharashtra' AND NOT EXISTS (SELECT 1 FROM cities WHERE state_id = s.id);

-- Odisha
INSERT INTO cities (state_id, name)
SELECT s.id, c.name FROM states s,
  (VALUES ('Bhubaneswar'),('Cuttack'),('Rourkela'),('Puri'),('Sambalpur')) AS c(name)
WHERE s.name = 'Odisha' AND NOT EXISTS (SELECT 1 FROM cities WHERE state_id = s.id);

-- Punjab
INSERT INTO cities (state_id, name)
SELECT s.id, c.name FROM states s,
  (VALUES ('Ludhiana'),('Amritsar'),('Jalandhar'),('Patiala'),('Bathinda'),
          ('Mohali'),('Pathankot'),('Hoshiarpur')) AS c(name)
WHERE s.name = 'Punjab' AND NOT EXISTS (SELECT 1 FROM cities WHERE state_id = s.id);

-- Rajasthan
INSERT INTO cities (state_id, name)
SELECT s.id, c.name FROM states s,
  (VALUES ('Jaipur'),('Jodhpur'),('Udaipur'),('Kota'),('Bikaner'),
          ('Ajmer'),('Alwar'),('Sikar'),('Bharatpur')) AS c(name)
WHERE s.name = 'Rajasthan' AND NOT EXISTS (SELECT 1 FROM cities WHERE state_id = s.id);

-- Tamil Nadu
INSERT INTO cities (state_id, name)
SELECT s.id, c.name FROM states s,
  (VALUES ('Chennai'),('Coimbatore'),('Madurai'),('Tiruchirappalli'),('Salem'),
          ('Tirunelveli'),('Vellore'),('Erode'),('Thanjavur'),('Tiruppur'),
          ('Thoothukudi'),('Dindigul')) AS c(name)
WHERE s.name = 'Tamil Nadu' AND NOT EXISTS (SELECT 1 FROM cities WHERE state_id = s.id);

-- Telangana
INSERT INTO cities (state_id, name)
SELECT s.id, c.name FROM states s,
  (VALUES ('Hyderabad'),('Warangal'),('Karimnagar'),('Nizamabad'),
          ('Khammam'),('Secunderabad'),('Nalgonda')) AS c(name)
WHERE s.name = 'Telangana' AND NOT EXISTS (SELECT 1 FROM cities WHERE state_id = s.id);

-- Uttar Pradesh
INSERT INTO cities (state_id, name)
SELECT s.id, c.name FROM states s,
  (VALUES ('Lucknow'),('Kanpur'),('Agra'),('Varanasi'),('Prayagraj'),
          ('Meerut'),('Ghaziabad'),('Noida'),('Mathura'),
          ('Bareilly'),('Aligarh'),('Gorakhpur'),('Moradabad')) AS c(name)
WHERE s.name = 'Uttar Pradesh' AND NOT EXISTS (SELECT 1 FROM cities WHERE state_id = s.id);

-- Uttarakhand
INSERT INTO cities (state_id, name)
SELECT s.id, c.name FROM states s,
  (VALUES ('Dehradun'),('Haridwar'),('Roorkee'),('Rishikesh'),('Haldwani'),('Nainital')) AS c(name)
WHERE s.name = 'Uttarakhand' AND NOT EXISTS (SELECT 1 FROM cities WHERE state_id = s.id);

-- West Bengal
INSERT INTO cities (state_id, name)
SELECT s.id, c.name FROM states s,
  (VALUES ('Kolkata'),('Howrah'),('Durgapur'),('Asansol'),('Siliguri'),
          ('Darjeeling'),('Malda'),('Berhampore')) AS c(name)
WHERE s.name = 'West Bengal' AND NOT EXISTS (SELECT 1 FROM cities WHERE state_id = s.id);

-- Delhi
INSERT INTO cities (state_id, name)
SELECT s.id, c.name FROM states s,
  (VALUES ('New Delhi'),('North Delhi'),('South Delhi'),('East Delhi'),
          ('West Delhi'),('Dwarka'),('Rohini'),('Janakpuri')) AS c(name)
WHERE s.name = 'Delhi' AND NOT EXISTS (SELECT 1 FROM cities WHERE state_id = s.id);

-- Jammu & Kashmir
INSERT INTO cities (state_id, name)
SELECT s.id, c.name FROM states s,
  (VALUES ('Srinagar'),('Jammu'),('Anantnag'),('Baramulla'),('Sopore')) AS c(name)
WHERE s.name = 'Jammu & Kashmir' AND NOT EXISTS (SELECT 1 FROM cities WHERE state_id = s.id);

-- Chandigarh
INSERT INTO cities (state_id, name)
SELECT s.id, c.name FROM states s,
  (VALUES ('Chandigarh')) AS c(name)
WHERE s.name = 'Chandigarh' AND NOT EXISTS (SELECT 1 FROM cities WHERE state_id = s.id);

-- Puducherry
INSERT INTO cities (state_id, name)
SELECT s.id, c.name FROM states s,
  (VALUES ('Puducherry'),('Karaikal'),('Mahe')) AS c(name)
WHERE s.name = 'Puducherry' AND NOT EXISTS (SELECT 1 FROM cities WHERE state_id = s.id);

-- 4. Categories
INSERT INTO categories (name, slug, is_active) VALUES
('Food & Restaurants',      'food-restaurants',       true),
('Fashion & Clothing',      'fashion-clothing',        true),
('Beauty & Wellness',       'beauty-wellness',         true),
('Fitness & Gym',           'fitness-gym',             true),
('Technology & Gadgets',    'technology-gadgets',      true),
('Travel & Tourism',        'travel-tourism',          true),
('Real Estate',             'real-estate',             true),
('Education & Coaching',    'education-coaching',      true),
('Healthcare & Pharmacy',   'healthcare-pharmacy',     true),
('Jewellery & Accessories', 'jewellery-accessories',   true),
('Home & Interior',         'home-interior',           true),
('Events & Entertainment',  'events-entertainment',    true),
('Automotive',              'automotive',              true),
('Photography & Video',     'photography-video',       true),
('Finance & Insurance',     'finance-insurance',       true),
('Baby & Kids',             'baby-kids',               true),
('Pet Care',                'pet-care',                true),
('Agriculture & Farming',   'agriculture-farming',     true),
('Handmade & Crafts',       'handmade-crafts',         true),
('Hospitality & Hotels',    'hospitality-hotels',      true)
ON CONFLICT (slug) DO NOTHING;

-- 5. Platform Config defaults
INSERT INTO platform_config (key, value, description) VALUES
('max_business_profiles_per_provider', '5',  'Maximum business profiles a provider can create'),
('max_opportunity_duration_days',      '31', 'Maximum days an opportunity can remain active')
ON CONFLICT (key) DO NOTHING;
