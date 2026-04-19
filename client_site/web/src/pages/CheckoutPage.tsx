import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useCart } from '../context/CartContext';

export function CheckoutPage() {
  const { cart, clearCart } = useCart();
  const navigate = useNavigate();
  const rentalDays = cart.rentalDays;

  const [fulfillmentMode, setFulfillmentMode] = useState<'delivery' | 'pickup'>(
    'delivery'
  );
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('17:00');
  const [line1, setLine1] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('TX');
  const [postal, setPostal] = useState('');
  const [instructions, setInstructions] = useState('');
  const [step, setStep] = useState(1);
  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function buildDt(d: string, t: string) {
    if (!d) return '';
    return `${d}T${t || '09:00'}:00`;
  }

  async function submit() {
    setErr(null);
    const scheduledStart = buildDt(startDate, startTime);
    const scheduledEnd = buildDt(endDate, endTime);
    if (!scheduledStart || !scheduledEnd) {
      setErr('Start and end schedule required');
      return;
    }
    if (fulfillmentMode === 'delivery' && (!line1 || !city)) {
      setErr('Address required for delivery');
      return;
    }
    setSubmitting(true);
    try {
      await api('/api/rental-contracts', {
        method: 'POST',
        body: JSON.stringify({
          scheduledStart,
          scheduledEnd,
          rentalDays,
          fulfillmentMode,
          address:
            fulfillmentMode === 'delivery'
              ? {
                  line1,
                  city,
                  state_region: state,
                  postal_code: postal,
                  delivery_instructions: instructions || undefined,
                }
              : undefined,
          items: cart.items.map((i) => ({
            toolId: i.toolId,
            quantity: i.quantity,
          })),
          processPaymentStub: true,
        }),
      });
      clearCart();
      navigate('/my-rentals');
    } catch (e) {
      setErr((e as Error).message || 'Checkout failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (!cart.items.length) {
    return (
      <div className="page-pad">
        <p>Your cart is empty.</p>
        <Link to="/tools">Browse tools</Link>
      </div>
    );
  }

  return (
    <div className="page-pad checkout-wizard">
      <h1>Checkout</h1>
      <div className="step-indicator">Step {step} of 3</div>
      {err && <p className="error-banner">{err}</p>}

      {step === 1 && (
        <section>
          <h2>Schedule</h2>
          <p>Rental duration: {rentalDays} days (from cart)</p>
          <label>
            Start date
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </label>
          <label>
            Start time
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </label>
          <label>
            End date
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </label>
          <label>
            End time
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </label>
          <button type="button" className="btn-primary" onClick={() => setStep(2)}>
            Next
          </button>
        </section>
      )}

      {step === 2 && (
        <section>
          <h2>Fulfillment</h2>
          <label>
            <input
              type="radio"
              checked={fulfillmentMode === 'delivery'}
              onChange={() => setFulfillmentMode('delivery')}
            />{' '}
            Delivery
          </label>
          <label>
            <input
              type="radio"
              checked={fulfillmentMode === 'pickup'}
              onChange={() => setFulfillmentMode('pickup')}
            />{' '}
            Pickup at yard
          </label>
          {fulfillmentMode === 'delivery' && (
            <>
              <label>
                Street
                <input value={line1} onChange={(e) => setLine1(e.target.value)} />
              </label>
              <label>
                City
                <input value={city} onChange={(e) => setCity(e.target.value)} />
              </label>
              <label>
                State
                <input value={state} onChange={(e) => setState(e.target.value)} />
              </label>
              <label>
                ZIP
                <input value={postal} onChange={(e) => setPostal(e.target.value)} />
              </label>
              <label>
                Notes
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                />
              </label>
            </>
          )}
          <div className="checkout-nav">
            <button type="button" onClick={() => setStep(1)}>
              Back
            </button>
            <button type="button" className="btn-primary" onClick={() => setStep(3)}>
              Next
            </button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section>
          <h2>Review</h2>
          <p>
            <strong>Starts:</strong> {startDate} {startTime}
          </p>
          <p>
            <strong>Ends:</strong> {endDate} {endTime}
          </p>
          <p>
            <strong>Mode:</strong> {fulfillmentMode}
          </p>
          <ul>
            {cart.items.map((i) => (
              <li key={i.toolId}>
                {i.name || `Tool #${i.toolId}`} × {i.quantity}
              </li>
            ))}
          </ul>
          <p className="fine-print">
            Submitting records your rental and placeholder payments (stub provider)
            for demo purposes.
          </p>
          <div className="checkout-nav">
            <button type="button" onClick={() => setStep(2)}>
              Back
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={submitting}
              onClick={submit}
            >
              {submitting ? 'Submitting…' : 'Confirm rental'}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
