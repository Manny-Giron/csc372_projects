<?php
/*
Name: Emmanuel Giron
Description: PDO database connection for Rocket Rentals.
This file is included by any page that needs to query the database.
*/

$type    = 'mysql';
$server  = '10.37.183.174';
$DB      = 'emmanue0_RocketRentals';
$port    = '3306';
$charset = 'utf8mb4';

$username = 'emmanue0_user';
$password = 'Flores526!';

$options = [
   PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
   PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
   PDO::ATTR_STRINGIFY_FETCHES  => false,
];

$dsn = "{$type}:host={$server};dbname={$DB};port={$port};charset={$charset}";

try {
   $pdo = new PDO($dsn, $username, $password, $options);
} catch (PDOException $e) {
   throw new PDOException('Database connection failed.');
}
