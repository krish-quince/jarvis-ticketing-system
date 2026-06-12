import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import UsersPage from "./pages/UserPage";
import TicketsPage from "./pages/TicketsPage";

import MainLayout from "./layouts/MainLayout";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Login */}

        <Route
          path="/"
          element={<LoginPage />}
        />

        {/* Main Application */}

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