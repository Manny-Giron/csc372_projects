<?php
/*
Name: Emmanuel Giron
Description: Add a new tool to the Rocket Rentals inventory (INSERT operation).
Validates and sanitizes all input before inserting via a prepared statement.
*/

require_once __DIR__ . '/../includes/db.php';

$typeStmt = $pdo->query(
   "SELECT tt.id, tt.name AS type_name, tc.name AS category_name
    FROM tool_types tt
    JOIN tool_categories tc ON tt.category_id = tc.id
    ORDER BY tc.sort_order, tt.sort_order"
);
$types = $typeStmt->fetchAll();

$values = [
   'name'          => '',
   'slug'          => '',
   'description'   => '',
   'daily_rate'    => '',
   'deposit'       => '',
   'delivery_only' => '0',
   'type_id'       => '',
   'image_url'     => '',
];

$errors = [];
$success = false;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
   foreach ($values as $key => $default) {
      $values[$key] = trim($_POST[$key] ?? $default);
   }

   // Validate name
   if (strlen($values['name']) < 2 || strlen($values['name']) > 150) {
      $errors['name'] = 'Name must be between 2 and 150 characters.';
   }

   // Validate slug
   if (!preg_match('/^[a-z0-9]+(-[a-z0-9]+)*$/', $values['slug'])) {
      $errors['slug'] = 'Slug must be lowercase letters, numbers, and hyphens (e.g. "impact-driver").';
   }

   // Check slug uniqueness
   if (empty($errors['slug'])) {
      $slugCheck = $pdo->prepare("SELECT COUNT(*) FROM tools WHERE slug = :slug");
      $slugCheck->execute([':slug' => $values['slug']]);
      if ($slugCheck->fetchColumn() > 0) {
         $errors['slug'] = 'This slug is already in use.';
      }
   }

   // Validate description
   if (strlen($values['description']) < 10) {
      $errors['description'] = 'Description must be at least 10 characters.';
   }

   // Validate daily_rate
   if (!is_numeric($values['daily_rate']) || (float) $values['daily_rate'] <= 0) {
      $errors['daily_rate'] = 'Daily rate must be a positive number.';
   }

   // Validate deposit
   if (!is_numeric($values['deposit']) || (float) $values['deposit'] < 0) {
      $errors['deposit'] = 'Deposit must be zero or a positive number.';
   }

   // Validate type_id
   $validTypeIds = array_column($types, 'id');
   if (!in_array((int) $values['type_id'], $validTypeIds, true)) {
      $errors['type_id'] = 'Please select a valid tool type.';
   }

   // Sanitize delivery_only
   $values['delivery_only'] = ($values['delivery_only'] === '1') ? '1' : '0';

   // Sanitize image_url
   if ($values['image_url'] !== '' && !filter_var($values['image_url'], FILTER_VALIDATE_URL)) {
      $errors['image_url'] = 'Image URL must be a valid URL or left blank.';
   }

   if (empty($errors)) {
      $insertStmt = $pdo->prepare(
         "INSERT INTO tools (type_id, name, slug, description, daily_rate, deposit, delivery_only, image_url)
          VALUES (:type_id, :name, :slug, :description, :daily_rate, :deposit, :delivery_only, :image_url)"
      );
      $insertStmt->execute([
         ':type_id'       => (int) $values['type_id'],
         ':name'          => $values['name'],
         ':slug'          => $values['slug'],
         ':description'   => $values['description'],
         ':daily_rate'    => (float) $values['daily_rate'],
         ':deposit'       => (float) $values['deposit'],
         ':delivery_only' => (int) $values['delivery_only'],
         ':image_url'     => $values['image_url'] !== '' ? $values['image_url'] : null,
      ]);

      header('Location: index.php?msg=added');
      exit;
   }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
   <meta charset="UTF-8">
   <meta name="viewport" content="width=device-width, initial-scale=1.0">
   <title>Add Tool | Rocket Rentals Admin</title>
   <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: system-ui, -apple-system, sans-serif; background: #f5f5f5; color: #222; padding: 24px; }
      .back-link { display: inline-block; margin-bottom: 16px; font-weight: 600; color: #ff8c00; text-decoration: none; }
      .back-link:hover { text-decoration: underline; }
      h1 { font-size: 1.5rem; margin-bottom: 20px; }
      .form-card { background: white; border-radius: 10px; padding: 24px; max-width: 600px; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
      .field { margin-bottom: 16px; }
      .field label { display: block; font-weight: 600; margin-bottom: 4px; font-size: 0.9rem; }
      .field input, .field select, .field textarea { width: 100%; padding: 8px 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 0.95rem; font-family: inherit; }
      .field input:focus, .field select:focus, .field textarea:focus { outline: none; border-color: #ff8c00; }
      .field textarea { resize: vertical; min-height: 80px; }
      .field-error { color: #dc3545; font-size: 0.8rem; margin-top: 4px; }
      .field-row { display: flex; gap: 16px; }
      .field-row .field { flex: 1; }
      .checkbox-field { display: flex; align-items: center; gap: 8px; }
      .checkbox-field input { width: auto; }
      .btn { display: inline-block; padding: 10px 20px; border-radius: 8px; font-weight: 600; font-size: 0.95rem; cursor: pointer; border: none; }
      .btn-primary { background: #ff8c00; color: white; }
      .btn-primary:hover { background: #e07800; }
   </style>
</head>
<body>
   <a class="back-link" href="index.php">&larr; Back to dashboard</a>
   <h1>Add New Tool</h1>

   <div class="form-card">
      <form method="POST" action="add-tool.php">
         <div class="field">
            <label for="name">Tool Name</label>
            <input type="text" id="name" name="name" value="<?php echo htmlspecialchars($values['name']); ?>" required>
            <?php if (!empty($errors['name'])): ?>
               <div class="field-error"><?php echo htmlspecialchars($errors['name']); ?></div>
            <?php endif; ?>
         </div>

         <div class="field">
            <label for="slug">Slug (URL-safe identifier)</label>
            <input type="text" id="slug" name="slug" value="<?php echo htmlspecialchars($values['slug']); ?>" placeholder="e.g. impact-driver" required>
            <?php if (!empty($errors['slug'])): ?>
               <div class="field-error"><?php echo htmlspecialchars($errors['slug']); ?></div>
            <?php endif; ?>
         </div>

         <div class="field">
            <label for="type_id">Tool Type</label>
            <select id="type_id" name="type_id" required>
               <option value="">— Select a type —</option>
               <?php foreach ($types as $type): ?>
                  <option value="<?php echo (int) $type['id']; ?>"
                     <?php echo (int) $values['type_id'] === (int) $type['id'] ? 'selected' : ''; ?>>
                     <?php echo htmlspecialchars($type['category_name'] . ' → ' . $type['type_name']); ?>
                  </option>
               <?php endforeach; ?>
            </select>
            <?php if (!empty($errors['type_id'])): ?>
               <div class="field-error"><?php echo htmlspecialchars($errors['type_id']); ?></div>
            <?php endif; ?>
         </div>

         <div class="field">
            <label for="description">Description</label>
            <textarea id="description" name="description" required><?php echo htmlspecialchars($values['description']); ?></textarea>
            <?php if (!empty($errors['description'])): ?>
               <div class="field-error"><?php echo htmlspecialchars($errors['description']); ?></div>
            <?php endif; ?>
         </div>

         <div class="field-row">
            <div class="field">
               <label for="daily_rate">Daily Rate ($)</label>
               <input type="number" id="daily_rate" name="daily_rate" step="0.01" min="0.01"
                      value="<?php echo htmlspecialchars($values['daily_rate']); ?>" required>
               <?php if (!empty($errors['daily_rate'])): ?>
                  <div class="field-error"><?php echo htmlspecialchars($errors['daily_rate']); ?></div>
               <?php endif; ?>
            </div>
            <div class="field">
               <label for="deposit">Deposit ($)</label>
               <input type="number" id="deposit" name="deposit" step="0.01" min="0"
                      value="<?php echo htmlspecialchars($values['deposit']); ?>" required>
               <?php if (!empty($errors['deposit'])): ?>
                  <div class="field-error"><?php echo htmlspecialchars($errors['deposit']); ?></div>
               <?php endif; ?>
            </div>
         </div>

         <div class="field">
            <label for="image_url">Image URL (optional)</label>
            <input type="url" id="image_url" name="image_url" value="<?php echo htmlspecialchars($values['image_url']); ?>" placeholder="https://...">
            <?php if (!empty($errors['image_url'])): ?>
               <div class="field-error"><?php echo htmlspecialchars($errors['image_url']); ?></div>
            <?php endif; ?>
         </div>

         <div class="field">
            <div class="checkbox-field">
               <input type="checkbox" id="delivery_only" name="delivery_only" value="1"
                      <?php echo $values['delivery_only'] === '1' ? 'checked' : ''; ?>>
               <label for="delivery_only">Delivery only (no customer pickup)</label>
            </div>
         </div>

         <button type="submit" class="btn btn-primary">Add Tool</button>
      </form>
   </div>
</body>
</html>
