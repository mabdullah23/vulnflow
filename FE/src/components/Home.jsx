function Home({ user, onNavigate }) {
  const shortcuts = [
    { page: "reports", label: "My reports", description: "Findings, evidence, and review status." },
    { page: "projects", label: "My projects", description: "Your programs and incoming submissions." },
    { page: "profile", label: "My profile", description: "Your identity on VulnFlow." },
  ];

  return (
    <div className="home">
      <section className="home-hero" aria-labelledby="home-title">
        <div className="hero-copy">
          <p className="home-path"><span aria-hidden="true">~/</span> workspace</p>
          <p className="home-welcome">Welcome back, {user.name}.</p>
          <h1 id="home-title">Find the gap<span>.</span></h1>
          <p className="hero-description">
            Pick a program. Know the scope. Put your research to work.
          </p>
          <button className="home-primary" type="button" onClick={() => onNavigate("explore")}>
            Browse programs
          </button>
        </div>

        <aside className="scope-note" aria-labelledby="scope-title">
          <div className="scope-file"><span aria-hidden="true">#</span> scope.txt</div>
          <div className="scope-body">
            <h2 id="scope-title">Before you start</h2>
            <ul>
              <li>Read the program scope.</li>
              <li>Test only authorized assets.</li>
              <li>Keep your steps reproducible.</li>
              <li>Report privately. Include evidence.</li>
            </ul>
            <p className="scope-comment">// Good research leaves a clear trail.</p>
          </div>
        </aside>
      </section>

      <section className="home-shortcuts" aria-labelledby="shortcuts-title">
        <div className="shortcuts-heading">
          <h2 id="shortcuts-title">Workspace</h2>
          <span>reports / programs / account</span>
        </div>
        <div className="workspace-links">
          {shortcuts.map((shortcut) => (
            <button className="workspace-link" key={shortcut.page} type="button" onClick={() => onNavigate(shortcut.page)}>
              <span className="workspace-name"><span aria-hidden="true">./</span>{shortcut.label}</span>
              <span className="workspace-description">{shortcut.description}</span>
              <span className="workspace-open">Open</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Home;
