<?php
/*
Name: Emmanuel Giron
Date: March 15, 2026
Description: Rocket Rentals checkout page using PHP form validation, cookies, and sessions.
AI-assisted suggestion: GPT helped refactor the existing cart/checkout scaffold into a PHP checkout form. 
Checkout will be reverted to previous design after the assignment
*/

session_start();
require_once __DIR__ . '/includes/validation.php';

if (isset($_GET['end_session'])) {
    $_SESSION = [];

    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 3600, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
    }

    session_destroy();
    header('Location: checkout.php');
    exit;
}

$allowed_delivery_methods = ['delivery', 'pickup'];
$allowed_tool_categories = ['power-tools', 'ladders', 'landscaping', 'concrete', 'moving-equipment'];

$values = [
    'customer_name' => '',
    'customer_email' => '',
    'rental_days' => '',
    'delivery_method' => '',
    'tool_category' => '',
    'delivery_date' => '',
    'delivery_time' => '',
    'pickup_date' => '',
    'pickup_time' => '',
    'delivery_address' => '',
    'delivery_unit' => '',
    'delivery_zip' => '',
    'notes' => '',
];

$errors = [
    'customer_name' => '',
    'customer_email' => '',
    'rental_days' => '',
    'delivery_method' => '',
    'tool_category' => '',
    'delivery_date' => '',
    'delivery_time' => '',
    'pickup_date' => '',
    'pickup_time' => '',
    'delivery_address' => '',
    'delivery_zip' => '',
];

$message = '';
$message_class = '';
$success = false;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    foreach ($values as $key => $value) {
        $values[$key] = trim($_POST[$key] ?? '');
    }

    if (!validate_text_range($values['customer_name'], 2, 50)) {
        $errors['customer_name'] = 'Please enter a name between 2 and 50 characters.';
    }

    if (!filter_var($values['customer_email'], FILTER_VALIDATE_EMAIL)) {
        $errors['customer_email'] = 'Please enter a valid email address.';
    }

    if (!validate_number_range($values['rental_days'], 1, 30)) {
        $errors['rental_days'] = 'Rental days must be a number between 1 and 30.';
    }

    if (!validate_option($values['delivery_method'] ?? null, $allowed_delivery_methods)) {
        $errors['delivery_method'] = 'Please choose either delivery or pickup.';
    }

    if (!validate_option($values['tool_category'] ?? null, $allowed_tool_categories)) {
        $errors['tool_category'] = 'Please choose a valid tool category.';
    }

    if ($values['delivery_date'] === '') {
        $errors['delivery_date'] = 'Please choose a delivery date.';
    }

    if ($values['delivery_time'] === '') {
        $errors['delivery_time'] = 'Please choose a delivery time.';
    }

    if ($values['pickup_date'] === '') {
        $errors['pickup_date'] = 'Please choose a pickup date.';
    }

    if ($values['pickup_time'] === '') {
        $errors['pickup_time'] = 'Please choose a pickup time.';
    }

    if (!validate_text_range($values['delivery_address'], 5, 100)) {
        $errors['delivery_address'] = 'Please enter a delivery address between 5 and 100 characters.';
    }

    if (!preg_match('/^\d{5}$/', $values['delivery_zip'])) {
        $errors['delivery_zip'] = 'ZIP code must be exactly 5 digits.';
    }

    if ($values['delivery_date'] !== '' && $values['delivery_time'] !== '' && $values['pickup_date'] !== '' && $values['pickup_time'] !== '') {
        $delivery_datetime = strtotime($values['delivery_date'] . ' ' . $values['delivery_time']);
        $pickup_datetime = strtotime($values['pickup_date'] . ' ' . $values['pickup_time']);

        if ($delivery_datetime === false || $pickup_datetime === false || $pickup_datetime <= $delivery_datetime) {
            $errors['pickup_time'] = 'Pickup must be after delivery.';
        }
    }

    if ($values['delivery_method'] === 'pickup') {
        $errors['delivery_address'] = '';
        $errors['delivery_zip'] = '';
    }

    if (implode('', $errors) === '') {
        $success = true;
        $message = 'Checkout request submitted successfully.';
        $message_class = 'success-message';

        $_SESSION['customer_name'] = $values['customer_name'];
        $_SESSION['checkout_count'] = ($_SESSION['checkout_count'] ?? 0) + 1;
        $_SESSION['last_request_summary'] = $values['tool_category'] . ' for ' . $values['rental_days'] . ' day(s) via ' . $values['delivery_method'];

        setcookie('preferred_delivery_method', $values['delivery_method'], time() + (60 * 60 * 24 * 30));
        setcookie('last_tool_category', $values['tool_category'], time() + (60 * 60 * 24 * 30));
    } else {
        $message = 'Please correct the errors below.';
        $message_class = 'error-message';
    }
}

