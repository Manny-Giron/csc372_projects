<?php
/*
Name: Emmanuel Giron
Date: March 7, 2026
Description: Dynamic tools page for Rocket Rentals.
<<<<<<< HEAD
This page reads a category from the URL, creates tool objects,
and displays matching placeholder inventory for that category.
*/

// AI-assistanced:
// b/c of how many tools and categories there are, I used ChatGPT to help generate creations of the objects 
// given the html files containing said data.
// ALSO: GPT Helped me figure out the page query parameter. 
=======
This page reads a category from the URL query string, validates it
against the database, and displays matching tools using prepared statements.
*/

require_once __DIR__ . '/db.php';
>>>>>>> client_site_v5_php

/**
 * RentalTool represents one rentable tool shown on the Rocket Rentals website.
 * Each object stores visible information for a tool card.
 */
class RentalTool
{
   public string $name;
   protected string $categoryKey;
   protected string $description;
   protected float $dailyRate;
   protected bool $deliveryOnly;

   public function __construct(
      string $name,
      string $categoryKey,
      string $description,
      float $dailyRate,
      bool $deliveryOnly = false
   ) {
      $this->name = $name;
      $this->categoryKey = $categoryKey;
      $this->description = $description;
      $this->dailyRate = $dailyRate;
      $this->deliveryOnly = $deliveryOnly;
   }


   public function getCategoryKey(): string
   {
      return $this->categoryKey;
   }


   public function getDescription(): string
   {
      return $this->description;
   }

   public function getFormattedRate(): string
   {
      return '$' . number_format($this->dailyRate, 2) . '/day';
   }

   public function getRentalNote(): string
   {
      if ($this->deliveryOnly) {
         return 'Delivery + pickup only';
      }

      return 'Standard rental';
   }

<<<<<<< HEAD
   /**
    * Checks whether this tool belongs to the selected category.
    */
=======
>>>>>>> client_site_v5_php
   public function matchesCategory(string $category): bool
   {
      return $category === 'all' || $this->categoryKey === $category;
   }
}

<<<<<<< HEAD
$categoryInfo = [
   'all' => [
      'title' => 'All Tools',
      'description' => 'Browse all current placeholder tools across every Rocket Rentals category.'
   ],
   'power' => [
      'title' => 'Power Tools',
      'description' => 'Drills, saws, sanders, nailers, and more.'
   ],
   'lawn' => [
      'title' => 'Lawn & Outdoor',
      'description' => 'Seasonal equipment for yard projects.'
   ],
   'masonry' => [
      'title' => 'Concrete & Masonry',
      'description' => 'Mixing, cutting, and surface prep equipment.'
   ],
   'cleaning' => [
      'title' => 'Cleaning',
      'description' => 'For jobsite cleanup, garages, and home refresh.'
   ],
   'ladders' => [
      'title' => 'Ladders & Lifts',
      'description' => 'Reach higher safely with delivery-focused equipment.'
   ],
   'trailers' => [
      'title' => 'Trailers & Hauling',
      'description' => 'Move materials, equipment, and debris.'
   ]
];


