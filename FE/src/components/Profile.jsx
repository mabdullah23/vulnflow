import { useState } from "react";
import { authRequest, tokenKey } from "../services/authApi.js";

function Profile({ user, onUpdated }) {
  const [name, setName] = useState(user.name);
  const [image, setImage] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setMessage("");
    setError("");
    setIsSaving(true);

    const formData = new FormData();
    formData.append("name", name);
    if (image) {
      formData.append("profileImage", image);
    }

    try {
      const data = await authRequest("/api/profile", {
        method: "PATCH",
        body: formData,
        token: localStorage.getItem(tokenKey),
      });
      onUpdated(data.user);
      setImage(null);
      setMessage("Profile updated successfully.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="page-card">
      <h1>Profile</h1>
      <p>Manage your researcher profile.</p>
      <form className="profile-form" onSubmit={submit}>
        <img
          className="profile-picture"
          src={user.profilePicture}
          alt="Profile"
        />
        <label>
          Username
          <input value={name} onChange={(event) => setName(event.target.value)} required />
        </label>
        <label>
          Profile image
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(event) => setImage(event.target.files?.[0] || null)}
          />
        </label>
        <small>Maximum size: 5 MB. Accepted: JPG, PNG, WebP, or GIF.</small>
        {error && <p className="error">{error}</p>}
        {message && <p className="success">{message}</p>}
        <button type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : "Update profile"}
        </button>
      </form>
      <div className="detail-list">
        <strong>Username</strong><span>{user.name}</span>
        <strong>Email</strong><span>{user.email}</span>
        <strong>Profile picture</strong><span>{user.profilePicture}</span>
      </div>
    </section>
  );
}

export default Profile;
