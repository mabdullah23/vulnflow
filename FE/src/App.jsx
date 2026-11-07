import { useEffect, useState } from "react";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

function App() {
  const [message, setMessage] = useState("Loading server message...");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${apiUrl}/api/message`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("The server returned an error.");
        }
        return response.json();
      })
      .then((data) => setMessage(data.message))
      .catch(() => {
        setError("Could not connect to the Express server.");
      });
  }, []);

  return (
    <main>
      <h1>VulnFlow</h1>
      <p>Bug bounty platform demo</p>
      <p>{error || message}</p>
    </main>
  );
}

export default App;
