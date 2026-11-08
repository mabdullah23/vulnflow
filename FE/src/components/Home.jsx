function Home({ user }) {
  return (
    <section className="page-card home">
      <h1>Hello: {user.name}</h1>
      <p>Welcome to your VulnFlow home page.</p>
      <p>Use the navigation to manage your reports and projects.</p>
    </section>
  );
}

export default Home;
