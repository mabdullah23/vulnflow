import { dummyReports } from "../data/dummyData.js";

function Reports() {
  return (
    <section className="page-card">
      <h1>My Reports</h1>
      <p>Dummy vulnerability reports submitted by you.</p>
      <div className="item-list">
        {dummyReports.map((report) => (
          <article className="list-item" key={report.id}>
            <div><h2>{report.title}</h2><p>{report.status}</p></div>
            <span className={`badge badge-${report.severity.toLowerCase()}`}>{report.severity}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

export default Reports;
