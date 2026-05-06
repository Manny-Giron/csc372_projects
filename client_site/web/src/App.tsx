import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Layout } from './components/Layout';
import { StaffLayout } from './components/StaffLayout';
import { RequireAuth } from './components/RequireAuth';
import { RequireAdminStaff } from './components/RequireAdminStaff';
import { RequireStaffAuth } from './components/RequireStaffAuth';
import { HomePage } from './pages/HomePage';
import { ToolsPage } from './pages/ToolsPage';
import { ToolDetailPage } from './pages/ToolDetailPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { CartPage } from './pages/CartPage';
import { MyRentalsPage } from './pages/MyRentalsPage';
import { AccountPage } from './pages/AccountPage';
import { OpsJobsPage } from './pages/OpsJobsPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { AboutPage } from './pages/AboutPage';
import { StaffLoginPage } from './pages/StaffLoginPage';
import { StaffDashboardPage } from './pages/StaffDashboardPage';
import { StaffReservationsPage } from './pages/StaffReservationsPage';
import { StaffContractDetailPage } from './pages/StaffContractDetailPage';
import { StaffBusinessPage } from './pages/StaffBusinessPage';
import { StaffToolUnitsPage } from './pages/StaffToolUnitsPage';
import { StaffToolUnitDetailPage } from './pages/StaffToolUnitDetailPage';

import './app.css';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/staff/login" element={<StaffLoginPage />} />
            <Route
              path="/staff"
              element={
                <RequireStaffAuth>
                  <StaffLayout />
                </RequireStaffAuth>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<StaffDashboardPage />} />
              <Route path="reservations" element={<StaffReservationsPage />} />
              <Route path="contracts/:id" element={<StaffContractDetailPage />} />
              <Route path="ops" element={<OpsJobsPage />} />
              <Route path="units" element={<StaffToolUnitsPage />} />
              <Route path="units/:unitId" element={<StaffToolUnitDetailPage />} />
              <Route
                path="business"
                element={
                  <RequireAdminStaff>
                    <StaffBusinessPage />
                  </RequireAdminStaff>
                }
              />
            </Route>

            <Route path="/admin" element={<Navigate to="/staff/business" replace />} />
            <Route path="/ops/jobs" element={<Navigate to="/staff/ops" replace />} />

            <Route element={<Layout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/tools" element={<ToolsPage />} />
              <Route path="/tools/item/:slug" element={<ToolDetailPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/how-it-works" element={<HowItWorksPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route
                path="/account"
                element={
                  <RequireAuth>
                    <AccountPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/cart"
                element={
                  <RequireAuth>
                    <CartPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/checkout"
                element={
                  <RequireAuth>
                    <Navigate to="/cart" replace />
                  </RequireAuth>
                }
              />
              <Route
                path="/my-rentals"
                element={
                  <RequireAuth>
                    <MyRentalsPage />
                  </RequireAuth>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