$tools = [
   new RentalTool(
      'Impact Driver',
      'power',
      'Compact fastening tool for framing, decking, and general construction jobs.',
      18.00
   ),
   new RentalTool(
      'Circular Saw',
      'power',
      'Portable cutting tool for plywood, framing lumber, and jobsite cuts.',
      22.00
   ),
   new RentalTool(
      'Rotary Hammer',
      'power',
      'Heavy-duty drilling tool for concrete, anchors, and masonry work.',
      30.00
   ),

   new RentalTool(
      'Tiller',
      'lawn',
      'Break up soil for garden beds, landscaping, and yard preparation.',
      35.00,
      true
   ),
   new RentalTool(
      'Leaf Blower',
      'lawn',
      'Clear leaves, grass clippings, and debris from outdoor spaces.',
      15.00
   ),
   new RentalTool(
      'Brush Cutter',
      'lawn',
      'Cut through overgrowth, weeds, and thick brush along property edges.',
      28.00,
      true
   ),

   new RentalTool(
      'Concrete Mixer',
      'masonry',
      'Mix concrete, mortar, and other materials for slab and repair work.',
      45.00,
      true
   ),
   new RentalTool(
      'Wet Saw',
      'masonry',
      'Precision tile and masonry cutting with water-cooled blade support.',
      38.00
   ),
   new RentalTool(
      'Angle Grinder',
      'masonry',
      'Grinding and cutting tool for metal, masonry, and surface prep.',
      20.00
   ),

   new RentalTool(
      'Pressure Washer',
      'cleaning',
      'High-pressure cleaning tool for siding, driveways, patios, and equipment.',
      40.00,
      true
   ),
   new RentalTool(
      'Shop Vac',
      'cleaning',
      'Wet/dry vacuum for garages, workshops, and construction cleanup.',
      12.00
   ),
   new RentalTool(
      'Carpet Cleaner',
      'cleaning',
      'Deep-clean carpets and rugs for home refresh or move-out cleanup.',
      25.00
   ),

   new RentalTool(
      'Extension Ladder',
      'ladders',
      'Tall ladder for exterior work, roofing access, and elevated repairs.',
      18.00,
      true
   ),
   new RentalTool(
      'Step Ladder',
      'ladders',
      'Standard ladder for indoor tasks, painting, and maintenance work.',
      10.00
   ),
   new RentalTool(
      'Scaffold',
      'ladders',
      'Stable elevated work platform for larger painting and repair jobs.',
      55.00,
      true
   ),

   new RentalTool(
      'Utility Trailer',
      'trailers',
      'Trailer for hauling tools, lumber, yard waste, and light materials.',
      60.00,
      true
   ),
   new RentalTool(
      'Dump Trailer',
      'trailers',
      'Heavy-duty trailer for debris, demolition waste, and bulk materials.',
      95.00,
      true
   ),
   new RentalTool(
      'Hand Truck',
      'trailers',
      'Manual moving support for appliances, boxes, and stacked materials.',
      8.00
   )
];

/*
Read the selected category from the URL.
Default to all tools if the query parameter is missing or invalid.
*/
$selectedCategory = $_GET['category'] ?? 'all';

if (!array_key_exists($selectedCategory, $categoryInfo)) {
   $selectedCategory = 'all';
}

/*
Filter tools so only matching objects display on the page.
*/
$filteredTools = [];

foreach ($tools as $tool) {
   if ($tool->matchesCategory($selectedCategory)) {
      $filteredTools[] = $tool;
   }
}

=======
/*
Build $categoryInfo from the database for sidebar links and page headers.
The 'all' entry is added manually since it has no DB row.
*/
$categoryInfo = [
   'all' => [
      'title' => 'All Tools',
      'description' => 'Browse all available tools across every Rocket Rentals category.'
   ]
];

$catStmt = $pdo->query(
   "SELECT `key`, name, description FROM tool_categories ORDER BY sort_order"
);
$sidebarCategories = $catStmt->fetchAll();

foreach ($sidebarCategories as $cat) {
   $categoryInfo[$cat['key']] = [
      'title' => $cat['name'],
      'description' => $cat['description']
   ];
}

/*
Validate the category query string against known keys.
Uses a prepared statement to confirm the key exists in the database.
*/
$selectedCategory = $_GET['category'] ?? 'all';

if ($selectedCategory !== 'all') {
   $validateStmt = $pdo->prepare(
      "SELECT COUNT(*) FROM tool_categories WHERE `key` = :catKey"
   );
   $validateStmt->execute([':catKey' => $selectedCategory]);

   if ($validateStmt->fetchColumn() === 0) {
      $selectedCategory = 'all';
   }
}

/*
Retrieve tools from the database using a prepared statement.
Joins through tool_types to tool_categories for category filtering.
*/
if ($selectedCategory === 'all') {
   $toolStmt = $pdo->query(
      "SELECT t.name, tc.`key` AS category_key, t.description, t.daily_rate, t.delivery_only
       FROM tools t
       JOIN tool_types tt  ON t.type_id = tt.id
       JOIN tool_categories tc ON tt.category_id = tc.id
       WHERE t.is_active = 1
       ORDER BY tc.sort_order, t.name"
   );
} else {
   $toolStmt = $pdo->prepare(
      "SELECT t.name, tc.`key` AS category_key, t.description, t.daily_rate, t.delivery_only
       FROM tools t
       JOIN tool_types tt  ON t.type_id = tt.id
       JOIN tool_categories tc ON tt.category_id = tc.id
       WHERE t.is_active = 1 AND tc.`key` = :catKey
       ORDER BY t.name"
   );
   $toolStmt->execute([':catKey' => $selectedCategory]);
}

