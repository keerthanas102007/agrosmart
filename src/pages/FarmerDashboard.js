import { useNavigate } from "react-router-dom";

export default function FarmerDashboard() {
  const navigate = useNavigate();
  // Redirect to main dashboard
  navigate("/dashboard");
  return null;
}