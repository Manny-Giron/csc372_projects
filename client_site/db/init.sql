-- ============================================================
-- Rocket Rentals – Database Initialization (v2 operational schema)
-- Target: MySQL 8+ / MariaDB 10.5+ (InnoDB, utf8mb4)
-- Database: emmanue0_RocketRentals
--
-- This script creates a normalized rental-business schema:
-- identity/access, catalog/inventory, contracts, fulfillment,
-- financials, reporting snapshots, audit/notifications, and file refs.
--
-- Run once against an empty database (or after DROP of prior objects).
-- Tables are dropped in dependency-safe order (children before parents).
-- ============================================================

USE `emmanue0_RocketRentals`;

-- ------------------------------------------------------------
-- Optional: ensure clean session charset
-- ------------------------------------------------------------
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- DROP TABLES (dependency order: leaf → root)
-- ============================================================

DROP TABLE IF EXISTS `write_down_events`;
DROP TABLE IF EXISTS `repair_events`;
DROP TABLE IF EXISTS `damage_reports`;
DROP TABLE IF EXISTS `rental_contract_items`;
DROP TABLE IF EXISTS `maintenance_events`;
DROP TABLE IF EXISTS `tool_unit_status_history`;
DROP TABLE IF EXISTS `contract_fulfillment_jobs`;
DROP TABLE IF EXISTS `refunds`;
DROP TABLE IF EXISTS `payments`;
DROP TABLE IF EXISTS `contract_adjustments`;
DROP TABLE IF EXISTS `rental_contracts`;
DROP TABLE IF EXISTS `file_attachments`;
DROP TABLE IF EXISTS `notifications_log`;
DROP TABLE IF EXISTS `audit_log`;
DROP TABLE IF EXISTS `daily_business_metrics`;
DROP TABLE IF EXISTS `tool_units`;
DROP TABLE IF EXISTS `tools`;
DROP TABLE IF EXISTS `tool_types`;
DROP TABLE IF EXISTS `tool_categories`;
DROP TABLE IF EXISTS `customer_addresses`;
DROP TABLE IF EXISTS `customer_profiles`;
DROP TABLE IF EXISTS `staff_profiles`;
DROP TABLE IF EXISTS `user_role_assignments`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `roles`;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- 1. IDENTITY / ACCESS
--    Unified users with role assignments. Application auth maps
--    roles to permissions (customer vs associate vs admin).
-- ============================================================

