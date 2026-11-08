import { useEffect, useState } from "react";
import ExploreProjects from "./components/ExploreProjects.jsx";
import Home from "./components/Home.jsx";
import Login from "./components/Login.jsx";
import Navbar from "./components/Navbar.jsx";
import Profile from "./components/Profile.jsx";
import Projects from "./components/Projects.jsx";
import Reports from "./components/Reports.jsx";
import Signin from "./components/Signin.jsx";
import { authRequest, tokenKey } from "./services/authApi.js";

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

  function logout() {
    localStorage.removeItem(tokenKey);
    setUser(null);
    setPage("login");
    setActivePage("home");
  }

  function renderPage() {
    const pages = {
      home: <Home user={user} />,
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
    <main>
      {user ? (
        <div className="app-shell">
          <Navbar
            activePage={activePage}
            onNavigate={setActivePage}
            onLogout={logout}
          />
          {renderPage()}
        </div>
      ) : page === "login" ? (
        <Login onAuthenticated={setUser} onSwitch={() => setPage("signin")} />
      ) : (
        <Signin onAuthenticated={setUser} onSwitch={() => setPage("login")} />
      )}
    </main>
  );
}

export default App;
