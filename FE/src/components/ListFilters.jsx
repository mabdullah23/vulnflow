import { defaultFilters } from "../services/listFilters.js";
import { statusLabels } from "../services/reportStatus.js";

function ListFilters({ type, filters, onChange }) {
  const programs = type === "programs";

  function update(event) {
    onChange({ ...filters, [event.target.name]: event.target.value });
  }

  return (
    <div className="list-filters">
      <label>
        Search {programs ? "programs" : "reports"}
        <input type="search" name="search" value={filters.search} onChange={update} placeholder="Search..." />
      </label>
      {programs ? (
        <label>
          Domain
          <select name="domain" value={filters.domain} onChange={update}>
            <option value="">All domains</option>
            <option value="web">Web Application</option>
            <option value="api">API</option>
            <option value="cloud">Cloud</option>
            <option value="network">Network</option>
            <option value="source-code">Source Code</option>
          </select>
        </label>
      ) : (
        <>
          <label>
            Status
            <select name="status" value={filters.status} onChange={update}>
              <option value="">All statuses</option>
              {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label>
            Severity
            <select name="severity" value={filters.severity} onChange={update}>
              <option value="">All severities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </label>
        </>
      )}
      <label>
        Sort by
        <select name="sort" value={filters.sort} onChange={update}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="name">{programs ? "Name" : "Title"} A-Z</option>
          {programs ? (
            <>
              <option value="bounty_high">Bounty: high to low</option>
              <option value="bounty_low">Bounty: low to high</option>
            </>
          ) : (
            <>
              <option value="severity_high">Severity: high to low</option>
              <option value="severity_low">Severity: low to high</option>
            </>
          )}
        </select>
      </label>
      <button className="secondary-button" type="button" onClick={() => onChange(defaultFilters)}>Clear</button>
    </div>
  );
}

export default ListFilters;
