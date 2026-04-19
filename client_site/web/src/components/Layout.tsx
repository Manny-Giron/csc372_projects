import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export function Layout() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const count = cart.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <>
      <div id="Navbar">
        <Link to="/">
          <img id="Logo" src="/logo.png" alt="Rocket Rentals" />
        </Link>
        <div id="NavItems">
          <Link to="/" className="nav-item-link">
            <h2 className="nav-item">Home</h2>
          </Link>
          <Link to="/tools" className="nav-item-link">
            <h2 className="nav-item">Tools</h2>
          </Link>
          <h2 className="nav-item">How It Works</h2>
          <h2 className="nav-item">About</h2>
          {user ? (
            <>
              <Link to="/my-rentals" className="nav-item-link">
                <h2 className="nav-item">My rentals</h2>
              </Link>
              <Link to="/cart" className="nav-item-link cart-nav" title="Cart">
                <span className="cart-badge">{count}</span>
                <img
                  src="https://media.istockphoto.com/id/1206806317/vector/shopping-cart-icon-isolated-on-white-background.jpg?s=612x612&w=0&k=20&c=1RRQJs5NDhcB67necQn1WCpJX2YMfWZ4rYi1DFKlkNA="
                  alt="Cart"
                  height={45}
                />
              </Link>
              <span className="nav-user">{user.email}</span>
              {user.roles.includes('associate') || user.roles.includes('admin') ? (
                <Link to="/ops/jobs" className="nav-item-link">
                  <h2 className="nav-item">Ops</h2>
                </Link>
              ) : null}
              {user.roles.includes('admin') ? (
                <Link to="/admin" className="nav-item-link">
                  <h2 className="nav-item">Admin</h2>
                </Link>
              ) : null}
              <button type="button" className="nav-logout" onClick={logout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-item-link">
                <h2 className="nav-item">Log in</h2>
              </Link>
              <Link to="/register" className="nav-item-link">
                <h2 className="nav-item">Register</h2>
              </Link>
            </>
          )}
        </div>
      </div>
      <div id="Content">
        <Outlet />
      </div>
    </>
  );
}
