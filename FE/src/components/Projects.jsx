import { useEffect, useState } from "react";
import CreateProject from "./CreateProject.jsx";
import ProjectDetails from "./ProjectDetails.jsx";
import { authRequest, tokenKey } from "../services/authApi.js";
import ListFilters from "./ListFilters.jsx";
import { defaultFilters, filterProjects } from "../services/listFilters.js";

function Projects() {
  const [projects, setProjects] = useState([]);
  const [view, setView] = useState("list");
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState(defaultFilters);
  const visibleProjects = filterProjects(projects, filters);

  function loadProjects() {
    authRequest("/api/projects/mine", {
      token: localStorage.getItem(tokenKey),
    })
      .then((data) => setProjects(data.projects))
      .catch((requestError) => setError(requestError.message));
  }

  useEffect(() => {
    loadProjects();
  }, []);

  if (view === "create") {
    return (
      <CreateProject
        onCancel={() => setView("list")}
        onCreated={(project) => {
          setProjects([project, ...projects]);
          setView("list");
        }}
      />
    );
  }

  if (view === "details") {
    return (
      <ProjectDetails
        projectId={selectedProjectId}
        onBack={() => {
          loadProjects();
          setView("list");
        }}
      />
    );
  }

  return (
    <section className="page-card">
      <p className="page-path">~/ projects</p>
      <div className="page-heading">
        <div>
          <h1>My Projects</h1>
          <p>Create security programs and review researcher submissions.</p>
        </div>
        <button className="add-button" type="button" onClick={() => setView("create")}>Create program</button>
      </div>
      {error && <p className="error">{error}</p>}
      <ListFilters type="programs" filters={filters} onChange={setFilters} />
      {!error && projects.length === 0 && <p className="empty-state">No projects yet. Create a program to start receiving reports.</p>}
      {!error && projects.length > 0 && visibleProjects.length === 0 && <p className="empty-state">No programs match your search or filters.</p>}
      <div className="item-list">
        {visibleProjects.map((project) => (
          <button
            className="project-item"
            type="button"
            key={project.id}
            onClick={() => {
              setSelectedProjectId(project.id);
              setView("details");
            }}
          >
            <span><strong>{project.name}</strong><small>{project.domainLabel}</small></span>
            <span className="bounty">${project.bountyAmount}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

export default Projects;
