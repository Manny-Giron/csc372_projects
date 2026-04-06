<?php
/*
Name: Emmanuel Giron
Date: March 7, 2026
Description: Dynamic tools page for Rocket Rentals.
This page reads a category from the URL query string, validates it
against the database, and displays matching tools using prepared statements.
*/

require_once __DIR__ . '/db.php';

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

   public function matchesCategory(string $category): bool
   {
      return $category === 'all' || $this->categoryKey === $category;
   }
}

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
               <span class="sidebar-badge" aria-label="Live data badge">Live</span>
            </div>

            <nav class="category-nav">
               <a class="category-link <?php echo $selectedCategory === 'all' ? 'active' : ''; ?>"
                  href="tools.php?category=all">All Tools</a>
               <?php foreach ($sidebarCategories as $cat): ?>
                  <a class="category-link <?php echo $selectedCategory === $cat['key'] ? 'active' : ''; ?>"
                     href="tools.php?category=<?php echo htmlspecialchars(urlencode($cat['key'])); ?>">
                     <?php echo htmlspecialchars($cat['name']); ?>
                  </a>
               <?php endforeach; ?>
            </nav>

            <div class="sidebar-help" role="note">
               <p>
                  <strong>Note:</strong> Tools and categories are loaded from the database
                  and filtered using prepared statements via PDO.
               </p>
            </div>
         </aside>

         <!-- RIGHT CONTENT -->
         <div class="category-content">
            <div class="content-toolbar">
               <h2>
                  Available Tools
                  (<?php echo count($filteredTools); ?>)
               </h2>
            </div>

            <p class="content-desc">
               Browse tools from our rental inventory. Select a category to filter.
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
                  No tools were found for this category.
               </div>
            <?php endif; ?>

            <footer class="page-footer">
               <p>
                  Need a different tool category? Email us:
                  <a href="mailto:rocketrentals@example.com">rocketrentals@example.com</a>
               </p>
            </footer>
         </div>
      </section>
   </main>
</body>

</html>