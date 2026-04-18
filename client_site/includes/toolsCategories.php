<?php
/*
Name: Emmanuel Giron
Date: March 7, 2026
Description: Tool categories landing page for Rocket Rentals.
Categories and sample tool names are now pulled from the database
using PDO instead of hardcoded PHP arrays.
*/

require_once __DIR__ . '/db.php';

/**
 * ToolCategory represents one visible category on the Rocket Rentals site.
 * Each object stores the category name, category key, description, sample tools,
 * and whether it should show a featured pill.
 */
class ToolCategory
{

   public string $name;

   protected string $key;
   protected string $description;
   protected array $sampleTools;
   protected bool $featured;


   public function __construct(
      string $name,
      string $key,
      string $description,
      array $sampleTools,
      bool $featured = false
   ) {
      $this->name = $name;
      $this->key = $key;
      $this->description = $description;
      $this->sampleTools = $sampleTools;
      $this->featured = $featured;
   }

   public function getKey(): string
   {
      return $this->key;
   }

   public function getDescription(): string
   {
      return $this->description;
   }
   public function getSampleTools(): array
   {
      return $this->sampleTools;
   }

   public function isFeatured(): bool
   {
      return $this->featured;
   }

   public function getCategoryUrl(): string
   {
      return 'tools.php?category=' . urlencode($this->key);
   }

   public function getCtaText(): string
   {
      return 'View tools →';
   }


   public function getToolCount(): int
   {
      return count($this->sampleTools);
   }
}

/*
Query categories from the database and build ToolCategory objects.
Sample tool names are pulled via GROUP_CONCAT through tool_types → tools.
*/
$catStmt = $pdo->query(
   "SELECT tc.id, tc.`key`, tc.name, tc.description, tc.featured,
           GROUP_CONCAT(t.name ORDER BY t.name SEPARATOR '||') AS sample_tools
    FROM tool_categories tc
    LEFT JOIN tool_types tt ON tt.category_id = tc.id
    LEFT JOIN tools t       ON t.type_id = tt.id AND t.is_active = 1
    GROUP BY tc.id
    ORDER BY tc.sort_order"
);
$catRows = $catStmt->fetchAll();

$categories = [];
foreach ($catRows as $row) {
   $sampleTools = [];
   if (!empty($row['sample_tools'])) {
      $allTools = explode('||', $row['sample_tools']);
      $sampleTools = array_slice($allTools, 0, 3);
   }

   $categories[] = new ToolCategory(
      $row['name'],
      $row['key'],
      $row['description'],
      $sampleTools,
      (bool) $row['featured']
   );
}
?>
<!DOCTYPE html>
<html lang="en">

<head>
   <meta charset="UTF-8" />
   <meta name="viewport" content="width=device-width, initial-scale=1.0" />
   <title>Tool Categories | Rocket Rentals</title>
   <link rel="stylesheet" href="../css/toolCategories.css" />
</head>

<body>
   <!-- Emmanuel Giron | March 7, 2026
       Tool Categories landing page. Displays category navigation and featured categories.
       This PHP version keeps the original Rocket Rentals page layout and styling,
       but now renders category data dynamically from objects.
  -->

   <div id="Navbar">
      <img id="Logo" src="../../documentation/logo.png" alt="Rocket Rentals logo" />
      <div id="NavItems">
         <h2 class="nav-item"><a href="../index.html">Home</a></h2>
         <h2 class="nav-item current-page"><a href="toolsCategories.php" aria-current="page">Tools</a></h2>
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
         <h1>Browse Tools by Category</h1>
         <p class="subtext">
            Delivery + pickup tool rentals. Browse our categories below to find the right equipment for your
            project.
         </p>
      </header>

      <section class="categories-layout" aria-label="Tool categories layout">
         <!-- LEFT SIDEBAR -->
         <aside class="category-sidebar" aria-label="Tool category navigation">
            <div class="sidebar-title-row">
               <h2 class="sidebar-title">Categories</h2>
               <span class="sidebar-badge" aria-label="Live data badge">Live</span>
            </div>

            <nav class="category-nav">
               <a class="category-link active" href="toolsCategories.php" data-cat="all">All Categories</a>

               <?php foreach ($categories as $category): ?>
                  <a class="category-link" href="<?php echo htmlspecialchars($category->getCategoryUrl()); ?>"
                     data-cat="<?php echo htmlspecialchars($category->getKey()); ?>">
                     <?php echo htmlspecialchars($category->name); ?>
                  </a>
               <?php endforeach; ?>
            </nav>

            <div class="sidebar-help" role="note">
               <p>
                  <strong>Note:</strong> Categories are loaded from the database and rendered
                  dynamically with PHP objects via PDO.
               </p>
            </div>
         </aside>

         <!-- RIGHT CONTENT -->
         <div class="category-content">
            <div class="content-toolbar">
               <h2 id="contentTitle">Featured Categories</h2>

               <!-- simple interactivity: filter cards by search -->
               <div class="search-wrap">
                  <label for="categorySearch" class="sr-only">Search categories</label>
                  <input id="categorySearch" type="text" placeholder="Search categories..." />
               </div>
            </div>

            <p class="content-desc">
               Choose a category to see available tool listings from our inventory.
            </p>

            <div class="category-grid" id="categoryGrid">
               <?php if (empty($categories)): ?>
                  <p>No categories are available at this time.</p>
               <?php endif; ?>
               <?php foreach ($categories as $category): ?>
                  <!-- Objects are used here to dynamically render each category card -->
                  <a class="category-card" href="<?php echo htmlspecialchars($category->getCategoryUrl()); ?>"
                     data-name="<?php echo htmlspecialchars($category->name); ?>">

                     <div class="card-top">
                        <!-- Direct public property access -->
                        <h3><?php echo htmlspecialchars($category->name); ?></h3>

                        <!-- Method call returning a value -->
                        <?php if ($category->isFeatured()): ?>
                           <span class="pill">Most Popular</span>
                        <?php endif; ?>
                     </div>

                     <!-- Method call returning a value -->
                     <p><?php echo htmlspecialchars($category->getDescription()); ?></p>

                     <ul class="mini-list" aria-label="Example tools">
                        <?php foreach ($category->getSampleTools() as $tool): ?>
                           <li><?php echo htmlspecialchars($tool); ?></li>
                        <?php endforeach; ?>
                     </ul>

                     <span class="card-cta">
                        <?php echo htmlspecialchars($category->getCtaText()); ?>
                     </span>
                  </a>
               <?php endforeach; ?>
            </div>

            <footer class="page-footer">
               <p>
                  Want to request a category? Email us (placeholder):
                  <a href="mailto:rocketrentals@example.com">rocketrentals@example.com</a>
               </p>
            </footer>
         </div>
      </section>
   </main>

   <script src="../js/toolCategories.js"></script>
</body>

</html>