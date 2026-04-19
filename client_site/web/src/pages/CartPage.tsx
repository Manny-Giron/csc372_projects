import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export function CartPage() {
  const { cart, setQty, removeTool, setRentalDays } = useCart();

  if (!cart.items.length) {
    return (
      <div className="page-pad">
        <h1>Your cart</h1>
        <p>Your cart is empty.</p>
        <Link to="/tools">Browse tools</Link>
      </div>
    );
  }

  return (
    <div className="page-pad cart-page">
      <h1>Your cart</h1>
      <label>
        Rental days{' '}
        <input
          type="number"
          min={1}
          max={30}
          value={cart.rentalDays}
          onChange={(e) => setRentalDays(Number(e.target.value))}
        />
      </label>
      <ul className="cart-lines">
        {cart.items.map((line) => (
          <li key={line.toolId}>
            <span>{line.name || `Tool #${line.toolId}`}</span>
            <input
              type="number"
              min={1}
              max={99}
              value={line.quantity}
              onChange={(e) => setQty(line.toolId, Number(e.target.value))}
            />
            <button type="button" onClick={() => removeTool(line.toolId)}>
              Remove
            </button>
          </li>
        ))}
      </ul>
      <Link to="/checkout" className="btn-primary checkout-link">
        Proceed to schedule & checkout
      </Link>
    </div>
  );
}
