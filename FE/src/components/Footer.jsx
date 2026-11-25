function Footer({ onNavigate }) {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <strong>VulnFlow</strong>
          <span>Independent research. Responsible disclosure.</span>
        </div>
        <nav className="footer-links" aria-label="Footer navigation">
          <button type="button" onClick={() => onNavigate("home")}>Home</button>
          <button type="button" onClick={() => onNavigate("explore")}>Explore projects</button>
          <button type="button" onClick={() => onNavigate("profile")}>My profile</button>
        </nav>
        <small>© {new Date().getFullYear()} VulnFlow</small>
      </div>
    </footer>
  );
}

export default Footer;
