import { useEffect, useState } from "react";
import Home from "./components/Home.jsx";
import Login from "./components/Login.jsx";
import Signin from "./components/Signin.jsx";
import { authRequest, tokenKey } from "./services/authApi.js";

function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("login");
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
  }

  if (checkingAuth) {
    return <main><p>Checking your session...</p></main>;
  }

  return (
    <main>
      {user ? (
        <Home user={user} onLogout={logout} />
      ) : page === "login" ? (
        <Login onAuthenticated={setUser} onSwitch={() => setPage("signin")} />
      ) : (
        <Signin onAuthenticated={setUser} onSwitch={() => setPage("login")} />
      )}
    </main>
  );
}

export default App;
