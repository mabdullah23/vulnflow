import { useEffect, useState } from "react";
import { authRequest, tokenKey } from "../services/authApi.js";

function Notifications() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState("");
  const [marking, setMarking] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const data = await authRequest("/api/notifications", { token: sessionStorage.getItem(tokenKey) });
      setItems(data.notifications);
      setUnreadCount(data.unreadCount);
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, []);

  async function markRead() {
    setMarking(true);
    try {
      await authRequest("/api/notifications/read", { method: "PATCH", token: sessionStorage.getItem(tokenKey) });
      await load();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setMarking(false);
    }
  }

  return (
    <div className="notifications" onKeyDown={(event) => { if (event.key === "Escape") setOpen(false); }}>
      <button className="notification-toggle" type="button" aria-label={`Notifications, ${unreadCount} unread`}
        aria-expanded={open} aria-controls="notification-list" onClick={() => { setOpen(!open); if (!open) load(); }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
        </svg>
        {unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}
      </button>
      {open && (
        <section className="notification-panel" id="notification-list" aria-label="Notifications">
          <strong>Notifications</strong>
          <button className="link-button" type="button" onClick={() => setOpen(false)}>Close</button>
          {unreadCount > 0 && <button className="link-button" type="button" disabled={marking} onClick={markRead}>Mark all as read</button>}
          {error && <p className="error" role="alert">{error}</p>}
          {loading && <p>Loading notifications...</p>}
          {!loading && !error && items.length === 0 && <p>No notifications yet.</p>}
          {items.map((item) => (
            <article className={`notification-item ${item.read ? "" : "notification-unread"}`} key={item.id}>
              <p>{!item.read && <strong>New: </strong>}{item.message}</p>
              <small>{new Date(item.createdAt).toLocaleString()}</small>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

export default Notifications;
