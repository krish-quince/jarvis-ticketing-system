import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import AdminPage from "./pages/AdminPage";
import TicketsPage from "./pages/TicketsPage";
import TicketDetailPage from "./pages/TicketDetailPage";
import NewTicketPage from "./pages/NewTicketPage";
import AdminCategoriesPage from "./pages/AdminCategoriesPage";
import AdminStatusesPage from "./pages/AdminStatusesPage";
import AdminPrioritiesPage from "./pages/AdminPrioritiesPage";
import AdminCompaniesPage from "./pages/AdminCompaniesPage";
import AdminDepartmentsPage from "./pages/AdminDepartmentsPage";
import GeneralSettingsPage from "./pages/GeneralSettingsPage";

import MainLayout from "./layouts/MainLayout";
import UsersPage from "./pages/UserPage";
import AddUserPage from "./pages/AddUserPage";

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
          <Route path="/" element={<LoginPage />} />
        </Route>

        {/* Main Application (Protected) */}
        <Route element={<ProtectedRoute />}>
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/tickets" element={<TicketsPage />} />
              <Route path="/tickets/new" element={<NewTicketPage />} />
              <Route path="/tickets/:id" element={<TicketDetailPage />} />

              <Route path="/admin" element={<AdminPage />} />
              <Route path="/admin/users" element={<UsersPage />} />
              <Route path="/admin/users/new" element={<AddUserPage />} />
              <Route path="/admin/categories" element={<AdminCategoriesPage />} />
              <Route path="/admin/categories/:categoryId" element={<AdminCategoriesPage />} />
              <Route path="/admin/statuses" element={<AdminStatusesPage />} />
              <Route path="/admin/priorities" element={<AdminPrioritiesPage />} />
              <Route path="/admin/companies" element={<AdminCompaniesPage />} />
              <Route path="/admin/departments" element={<AdminDepartmentsPage />} />
              <Route path="/admin/settings" element={<GeneralSettingsPage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