$toolRows = $toolStmt->fetchAll();

$filteredTools = [];
foreach ($toolRows as $row) {
   $filteredTools[] = new RentalTool(
      $row['name'],
      $row['category_key'],
      $row['description'],
      (float) $row['daily_rate'],
      (bool) $row['delivery_only']
   );
}

>>>>>>> client_site_v5_php
$pageTitle = $categoryInfo[$selectedCategory]['title'];
$pageDescription = $categoryInfo[$selectedCategory]['description'];
?>
<!DOCTYPE html>
<html lang="en">

<head>
   <meta charset="UTF-8" />
   <meta name="viewport" content="width=device-width, initial-scale=1.0" />
   <title>
      <?php echo htmlspecialchars($pageTitle); ?> | Rocket Rentals
   </title>
   <link rel="stylesheet" href="../css/toolCategories.css" />

   <style>
      .tool-grid {
         display: grid;
         grid-template-columns: repeat(2, minmax(0, 1fr));
         gap: 16px;
      }

      .tool-card {
         display: block;
         color: black;
         border: 2px solid rgb(240, 240, 240);
         border-radius: 14px;
         padding: 16px;
         background: white;
         transition: 0.2s;
      }

      .tool-card:hover {
         transform: translateY(-4px);
         border-color: rgb(255, 173, 49);
      }

      .tool-card h3 {
         margin: 0;
         font-size: 1.1rem;
      }

      .tool-card p {
         margin: 10px 0 12px;
         color: rgb(90, 90, 90);
         line-height: 1.35;
      }

      .tool-meta {
         display: flex;
         justify-content: space-between;
         align-items: center;
         gap: 10px;
         flex-wrap: wrap;
         margin-top: 10px;
      }

      .tool-rate {
         font-weight: bold;
      }

      .tool-note {
         font-size: 0.85rem;
         padding: 6px 10px;
         border-radius: 999px;
         background: rgb(255, 245, 230);
         border: 1px solid rgb(255, 173, 49);
      }

      .back-link {
         display: inline-block;
         margin-bottom: 16px;
         font-weight: bold;
      }

      .empty-state {
         border: 2px dashed rgb(220, 220, 220);
         border-radius: 14px;
         padding: 20px;
         color: rgb(110, 110, 110);
         background: white;
      }

      @media (max-width: 900px) {
         .tool-grid {
            grid-template-columns: 1fr;
         }
      }
   </style>
</head>

<body>
   <!-- Emmanuel Giron | March 7, 2026
        Dynamic tools page using PHP objects and category filtering.
        The layout intentionally follows the same Rocket Rentals style direction
        as the category landing page.
   -->

   <div id="Navbar">
      <img id="Logo" src="../../documentation/logo.png" alt="Rocket Rentals logo" />
      <div id="NavItems">
         <h2 class="nav-item"><a href="../index.html">Home</a></h2>
         <h2 class="nav-item current-page"><a href="toolsCategories.php">Tools</a></h2>
         <div class="nav-item" aria-label="Cart">
            <a href="../checkout.php">
               <img
                  src="https://media.istockphoto.com/id/1206806317/vector/shopping-cart-icon-isolated-on-white-background.jpg?s=612x612&w=0&k=20&c=1RRQJs5NDhcB67necQn1WCpJX2YMfWZ4rYi1DFKlkNA="
                  alt="Shopping cart icon" />
            </a>
         </div>
      </div>
   </div>

   <main id="ToolCategoriesPage">
      <header class="page-hero">
         <a class="back-link" href="toolsCategories.php">← Back to categories</a>
         <h1>
            <?php echo htmlspecialchars($pageTitle); ?>
         </h1>
         <p class="subtext">
            <?php echo htmlspecialchars($pageDescription); ?>
         </p>
      </header>

      <section class="categories-layout" aria-label="Tools page layout">
         <!-- LEFT SIDEBAR -->
         <aside class="category-sidebar" aria-label="Tool category navigation">
            <div class="sidebar-title-row">
               <h2 class="sidebar-title">Browse</h2>
<<<<<<< HEAD
               <span class="sidebar-badge" aria-label="Placeholder data badge">Placeholder</span>
=======
               <span class="sidebar-badge" aria-label="Live data badge">Live</span>
