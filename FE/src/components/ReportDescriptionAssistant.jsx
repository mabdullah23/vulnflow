import { useState } from "react";
import { improveDescription } from "../services/reportAssistantApi.js";

export default function ReportDescriptionAssistant({ description, disabled, onApply }) {
  const [suggestion, setSuggestion] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  // Suggestions apply only to the exact draft that was sent to the API.
  const currentSuggestion = suggestion?.source === description ? suggestion : null;

  async function improve() {
    setBusy(true);
    setError("");
    setSuggestion(null);
    try {
      const result = await improveDescription(description);
      setSuggestion({ ...result, source: description });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="description-assistant" aria-busy={busy}>
      <button className="secondary-button" type="button" onClick={improve}
        disabled={disabled || busy || description.trim().length < 10 || description.length > 5000}>
        {busy ? "Improving..." : "Improve with AI"}
      </button>
      <small>Only your description is sent to AI. Review its suggestion before using it. Limit: 5,000 characters.</small>
      {error && <p className="error" role="alert">{error}</p>}
      {currentSuggestion && (
        <section className="ai-suggestion" aria-label="AI description suggestion" aria-live="polite">
          <h3>Suggested description</h3>
          <p className="ai-suggestion-text">{currentSuggestion.description}</p>
          {currentSuggestion.missingDetails.length > 0 && (
            <>
              <h4>Details you could add</h4>
              <ul>{currentSuggestion.missingDetails.map((detail, index) => <li key={index}>{detail}</li>)}</ul>
            </>
          )}
          <div className="ai-suggestion-actions">
            <button type="button" disabled={disabled} onClick={() => {
              onApply(currentSuggestion.description);
              setSuggestion(null);
            }}>Use suggestion</button>
            <button className="secondary-button" type="button" onClick={() => setSuggestion(null)}>Cancel</button>
          </div>
        </section>
      )}
    </div>
  );
}
