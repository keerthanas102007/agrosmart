import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import "./styles/global.css";
import { AppProvider } from "./context/AppContext";

import Login          from "./pages/Login";
import Register       from "./pages/Register";
import Home           from "./pages/Home";
import Dashboard      from "./pages/Dashboard";
import Farm           from "./pages/Farm";
import Crops          from "./pages/Crops";
import Irrigation     from "./pages/Irrigation";
import Soil           from "./pages/Soil";
import Weather        from "./pages/Weather";
import Reports        from "./pages/Reports";
import Profile        from "./pages/Profile";
import FarmHistory    from "./pages/FarmHistory";
import NotificationNews from "./pages/NotificationNews";
import AdminDashboard from "./pages/AdminDashboard";
import Fertilizer     from "./pages/Fertilizer";
import Community      from "./pages/Community";
import CreatePost     from "./pages/CreatePost";
import ProfitHistory  from "./pages/ProfitHistory";
import DiseaseDetection from "./pages/DiseaseDetection";

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          <Route path="/"            element={<Login />} />
          <Route path="/register"    element={<Register />} />
          <Route path="/home"        element={<Home />} />
          <Route path="/dashboard"   element={<Dashboard />} />
          <Route path="/farm"        element={<Farm />} />
          <Route path="/crops"       element={<Crops />} />
          <Route path="/irrigation"  element={<Irrigation />} />
          <Route path="/soil"        element={<Soil />} />
          <Route path="/weather"     element={<Weather />} />
          <Route path="/reports"     element={<Reports />} />
          <Route path="/profile"     element={<Profile />} />
          <Route path="/history"     element={<ProfitHistory />} />
          <Route path="/news/:id"    element={<NotificationNews />} />
          <Route path="/admin"       element={<AdminDashboard />} />
          <Route path="/fertilizer"  element={<Fertilizer />} />
          <Route path="/community"   element={<Community />} />
          <Route path="/create-post" element={<CreatePost />} />
          <Route path="/disease"     element={<DiseaseDetection />} />
          <Route path="*"            element={<Navigate to="/" replace />} />
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;

