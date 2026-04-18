-- ============================================================
-- Rocket Rentals – Database Initialization
-- Database: emmanue0_RocketRentals
-- Run this file once to create all tool-related tables
-- and populate them with the current mock / placeholder data.
-- ============================================================

USE `emmanue0_RocketRentals`;

-- ============================================================
--  1. TOOL CATEGORIES
--     Broad groupings shown in the sidebar and category grid.
--     Maps to the ToolCategory PHP class.
--
--     image_url: Category card image (e.g. hero photo for "Power Tools").
--               NULL for now — will hold a URL or S3 path once assets are added.
-- ============================================================

DROP TABLE IF EXISTS `tool_units`;
DROP TABLE IF EXISTS `tools`;
DROP TABLE IF EXISTS `tool_types`;
DROP TABLE IF EXISTS `tool_categories`;

CREATE TABLE `tool_categories` (
   `id`          INT           AUTO_INCREMENT PRIMARY KEY,
   `key`         VARCHAR(30)   NOT NULL UNIQUE,
   `name`        VARCHAR(100)  NOT NULL,
   `description` VARCHAR(255)  NOT NULL,
   `image_url`   VARCHAR(500)  DEFAULT NULL,
   `featured`    TINYINT(1)    NOT NULL DEFAULT 0,
   `sort_order`  INT           NOT NULL DEFAULT 0,
   `created_at`  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
   `updated_at`  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `tool_categories` (`key`, `name`, `description`, `featured`, `sort_order`) VALUES
   ('power',    'Power Tools',        'Drills, saws, sanders, nailers, and more.',              1, 1),
   ('lawn',     'Lawn & Outdoor',     'Seasonal equipment for yard projects.',                  0, 2),
   ('masonry',  'Concrete & Masonry', 'Mixing, cutting, and surface prep equipment.',           0, 3),
   ('cleaning', 'Cleaning',           'For jobsite cleanup, garages, and home refresh.',         0, 4),
   ('ladders',  'Ladders & Lifts',    'Reach higher safely with delivery-focused equipment.',   0, 5),
   ('trailers', 'Trailers & Hauling', 'Move materials, equipment, and debris.',                 0, 6);


-- ============================================================
--  2. TOOL TYPES
--     Sub-groupings within a category.
--     e.g. Power Tools → Drills, Saws, Hammers
--     Not heavily used in the UI today, but keeps the schema
--     ready to scale when the catalog grows.
-- ============================================================

CREATE TABLE `tool_types` (
   `id`          INT           AUTO_INCREMENT PRIMARY KEY,
   `category_id` INT           NOT NULL,
   `key`         VARCHAR(50)   NOT NULL,
   `name`        VARCHAR(100)  NOT NULL,
   `description` VARCHAR(255)  DEFAULT NULL,
   `sort_order`  INT           NOT NULL DEFAULT 0,
   `created_at`  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
   `updated_at`  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

   UNIQUE KEY `uq_type_per_category` (`category_id`, `key`),
   CONSTRAINT `fk_type_category` FOREIGN KEY (`category_id`)
      REFERENCES `tool_categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `tool_types` (`category_id`, `key`, `name`, `sort_order`) VALUES
   -- Power Tools (category 1)
   (1, 'drills',           'Drills & Drivers',       1),
   (1, 'saws',             'Saws',                   2),
   (1, 'hammers',          'Hammers',                3),

   -- Lawn & Outdoor (category 2)
   (2, 'tillers',          'Tillers',                1),
   (2, 'blowers',          'Blowers',                2),
   (2, 'cutters',          'Brush Cutters',          3),

   -- Concrete & Masonry (category 3)
   (3, 'mixers',           'Mixers',                 1),
   (3, 'masonry-saws',     'Tile & Masonry Saws',    2),
   (3, 'grinders',         'Grinders',               3),

   -- Cleaning (category 4)
   (4, 'pressure-washers', 'Pressure Washers',       1),
   (4, 'vacuums',          'Vacuums',                2),
   (4, 'carpet-cleaners',  'Carpet Cleaners',        3),

   -- Ladders & Lifts (category 5)
   (5, 'ladders',          'Ladders',                1),
   (5, 'scaffolds',        'Scaffolds',              2),

   -- Trailers & Hauling (category 6)
   (6, 'trailers',         'Trailers',               1),
   (6, 'hand-equipment',   'Hand Equipment',         2);


-- ============================================================
--  3. TOOLS
--     Individual rentable products (the card on the website).
--     Maps to the RentalTool PHP class.
--     Each tool belongs to a type, which belongs to a category.
--
--     image_url: Product photo for the tool card (like Home Depot's listing images).
--               Stored per tool model, not per physical unit.
--               NULL for now — will eventually hold an S3 bucket path
--               (e.g. "s3://rocketrentals-assets/tools/impact-driver.webp")
--               or a CDN URL once image assets are uploaded.
-- ============================================================

CREATE TABLE `tools` (
   `id`            INT            AUTO_INCREMENT PRIMARY KEY,
   `type_id`       INT            NOT NULL,
   `name`          VARCHAR(150)   NOT NULL,
   `slug`          VARCHAR(150)   NOT NULL UNIQUE,
   `description`   TEXT           NOT NULL,
   `daily_rate`    DECIMAL(8,2)   NOT NULL,
   `deposit`       DECIMAL(8,2)   NOT NULL DEFAULT 0.00,
   `delivery_only` TINYINT(1)     NOT NULL DEFAULT 0,
   `image_url`     VARCHAR(500)   DEFAULT NULL,
   `is_active`     TINYINT(1)     NOT NULL DEFAULT 1,
   `created_at`    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
   `updated_at`    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

   CONSTRAINT `fk_tool_type` FOREIGN KEY (`type_id`)
      REFERENCES `tool_types`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `tools` (`type_id`, `name`, `slug`, `description`, `daily_rate`, `deposit`, `delivery_only`) VALUES
   -- ── Power Tools ─────────────────────────────────────────
   -- Drills & Drivers (type 1)
   (1,  'Impact Driver',     'impact-driver',     'Compact fastening tool for framing, decking, and general construction jobs.',             18.00,  50.00,  0),
   -- Saws (type 2)
   (2,  'Circular Saw',      'circular-saw',      'Portable cutting tool for plywood, framing lumber, and jobsite cuts.',                    22.00,  60.00,  0),
   -- Hammers (type 3)
   (3,  'Rotary Hammer',     'rotary-hammer',     'Heavy-duty drilling tool for concrete, anchors, and masonry work.',                      30.00,  75.00,  0),

   -- ── Lawn & Outdoor ─────────────────────────────────────
   -- Tillers (type 4)
   (4,  'Tiller',            'tiller',            'Break up soil for garden beds, landscaping, and yard preparation.',                       35.00,  80.00,  1),
   -- Blowers (type 5)
   (5,  'Leaf Blower',       'leaf-blower',       'Clear leaves, grass clippings, and debris from outdoor spaces.',                          15.00,  40.00,  0),
   -- Brush Cutters (type 6)
   (6,  'Brush Cutter',      'brush-cutter',      'Cut through overgrowth, weeds, and thick brush along property edges.',                   28.00,  65.00,  1),

   -- ── Concrete & Masonry ─────────────────────────────────
   -- Mixers (type 7)
   (7,  'Concrete Mixer',    'concrete-mixer',    'Mix concrete, mortar, and other materials for slab and repair work.',                     45.00, 100.00,  1),
   -- Tile & Masonry Saws (type 8)
   (8,  'Wet Saw',           'wet-saw',           'Precision tile and masonry cutting with water-cooled blade support.',                     38.00,  90.00,  0),
   -- Grinders (type 9)
   (9,  'Angle Grinder',     'angle-grinder',     'Grinding and cutting tool for metal, masonry, and surface prep.',                        20.00,  55.00,  0),

   -- ── Cleaning ───────────────────────────────────────────
   -- Pressure Washers (type 10)
   (10, 'Pressure Washer',   'pressure-washer',   'High-pressure cleaning tool for siding, driveways, patios, and equipment.',              40.00,  85.00,  1),
   -- Vacuums (type 11)
   (11, 'Shop Vac',          'shop-vac',          'Wet/dry vacuum for garages, workshops, and construction cleanup.',                       12.00,  35.00,  0),
   -- Carpet Cleaners (type 12)
   (12, 'Carpet Cleaner',    'carpet-cleaner',    'Deep-clean carpets and rugs for home refresh or move-out cleanup.',                      25.00,  60.00,  0),

   -- ── Ladders & Lifts ───────────────────────────────────
   -- Ladders (type 13)
   (13, 'Extension Ladder',  'extension-ladder',  'Tall ladder for exterior work, roofing access, and elevated repairs.',                   18.00,  50.00,  1),
   (13, 'Step Ladder',       'step-ladder',       'Standard ladder for indoor tasks, painting, and maintenance work.',                      10.00,  30.00,  0),
   -- Scaffolds (type 14)
   (14, 'Scaffold',          'scaffold',          'Stable elevated work platform for larger painting and repair jobs.',                     55.00, 120.00,  1),

   -- ── Trailers & Hauling ────────────────────────────────
   -- Trailers (type 15)
   (15, 'Utility Trailer',   'utility-trailer',   'Trailer for hauling tools, lumber, yard waste, and light materials.',                    60.00, 150.00,  1),
   (15, 'Dump Trailer',      'dump-trailer',      'Heavy-duty trailer for debris, demolition waste, and bulk materials.',                   95.00, 200.00,  1),
   -- Hand Equipment (type 16)
   (16, 'Hand Truck',        'hand-truck',        'Manual moving support for appliances, boxes, and stacked materials.',                     8.00,  20.00,  0);


-- ============================================================
--  4. TOOL UNITS
--     Physical inventory — each row is one real item that
--     Rocket Rentals owns. Multiple units can exist per tool.
--     This is what gets tied to a reservation / rental.
-- ============================================================

CREATE TABLE `tool_units` (
   `id`            INT            AUTO_INCREMENT PRIMARY KEY,
   `tool_id`       INT            NOT NULL,
   `serial_number` VARCHAR(100)   DEFAULT NULL UNIQUE,
   `condition`     ENUM('new', 'good', 'fair', 'maintenance') NOT NULL DEFAULT 'good',
   `status`        ENUM('available', 'rented', 'reserved', 'retired') NOT NULL DEFAULT 'available',
   `notes`         TEXT           DEFAULT NULL,
   `acquired_date` DATE           DEFAULT NULL,
   `created_at`    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
   `updated_at`    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

   CONSTRAINT `fk_unit_tool` FOREIGN KEY (`tool_id`)
      REFERENCES `tools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `tool_units` (`tool_id`, `serial_number`, `condition`, `status`, `acquired_date`) VALUES
   -- Impact Driver (tool 1) – 3 units
   (1,  'RR-PWR-001',  'new',   'available',  '2025-06-01'),
   (1,  'RR-PWR-002',  'good',  'available',  '2025-06-01'),
   (1,  'RR-PWR-003',  'good',  'rented',     '2025-08-15'),

   -- Circular Saw (tool 2) – 2 units
   (2,  'RR-PWR-004',  'new',   'available',  '2025-07-01'),
   (2,  'RR-PWR-005',  'good',  'available',  '2025-07-01'),

   -- Rotary Hammer (tool 3) – 2 units
   (3,  'RR-PWR-006',  'good',  'available',  '2025-05-20'),
   (3,  'RR-PWR-007',  'fair',  'available',  '2024-11-10'),

   -- Tiller (tool 4) – 2 units
   (4,  'RR-LWN-001',  'good',  'available',  '2025-03-01'),
   (4,  'RR-LWN-002',  'good',  'rented',     '2025-03-01'),

   -- Leaf Blower (tool 5) – 3 units
   (5,  'RR-LWN-003',  'new',   'available',  '2025-09-01'),
   (5,  'RR-LWN-004',  'good',  'available',  '2025-09-01'),
   (5,  'RR-LWN-005',  'good',  'available',  '2025-04-15'),

   -- Brush Cutter (tool 6) – 2 units
   (6,  'RR-LWN-006',  'good',  'available',  '2025-06-10'),
   (6,  'RR-LWN-007',  'fair',  'rented',     '2025-01-20'),

   -- Concrete Mixer (tool 7) – 2 units
   (7,  'RR-MSN-001',  'good',  'available',  '2025-04-01'),
   (7,  'RR-MSN-002',  'good',  'available',  '2025-04-01'),

   -- Wet Saw (tool 8) – 2 units
   (8,  'RR-MSN-003',  'new',   'available',  '2025-08-01'),
   (8,  'RR-MSN-004',  'good',  'available',  '2025-02-15'),

   -- Angle Grinder (tool 9) – 3 units
   (9,  'RR-MSN-005',  'good',  'available',  '2025-05-01'),
   (9,  'RR-MSN-006',  'good',  'available',  '2025-05-01'),
   (9,  'RR-MSN-007',  'new',   'available',  '2025-10-01'),

   -- Pressure Washer (tool 10) – 2 units
   (10, 'RR-CLN-001',  'good',  'available',  '2025-03-15'),
   (10, 'RR-CLN-002',  'good',  'rented',     '2025-03-15'),

   -- Shop Vac (tool 11) – 3 units
   (11, 'RR-CLN-003',  'good',  'available',  '2025-06-01'),
   (11, 'RR-CLN-004',  'new',   'available',  '2025-09-10'),
   (11, 'RR-CLN-005',  'good',  'available',  '2025-06-01'),

   -- Carpet Cleaner (tool 12) – 2 units
   (12, 'RR-CLN-006',  'good',  'available',  '2025-07-20'),
   (12, 'RR-CLN-007',  'good',  'available',  '2025-07-20'),

   -- Extension Ladder (tool 13) – 2 units
   (13, 'RR-LDR-001',  'good',  'available',  '2025-02-01'),
   (13, 'RR-LDR-002',  'good',  'rented',     '2025-02-01'),

   -- Step Ladder (tool 14) – 3 units
   (14, 'RR-LDR-003',  'new',   'available',  '2025-08-01'),
   (14, 'RR-LDR-004',  'good',  'available',  '2025-08-01'),
   (14, 'RR-LDR-005',  'good',  'available',  '2025-05-15'),

   -- Scaffold (tool 15) – 2 units
   (15, 'RR-LDR-006',  'good',  'available',  '2025-01-10'),
   (15, 'RR-LDR-007',  'good',  'reserved',   '2025-01-10'),

   -- Utility Trailer (tool 16) – 2 units
   (16, 'RR-TRL-001',  'good',  'available',  '2025-04-01'),
   (16, 'RR-TRL-002',  'good',  'available',  '2025-04-01'),

   -- Dump Trailer (tool 17) – 1 unit
   (17, 'RR-TRL-003',  'good',  'available',  '2025-06-15'),

   -- Hand Truck (tool 18) – 4 units
   (18, 'RR-TRL-004',  'good',  'available',  '2025-01-01'),
   (18, 'RR-TRL-005',  'good',  'available',  '2025-01-01'),
   (18, 'RR-TRL-006',  'new',   'available',  '2025-07-01'),
   (18, 'RR-TRL-007',  'fair',  'available',  '2024-09-01');


-- ============================================================
--  VERIFICATION QUERIES
--  Run these after the init to confirm everything loaded.
-- ============================================================

-- Category count (expect 6)
SELECT 'tool_categories' AS `table`, COUNT(*) AS `rows` FROM `tool_categories`
UNION ALL
-- Type count (expect 16)
SELECT 'tool_types',       COUNT(*) FROM `tool_types`
UNION ALL
-- Tool count (expect 18)
SELECT 'tools',            COUNT(*) FROM `tools`
UNION ALL
-- Unit count (expect 46)
SELECT 'tool_units',       COUNT(*) FROM `tool_units`;

-- Quick check: tools per category with available unit counts
SELECT
   tc.`name`       AS category,
   tt.`name`       AS type,
   t.`name`        AS tool,
   t.`daily_rate`,
   t.`deposit`,
   COUNT(tu.`id`)                                          AS total_units,
   SUM(CASE WHEN tu.`status` = 'available' THEN 1 ELSE 0 END) AS available_units
FROM `tool_categories` tc
JOIN `tool_types` tt   ON tt.`category_id` = tc.`id`
JOIN `tools` t         ON t.`type_id`      = tt.`id`
LEFT JOIN `tool_units` tu ON tu.`tool_id`  = t.`id`
GROUP BY tc.`name`, tt.`name`, t.`name`, t.`daily_rate`, t.`deposit`
ORDER BY tc.`sort_order`, tt.`sort_order`, t.`name`;