CREATE TABLE `roles` (
   `id`          SMALLINT      UNSIGNED AUTO_INCREMENT PRIMARY KEY,
   `name`        VARCHAR(32)   NOT NULL UNIQUE,
   `description` VARCHAR(255)  DEFAULT NULL,
   `created_at`  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
   `updated_at`  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `roles` (`name`, `description`) VALUES
   ('customer',  'External renter; catalog, checkout, account, rental history.'),
   ('associate', 'Operations: rentals, fulfillment jobs, inventory updates; no full business metrics.'),
   ('admin',     'Full business visibility, staff, settings, dashboards, financial oversight.');

CREATE TABLE `users` (
   `id`                 INT            UNSIGNED AUTO_INCREMENT PRIMARY KEY,
   `email`              VARCHAR(255)   NOT NULL UNIQUE,
   `password_hash`      VARCHAR(255)   NOT NULL COMMENT 'Argon2/bcrypt hash; length allows future algorithms',
   `is_active`          TINYINT(1)     NOT NULL DEFAULT 1,
   `email_verified_at`  DATETIME       DEFAULT NULL,
   `last_login_at`      DATETIME       DEFAULT NULL,
   `created_at`         DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
   `updated_at`         DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

   INDEX `idx_users_active` (`is_active`),
   INDEX `idx_users_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_role_assignments` (
   `id`         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
   `user_id`    INT UNSIGNED NOT NULL,
   `role_id`    SMALLINT UNSIGNED NOT NULL,
   `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

   UNIQUE KEY `uq_user_role` (`user_id`, `role_id`),
   INDEX `idx_ura_role` (`role_id`),
   CONSTRAINT `fk_ura_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
      ON DELETE CASCADE ON UPDATE CASCADE,
   CONSTRAINT `fk_ura_role` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`)
      ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `customer_profiles` (
   `user_id`              INT UNSIGNED NOT NULL PRIMARY KEY,
   `first_name`           VARCHAR(100) NOT NULL,
   `last_name`            VARCHAR(100) NOT NULL,
   `phone`                VARCHAR(32)  DEFAULT NULL,
   `government_id_type`   ENUM('none','drivers_license','state_id','passport','other') NOT NULL DEFAULT 'none',
   `government_id_last4`  CHAR(4)      DEFAULT NULL COMMENT 'Last 4 only; full ID never stored in DB',
   `license_verified_at`  DATETIME     DEFAULT NULL,
   `account_notes`        VARCHAR(500) DEFAULT NULL COMMENT 'Internal notes; not shown to customer',
   `marketing_opt_in`     TINYINT(1)   NOT NULL DEFAULT 0,
   `created_at`           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
   `updated_at`           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

   CONSTRAINT `fk_cust_profile_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
      ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `staff_profiles` (
   `user_id`            INT UNSIGNED NOT NULL PRIMARY KEY,
   `employee_id`        VARCHAR(32)  DEFAULT NULL UNIQUE,
   `department`         VARCHAR(64)  DEFAULT NULL,
   `phone`              VARCHAR(32)  DEFAULT NULL,
   `phone_extension`    VARCHAR(16)  DEFAULT NULL,
   `employment_status`  ENUM('active','leave','terminated') NOT NULL DEFAULT 'active',
   `hire_date`          DATE         DEFAULT NULL,
   `internal_notes`     VARCHAR(500) DEFAULT NULL,
   `created_at`         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
   `updated_at`         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

   INDEX `idx_staff_employment` (`employment_status`),
   CONSTRAINT `fk_staff_profile_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
      ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `customer_addresses` (
   `id`                     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
   `user_id`                INT UNSIGNED NOT NULL,
   `label`                  VARCHAR(64)  DEFAULT NULL COMMENT 'e.g. Home, Jobsite',
   `line1`                  VARCHAR(255) NOT NULL,
   `line2`                  VARCHAR(255) DEFAULT NULL,
   `city`                   VARCHAR(100) NOT NULL,
   `state_region`           VARCHAR(64)  DEFAULT NULL,
   `postal_code`            VARCHAR(20)  DEFAULT NULL,
   `country_code`           CHAR(2)      NOT NULL DEFAULT 'US',
   `is_default`             TINYINT(1)   NOT NULL DEFAULT 0,
   `delivery_instructions`  VARCHAR(500) DEFAULT NULL,
   `created_at`             DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
   `updated_at`             DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

   INDEX `idx_addr_user` (`user_id`),
   INDEX `idx_addr_default` (`user_id`, `is_default`),
   CONSTRAINT `fk_addr_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
      ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 2. CATALOG / INVENTORY
--    Preserves tool_categories → tool_types → tools → tool_units.
-- ============================================================

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `tool_categories` (`key`, `name`, `description`, `featured`, `sort_order`) VALUES
   ('power',    'Power Tools',        'Drills, saws, sanders, nailers, and more.',              1, 1),
   ('lawn',     'Lawn & Outdoor',     'Seasonal equipment for yard projects.',                  0, 2),
   ('masonry',  'Concrete & Masonry', 'Mixing, cutting, and surface prep equipment.',           0, 3),
   ('cleaning', 'Cleaning',           'For jobsite cleanup, garages, and home refresh.',         0, 4),
   ('ladders',  'Ladders & Lifts',    'Reach higher safely with delivery-focused equipment.',   0, 5),
   ('trailers', 'Trailers & Hauling', 'Move materials, equipment, and debris.',                 0, 6);

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
   INDEX `idx_type_category` (`category_id`),
   CONSTRAINT `fk_type_category` FOREIGN KEY (`category_id`)
      REFERENCES `tool_categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `tool_types` (`category_id`, `key`, `name`, `sort_order`) VALUES
   (1, 'drills',           'Drills & Drivers',       1),
   (1, 'saws',             'Saws',                   2),
   (1, 'hammers',          'Hammers',                3),
   (2, 'tillers',          'Tillers',                1),
   (2, 'blowers',          'Blowers',                2),
   (2, 'cutters',          'Brush Cutters',          3),
   (3, 'mixers',           'Mixers',                 1),
   (3, 'masonry-saws',     'Tile & Masonry Saws',    2),
   (3, 'grinders',         'Grinders',                 3),
   (4, 'pressure-washers', 'Pressure Washers',       1),
   (4, 'vacuums',          'Vacuums',                2),
   (4, 'carpet-cleaners',  'Carpet Cleaners',        3),
   (5, 'ladders',          'Ladders',                1),
   (5, 'scaffolds',        'Scaffolds',                2),
   (6, 'trailers',         'Trailers',               1),
   (6, 'hand-equipment',   'Hand Equipment',         2);

CREATE TABLE `tools` (
   `id`            INT            AUTO_INCREMENT PRIMARY KEY,
   `type_id`       INT            NOT NULL,
   `name`          VARCHAR(150)   NOT NULL,
   `slug`          VARCHAR(150)   NOT NULL UNIQUE,
   `description`   TEXT           NOT NULL,
   `daily_rate`    DECIMAL(10,2)  NOT NULL COMMENT 'Current list rate; contract lines snapshot their own',
   `deposit`       DECIMAL(10,2)  NOT NULL DEFAULT 0.00 COMMENT 'Suggested deposit; copied to contract items',
   `delivery_only` TINYINT(1)     NOT NULL DEFAULT 0,
   `image_url`     VARCHAR(500)   DEFAULT NULL,
   `is_active`     TINYINT(1)     NOT NULL DEFAULT 1,
   `created_at`    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
   `updated_at`    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

   INDEX `idx_tools_type` (`type_id`),
   INDEX `idx_tools_active` (`is_active`),
   CONSTRAINT `fk_tool_type` FOREIGN KEY (`type_id`)
      REFERENCES `tool_types`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `tools` (`type_id`, `name`, `slug`, `description`, `daily_rate`, `deposit`, `delivery_only`) VALUES
   (1,  'Impact Driver',     'impact-driver',     'Compact fastening tool for framing, decking, and general construction jobs.',             18.00,  50.00,  0),
   (2,  'Circular Saw',      'circular-saw',      'Portable cutting tool for plywood, framing lumber, and jobsite cuts.',                    22.00,  60.00,  0),
   (3,  'Rotary Hammer',     'rotary-hammer',     'Heavy-duty drilling tool for concrete, anchors, and masonry work.',                      30.00,  75.00,  0),
   (4,  'Tiller',            'tiller',            'Break up soil for garden beds, landscaping, and yard preparation.',                       35.00,  80.00,  1),
   (5,  'Leaf Blower',       'leaf-blower',       'Clear leaves, grass clippings, and debris from outdoor spaces.',                          15.00,  40.00,  0),
   (6,  'Brush Cutter',      'brush-cutter',      'Cut through overgrowth, weeds, and thick brush along property edges.',                   28.00,  65.00,  1),
   (7,  'Concrete Mixer',    'concrete-mixer',    'Mix concrete, mortar, and other materials for slab and repair work.',                     45.00, 100.00,  1),
   (8,  'Wet Saw',           'wet-saw',           'Precision tile and masonry cutting with water-cooled blade support.',                     38.00,  90.00,  0),
   (9,  'Angle Grinder',     'angle-grinder',     'Grinding and cutting tool for metal, masonry, and surface prep.',                        20.00,  55.00,  0),
   (10, 'Pressure Washer',   'pressure-washer',   'High-pressure cleaning tool for siding, driveways, patios, and equipment.',              40.00,  85.00,  1),
   (11, 'Shop Vac',          'shop-vac',          'Wet/dry vacuum for garages, workshops, and construction cleanup.',                       12.00,  35.00,  0),
   (12, 'Carpet Cleaner',    'carpet-cleaner',    'Deep-clean carpets and rugs for home refresh or move-out cleanup.',                      25.00,  60.00,  0),
   (13, 'Extension Ladder',  'extension-ladder',  'Tall ladder for exterior work, roofing access, and elevated repairs.',                   18.00,  50.00,  1),
   (13, 'Step Ladder',       'step-ladder',       'Standard ladder for indoor tasks, painting, and maintenance work.',                      10.00,  30.00,  0),
   (14, 'Scaffold',          'scaffold',          'Stable elevated work platform for larger painting and repair jobs.',                     55.00, 120.00,  1),
   -- 15 = trailers, 16 = hand-equipment (`tool_types` has exactly 16 rows → ids 1–16)
   (15, 'Utility Trailer',   'utility-trailer',   'Trailer for hauling tools, lumber, yard waste, and light materials.',                    60.00, 150.00,  1),
   (15, 'Dump Trailer',      'dump-trailer',      'Heavy-duty trailer for debris, demolition waste, and bulk materials.',                   95.00, 200.00,  1),
   (16, 'Hand Truck',        'hand-truck',        'Manual moving support for appliances, boxes, and stacked materials.',                     8.00,  20.00,  0);

CREATE TABLE `tool_units` (
   `id`                    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
   `tool_id`               INT            NOT NULL,
   `asset_tag`             VARCHAR(64)    DEFAULT NULL UNIQUE COMMENT 'Internal barcode / inventory code',
   `serial_number`         VARCHAR(100)   DEFAULT NULL,
   `condition`             ENUM('new','good','fair','poor') NOT NULL DEFAULT 'good',
   `operational_status`    ENUM('in_service','out_of_service','retired') NOT NULL DEFAULT 'in_service',
   -- `status`: physical availability in the rental pool (same column name as v1 for app compatibility)
   `status`                ENUM('available','rented','reserved','in_transit','maintenance','retired') NOT NULL DEFAULT 'available',
   `home_location`         VARCHAR(120)   DEFAULT NULL COMMENT 'Yard / rack / warehouse slot',
   `purchase_cost`         DECIMAL(12,2)  DEFAULT NULL,
   `replacement_cost`      DECIMAL(12,2)  DEFAULT NULL,
   `acquired_date`         DATE           DEFAULT NULL,
   `notes`                 TEXT           DEFAULT NULL,
   `created_at`            DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
   `updated_at`            DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

   UNIQUE KEY `uq_unit_serial` (`serial_number`),
   INDEX `idx_unit_tool` (`tool_id`),
   INDEX `idx_unit_status` (`status`),
   INDEX `idx_unit_operational` (`operational_status`),
   CONSTRAINT `fk_unit_tool` FOREIGN KEY (`tool_id`)
      REFERENCES `tools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `tool_units` (`tool_id`, `asset_tag`, `serial_number`, `condition`, `operational_status`, `status`, `home_location`, `purchase_cost`, `replacement_cost`, `acquired_date`) VALUES
   (1,  'RR-PWR-001', 'RR-PWR-001',  'new',   'in_service', 'available',  'Aisle A1', 120.00,  95.00,  '2025-06-01'),
   (1,  'RR-PWR-002', 'RR-PWR-002',  'good',  'in_service', 'available',  'Aisle A1', 110.00,  95.00,  '2025-06-01'),
   (1,  'RR-PWR-003', 'RR-PWR-003',  'good',  'in_service', 'rented',     'Aisle A1', 110.00,  95.00,  '2025-08-15'),
   (2,  'RR-PWR-004', 'RR-PWR-004',  'new',   'in_service', 'available',  'Aisle A2', 180.00, 140.00,  '2025-07-01'),
   (2,  'RR-PWR-005', 'RR-PWR-005',  'good',  'in_service', 'available',  'Aisle A2', 160.00, 140.00,  '2025-07-01'),
   (3,  'RR-PWR-006', 'RR-PWR-006',  'good',  'in_service', 'available',  'Aisle A3', 220.00, 180.00,  '2025-05-20'),
   (3,  'RR-PWR-007', 'RR-PWR-007',  'fair',  'in_service', 'available',  'Aisle A3', 200.00, 180.00,  '2024-11-10'),
   (4,  'RR-LWN-001', 'RR-LWN-001',  'good',  'in_service', 'available',  'Bay B1',   400.00, 350.00,  '2025-03-01'),
   (4,  'RR-LWN-002', 'RR-LWN-002',  'good',  'in_service', 'rented',     'Bay B1',   400.00, 350.00,  '2025-03-01'),
   (5,  'RR-LWN-003', 'RR-LWN-003',  'new',   'in_service', 'available',  'Bay B2',    90.00,  75.00,  '2025-09-01'),
   (5,  'RR-LWN-004', 'RR-LWN-004',  'good',  'in_service', 'available',  'Bay B2',    85.00,  75.00,  '2025-09-01'),
   (5,  'RR-LWN-005', 'RR-LWN-005',  'good',  'in_service', 'available',  'Bay B2',    85.00,  75.00,  '2025-04-15'),
   (6,  'RR-LWN-006', 'RR-LWN-006',  'good',  'in_service', 'available',  'Bay B3',   240.00, 200.00,  '2025-06-10'),
   (6,  'RR-LWN-007', 'RR-LWN-007',  'fair',  'in_service', 'rented',     'Bay B3',   220.00, 200.00,  '2025-01-20'),
   (7,  'RR-MSN-001', 'RR-MSN-001',  'good',  'in_service', 'available',  'Bay C1',   520.00, 450.00,  '2025-04-01'),
   (7,  'RR-MSN-002', 'RR-MSN-002',  'good',  'in_service', 'available',  'Bay C1',   520.00, 450.00,  '2025-04-01'),
   (8,  'RR-MSN-003', 'RR-MSN-003',  'new',   'in_service', 'available',  'Aisle C2', 320.00, 280.00,  '2025-08-01'),
   (8,  'RR-MSN-004', 'RR-MSN-004',  'good',  'in_service', 'available',  'Aisle C2', 300.00, 280.00,  '2025-02-15'),
   (9,  'RR-MSN-005', 'RR-MSN-005',  'good',  'in_service', 'available',  'Aisle C3', 110.00,  95.00,  '2025-05-01'),
   (9,  'RR-MSN-006', 'RR-MSN-006',  'good',  'in_service', 'available',  'Aisle C3', 110.00,  95.00,  '2025-05-01'),
   (9,  'RR-MSN-007', 'RR-MSN-007',  'new',   'in_service', 'available',  'Aisle C3', 115.00,  95.00,  '2025-10-01'),
   (10, 'RR-CLN-001', 'RR-CLN-001',  'good',  'in_service', 'available',  'Bay D1',   280.00, 240.00,  '2025-03-15'),
   (10, 'RR-CLN-002', 'RR-CLN-002',  'good',  'in_service', 'rented',     'Bay D1',   280.00, 240.00,  '2025-03-15'),
   (11, 'RR-CLN-003', 'RR-CLN-003',  'good',  'in_service', 'available',  'Bay D2',    75.00,  65.00,  '2025-06-01'),
   (11, 'RR-CLN-004', 'RR-CLN-004',  'new',   'in_service', 'available',  'Bay D2',    80.00,  65.00,  '2025-09-10'),
   (11, 'RR-CLN-005', 'RR-CLN-005',  'good',  'in_service', 'available',  'Bay D2',    75.00,  65.00,  '2025-06-01'),
   (12, 'RR-CLN-006', 'RR-CLN-006',  'good',  'in_service', 'available',  'Bay D3',   180.00, 150.00,  '2025-07-20'),
   (12, 'RR-CLN-007', 'RR-CLN-007',  'good',  'in_service', 'available',  'Bay D3',   180.00, 150.00,  '2025-07-20'),
   (13, 'RR-LDR-001', 'RR-LDR-001',  'good',  'in_service', 'available',  'Rack E1',  140.00, 120.00,  '2025-02-01'),
   (13, 'RR-LDR-002', 'RR-LDR-002',  'good',  'in_service', 'rented',     'Rack E1',  140.00, 120.00,  '2025-02-01'),
   (14, 'RR-LDR-003', 'RR-LDR-003',  'new',   'in_service', 'available',  'Rack E2',   55.00,  45.00,  '2025-08-01'),
   (14, 'RR-LDR-004', 'RR-LDR-004',  'good',  'in_service', 'available',  'Rack E2',   50.00,  45.00,  '2025-08-01'),
   (14, 'RR-LDR-005', 'RR-LDR-005',  'good',  'in_service', 'available',  'Rack E2',   50.00,  45.00,  '2025-05-15'),
   (15, 'RR-LDR-006', 'RR-LDR-006',  'good',  'in_service', 'available',  'Yard F1',  480.00, 420.00,  '2025-01-10'),
   (15, 'RR-LDR-007', 'RR-LDR-007',  'good',  'in_service', 'reserved',   'Yard F1',  480.00, 420.00,  '2025-01-10'),
   (16, 'RR-TRL-001', 'RR-TRL-001',  'good',  'in_service', 'available',  'Lot G1',  1200.00, 1000.00, '2025-04-01'),
   (16, 'RR-TRL-002', 'RR-TRL-002',  'good',  'in_service', 'available',  'Lot G1',  1200.00, 1000.00, '2025-04-01'),
   (17, 'RR-TRL-003', 'RR-TRL-003',  'good',  'in_service', 'available',  'Lot G2',  2200.00, 1900.00, '2025-06-15'),
   (18, 'RR-TRL-004', 'RR-TRL-004',  'good',  'in_service', 'available',  'Rack G3',   45.00,  40.00,  '2025-01-01'),
   (18, 'RR-TRL-005', 'RR-TRL-005',  'good',  'in_service', 'available',  'Rack G3',   45.00,  40.00,  '2025-01-01'),
   (18, 'RR-TRL-006', 'RR-TRL-006',  'new',   'in_service', 'available',  'Rack G3',   48.00,  40.00,  '2025-07-01'),
   (18, 'RR-TRL-007', 'RR-TRL-007',  'fair',  'in_service', 'available',  'Rack G3',   40.00,  40.00,  '2024-09-01');

CREATE TABLE `tool_unit_status_history` (
   `id`              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
   `tool_unit_id`    INT UNSIGNED NOT NULL,
   `from_status` ENUM('available','rented','reserved','in_transit','maintenance','retired') DEFAULT NULL,
   `to_status`   ENUM('available','rented','reserved','in_transit','maintenance','retired') NOT NULL,
   `from_operational_status` ENUM('in_service','out_of_service','retired') DEFAULT NULL,
   `to_operational_status`   ENUM('in_service','out_of_service','retired') DEFAULT NULL,
   `reason`          VARCHAR(255) DEFAULT NULL,
   `related_contract_id` INT UNSIGNED DEFAULT NULL COMMENT 'Set when transition tied to a rental',
   `changed_by_user_id` INT UNSIGNED DEFAULT NULL,
   `created_at`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

   INDEX `idx_tush_unit` (`tool_unit_id`, `created_at`),
   INDEX `idx_tush_contract` (`related_contract_id`),
   CONSTRAINT `fk_tush_unit` FOREIGN KEY (`tool_unit_id`) REFERENCES `tool_units`(`id`)
      ON DELETE CASCADE ON UPDATE CASCADE,
   CONSTRAINT `fk_tush_user` FOREIGN KEY (`changed_by_user_id`) REFERENCES `users`(`id`)
      ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `maintenance_events` (
   `id`                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
   `tool_unit_id`       INT UNSIGNED NOT NULL,
   `event_type`         ENUM('scheduled','repair','inspection','cleaning','other') NOT NULL DEFAULT 'repair',
   `summary`            VARCHAR(255) NOT NULL,
   `detail`             TEXT DEFAULT NULL,
   `cost`               DECIMAL(12,2) DEFAULT NULL,
   `started_at`         DATETIME DEFAULT NULL,
   `completed_at`       DATETIME DEFAULT NULL,
   `performed_by_user_id` INT UNSIGNED DEFAULT NULL,
   `created_at`         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
   `updated_at`         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

   INDEX `idx_maint_unit` (`tool_unit_id`),
   INDEX `idx_maint_completed` (`completed_at`),
   CONSTRAINT `fk_maint_unit` FOREIGN KEY (`tool_unit_id`) REFERENCES `tool_units`(`id`)
      ON DELETE CASCADE ON UPDATE CASCADE,
   CONSTRAINT `fk_maint_user` FOREIGN KEY (`performed_by_user_id`) REFERENCES `users`(`id`)
      ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `damage_reports` (
   `id`                      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
   `tool_unit_id`            INT UNSIGNED NOT NULL,
   `rental_contract_item_id` INT UNSIGNED DEFAULT NULL,
   `reported_by_user_id`     INT UNSIGNED DEFAULT NULL,
   `severity`                ENUM('cosmetic','functional','total_loss') NOT NULL DEFAULT 'cosmetic',
   `description`             TEXT NOT NULL,
   `reported_at`             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
   `resolved_at`             DATETIME DEFAULT NULL,
   `created_at`              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
   `updated_at`              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

   INDEX `idx_damage_unit` (`tool_unit_id`),
   INDEX `idx_damage_item` (`rental_contract_item_id`),
   CONSTRAINT `fk_damage_unit` FOREIGN KEY (`tool_unit_id`) REFERENCES `tool_units`(`id`)
      ON DELETE CASCADE ON UPDATE CASCADE,
   CONSTRAINT `fk_damage_reporter` FOREIGN KEY (`reported_by_user_id`) REFERENCES `users`(`id`)
      ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Forward reference: rental_contract_items created below; FK added after that table.
-- damage_reports.rental_contract_item_id filled by app after line exists.

-- ============================================================
-- 3. RENTAL CONTRACTS & LINE ITEMS
-- ============================================================

CREATE TABLE `rental_contracts` (
   `id`                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
   `contract_number`      VARCHAR(32) NOT NULL UNIQUE,
   `customer_user_id`     INT UNSIGNED NOT NULL,
   `billing_address_id`      INT UNSIGNED DEFAULT NULL,
   `delivery_address_id`     INT UNSIGNED DEFAULT NULL,
   `status`                  ENUM('draft','scheduled','confirmed','active','closed','cancelled') NOT NULL DEFAULT 'draft',
   `scheduled_start`         DATETIME NOT NULL,
   `scheduled_end`           DATETIME NOT NULL,
   `actual_start`            DATETIME DEFAULT NULL,
   `actual_end`              DATETIME DEFAULT NULL,
   `subtotal`                DECIMAL(12,2) NOT NULL DEFAULT 0.00,
   `deposit_total`           DECIMAL(12,2) NOT NULL DEFAULT 0.00,
   `tax_total`               DECIMAL(12,2) NOT NULL DEFAULT 0.00,
   `fees_total`              DECIMAL(12,2) NOT NULL DEFAULT 0.00,
   `discount_total`          DECIMAL(12,2) NOT NULL DEFAULT 0.00,
   `grand_total`             DECIMAL(12,2) NOT NULL DEFAULT 0.00,
   `currency_code`           CHAR(3) NOT NULL DEFAULT 'USD',
   `terms_version`           VARCHAR(32) DEFAULT NULL,
   `terms_accepted_at`       DATETIME DEFAULT NULL,
   `signed_at`               DATETIME DEFAULT NULL,
   `signature_attachment_id` INT UNSIGNED DEFAULT NULL COMMENT 'FK to file_attachments after insert',
   `notes`                   TEXT DEFAULT NULL,
   `created_at`              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
   `updated_at`              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

   INDEX `idx_contract_customer` (`customer_user_id`),
   INDEX `idx_contract_status` (`status`),
   INDEX `idx_contract_scheduled` (`scheduled_start`, `scheduled_end`),
   CONSTRAINT `fk_contract_customer` FOREIGN KEY (`customer_user_id`) REFERENCES `users`(`id`)
      ON DELETE RESTRICT ON UPDATE CASCADE,
   CONSTRAINT `fk_contract_billing_addr` FOREIGN KEY (`billing_address_id`) REFERENCES `customer_addresses`(`id`)
      ON DELETE SET NULL ON UPDATE CASCADE,
   CONSTRAINT `fk_contract_delivery_addr` FOREIGN KEY (`delivery_address_id`) REFERENCES `customer_addresses`(`id`)
      ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `rental_contract_items` (
   `id`                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
   `rental_contract_id` INT UNSIGNED NOT NULL,
   `tool_id`            INT NOT NULL,
   `tool_unit_id`       INT UNSIGNED DEFAULT NULL COMMENT 'Specific asset when allocated',
   `quantity`           INT UNSIGNED NOT NULL DEFAULT 1,
   `daily_rate_snapshot`   DECIMAL(10,2) NOT NULL,
   `deposit_snapshot`      DECIMAL(10,2) NOT NULL DEFAULT 0.00,
   `rental_days`        INT UNSIGNED NOT NULL DEFAULT 1,
   `line_subtotal`      DECIMAL(12,2) NOT NULL DEFAULT 0.00,
   `period_start`       DATE DEFAULT NULL,
   `period_end`         DATE DEFAULT NULL,
   `item_status`        ENUM('pending','reserved','out','returned','cancelled','damaged') NOT NULL DEFAULT 'pending',
   `notes`              VARCHAR(500) DEFAULT NULL,
   `created_at`         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
   `updated_at`         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

   INDEX `idx_rci_contract` (`rental_contract_id`),
   INDEX `idx_rci_tool` (`tool_id`),
   INDEX `idx_rci_unit` (`tool_unit_id`),
   INDEX `idx_rci_status` (`item_status`),
   CONSTRAINT `fk_rci_contract` FOREIGN KEY (`rental_contract_id`) REFERENCES `rental_contracts`(`id`)
      ON DELETE CASCADE ON UPDATE CASCADE,
   CONSTRAINT `fk_rci_tool` FOREIGN KEY (`tool_id`) REFERENCES `tools`(`id`)
      ON DELETE RESTRICT ON UPDATE CASCADE,
   CONSTRAINT `fk_rci_unit` FOREIGN KEY (`tool_unit_id`) REFERENCES `tool_units`(`id`)
      ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add FK from damage_reports to rental_contract_items (table now exists)
ALTER TABLE `damage_reports`
   ADD CONSTRAINT `fk_damage_contract_item` FOREIGN KEY (`rental_contract_item_id`) REFERENCES `rental_contract_items`(`id`)
      ON DELETE SET NULL ON UPDATE CASCADE;

-- Link contracts to signature file (file_attachments defined in section 7)
-- FK added after file_attachments table exists — see end of script.

-- ============================================================
-- 4. FULFILLMENT JOBS (delivery / pickup operations)
-- ============================================================

CREATE TABLE `contract_fulfillment_jobs` (
   `id`                      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
   `rental_contract_id`      INT UNSIGNED NOT NULL,
   `job_type`                ENUM('delivery','pickup') NOT NULL,
   `job_status`              ENUM('unassigned','assigned','in_progress','completed','failed','rescheduled','cancelled') NOT NULL DEFAULT 'unassigned',
   `assigned_staff_user_id`  INT UNSIGNED DEFAULT NULL,
   `address_id`              INT UNSIGNED DEFAULT NULL COMMENT 'Override or snapshot address for routing',
   `scheduled_at`            DATETIME NOT NULL,
   `arrived_at`              DATETIME DEFAULT NULL,
   `completed_at`            DATETIME DEFAULT NULL,
   `proof_attachment_id`     INT UNSIGNED DEFAULT NULL COMMENT 'Photo / POD reference',
   `failure_reason`          VARCHAR(255) DEFAULT NULL,
   `notes`                   TEXT DEFAULT NULL,
   `created_at`              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
   `updated_at`              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

   INDEX `idx_ff_contract` (`rental_contract_id`),
   INDEX `idx_ff_status` (`job_status`),
   INDEX `idx_ff_scheduled` (`scheduled_at`),
   INDEX `idx_ff_assigned` (`assigned_staff_user_id`),
   CONSTRAINT `fk_ff_contract` FOREIGN KEY (`rental_contract_id`) REFERENCES `rental_contracts`(`id`)
      ON DELETE CASCADE ON UPDATE CASCADE,
   CONSTRAINT `fk_ff_staff` FOREIGN KEY (`assigned_staff_user_id`) REFERENCES `users`(`id`)
      ON DELETE SET NULL ON UPDATE CASCADE,
   CONSTRAINT `fk_ff_address` FOREIGN KEY (`address_id`) REFERENCES `customer_addresses`(`id`)
      ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 5. FINANCIAL TRACKING
-- ============================================================

CREATE TABLE `payments` (
   `id`                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
   `rental_contract_id`   INT UNSIGNED NOT NULL,
   `amount`               DECIMAL(12,2) NOT NULL,
   `currency_code`        CHAR(3) NOT NULL DEFAULT 'USD',
   `payment_type`         ENUM('rental_charge','deposit','balance','extension','other') NOT NULL DEFAULT 'rental_charge',
   `payment_method`       ENUM('card','cash','ach','other') NOT NULL DEFAULT 'card',
   `status`               ENUM('pending','authorized','paid','failed','refunded','partially_refunded') NOT NULL DEFAULT 'pending',
   `provider`             VARCHAR(32) DEFAULT NULL COMMENT 'stripe, square, etc.',
   `provider_payment_id`  VARCHAR(128) DEFAULT NULL,
   `provider_customer_id` VARCHAR(128) DEFAULT NULL,
   `idempotency_key`      VARCHAR(64) DEFAULT NULL,
   `paid_at`              DATETIME DEFAULT NULL,
   `recorded_by_user_id`  INT UNSIGNED DEFAULT NULL,
   `created_at`           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
   `updated_at`           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

   INDEX `idx_pay_contract` (`rental_contract_id`),
   INDEX `idx_pay_status` (`status`),
   INDEX `idx_pay_provider` (`provider`, `provider_payment_id`),
   INDEX `idx_pay_created` (`created_at`),
   CONSTRAINT `fk_pay_contract` FOREIGN KEY (`rental_contract_id`) REFERENCES `rental_contracts`(`id`)
      ON DELETE RESTRICT ON UPDATE CASCADE,
   CONSTRAINT `fk_pay_recorded_by` FOREIGN KEY (`recorded_by_user_id`) REFERENCES `users`(`id`)
      ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `refunds` (
   `id`                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
   `payment_id`          INT UNSIGNED NOT NULL,
   `amount`              DECIMAL(12,2) NOT NULL,
   `reason`              VARCHAR(255) DEFAULT NULL,
   `status`              ENUM('pending','completed','failed') NOT NULL DEFAULT 'pending',
   `provider_refund_id`  VARCHAR(128) DEFAULT NULL,
   `processed_at`        DATETIME DEFAULT NULL,
   `created_at`          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
   `updated_at`          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

   INDEX `idx_refund_payment` (`payment_id`),
   CONSTRAINT `fk_refund_payment` FOREIGN KEY (`payment_id`) REFERENCES `payments`(`id`)
      ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `contract_adjustments` (
   `id`                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
   `rental_contract_id`   INT UNSIGNED NOT NULL,
   `adjustment_type`      ENUM('discount','late_fee','damage_fee','credit','manual_adjustment','write_off','tax_correction') NOT NULL,
   `amount`               DECIMAL(12,2) NOT NULL COMMENT 'Positive = charge to customer; negative = credit',
   `reason`               VARCHAR(255) NOT NULL,
   `created_by_user_id`   INT UNSIGNED DEFAULT NULL,
   `created_at`           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

   INDEX `idx_adj_contract` (`rental_contract_id`),
   INDEX `idx_adj_type` (`adjustment_type`),
   CONSTRAINT `fk_adj_contract` FOREIGN KEY (`rental_contract_id`) REFERENCES `rental_contracts`(`id`)
      ON DELETE CASCADE ON UPDATE CASCADE,
   CONSTRAINT `fk_adj_user` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`)
      ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `repair_events` (
   `id`                      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
   `tool_unit_id`            INT UNSIGNED NOT NULL,
   `rental_contract_item_id` INT UNSIGNED DEFAULT NULL,
   `damage_report_id`        INT UNSIGNED DEFAULT NULL,
   `repair_cost`             DECIMAL(12,2) NOT NULL DEFAULT 0.00,
   `summary`                 VARCHAR(255) NOT NULL,
   `detail`                  TEXT DEFAULT NULL,
   `occurred_at`             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
   `performed_by_user_id`    INT UNSIGNED DEFAULT NULL,
   `created_at`              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
   `updated_at`              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

   INDEX `idx_rep_unit` (`tool_unit_id`),
   INDEX `idx_rep_item` (`rental_contract_item_id`),
   INDEX `idx_rep_damage` (`damage_report_id`),
   CONSTRAINT `fk_rep_unit` FOREIGN KEY (`tool_unit_id`) REFERENCES `tool_units`(`id`)
      ON DELETE RESTRICT ON UPDATE CASCADE,
   CONSTRAINT `fk_rep_item` FOREIGN KEY (`rental_contract_item_id`) REFERENCES `rental_contract_items`(`id`)
      ON DELETE SET NULL ON UPDATE CASCADE,
   CONSTRAINT `fk_rep_damage` FOREIGN KEY (`damage_report_id`) REFERENCES `damage_reports`(`id`)
      ON DELETE SET NULL ON UPDATE CASCADE,
   CONSTRAINT `fk_rep_user` FOREIGN KEY (`performed_by_user_id`) REFERENCES `users`(`id`)
      ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `write_down_events` (
   `id`                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
   `tool_unit_id`      INT UNSIGNED NOT NULL,
   `damage_report_id`  INT UNSIGNED DEFAULT NULL,
   `amount`            DECIMAL(12,2) NOT NULL COMMENT 'Book value reduction / loss',
   `reason`            VARCHAR(255) NOT NULL,
   `posted_by_user_id` INT UNSIGNED DEFAULT NULL,
   `posted_at`         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
   `created_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

   INDEX `idx_wd_unit` (`tool_unit_id`),
   CONSTRAINT `fk_wd_unit` FOREIGN KEY (`tool_unit_id`) REFERENCES `tool_units`(`id`)
      ON DELETE RESTRICT ON UPDATE CASCADE,
   CONSTRAINT `fk_wd_damage` FOREIGN KEY (`damage_report_id`) REFERENCES `damage_reports`(`id`)
      ON DELETE SET NULL ON UPDATE CASCADE,
   CONSTRAINT `fk_wd_user` FOREIGN KEY (`posted_by_user_id`) REFERENCES `users`(`id`)
      ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 6. REPORTING SNAPSHOTS (derived metrics cache — not SOT)
-- ============================================================

CREATE TABLE `daily_business_metrics` (
   `id`                      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
   `metric_date`             DATE NOT NULL,
   `total_revenue`           DECIMAL(14,2) NOT NULL DEFAULT 0.00,
   `rentals_started_count`   INT UNSIGNED NOT NULL DEFAULT 0,
   `rentals_closed_count`    INT UNSIGNED NOT NULL DEFAULT 0,
   `repair_cost_total`       DECIMAL(14,2) NOT NULL DEFAULT 0.00,
   `write_down_total`        DECIMAL(14,2) NOT NULL DEFAULT 0.00,
   `deposits_held`           DECIMAL(14,2) NOT NULL DEFAULT 0.00 COMMENT 'Snapshot of deposit liability',
   `overdue_rentals_count`   INT UNSIGNED NOT NULL DEFAULT 0,
   `utilization_rate`        DECIMAL(5,4) DEFAULT NULL COMMENT 'Optional 0–1 fleet utilization',
   `generated_at`            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
   `source_note`             VARCHAR(255) DEFAULT NULL COMMENT 'e.g. nightly job batch id',

   UNIQUE KEY `uq_metrics_date` (`metric_date`),
   INDEX `idx_metrics_date` (`metric_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 7. AUDIT, NOTIFICATIONS, FILE REFERENCES
-- ============================================================

CREATE TABLE `file_attachments` (
   `id`                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
   `storage_provider`   ENUM('s3','gcs','azure','local','other') NOT NULL DEFAULT 's3',
   `bucket_or_container` VARCHAR(255) DEFAULT NULL,
   `object_key`         VARCHAR(512) NOT NULL,
   `mime_type`          VARCHAR(128) DEFAULT NULL,
   `original_filename`  VARCHAR(255) DEFAULT NULL,
   `byte_size`          BIGINT UNSIGNED DEFAULT NULL,
   `entity_type`        VARCHAR(64) NOT NULL COMMENT 'rental_contract, fulfillment_job, damage_report, ...',
   `entity_id`          BIGINT UNSIGNED NOT NULL,
   `purpose`            ENUM('contract_pdf','signature','delivery_photo','pickup_photo','condition_check','waiver','other') NOT NULL DEFAULT 'other',
   `uploaded_by_user_id` INT UNSIGNED DEFAULT NULL,
   `created_at`         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

   INDEX `idx_file_entity` (`entity_type`, `entity_id`),
   INDEX `idx_file_purpose` (`purpose`),
   CONSTRAINT `fk_file_uploader` FOREIGN KEY (`uploaded_by_user_id`) REFERENCES `users`(`id`)
      ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `audit_log` (
   `id`              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
   `actor_user_id`   INT UNSIGNED DEFAULT NULL,
   `action`          VARCHAR(64) NOT NULL COMMENT 'create, update, status_change, payment, ...',
   `entity_type`     VARCHAR(64) NOT NULL,
   `entity_id`       BIGINT UNSIGNED NOT NULL,
   `old_values`      JSON DEFAULT NULL,
   `new_values`      JSON DEFAULT NULL,
   `ip_address`      VARCHAR(45) DEFAULT NULL,
   `user_agent`      VARCHAR(255) DEFAULT NULL,
   `created_at`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

   INDEX `idx_audit_entity` (`entity_type`, `entity_id`),
   INDEX `idx_audit_actor` (`actor_user_id`),
   INDEX `idx_audit_created` (`created_at`),
   CONSTRAINT `fk_audit_actor` FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`)
      ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `notifications_log` (
   `id`                 BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
   `recipient_user_id`  INT UNSIGNED DEFAULT NULL,
   `channel`            ENUM('email','sms','push','in_app') NOT NULL,
   `template_key`       VARCHAR(64) NOT NULL,
   `payload`            JSON DEFAULT NULL,
   `status`             ENUM('queued','sent','delivered','failed','bounced') NOT NULL DEFAULT 'queued',
   `provider_message_id` VARCHAR(128) DEFAULT NULL,
   `error_message`      VARCHAR(500) DEFAULT NULL,
   `sent_at`            DATETIME DEFAULT NULL,
   `created_at`         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

   INDEX `idx_notif_user` (`recipient_user_id`),
   INDEX `idx_notif_status` (`status`),
   INDEX `idx_notif_created` (`created_at`),
   CONSTRAINT `fk_notif_user` FOREIGN KEY (`recipient_user_id`) REFERENCES `users`(`id`)
      ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- FKs to file_attachments (tables created before file_attachments need ALTER)
ALTER TABLE `rental_contracts`
   ADD CONSTRAINT `fk_contract_signature_file` FOREIGN KEY (`signature_attachment_id`) REFERENCES `file_attachments`(`id`)
      ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `contract_fulfillment_jobs`
   ADD CONSTRAINT `fk_ff_proof_file` FOREIGN KEY (`proof_attachment_id`) REFERENCES `file_attachments`(`id`)
      ON DELETE SET NULL ON UPDATE CASCADE;

-- Forward reference for tool_unit_status_history.related_contract_id
ALTER TABLE `tool_unit_status_history`
   ADD CONSTRAINT `fk_tush_contract` FOREIGN KEY (`related_contract_id`) REFERENCES `rental_contracts`(`id`)
      ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================
-- 8. SEED USERS & SAMPLE OPERATIONAL ROWS (minimal)
--    Password hashes are placeholders — replace via app before production.
-- ============================================================

INSERT INTO `users` (`id`, `email`, `password_hash`, `is_active`) VALUES
   (1, 'customer.demo@rocketrentals.example', '$argon2id$v=19$m=65536,t=3,p=4$PLACEHOLDER', 1),
   (2, 'associate.demo@rocketrentals.example', '$argon2id$v=19$m=65536,t=3,p=4$PLACEHOLDER', 1),
   (3, 'admin.demo@rocketrentals.example',    '$argon2id$v=19$m=65536,t=3,p=4$PLACEHOLDER', 1);

INSERT INTO `user_role_assignments` (`user_id`, `role_id`) VALUES
   (1, 1),
   (2, 2),
   (3, 3);

INSERT INTO `customer_profiles` (`user_id`, `first_name`, `last_name`, `phone`, `government_id_type`) VALUES
   (1, 'Demo', 'Customer', '555-0100', 'drivers_license');

INSERT INTO `staff_profiles` (`user_id`, `employee_id`, `department`, `employment_status`) VALUES
   (2, 'EMP-100', 'Operations', 'active'),
   (3, 'EMP-001', 'Management', 'active');

INSERT INTO `customer_addresses` (`id`, `user_id`, `label`, `line1`, `city`, `state_region`, `postal_code`, `is_default`) VALUES
   (1, 1, 'Home', '100 Main St', 'Houston', 'TX', '77001', 1);

INSERT INTO `rental_contracts` (
   `id`, `contract_number`, `customer_user_id`, `delivery_address_id`, `status`,
   `scheduled_start`, `scheduled_end`, `subtotal`, `deposit_total`, `tax_total`, `fees_total`, `discount_total`, `grand_total`,
   `terms_accepted_at`
) VALUES (
   1, 'RR-2026-00001', 1, 1, 'active',
   '2026-04-10 09:00:00', '2026-04-17 17:00:00',
   126.00, 50.00, 10.40, 15.00, 0.00, 201.40,
   '2026-04-09 14:00:00'
);

INSERT INTO `rental_contract_items` (
   `rental_contract_id`, `tool_id`, `tool_unit_id`, `quantity`,
   `daily_rate_snapshot`, `deposit_snapshot`, `rental_days`, `line_subtotal`, `item_status`
) VALUES
   (1, 1, 3, 1, 18.00, 50.00, 7, 126.00, 'out');

INSERT INTO `contract_fulfillment_jobs` (
   `rental_contract_id`, `job_type`, `job_status`, `assigned_staff_user_id`, `address_id`, `scheduled_at`, `completed_at`
) VALUES
   (1, 'delivery', 'completed', 2, 1, '2026-04-10 08:30:00', '2026-04-10 09:15:00'),
   (1, 'pickup',   'unassigned', NULL, 1, '2026-04-17 16:00:00', NULL);

INSERT INTO `payments` (
   `rental_contract_id`, `amount`, `payment_type`, `payment_method`, `status`, `provider`, `paid_at`, `recorded_by_user_id`
) VALUES
   (1, 50.00, 'deposit', 'card', 'paid', 'stripe', '2026-04-09 14:05:00', 3),
   (1, 151.40, 'balance', 'card', 'paid', 'stripe', '2026-04-10 09:20:00', 2);

INSERT INTO `tool_unit_status_history` (
   `tool_unit_id`, `from_status`, `to_status`, `reason`, `related_contract_id`, `changed_by_user_id`
) VALUES
   (3, 'available', 'rented', 'Rental RR-2026-00001 start', 1, 2);

UPDATE `tool_units` SET `status` = 'rented' WHERE `id` = 3;

INSERT INTO `daily_business_metrics` (
   `metric_date`, `total_revenue`, `rentals_started_count`, `rentals_closed_count`,
   `repair_cost_total`, `write_down_total`, `deposits_held`, `overdue_rentals_count`, `source_note`
) VALUES
   ('2026-04-18', 201.40, 1, 0, 0.00, 0.00, 0.00, 0, 'seed snapshot example');

-- ============================================================
-- 9. VERIFICATION QUERIES (optional — run after init)
-- ============================================================

SELECT 'tool_categories' AS tbl, COUNT(*) AS n FROM `tool_categories`
UNION ALL SELECT 'tool_types', COUNT(*) FROM `tool_types`
UNION ALL SELECT 'tools', COUNT(*) FROM `tools`
UNION ALL SELECT 'tool_units', COUNT(*) FROM `tool_units`
UNION ALL SELECT 'users', COUNT(*) FROM `users`
UNION ALL SELECT 'rental_contracts', COUNT(*) FROM `rental_contracts`;

-- Deeper catalog check (optional):
-- SELECT tc.name AS category, tt.name AS type, t.name AS tool, t.daily_rate, t.deposit,
--        COUNT(tu.id) AS total_units,
--        SUM(CASE WHEN tu.status = 'available' THEN 1 ELSE 0 END) AS available_units
-- FROM tool_categories tc
-- JOIN tool_types tt ON tt.category_id = tc.id
-- JOIN tools t ON t.type_id = tt.id
-- LEFT JOIN tool_units tu ON tu.tool_id = t.id
-- GROUP BY tc.name, tt.name, t.name, t.daily_rate, t.deposit
-- ORDER BY tc.sort_order, tt.sort_order, t.name;
