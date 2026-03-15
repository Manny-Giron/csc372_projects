<?php
/*
Name: Emmanuel Giron
Date: March 15, 2026
Description: Validation helper functions for the Rocket Rentals PHP checkout form.
*/

function validate_text_range(string $text, int $min, int $max): bool
{
    $trimmed = trim($text);
    $length = strlen($trimmed);
    return $length >= $min && $length <= $max;
}

function validate_number_range($number, int $min, int $max): bool
{
    if ($number === '' || !is_numeric($number)) {
        return false;
    }

    $value = (int) $number;
    return $value >= $min && $value <= $max;
}

function validate_option(?string $value, array $allowed_values): bool
{
    if ($value === null || $value === '') {
        return false;
    }

    return in_array($value, $allowed_values, true);
}
