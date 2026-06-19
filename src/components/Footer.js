import { useContext } from "react";
import { LanguageContext } from "../context/LanguageContext";

function Footer() {

  const { language, text } =
    useContext(LanguageContext);

  return (
    <footer className="footer">

      <h3>
        🌾 {text[language].footerTitle}
      </h3>

      <p>
        {text[language].footerDesc}
      </p>

      <p>
        {text[language].footerTech}
      </p>

      <p>
        © 2026 {text[language].footerRights}
      </p>

    </footer>
  );
}

export default Footer;