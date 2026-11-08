import { exploreProjects } from "../data/dummyData.js";

function ExploreProjects() {
  return (
    <section className="page-card">
      <h1>Explore Projects</h1>
      <p>Discover programs looking for security researchers.</p>
      <div className="project-grid">
        {exploreProjects.map((project) => (
          <article className="explore-item" key={project.id}>
            <h2>{project.name}</h2>
            <p>{project.category}</p>
            <small>{project.researchers} researchers joined</small>
          </article>
        ))}
      </div>
    </section>
  );
}

export default ExploreProjects;
