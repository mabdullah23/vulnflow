import { useState } from "react";

const links = [
  { id: "home", label: "Home" },
  { id: "profile", label: "Profile" },
  { id: "reports", label: "My Reports" },
  { id: "projects", label: "My Projects" },
  { id: "explore", label: "Explore Projects" },
];

function Navbar({ activePage, onNavigate, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);

  function navigate(page) {
    onNavigate(page);
    setIsOpen(false);
  }

  return (
    <header className="site-header">
      <nav className="navbar" aria-label="Main navigation">
        <button className="brand" type="button" onClick={() => navigate("home")}>
          <span className="brand-mark" aria-hidden="true">[v]</span>
          VulnFlow
        </button>
        <button
          className="menu-toggle"
          type="button"
          aria-label="Toggle navigation"
          aria-expanded={isOpen}
          aria-controls="main-navigation"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? "Close" : "Menu"}
        </button>
        <div id="main-navigation" className={`nav-links ${isOpen ? "nav-links-open" : ""}`}>
          {links.map((link) => (
            <button
              className={`nav-link ${activePage === link.id ? "nav-link-active" : ""}`}
              key={link.id}
              type="button"
              aria-current={activePage === link.id ? "page" : undefined}
              onClick={() => navigate(link.id)}
            >
              {link.label}
            </button>
          ))}
          <button className="nav-logout" type="button" onClick={onLogout}>
            Log out
          </button>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
