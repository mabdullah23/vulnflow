import { useEffect, useState } from "react";
import ExploreProjects from "./components/ExploreProjects.jsx";
import Home from "./components/Home.jsx";
import Footer from "./components/Footer.jsx";
import Login from "./components/Login.jsx";
import Navbar from "./components/Navbar.jsx";
import Profile from "./components/Profile.jsx";
import Projects from "./components/Projects.jsx";
import Reports from "./components/Reports.jsx";
import Signin from "./components/Signin.jsx";
import { authRequest, tokenKey } from "./services/authApi.js";
import { logoutFirebase } from "./services/firebaseAuth.js";

function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("login");
  const [activePage, setActivePage] = useState("home");
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(tokenKey);

    if (!token) {
      setCheckingAuth(false);
      return;
    }

    authRequest("/api/auth/me", { token })
      .then((data) => setUser(data.user))
      .catch(() => localStorage.removeItem(tokenKey))
      .finally(() => setCheckingAuth(false));
  }, []);

  async function logout() {
    localStorage.removeItem(tokenKey);
    setUser(null);
    setPage("login");
    setActivePage("home");
    await logoutFirebase().catch(() => {});
  }

  function renderPage() {
    const pages = {
      home: <Home user={user} onNavigate={setActivePage} />,
      profile: <Profile user={user} onUpdated={setUser} />,
      reports: <Reports />,
      projects: <Projects />,
      explore: <ExploreProjects />,
    };
    return pages[activePage];
  }

  if (checkingAuth) {
    return <main><p>Checking your session...</p></main>;
  }

  return (
    <div>
      {user ? (
        <div className="app-shell">
          <Navbar
            activePage={activePage}
            onNavigate={setActivePage}
            onLogout={logout}
          />
          <main className="app-content">{renderPage()}</main>
          <Footer onNavigate={setActivePage} />
        </div>
      ) : (
        <main className="auth-page">
          {page === "login" ? (
            <Login onAuthenticated={setUser} onSwitch={() => setPage("signin")} />
          ) : (
            <Signin onAuthenticated={setUser} onSwitch={() => setPage("login")} />
          )}
          <p className="auth-note">Independent research. Responsible disclosure.</p>
        </main>
      )}
    </div>
  );
}

export default App;
