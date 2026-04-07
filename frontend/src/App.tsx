import React, { useState, createContext, useContext } from "react";
import "./index.css";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import NewGardenWizard from "./pages/NewGardenWizard";
import PlantSelection from "./pages/PlantSelection";
import GardenBuilder from "./pages/GardenBuilder";
import GardenView from "./pages/GardenView";
import logo from "./logo.png";

export interface Plant {
  id: number;
  name: string;
  category: string;
  is_nitrogen_fixing: boolean;
  min_zone: string;
  max_zone: string;
  climate_type: string;
  sun_hours: number;
  water_needs: string;
  soil_preferences: string;
  yield_info: string;
  planting_time: string;
  harvest_time: string;
  maintenance_level: string;
  fun_facts: string;
  emoji: string;
  color: string;
  companions?: any[];
  ai_reason?: string;
}

export interface Garden {
  id: number;
  user_id: number;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  zone: string;
  climate_type: string;
  width: number;
  height: number;
  created_at: string;
  plants?: any[];
  layout?: any[];
}

interface User {
  id: number;
  name: string;
  email: string;
}
interface AuthContextType {
  user: User | null;
  login: (u: User) => void;
  logout: () => void;
}
export const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
});
export const useAuth = () => useContext(AuthContext);

type Page =
  | { name: "dashboard" }
  | { name: "new-garden" }
  | { name: "garden-view"; gardenId: number }
  | { name: "plant-selection"; garden: Garden }
  | {
      name: "garden-builder";
      garden: Garden;
      selectedPlants: Plant[];
      savedLayout?: any[];
    };

export const NavContext = createContext<{
  navigate: (page: Page) => void;
  currentPage: Page;
}>({
  navigate: () => {},
  currentPage: { name: "dashboard" },
});
export const useNav = () => useContext(NavContext);

function NavBar() {
  const { user, logout } = useAuth();
  const { navigate } = useNav();
  return (
    <nav className="nav">
      <div className="nav-logo" onClick={() => navigate({ name: "dashboard" })}>
        <img src={logo} alt="Sympos Logo" style={{ height: "60px" }} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {user && <span className="nav-user">👤 {user.name}</span>}
        {user && (
          <button
            className="btn btn-sm"
            style={{
              background: "transparent",
              color: "var(--green-light)",
              border: "1px solid rgba(183,228,167,0.4)",
            }}
            onClick={logout}
          >
            Sign Out
          </button>
        )}
      </div>
    </nav>
  );
}

function App() {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const s = localStorage.getItem("sympos_user");
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  });
  const [currentPage, setCurrentPage] = useState<Page>({ name: "dashboard" });

  const login = (u: User) => {
    setUser(u);
    localStorage.setItem("sympos_user", JSON.stringify(u));
  };
  const logout = () => {
    setUser(null);
    localStorage.removeItem("sympos_user");
    setCurrentPage({ name: "dashboard" });
  };
  const navigate = (page: Page) => setCurrentPage(page);

  if (!user) {
    return (
      <AuthContext.Provider value={{ user, login, logout }}>
        <AuthPage />
      </AuthContext.Provider>
    );
  }

  const renderPage = () => {
    switch (currentPage.name) {
      case "dashboard":
        return <Dashboard />;
      case "new-garden":
        return <NewGardenWizard />;
      case "garden-view":
        return <GardenView gardenId={currentPage.gardenId} />;
      case "plant-selection":
        return <PlantSelection garden={currentPage.garden} />;
      case "garden-builder":
        return (
          <GardenBuilder
            garden={currentPage.garden}
            selectedPlants={currentPage.selectedPlants}
            savedLayout={currentPage.savedLayout}
          />
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <NavContext.Provider value={{ navigate, currentPage }}>
        <NavBar />
        {renderPage()}
      </NavContext.Provider>
    </AuthContext.Provider>
  );
}

export default App;
