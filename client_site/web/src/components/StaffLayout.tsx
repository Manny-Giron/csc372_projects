import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isAdminUser } from '../staff/roles';

const linkCls = ({ isActive }: { isActive: boolean }) =>
  `staff-nav__link${isActive ? ' staff-nav__link--active' : ''}`;

export function StaffLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="staff-portal">
      <header className="staff-topbar">
        <div className="staff-topbar__brand">
          <strong>Rocket Rentals</strong>
          <span className="staff-topbar__badge">Staff</span>
        </div>
        <div className="staff-topbar__actions">
          <span className="staff-topbar__user">{user?.email}</span>
          <button
            type="button"
            className="staff-topbar__btn"
            onClick={() => {
              navigate('/');
            }}
          >
            Main site
          </button>
          <button
            type="button"
            className="staff-topbar__btn"
            onClick={() => {
              logout();
              navigate('/staff/login', { replace: true });
            }}
          >
            Log out
          </button>
        </div>
      </header>
      <div className="staff-body">
        <aside className="staff-sidebar" aria-label="Staff navigation">
          <nav className="staff-nav">
            <NavLink to="/staff/dashboard" className={linkCls} end>
              Active contracts
            </NavLink>
            <NavLink to="/staff/reservations" className={linkCls}>
              Reservations
            </NavLink>
            <NavLink to="/staff/ops" className={linkCls}>
              Fulfillment jobs
            </NavLink>
            <NavLink to="/staff/units" className={linkCls}>
              Equipment &amp; units
            </NavLink>
            {isAdminUser(user) && (
              <NavLink to="/staff/business" className={linkCls}>
                Business &amp; metrics
              </NavLink>
            )}
          </nav>
        </aside>
        <main className="staff-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