$preferred_delivery_cookie = htmlspecialchars($_COOKIE['preferred_delivery_method'] ?? 'Not set yet');
$last_tool_cookie = htmlspecialchars($_COOKIE['last_tool_category'] ?? 'Not set yet');
$session_customer_name = htmlspecialchars($_SESSION['customer_name'] ?? 'No active session name');
$session_checkout_count = (int) ($_SESSION['checkout_count'] ?? 0);
$session_last_request = htmlspecialchars($_SESSION['last_request_summary'] ?? 'No request submitted this session');

function checked_value(string $current, string $expected): string
{
    return $current === $expected ? 'checked' : '';
}

function selected_value(string $current, string $expected): string
{
    return $current === $expected ? 'selected' : '';
}
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Checkout | Rocket Rentals</title>
    <link rel="stylesheet" href="includes/cart.css" />
</head>

<body>
    <div id="Navbar">
        <img id="Logo" src="../documentation/logo.png" alt="Rocket Rentals logo" />
        <div id="NavItems">
            <h2 class="nav-item"><a href="index.html">Home</a></h2>
            <h2 class="nav-item"><a href="includes/toolsCategories.php">Tools</a></h2>
            <div class="nav-item current-page" aria-label="Cart">
                <a href="checkout.php" aria-current="page">
                    <img src="https://media.istockphoto.com/id/1206806317/vector/shopping-cart-icon-isolated-on-white-background.jpg?s=612x612&w=0&k=20&c=1RRQJs5NDhcB67necQn1WCpJX2YMfWZ4rYi1DFKlkNA="
                        alt="Shopping cart icon" />
                </a>
            </div>
        </div>
    </div>

    <main id="CartPage">
        <header class="page-hero">
            <h1>Rocket Rentals Checkout</h1>
            <p class="subtext">Use this checkout form to reserve tools, choose delivery or pickup, and review visitor
                tracking with cookies and sessions.</p>
        </header>

        <?php if ($message !== ''): ?>
            <div class="page-message <?= $message_class; ?>">
                <strong><?= htmlspecialchars($message); ?></strong>
            </div>
        <?php endif; ?>

        <section class="stepper" aria-label="Checkout steps">
            <div class="step active"><span class="step-num">1</span><span class="step-label">Form</span></div>
            <div class="step active"><span class="step-num">2</span><span class="step-label">Validation</span></div>
            <div class="step active"><span class="step-num">3</span><span class="step-label">Cookies</span></div>
            <div class="step active"><span class="step-num">4</span><span class="step-label">Sessions</span></div>
        </section>

        <section class="checkout-layout" aria-label="Cart and checkout layout">
            <div class="checkout-main">
                <section class="panel active" aria-label="Checkout form">
                    <div class="panel-header">
                        <h2>Checkout Details</h2>
                        <span class="badge">PHP Form</span>
                    </div>

                    <p class="panel-desc">This version reuses the Rocket Rentals checkout as the required PHP assignment
                        form.</p>

                    <form method="post" action="checkout.php" novalidate>
                        <div class="form-grid">
                            <div class="form-field full">
                                <label for="customer_name">Full name</label>
                                <input type="text" id="customer_name" name="customer_name"
                                    value="<?= htmlspecialchars($values['customer_name']); ?>" />
                                <?php if ($errors['customer_name'] !== ''): ?>
                                    <p class="field-error"><?= htmlspecialchars($errors['customer_name']); ?></p>
                                <?php endif; ?>
                            </div>

                            <div class="form-field full">
                                <label for="customer_email">Email address</label>
                                <input type="email" id="customer_email" name="customer_email"
                                    value="<?= htmlspecialchars($values['customer_email']); ?>" />
                                <?php if ($errors['customer_email'] !== ''): ?>
                                    <p class="field-error"><?= htmlspecialchars($errors['customer_email']); ?></p>
                                <?php endif; ?>
                            </div>

                            <div class="form-field">
                                <label for="rental_days">Rental days</label>
                                <input type="number" id="rental_days" name="rental_days" min="1" max="30"
                                    value="<?= htmlspecialchars($values['rental_days']); ?>" />
                                <?php if ($errors['rental_days'] !== ''): ?>
                                    <p class="field-error"><?= htmlspecialchars($errors['rental_days']); ?></p>
                                <?php endif; ?>
                            </div>

                            <div class="form-field">
                                <label for="tool_category">Tool category</label>
                                <select id="tool_category" name="tool_category">
                                    <option value="">Select a category</option>
                                    <option value="power-tools" <?= selected_value($values['tool_category'], 'power-tools'); ?>>Power Tools</option>
                                    <option value="ladders" <?= selected_value($values['tool_category'], 'ladders'); ?>>
                                        Ladders</option>
                                    <option value="landscaping" <?= selected_value($values['tool_category'], 'landscaping'); ?>>Landscaping</option>
                                    <option value="concrete" <?= selected_value($values['tool_category'], 'concrete'); ?>>Concrete</option>
                                    <option value="moving-equipment" <?= selected_value($values['tool_category'], 'moving-equipment'); ?>>Moving Equipment</option>
                                </select>
                                <?php if ($errors['tool_category'] !== ''): ?>
                                    <p class="field-error"><?= htmlspecialchars($errors['tool_category']); ?></p>
                                <?php endif; ?>
                            </div>

                            <div class="form-field full">
                                <label>Delivery method</label>
                                <div class="radio-row">
                                    <label><input type="radio" name="delivery_method" value="delivery"
                                            <?= checked_value($values['delivery_method'], 'delivery'); ?> />
                                        Delivery</label>
                                    <label><input type="radio" name="delivery_method" value="pickup"
                                            <?= checked_value($values['delivery_method'], 'pickup'); ?> /> Pickup</label>
                                </div>
                                <?php if ($errors['delivery_method'] !== ''): ?>
                                    <p class="field-error"><?= htmlspecialchars($errors['delivery_method']); ?></p>
                                <?php endif; ?>
                            </div>

                            <div class="form-field">
                                <label for="delivery_date">Delivery date</label>
                                <input type="date" id="delivery_date" name="delivery_date"
                                    value="<?= htmlspecialchars($values['delivery_date']); ?>" />
                                <?php if ($errors['delivery_date'] !== ''): ?>
                                    <p class="field-error"><?= htmlspecialchars($errors['delivery_date']); ?></p>
                                <?php endif; ?>
                            </div>

                            <div class="form-field">
                                <label for="delivery_time">Delivery time</label>
                                <input type="time" id="delivery_time" name="delivery_time"
                                    value="<?= htmlspecialchars($values['delivery_time']); ?>" />
                                <?php if ($errors['delivery_time'] !== ''): ?>
                                    <p class="field-error"><?= htmlspecialchars($errors['delivery_time']); ?></p>
                                <?php endif; ?>
                            </div>

                            <div class="form-field">
                                <label for="pickup_date">Pickup date</label>
                                <input type="date" id="pickup_date" name="pickup_date"
                                    value="<?= htmlspecialchars($values['pickup_date']); ?>" />
                                <?php if ($errors['pickup_date'] !== ''): ?>
                                    <p class="field-error"><?= htmlspecialchars($errors['pickup_date']); ?></p>
                                <?php endif; ?>
                            </div>

                            <div class="form-field">
                                <label for="pickup_time">Pickup time</label>
                                <input type="time" id="pickup_time" name="pickup_time"
                                    value="<?= htmlspecialchars($values['pickup_time']); ?>" />
                                <?php if ($errors['pickup_time'] !== ''): ?>
                                    <p class="field-error"><?= htmlspecialchars($errors['pickup_time']); ?></p>
                                <?php endif; ?>
                            </div>

                            <div class="form-field full">
                                <label for="delivery_address">Delivery address</label>
                                <input type="text" id="delivery_address" name="delivery_address"
                                    value="<?= htmlspecialchars($values['delivery_address']); ?>"
                                    placeholder="123 Main St" />
                                <?php if ($errors['delivery_address'] !== ''): ?>
                                    <p class="field-error"><?= htmlspecialchars($errors['delivery_address']); ?></p>
                                <?php endif; ?>
                            </div>

                            <div class="form-field">
                                <label for="delivery_unit">Unit / Apt (optional)</label>
                                <input type="text" id="delivery_unit" name="delivery_unit"
                                    value="<?= htmlspecialchars($values['delivery_unit']); ?>" placeholder="Apt 2B" />
                            </div>

                            <div class="form-field">
                                <label for="delivery_zip">ZIP code</label>
                                <input type="text" id="delivery_zip" name="delivery_zip"
                                    value="<?= htmlspecialchars($values['delivery_zip']); ?>" placeholder="02881" />
                                <?php if ($errors['delivery_zip'] !== ''): ?>
                                    <p class="field-error"><?= htmlspecialchars($errors['delivery_zip']); ?></p>
                                <?php endif; ?>
                            </div>

                            <div class="form-field full">
                                <label for="notes">Notes (optional)</label>
                                <textarea id="notes" name="notes" rows="3"
                                    placeholder="Gate code, parking notes, delivery instructions"><?= htmlspecialchars($values['notes']); ?></textarea>
                            </div>
                        </div>

                        <div class="panel-actions">
                            <a class="btn secondary" href="toolCategories.html">Continue shopping</a>
                            <button class="btn" type="submit">Submit checkout request</button>
                        </div>
                    </form>
                </section>

                <?php if ($success): ?>
                    <section class="panel" aria-label="Review step">
                        <div class="panel-header">
                            <h2>Review</h2>
                            <span class="badge">Submitted</span>
                        </div>

                        <div class="review-grid">
                            <div class="review-card">
                                <h3>Customer</h3>
                                <div class="review-block">
                                    <strong>Name:</strong> <?= htmlspecialchars($values['customer_name']); ?><br>
                                    <strong>Email:</strong> <?= htmlspecialchars($values['customer_email']); ?>
                                </div>
                            </div>

                            <div class="review-card">
                                <h3>Rental</h3>
                                <div class="review-block">
                                    <strong>Category:</strong> <?= htmlspecialchars($values['tool_category']); ?><br>
                                    <strong>Rental days:</strong> <?= htmlspecialchars($values['rental_days']); ?><br>
                                    <strong>Method:</strong> <?= htmlspecialchars($values['delivery_method']); ?>
                                </div>
                            </div>

                            <div class="review-card">
                                <h3>Schedule / Address</h3>
                                <div class="review-block">
                                    <strong>Delivery:</strong> <?= htmlspecialchars($values['delivery_date']); ?> at
                                    <?= htmlspecialchars($values['delivery_time']); ?><br>
                                    <strong>Pickup:</strong> <?= htmlspecialchars($values['pickup_date']); ?> at
                                    <?= htmlspecialchars($values['pickup_time']); ?><br>
                                    <strong>Address:</strong> <?= htmlspecialchars($values['delivery_address']); ?>
                                    <?= htmlspecialchars($values['delivery_unit']); ?><br>
                                    <strong>ZIP:</strong> <?= htmlspecialchars($values['delivery_zip']); ?><br>
                                    <strong>Notes:</strong>
                                    <?= htmlspecialchars($values['notes'] !== '' ? $values['notes'] : 'None'); ?>
                                </div>
                            </div>
                        </div>
                    </section>
                <?php endif; ?>
            </div>

            <aside class="checkout-summary" aria-label="Order summary">
                <div class="summary-header">
                    <h2>Visitor Data</h2>
                    <span class="badge">Assignment</span>
                </div>

                <div class="summary-section">
                    <h3>Cookies</h3>
                    <div class="summary-row"><span>Preferred
                            delivery</span><span><?= $preferred_delivery_cookie; ?></span></div>
                    <div class="summary-row"><span>Last tool category</span><span><?= $last_tool_cookie; ?></span></div>
                    <p class="summary-hint">These are stored in the browser with setcookie().</p>
                </div>

                <div class="summary-section">
                    <h3>Session</h3>
                    <div class="summary-row"><span>Visitor name</span><span><?= $session_customer_name; ?></span></div>
                    <div class="summary-row"><span>Requests this
                            session</span><span><?= $session_checkout_count; ?></span></div>
                    <div class="summary-row"><span>Last request</span><span><?= $session_last_request; ?></span></div>
                    <p class="summary-hint">Session data is stored on the server using session_start() and $_SESSION.
                    </p>
                    <a class="btn secondary session-btn" href="checkout.php?end_session=1">End Session</a>
                </div>

                <div class="summary-section">
                    <h3>Checklist</h3>
                    <ul class="checklist">
                        <li class="ok">Text input included</li>
                        <li class="ok">Number input included</li>
                        <li class="ok">Options included</li>
                        <li class="ok">Validation included</li>
                        <li class="ok">Cookies and sessions displayed</li>
                    </ul>
                </div>
            </aside>
        </section>
    </main>
</body>

</html>