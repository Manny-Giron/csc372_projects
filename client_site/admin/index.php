<?php
/*
Name: Emmanuel Giron
Description: Admin dashboard for Rocket Rentals tool management.
Lists all tools with category/type info, available unit counts,
and actions to add, edit, or delete tools.
Not linked from the customer site — accessed via URL only.
*/

require_once __DIR__ . '/../includes/db.php';

$message = $_GET['msg'] ?? '';

$stmt = $pdo->query(
   "SELECT t.id, t.name, t.slug, t.daily_rate, t.deposit, t.delivery_only, t.is_active,
           tt.name AS type_name,
           tc.name AS category_name,
           COUNT(tu.id) AS total_units,
           SUM(CASE WHEN tu.status = 'available' THEN 1 ELSE 0 END) AS available_units
    FROM tools t
    JOIN tool_types tt         ON t.type_id = tt.id
    JOIN tool_categories tc    ON tt.category_id = tc.id
    LEFT JOIN tool_units tu    ON tu.tool_id = t.id
    GROUP BY t.id
    ORDER BY tc.sort_order, tt.sort_order, t.name"
);
$tools = $stmt->fetchAll();
?>
<!DOCTYPE html>
<html lang="en">
<head>
   <meta charset="UTF-8">
   <meta name="viewport" content="width=device-width, initial-scale=1.0">
   <title>Admin Dashboard | Rocket Rentals</title>
   <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: system-ui, -apple-system, sans-serif; background: #f5f5f5; color: #222; padding: 24px; }
      .admin-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
      .admin-header h1 { font-size: 1.5rem; }
      .btn { display: inline-block; padding: 8px 16px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 0.9rem; cursor: pointer; border: none; }
      .btn-primary { background: #ff8c00; color: white; }
      .btn-primary:hover { background: #e07800; }
      .btn-danger { background: #dc3545; color: white; }
      .btn-danger:hover { background: #b02a37; }
      .btn-sm { padding: 5px 10px; font-size: 0.8rem; }
      .msg { padding: 12px 16px; border-radius: 8px; margin-bottom: 16px; font-weight: 500; }
      .msg-success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
      .msg-error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
      table { width: 100%; border-collapse: collapse; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
      th, td { padding: 10px 14px; text-align: left; border-bottom: 1px solid #eee; font-size: 0.9rem; }
      th { background: #fafafa; font-weight: 600; white-space: nowrap; }
      tr:last-child td { border-bottom: none; }
      tr:hover td { background: #fffdf5; }
      .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 0.75rem; font-weight: 600; }
      .badge-active { background: #d4edda; color: #155724; }
      .badge-inactive { background: #f8d7da; color: #721c24; }
      .actions { display: flex; gap: 6px; align-items: center; }
      .back-link { display: inline-block; margin-bottom: 16px; font-weight: 600; color: #ff8c00; text-decoration: none; }
      .back-link:hover { text-decoration: underline; }
      @media (max-width: 900px) {
         table { font-size: 0.8rem; }
         th, td { padding: 8px; }
      }
   </style>
</head>
<body>
   <a class="back-link" href="../includes/toolsCategories.php">&larr; Back to customer site</a>

   <div class="admin-header">
      <h1>Tool Management Dashboard</h1>
      <a href="add-tool.php" class="btn btn-primary">+ Add New Tool</a>
   </div>

   <?php if ($message === 'added'): ?>
      <div class="msg msg-success">Tool added successfully.</div>
   <?php elseif ($message === 'updated'): ?>
      <div class="msg msg-success">Tool updated successfully.</div>
   <?php elseif ($message === 'deleted'): ?>
      <div class="msg msg-success">Tool deleted successfully.</div>
   <?php elseif ($message === 'error'): ?>
      <div class="msg msg-error">Something went wrong. Please try again.</div>
   <?php endif; ?>

   <table>
      <thead>
         <tr>
            <th>ID</th>
            <th>Tool Name</th>
            <th>Category</th>
            <th>Type</th>
            <th>Daily Rate</th>
            <th>Deposit</th>
            <th>Delivery Only</th>
            <th>Units</th>
            <th>Status</th>
            <th>Actions</th>
         </tr>
      </thead>
      <tbody>
         <?php if (empty($tools)): ?>
            <tr><td colspan="10">No tools found in the database.</td></tr>
         <?php endif; ?>
         <?php foreach ($tools as $tool): ?>
            <tr>
               <td><?php echo (int) $tool['id']; ?></td>
               <td><?php echo htmlspecialchars($tool['name']); ?></td>
               <td><?php echo htmlspecialchars($tool['category_name']); ?></td>
               <td><?php echo htmlspecialchars($tool['type_name']); ?></td>
               <td>$<?php echo htmlspecialchars(number_format($tool['daily_rate'], 2)); ?></td>
               <td>$<?php echo htmlspecialchars(number_format($tool['deposit'], 2)); ?></td>
               <td><?php echo $tool['delivery_only'] ? 'Yes' : 'No'; ?></td>
               <td><?php echo (int) $tool['available_units']; ?> / <?php echo (int) $tool['total_units']; ?></td>
               <td>
                  <span class="badge <?php echo $tool['is_active'] ? 'badge-active' : 'badge-inactive'; ?>">
                     <?php echo $tool['is_active'] ? 'Active' : 'Inactive'; ?>
                  </span>
               </td>
               <td>
                  <div class="actions">
                     <a href="edit-tool.php?id=<?php echo (int) $tool['id']; ?>" class="btn btn-primary btn-sm">Edit</a>
                     <form method="POST" action="delete-tool.php" onsubmit="return confirm('Delete &quot;<?php echo htmlspecialchars($tool['name'], ENT_QUOTES); ?>&quot;? This also removes all its units.');">
                        <input type="hidden" name="id" value="<?php echo (int) $tool['id']; ?>">
                        <button type="submit" class="btn btn-danger btn-sm">Delete</button>
                     </form>
                  </div>
               </td>
            </tr>
         <?php endforeach; ?>
      </tbody>
   </table>
</body>
</html>
