import { Link, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { LanguageContext } from "../context/LanguageContext";

import {
  FaHome,
  FaTachometerAlt,
  FaLeaf,
  FaTint,
  FaCloudSun,
  FaFlask,
  FaFileAlt,    
  FaSignInAlt
} from "react-icons/fa";

function Navbar() {
    const navigate = useNavigate();

const logout = () => {
  localStorage.removeItem("loggedIn");
  localStorage.removeItem("role");
  localStorage.removeItem("username");

  navigate("/");
};

    const { language, text } =
useContext(LanguageContext);

  return (
    <nav className="navbar">

      <div className="logo">
        🌾 Smart Agriculture
      </div>

      <ul className="nav-links">

        <li>
          <Link to="/">
            <FaHome /> {text[language].home}
          </Link>
        </li>

        <li>
          <Link to="/dashboard">
            <FaTachometerAlt /> {text[language].dashboard}
          </Link>
        </li>

        <li>
          <Link to="/soil">
            <FaLeaf /> {text[language].soil}
          </Link>
        </li>

        <li>
          <Link to="/irrigation">
            <FaTint /> {text[language].irrigation}
          </Link>
        </li>

        <li>
          <Link to="/weather">
            <FaCloudSun /> {text[language].weather}
          </Link>
        </li>

        <li>
          <Link to="/fertilizer">
            <FaFlask /> {text[language].fertilizer}
          </Link>
        </li>

        <li>
          <Link to="/reports">
           <FaFileAlt /> {text[language].reports}
          </Link>
        </li>

        <li>
          <Link to="/login">
            <FaSignInAlt /> {text[language].login}
          </Link>
        </li>

        <li>
  <button
    className="btn btn-danger btn-sm"
    onClick={logout}
  >
    {text[language].logout}
  </button>
</li>

      </ul>

    </nav>
  );
}

export default Navbar;