>>>>>>> client_site_v5_php
            </div>

            <nav class="category-nav">
               <a class="category-link <?php echo $selectedCategory === 'all' ? 'active' : ''; ?>"
                  href="tools.php?category=all">All Tools</a>
<<<<<<< HEAD
               <a class="category-link <?php echo $selectedCategory === 'power' ? 'active' : ''; ?>"
                  href="tools.php?category=power">Power Tools</a>
               <a class="category-link <?php echo $selectedCategory === 'lawn' ? 'active' : ''; ?>"
                  href="tools.php?category=lawn">Lawn & Outdoor</a>
               <a class="category-link <?php echo $selectedCategory === 'masonry' ? 'active' : ''; ?>"
                  href="tools.php?category=masonry">Concrete & Masonry</a>
               <a class="category-link <?php echo $selectedCategory === 'cleaning' ? 'active' : ''; ?>"
                  href="tools.php?category=cleaning">Cleaning</a>
               <a class="category-link <?php echo $selectedCategory === 'ladders' ? 'active' : ''; ?>"
                  href="tools.php?category=ladders">Ladders & Lifts</a>
               <a class="category-link <?php echo $selectedCategory === 'trailers' ? 'active' : ''; ?>"
                  href="tools.php?category=trailers">Trailers & Hauling</a>
=======
               <?php foreach ($sidebarCategories as $cat): ?>
                  <a class="category-link <?php echo $selectedCategory === $cat['key'] ? 'active' : ''; ?>"
                     href="tools.php?category=<?php echo htmlspecialchars(urlencode($cat['key'])); ?>">
                     <?php echo htmlspecialchars($cat['name']); ?>
                  </a>
               <?php endforeach; ?>
>>>>>>> client_site_v5_php
            </nav>

            <div class="sidebar-help" role="note">
               <p>
<<<<<<< HEAD
                  <strong>Note:</strong> This page is using PHP objects to model tools and
                  dynamically render placeholder inventory by category.
=======
                  <strong>Note:</strong> Tools and categories are loaded from the database
                  and filtered using prepared statements via PDO.
>>>>>>> client_site_v5_php
               </p>
            </div>
         </aside>

         <!-- RIGHT CONTENT -->
         <div class="category-content">
            <div class="content-toolbar">
               <h2>
<<<<<<< HEAD
                  Available Placeholder Tools
                  (
                  <?php echo count($filteredTools); ?>)
=======
                  Available Tools
                  (<?php echo count($filteredTools); ?>)
>>>>>>> client_site_v5_php
               </h2>
            </div>

            <p class="content-desc">
<<<<<<< HEAD
               These listings are examples for the assignment and can later be connected
               to a real inventory database.
=======
               Browse tools from our rental inventory. Select a category to filter.
>>>>>>> client_site_v5_php
            </p>

            <?php if (count($filteredTools) > 0): ?>
               <div class="tool-grid">
                  <?php foreach ($filteredTools as $tool): ?>
                     <article class="tool-card">
                        <div class="card-top">
                           <!-- Direct public property access -->
                           <h3>
                              <?php echo htmlspecialchars($tool->name); ?>
                           </h3>
                           <span class="pill">
                              <?php echo htmlspecialchars(ucfirst($tool->getCategoryKey())); ?>
                           </span>
                        </div>

                        <!-- Method call returning visible text -->
                        <p>
                           <?php echo htmlspecialchars($tool->getDescription()); ?>
                        </p>

                        <div class="tool-meta">
                           <span class="tool-rate">
                              <?php echo htmlspecialchars($tool->getFormattedRate()); ?>
                           </span>
                           <span class="tool-note">
                              <?php echo htmlspecialchars($tool->getRentalNote()); ?>
                           </span>
                        </div>
                     </article>
                  <?php endforeach; ?>
               </div>
            <?php else: ?>
               <div class="empty-state">
<<<<<<< HEAD
                  No placeholder tools were found for this category yet.
=======
                  No tools were found for this category.
>>>>>>> client_site_v5_php
               </div>
            <?php endif; ?>

            <footer class="page-footer">
               <p>
<<<<<<< HEAD
                  Need a different tool category? Email us (placeholder):
=======
                  Need a different tool category? Email us:
>>>>>>> client_site_v5_php
                  <a href="mailto:rocketrentals@example.com">rocketrentals@example.com</a>
               </p>
            </footer>
         </div>
      </section>
   </main>
</body>

</html>