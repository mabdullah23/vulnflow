function Profile({ user }) {
  return (
    <section className="page-card">
      <h1>Profile</h1>
      <p>Manage your researcher profile.</p>
      <div className="detail-list">
        <strong>Username</strong><span>{user.name}</span>
        <strong>Email</strong><span>{user.email}</span>
        <strong>Profile picture</strong><span>Not added yet</span>
      </div>
    </section>
  );
}

export default Profile;
