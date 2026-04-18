<?php
/*
Name: Emmanuel Giron
Description: Delete a tool from the Rocket Rentals inventory (DELETE operation).
Accepts a POST request with the tool ID, validates it, and removes
the row using a prepared statement. CASCADE handles associated units.
*/

require_once __DIR__ . '/../includes/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
   header('Location: index.php');
   exit;
}

$toolId = filter_input(INPUT_POST, 'id', FILTER_VALIDATE_INT);

if (!$toolId) {
   header('Location: index.php?msg=error');
   exit;
}

// Confirm the tool exists before attempting to delete
$checkStmt = $pdo->prepare("SELECT COUNT(*) FROM tools WHERE id = :id");
$checkStmt->execute([':id' => $toolId]);

if ($checkStmt->fetchColumn() === 0) {
   header('Location: index.php?msg=error');
   exit;
}

$deleteStmt = $pdo->prepare("DELETE FROM tools WHERE id = :id");
$deleteStmt->execute([':id' => $toolId]);

header('Location: index.php?msg=deleted');
exit;
