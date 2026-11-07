function Home({ user, onLogout }) {
  return (
    <section className="card home">
      <h1>Hello: {user.name}</h1>
      <p>Welcome to your VulnFlow home page.</p>
      <button type="button" onClick={onLogout}>Log out</button>
    </section>
  );
}

export default Home;
