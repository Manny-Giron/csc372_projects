import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { PlaceAutocompleteMount } from '../components/cart/PlaceAutocompleteMount';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import {
  buildScheduleIso,
  computeCartTotals,
  deliveryMeetsMinimumLead,
  parseScheduleWindow,
  rentalDaysFromSchedule,
} from '../lib/checkoutPricing';
import { formatScheduleDisplay } from '../lib/formatSchedule';
import type { Tool } from '../types';

const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

function todayDateInputMin(): string {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
}

function laterDateStr(a: string, b: string): string {
  if (!a) return b;
  if (!b) return a;
  return a >= b ? a : b;
}

export function CartPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, setQty, removeTool, clearCart } = useCart();
  const [step, setStep] = useState(1);
  const [toolRows, setToolRows] = useState<Tool[]>([]);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('09:00');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('17:00');
  const [scheduleNotes, setScheduleNotes] = useState('');

  const todayMin = todayDateInputMin();
  const pickupDateMin = useMemo(() => laterDateStr(deliveryDate, todayMin), [deliveryDate, todayMin]);

  const [fulfillmentMode, setFulfillmentMode] = useState<'delivery' | 'pickup'>('delivery');
  const [deliveryName, setDeliveryName] = useState('');
  const [deliveryPhone, setDeliveryPhone] = useState('');
  const [line1, setLine1] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('TX');
  const [postal, setPostal] = useState('');
  const [unit, setUnit] = useState('');
  const [instructions, setInstructions] = useState('');
  const [addressVerified, setAddressVerified] = useState(false);
  const [formattedPlace, setFormattedPlace] = useState('');

  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState<{ contractNumber: string } | null>(null);
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!checkoutSuccess) return;
    redirectTimer.current = setTimeout(() => {
      navigate('/my-rentals');
    }, 3000);
    return () => {
      if (redirectTimer.current) clearTimeout(redirectTimer.current);
    };
  }, [checkoutSuccess, navigate]);

  useEffect(() => {
    if (!user?.profile) return;
    const p = user.profile;
    if (p.first_name || p.last_name) {
      setDeliveryName(`${p.first_name} ${p.last_name}`.trim());
    }
    if (p.phone) setDeliveryPhone(p.phone);
  }, [user]);

  useEffect(() => {
    const ids = cart.items.map((i) => i.toolId);
    if (!ids.length) {
      setToolRows([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await api<{ tools: Tool[] }>('/api/tools?category=all');
        if (cancelled) return;
        const want = new Set(ids);
        setToolRows(data.tools.filter((t) => want.has(t.id)));
        setLoadErr(null);
      } catch {
        if (!cancelled) setLoadErr('Could not load tool prices');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cart.items]);

  const priceMap = useMemo(() => {
    const m: Record<number, { daily_rate: number; deposit: number }> = {};
    for (const t of toolRows) {
      m[t.id] = { daily_rate: Number(t.daily_rate), deposit: Number(t.deposit) };
    }
    return m;
  }, [toolRows]);

  const computedRentalDays = useMemo(
    () => rentalDaysFromSchedule(deliveryDate, deliveryTime, pickupDate, pickupTime),
    [deliveryDate, deliveryTime, pickupDate, pickupTime]
  );

  const totals = useMemo(
    () => computeCartTotals(cart.items, priceMap, computedRentalDays, fulfillmentMode),
    [cart.items, priceMap, computedRentalDays, fulfillmentMode]
  );

  const durationLabel = useMemo(() => {
    const w = parseScheduleWindow(deliveryDate, deliveryTime, pickupDate, pickupTime);
    if (!w) return '—';
    const hours = Math.ceil((w.end.getTime() - w.start.getTime()) / (1000 * 60 * 60));
    return `${computedRentalDays} day(s) (≈ ${hours} hrs)`;
  }, [deliveryDate, deliveryTime, pickupDate, pickupTime, computedRentalDays]);

  const scheduleOk = useMemo(() => {
    if (!parseScheduleWindow(deliveryDate, deliveryTime, pickupDate, pickupTime)) return false;
    return deliveryMeetsMinimumLead(deliveryDate, deliveryTime);
  }, [deliveryDate, deliveryTime, pickupDate, pickupTime]);

  const onPlaceSelect = useCallback(
    (payload: { formattedAddress: string; line1: string; city: string; state: string; postal: string }) => {
      setFormattedPlace(payload.formattedAddress);
      setLine1(payload.line1);
      setCity(payload.city);
      setState(payload.state || 'TX');
      setPostal(payload.postal);
      setAddressVerified(true);
    },
    []
  );

  useEffect(() => {
    if (fulfillmentMode === 'pickup') {
      setAddressVerified(true);
    } else {
      setAddressVerified(false);
    }
  }, [fulfillmentMode]);

  function verifyManualAddress() {
    if (line1.trim() && city.trim() && state.trim() && postal.trim()) {
      setAddressVerified(true);
    }
  }

  function isScheduleValid() {
    if (!parseScheduleWindow(deliveryDate, deliveryTime, pickupDate, pickupTime)) {
      return { ok: false, msg: 'Enter valid delivery and pickup times (pickup after delivery).' };
    }
    if (!deliveryMeetsMinimumLead(deliveryDate, deliveryTime)) {
      return {
        ok: false,
        msg: 'Delivery must be at least 4 hours from the current time. Choose a later date or time.',
      };
    }
    return { ok: true, msg: '' };
  }

  async function submitContract() {
    setSubmitErr(null);
    const scheduledStart = buildScheduleIso(deliveryDate, deliveryTime);
    const scheduledEnd = buildScheduleIso(pickupDate, pickupTime);
    if (!scheduledStart || !scheduledEnd) {
      setSubmitErr('Schedule incomplete');
      return;
    }
    const sv = isScheduleValid();
    if (!sv.ok) {
      setSubmitErr(sv.msg);
      return;
    }
    if (fulfillmentMode === 'delivery') {
      if (!line1.trim() || !city.trim()) {
        setSubmitErr('Address required for delivery');
        return;
      }
      if (!addressVerified) {
        setSubmitErr('Verify your address (Google selection or Verify button for manual entry)');
        return;
      }
    }

    setSubmitting(true);
    try {
      const created = await api<{ contractNumber: string }>('/api/rental-contracts', {
        method: 'POST',
        body: JSON.stringify({
          scheduledStart,
          scheduledEnd,
          rentalDays: rentalDaysFromSchedule(deliveryDate, deliveryTime, pickupDate, pickupTime),
          fulfillmentMode,
          address:
            fulfillmentMode === 'delivery'
              ? {
                  label: 'Delivery',
                  line1: unit ? `${line1} ${unit}`.trim() : line1,
                  city,
                  state_region: state,
                  postal_code: postal,
                  delivery_instructions:
                    [scheduleNotes, instructions, formattedPlace && `Maps: ${formattedPlace}`]
                      .filter(Boolean)
                      .join(' — ') || undefined,
                }
              : undefined,
          items: cart.items.map((i) => ({
            toolId: i.toolId,
            quantity: i.quantity,
          })),
          processPaymentStub: true,
        }),
      });
      setCheckoutSuccess({ contractNumber: created.contractNumber });
      clearCart();
    } catch (e) {
      setSubmitErr((e as Error).message || 'Checkout failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) {
    return (
      <div className="page-pad">
        <h1>Your cart</h1>
        <p>Sign in to view your cart and checkout.</p>
        <Link to="/login" state={{ from: '/cart' }}>
          Log in
        </Link>
      </div>
    );
  }

  if (checkoutSuccess) {
    return (
      <main id="CartPage" className="cart-checkout-done">
        <div className="checkout-success-banner" role="status" aria-live="polite">
          <strong>Reservation confirmed.</strong> Contract{' '}
          <span className="checkout-success-contract">{checkoutSuccess.contractNumber}</span>. Taking you to My
          rentals…
        </div>
        <div className="page-pad checkout-success-pad">
          <p className="checkout-success-sub">Thank you — your rental is on the books.</p>
        </div>
      </main>
    );
  }

  if (!cart.items.length) {
    return (
      <main id="CartPage">
        <header className="page-hero">
          <h1>Your Cart</h1>
          <p className="subtext">Reserve tools for delivery + pickup.</p>
        </header>
        <section className="checkout-layout">
          <div className="checkout-main">
            <section className="panel active">
              <div className="empty-state">
                <h3>Your cart is empty</h3>
                <p>Go browse tools and add a few rentals.</p>
                <Link className="btn" to="/tools">
                  Browse tools
                </Link>
              </div>
            </section>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main id="CartPage">
      <header className="page-hero">
        <h1>Your Cart</h1>
        <p className="subtext">
          Reserve tools for delivery + pickup. Complete all steps to place your rental.
        </p>
      </header>

      <section className="stepper" aria-label="Checkout steps">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className={`step${step === n ? ' active' : ''}`} data-step={n}>
            <span className="step-num">{n}</span>
            <span className="step-label">
              {n === 1 ? 'Cart' : n === 2 ? 'Schedule' : n === 3 ? 'Delivery' : 'Review'}
            </span>
          </div>
        ))}
      </section>

      <section className="checkout-layout" aria-label="Cart and checkout layout">
        <div className="checkout-main">
          {step === 1 && (
            <section className="panel active" aria-label="Cart step">
              <div className="panel-header">
                <h2>Cart Items</h2>
                <span className="badge">Live</span>
              </div>
              <div className="cart-list">
                {cart.items.map((line) => {
                  const t = toolRows.find((x) => x.id === line.toolId);
                  const daily = t ? Number(t.daily_rate).toFixed(2) : '—';
                  const dep = t ? Number(t.deposit).toFixed(2) : '—';
                  return (
                    <div key={line.toolId} className="cart-item">
                      <div>
                        <h3 className="item-title">{line.name || t?.name || `Tool #${line.toolId}`}</h3>
                        <div className="item-meta">
                          <span>Daily: ${daily}</span>
                          <span>Deposit: ${dep}</span>
                        </div>
                      </div>
                      <div className="qty-controls">
                        <button
                          type="button"
                          className="qty-btn"
                          aria-label="Decrease quantity"
                          onClick={() => setQty(line.toolId, Math.max(1, line.quantity - 1))}
                        >
                          −
                        </button>
                        <span className="qty-val">{line.quantity}</span>
                        <button
                          type="button"
                          className="qty-btn"
                          aria-label="Increase quantity"
                          onClick={() => setQty(line.toolId, line.quantity + 1)}
                        >
                          +
                        </button>
                        <button
                          type="button"
                          className="remove-btn"
                          onClick={() => removeTool(line.toolId)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              {loadErr && <p className="error-banner">{loadErr}</p>}
              <div className="panel-actions">
                <Link className="btn secondary" to="/tools">
                  Continue shopping
                </Link>
                <button type="button" className="btn" onClick={() => setStep(2)}>
                  Continue →
                </button>
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="panel active" aria-label="Schedule step">
              <div className="panel-header">
                <h2>Schedule Your Rental</h2>
                <span className="badge">Calendar</span>
              </div>
              <p className="panel-desc">
                Pick your delivery (start) and pickup (end) times. Pickup must be after delivery.
              </p>
              <p className="notice cart-lead-notice" role="note">
                <strong>4-hour minimum:</strong> The delivery window cannot begin sooner than 4 hours from now.
                Past dates/times are not allowed — adjust both date and time if you’re booking for today.
              </p>
              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="deliveryDate">Delivery date</label>
                  <input
                    type="date"
                    id="deliveryDate"
                    min={todayMin}
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="deliveryTime">Delivery time</label>
                  <input
                    type="time"
                    id="deliveryTime"
                    value={deliveryTime}
                    onChange={(e) => setDeliveryTime(e.target.value)}
                  />
                  <p className="field-hint">Example: 9:00 AM – 6:00 PM delivery window</p>
                </div>
                <div className="form-field">
                  <label htmlFor="pickupDate">Pickup date</label>
                  <input
                    type="date"
                    id="pickupDate"
                    min={pickupDateMin}
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="pickupTime">Pickup time</label>
                  <input
                    type="time"
                    id="pickupTime"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                  />
                  <p className="field-hint">Pickup must be after delivery</p>
                </div>
                <div className="form-field full">
                  <label htmlFor="schedNotes">Notes for delivery/pickup (optional)</label>
                  <textarea
                    id="schedNotes"
                    rows={3}
                    value={scheduleNotes}
                    onChange={(e) => setScheduleNotes(e.target.value)}
                    placeholder="Gate code, parking, call on arrival…"
                  />
                </div>
              </div>
              <div className="notice" role="note">
                <strong>Heads up:</strong> Times are validated before the next step. Inventory holds apply
                when you confirm.
              </div>
              <div className="panel-actions">
                <button type="button" className="btn secondary" onClick={() => setStep(1)}>
                  ← Back
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    const v = isScheduleValid();
                    if (!v.ok) {
                      alert(v.msg);
                      return;
                    }
                    setStep(3);
                  }}
                >
                  Continue →
                </button>
              </div>
            </section>
          )}

          {step === 3 && (
            <section className="panel active" aria-label="Delivery step">
              <div className="panel-header">
                <h2>Delivery Details</h2>
                <span className="badge">{GOOGLE_KEY ? 'Google Places' : 'Manual'}</span>
              </div>
              <p className="panel-desc">
                Enter contact info and location. Address search uses Google Places when an API key is
                configured.
              </p>

              <div className="form-field full" style={{ marginBottom: 12 }}>
                <label>
                  <input
                    type="radio"
                    checked={fulfillmentMode === 'delivery'}
                    onChange={() => {
                      setFulfillmentMode('delivery');
                      setAddressVerified(false);
                    }}
                  />{' '}
                  Delivery
                </label>
                <label style={{ marginLeft: 16 }}>
                  <input
                    type="radio"
                    checked={fulfillmentMode === 'pickup'}
                    onChange={() => setFulfillmentMode('pickup')}
                  />{' '}
                  Pickup at yard
                </label>
              </div>

              <div className="form-grid">
                <div className="form-field full">
                  <label htmlFor="deliveryName">Full name</label>
                  <input
                    id="deliveryName"
                    value={deliveryName}
                    onChange={(e) => setDeliveryName(e.target.value)}
                    placeholder="First Last"
                  />
                </div>
                <div className="form-field full">
                  <label htmlFor="deliveryPhone">Phone number</label>
                  <input
                    id="deliveryPhone"
                    type="tel"
                    value={deliveryPhone}
                    onChange={(e) => setDeliveryPhone(e.target.value)}
                    placeholder="(401) 555-1234"
                  />
                </div>

                {fulfillmentMode === 'delivery' && (
                  <>
                    <div className="form-field full">
                      <label htmlFor="addr-autocomplete">Delivery address</label>
                      <PlaceAutocompleteMount
                        apiKey={GOOGLE_KEY}
                        onPlaceSelect={onPlaceSelect}
                        disabled={false}
                      />
                      {GOOGLE_KEY && formattedPlace && (
                        <p className="field-hint" style={{ marginTop: 8 }}>
                          Selected: {formattedPlace}
                        </p>
                      )}
                      {!GOOGLE_KEY && (
                        <>
                          <label htmlFor="line1" style={{ marginTop: 10 }}>
                            Street address
                          </label>
                          <input
                            id="line1"
                            value={line1}
                            onChange={(e) => {
                              setLine1(e.target.value);
                              setAddressVerified(false);
                            }}
                          />
                          <div className="form-grid" style={{ marginTop: 8 }}>
                            <div className="form-field">
                              <label htmlFor="city">City</label>
                              <input
                                id="city"
                                value={city}
                                onChange={(e) => {
                                  setCity(e.target.value);
                                  setAddressVerified(false);
                                }}
                              />
                            </div>
                            <div className="form-field">
                              <label htmlFor="state">State</label>
                              <input
                                id="state"
                                value={state}
                                onChange={(e) => {
                                  setState(e.target.value);
                                  setAddressVerified(false);
                                }}
                              />
                            </div>
                            <div className="form-field">
                              <label htmlFor="postal">ZIP</label>
                              <input
                                id="postal"
                                value={postal}
                                onChange={(e) => {
                                  setPostal(e.target.value);
                                  setAddressVerified(false);
                                }}
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="form-field">
                      <label htmlFor="unit">Unit / Apt (optional)</label>
                      <input
                        id="unit"
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        placeholder="Apt 2B"
                      />
                    </div>

                    <div className="form-field full">
                      <label htmlFor="instr">Site instructions (optional)</label>
                      <textarea
                        id="instr"
                        rows={2}
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                      />
                    </div>
                  </>
                )}
              </div>

              {fulfillmentMode === 'delivery' && (
                <div className="api-box" aria-label="Address verification">
                  <h3>Address verification</h3>
                  <p className="api-sub">
                    Selecting a suggested address from Google marks it verified. Without Google, fill all
                    fields and click Verify.
                  </p>
                  <div className="api-actions">
                    <button type="button" className="btn secondary" onClick={verifyManualAddress}>
                      Verify address
                    </button>
                    <span
                      className={`status-pill${addressVerified ? ' ok' : ''}`}
                      aria-live="polite"
                    >
                      {addressVerified ? 'Verified' : 'Not verified'}
                    </span>
                  </div>
                  <p className="mini-note">
                    Google Places helps ensure the location is reachable for delivery routing.
                  </p>
                </div>
              )}

              <div className="panel-actions">
                <button type="button" className="btn secondary" onClick={() => setStep(2)}>
                  ← Back
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    if (!isScheduleValid().ok) {
                      alert('Fix your schedule on step 2.');
                      setStep(2);
                      return;
                    }
                    if (fulfillmentMode === 'delivery' && !addressVerified) {
                      alert('Verify your delivery address before continuing.');
                      return;
                    }
                    setStep(4);
                  }}
                >
                  Continue →
                </button>
              </div>
            </section>
          )}

          {step === 4 && (
            <section className="panel active" aria-label="Review step">
              <div className="panel-header">
                <h2>Review &amp; Confirm</h2>
                <span className="badge">Confirm</span>
              </div>
              <p className="panel-desc">Review tools, schedule, and delivery before submitting.</p>
              {submitErr && <p className="error-banner">{submitErr}</p>}
              <div className="review-grid">
                <div className="review-card">
                  <h3>Tools</h3>
                  <div className="review-block">
                    {cart.items.map((i) => (
                      <div key={i.toolId}>
                        • {i.name || `Tool #${i.toolId}`} × {i.quantity}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="review-card">
                  <h3>Schedule</h3>
                  <div className="review-block">
                    <strong>Delivery:</strong>{' '}
                    {deliveryDate && deliveryTime
                      ? formatScheduleDisplay(buildScheduleIso(deliveryDate, deliveryTime))
                      : '—'}
                    <br />
                    <strong>Pickup:</strong>{' '}
                    {pickupDate && pickupTime
                      ? formatScheduleDisplay(buildScheduleIso(pickupDate, pickupTime))
                      : '—'}
                    <br />
                    <strong>Duration:</strong> {durationLabel}
                    {scheduleNotes && (
                      <>
                        <br />
                        <strong>Notes:</strong> {scheduleNotes}
                      </>
                    )}
                  </div>
                </div>
                <div className="review-card">
                  <h3>Delivery</h3>
                  <div className="review-block">
                    <strong>Mode:</strong> {fulfillmentMode}
                    <br />
                    <strong>Name:</strong> {deliveryName || '—'}
                    <br />
                    <strong>Phone:</strong> {deliveryPhone || '—'}
                    <br />
                    {fulfillmentMode === 'delivery' ? (
                      <>
                        <strong>Address:</strong> {line1} {unit ? `(${unit})` : ''}
                        <br />
                        {city}, {state} {postal}
                        <br />
                        <strong>Verified:</strong> {addressVerified ? 'Yes' : 'No'}
                      </>
                    ) : (
                      <p>Customer pickup — no ship-to address.</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="notice warn" role="note">
                <strong>Reminder:</strong> Placeholder payments run in demo mode after confirm.
              </div>
              <div className="panel-actions">
                <button type="button" className="btn secondary" onClick={() => setStep(3)} disabled={submitting}>
                  ← Back
                </button>
                <button type="button" className="btn" disabled={submitting} onClick={submitContract}>
                  {submitting ? 'Submitting…' : 'Confirm reservation'}
                </button>
              </div>
            </section>
          )}
        </div>

        <aside className="checkout-summary" aria-label="Order summary">
          <div className="summary-header">
            <h2>Order Summary</h2>
            <span className="badge">{cart.items.length}</span>
          </div>
          <div className="summary-section">
            <h3>Totals (estimate)</h3>
            <div className="summary-row">
              <span>Tools subtotal</span>
              <span>${totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Delivery fee</span>
              <span>${totals.deliveryFee.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Est. tax</span>
              <span>${totals.taxTotal.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Est. deposit (hold)</span>
              <span>${totals.depositTotal.toFixed(2)}</span>
            </div>
            <div className="summary-divider" />
            <div className="summary-row total">
              <span>Total (est.)</span>
              <span>${totals.grandTotal.toFixed(2)}</span>
            </div>
            <p className="summary-hint">
              Based on daily rate × {computedRentalDays} day(s) from your delivery–pickup window × qty + fees
              + tax
            </p>
          </div>
          <div className="summary-section">
            <h3>Rental duration</h3>
            <div className="summary-row">
              <span>Window</span>
              <span>{durationLabel}</span>
            </div>
            <p className="summary-hint">Updates when you set delivery and pickup on step 2</p>
          </div>
          <div className="summary-section">
            <h3>Checkout requirements</h3>
            <ul className="checklist">
              <li className="ok">Cart has items</li>
              <li className={scheduleOk ? 'ok' : ''}>Schedule selected</li>
              <li className={fulfillmentMode === 'pickup' || addressVerified ? 'ok' : ''}>
                Address verified
              </li>
            </ul>
          </div>
        </aside>
      </section>
    </main>
  );
}
