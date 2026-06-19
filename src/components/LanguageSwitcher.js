import { useApp } from "../context/AppContext";

function LanguageSwitcher() {

  const { lang, setLang } = useApp();

  const changeLanguage = (newLang) => {
    setLang(newLang);
  };

  return (
    <div className="d-flex gap-2">

      <button
        className={
          lang === "en"
          ? "btn btn-success"
          : "btn btn-outline-success"
        }
        onClick={() =>
          changeLanguage("en")
        }
      >
        English
      </button>

      <button
        className={
          lang === "ta"
          ? "btn btn-success"
          : "btn btn-outline-success"
        }
        onClick={() =>
          changeLanguage("ta")
        }
      >
        தமிழ்
      </button>

      <button
        className={
          lang === "hi"
          ? "btn btn-success"
          : "btn btn-outline-success"
        }
        onClick={() =>
          changeLanguage("hi")
        }
      >
        हिन्दी
      </button>

    </div>
  );
}

export default LanguageSwitcher;