import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

function AuthNavLink() {
  const { pathname } = useLocation();
  const active = pathname === '/login' || pathname === '/register';
  return (
    <Link
      to="/login"
      className={`nav-item-link${active ? ' nav-active' : ''}`}
    >
      <span className="nav-label">Login / Sign up</span>
    </Link>
  );
}

function NavLinkItem({
  to,
  children,
  matchSubpaths = false,
}: {
  to: string;
  children: React.ReactNode;
  matchSubpaths?: boolean;
}) {
  const { pathname } = useLocation();
  const active =
    to === '/'
      ? pathname === '/'
      : matchSubpaths
        ? pathname === to || pathname.startsWith(`${to}/`)
        : pathname === to;
  return (
    <Link to={to} className={`nav-item-link${active ? ' nav-active' : ''}`}>
      <span className="nav-label">{children}</span>
    </Link>
  );
}

export function Layout() {
  const { user } = useAuth();
  const { cart } = useCart();
  const count = cart.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <>
      <div id="Navbar">
        <Link to="/">
          <img id="Logo" src="/logo.png" alt="Rocket Rentals" />
        </Link>
        <div id="NavItems">
          <NavLinkItem to="/">Home</NavLinkItem>
          <NavLinkItem to="/tools" matchSubpaths>
            Tools
          </NavLinkItem>
          <NavLinkItem to="/how-it-works">How it works</NavLinkItem>
          <NavLinkItem to="/about">About</NavLinkItem>
          {user ? (
            <>
              <Link to="/cart" className="nav-item-link cart-nav" title="Cart">
                <span className="cart-badge">{count}</span>
                <img
                  src="https://media.istockphoto.com/id/1206806317/vector/shopping-cart-icon-isolated-on-white-background.jpg?s=612x612&w=0&k=20&c=1RRQJs5NDhcB67necQn1WCpJX2YMfWZ4rYi1DFKlkNA="
                  alt="Cart"
                  height={40}
                />
              </Link>
              <NavLinkItem to="/account" matchSubpaths>
                Account
              </NavLinkItem>
            </>
          ) : (
            <AuthNavLink />
          )}
        </div>
      </div>
      <div id="Content">
        <Outlet />
      </div>
    </>
  );
}
