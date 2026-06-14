import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import UsersPage from "./pages/UserPage";
import TicketsPage from "./pages/TicketsPage";
import TicketDetailPage from "./pages/TicketDetailPage";

import MainLayout from "./layouts/MainLayout";

// Route guard for authenticated users
const ProtectedRoute = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
};

// Route guard for guest-only pages (e.g. login page)
const GuestRoute = () => {
  const token = localStorage.getItem("token");
  if (token) {
    return <Navigate to="/tickets" replace />;
  }
  return <Outlet />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Login (Guests Only) */}
        <Route element={<GuestRoute />}>
          <Route
            path="/"
            element={<LoginPage />}
          />
        </Route>

        {/* Main Application (Protected) */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route
              path="/dashboard"
              element={<DashboardPage />}
            />

            <Route
              path="/users"
              element={<UsersPage />}
            />

            <Route
              path="/tickets"
              element={<TicketsPage />}
            />

            <Route
              path="/tickets/:id"
              element={<TicketDetailPage />}
            />
          </Route>
        </Route>

        {/* Unknown Routes */}
        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;