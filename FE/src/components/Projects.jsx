import { dummyProjects } from "../data/dummyData.js";

function Projects() {
  return (
    <section className="page-card">
      <h1>My Projects</h1>
      <p>Projects currently associated with your account.</p>
      <div className="item-list">
        {dummyProjects.map((project) => (
          <article className="list-item" key={project.id}>
            <div><h2>{project.name}</h2><p>{project.organization}</p></div>
            <span>{project.rewards}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

export default Projects;
