import { useEffect, useState } from "react";
import { authRequest, tokenKey } from "../services/authApi.js";
import { statusLabels } from "../services/reportStatus.js";
import ReportComments from "./ReportComments.jsx";
import ListFilters from "./ListFilters.jsx";
import { defaultFilters, filterReports } from "../services/listFilters.js";

function Reports() {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState(defaultFilters);
  const visibleReports = filterReports(reports, filters);

  useEffect(() => {
    authRequest("/api/submissions/mine", {
      token: localStorage.getItem(tokenKey),
    })
      .then((data) => setReports(data.submissions))
      .catch((requestError) => setError(requestError.message));
  }, []);

  return (
    <section className="page-card">
      <p className="page-path">~/ reports</p>
      <h1>My Reports</h1>
      <p>Reports you submitted to bounty programs.</p>
      {error && <p className="error">{error}</p>}
      <ListFilters type="reports" filters={filters} onChange={(value) => {
        setFilters(value);
        setSelectedReport(null);
      }} />
      {!error && reports.length === 0 && <p className="empty-state">You have not submitted any reports yet.</p>}
      {!error && reports.length > 0 && visibleReports.length === 0 && <p className="empty-state">No reports match your search or filters.</p>}
      <div className="item-list">
        {visibleReports.map((report) => (
          <button className="report-item" type="button" key={report.id} onClick={() => setSelectedReport(report)}>
            <span><strong>{report.title}</strong><small>{report.project?.name || "Project"} · {report.severity}</small></span>
            <span className={`badge badge-${report.status}`}>{statusLabels[report.status]}</span>
          </button>
        ))}
      </div>
      {selectedReport && (
        <article className="submission-detail">
          <div className="page-heading">
            <h2>{selectedReport.title}</h2>
            <button className="secondary-button" type="button" onClick={() => setSelectedReport(null)}>Close</button>
          </div>
          <p>{selectedReport.description}</p>
          <div className="program-meta">
            <strong>Status</strong><span>{statusLabels[selectedReport.status]}</span>
            <strong>Severity</strong><span>{selectedReport.severity}</span>
            <strong>Video</strong><a href={selectedReport.videoUrl} target="_blank" rel="noreferrer">View video</a>
            <strong>PDF</strong><a href={selectedReport.pdfUrl} target="_blank" rel="noreferrer">View PDF</a>
            <strong>Review note</strong><span>{selectedReport.reviewNote || "No review note yet."}</span>
          </div>
          <ReportComments key={selectedReport.id} submissionId={selectedReport.id} />
        </article>
      )}
    </section>
  );
}

export default Reports;
