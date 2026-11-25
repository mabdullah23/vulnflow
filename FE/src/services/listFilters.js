export const defaultFilters = { search: "", domain: "", status: "", severity: "", sort: "newest" };

const severityRank = { low: 1, medium: 2, high: 3, critical: 4 };

function sortItems(items, sort, nameField) {
  return items.sort((a, b) => {
    switch (sort) {
      case "oldest": return new Date(a.createdAt) - new Date(b.createdAt);
      case "name": return a[nameField].localeCompare(b[nameField]);
      case "bounty_high": return b.bountyAmount - a.bountyAmount;
      case "bounty_low": return a.bountyAmount - b.bountyAmount;
      case "severity_high": return severityRank[b.severity] - severityRank[a.severity];
      case "severity_low": return severityRank[a.severity] - severityRank[b.severity];
      default: return new Date(b.createdAt) - new Date(a.createdAt);
    }
  });
}

export function filterProjects(projects, filters) {
  const search = filters.search.trim().toLowerCase();
  const matches = projects.filter((project) =>
    (!filters.domain || project.domain === filters.domain) &&
    [project.name, project.description, project.scope].join(" ").toLowerCase().includes(search)
  );
  return sortItems(matches, filters.sort, "name");
}

export function filterReports(reports, filters) {
  const search = filters.search.trim().toLowerCase();
  const matches = reports.filter((report) =>
    (!filters.status || report.status === filters.status) &&
    (!filters.severity || report.severity === filters.severity) &&
    [report.title, report.description, report.project?.name, report.bugHunter?.name]
      .join(" ").toLowerCase().includes(search)
  );
  return sortItems(matches, filters.sort, "title");
}
