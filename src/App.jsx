import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://unaojaeegtzcwkdfvarg.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_skfJaYvXoVO4ahjMd3e7Xw_jn4ambim";
const TABLE = "meetup_responses_20260514";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const SATURDAYS = [
  "Jun 27", "Jul 4", "Jul 11", "Jul 18", "Jul 25",
  "Aug 1", "Aug 8", "Aug 15", "Aug 22", "Aug 29"
];

const OPTIONS = [
  { value: "yes",   label: "Fits",     icon: "✓", color: "#1a7f4e", bg: "#e6f5ed", border: "#a3d9bc" },
  { value: "maybe", label: "Maybe",    icon: "?", color: "#7a5c00", bg: "#fff8e1", border: "#f5d97a" },
  { value: "no",    label: "Can't do", icon: "✕", color: "#b0281a", bg: "#fdecea", border: "#f5b5af" },
];

export default function App() {
  const [name, setName] = useState("");
  const [responses, setResponses] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [allEntries, setAllEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => { fetchEntries(); }, []);

  const fetchEntries = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .order("created_at", { ascending: true });
    if (!error) setAllEntries(data || []);
    setLoading(false);
  };

  const handleSelect = (date, val) => {
    setResponses(r => ({ ...r, [date]: r[date] === val ? undefined : val }));
  };

  const handleSubmit = async () => {
    if (!name.trim()) { setSaveError("Please enter your name."); return; }
    setSaveError("");
    setSaving(true);

    const existingIdx = allEntries.findIndex(
      e => e.name.toLowerCase() === name.trim().toLowerCase()
    );

    let error;
    if (existingIdx !== -1) {
      ({ error } = await supabase
        .from(TABLE)
        .update({ responses, updated_at: new Date().toISOString() })
        .eq("id", allEntries[existingIdx].id));
    } else {
      ({ error } = await supabase
        .from(TABLE)
        .insert([{ name: name.trim(), responses }]));
    }

    if (error) {
      setSaveError("Could not save. Please try again.");
    } else {
      await fetchEntries();
      setSubmitted(true);
    }
    setSaving(false);
  };

  const tally = (date, val) => allEntries.filter(e => e.responses?.[date] === val).length;

  const bestDate = [...SATURDAYS].sort((a, b) => {
    const score = d => tally(d, "yes") * 2 + tally(d, "maybe");
    return score(b) - score(a);
  })[0];

  const hasBestDate = allEntries.length > 0 && tally(bestDate, "yes") > 0;

  if (loading) return (
    <div style={{ padding: "2rem", color: "#888", fontSize: 14 }}>Loading…</div>
  );

  return (
    <div style={{ padding: "1.5rem 1rem 2rem", maxWidth: 700, margin: "0 auto", fontFamily: "system-ui, sans-serif" }}>

      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontSize: 20, fontWeight: 500, marginBottom: 4 }}>Summer meet-up 2026</div>
        <div style={{ fontSize: 13, color: "#666" }}>
          Select your availability for each Saturday. You can respond to multiple dates.
        </div>
      </div>

      {!submitted ? (
        <>
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ fontSize: 13, color: "#555", display: "block", marginBottom: 6 }}>Your name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Anna K."
              style={{ width: 220, padding: "8px 12px", fontSize: 14, border: "1px solid #ddd", borderRadius: 8, outline: "none" }}
            />
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", width: "100%", tableLayout: "fixed" }}>
              <colgroup>
                <col style={{ width: 90 }} />
                {OPTIONS.map(o => <col key={o.value} style={{ width: 80 }} />)}
              </colgroup>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", fontSize: 11, color: "#888", padding: "0 0 10px 8px", fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5 }}>Date</th>
                  {OPTIONS.map(o => (
                    <th key={o.value} style={{ textAlign: "center", fontSize: 11, fontWeight: 500, padding: "0 0 10px 0", color: o.color, textTransform: "uppercase", letterSpacing: 0.5 }}>
                      {o.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SATURDAYS.map((date, i) => (
                  <tr key={date} style={{ background: i % 2 !== 0 ? "#f9f9f9" : "transparent" }}>
                    <td style={{ fontSize: 13, fontWeight: 500, padding: "8px 0 8px 8px" }}>{date}</td>
                    {OPTIONS.map(o => {
                      const sel = responses[date] === o.value;
                      return (
                        <td key={o.value} style={{ textAlign: "center", padding: "6px 4px" }}>
                          <button
                            onClick={() => handleSelect(date, o.value)}
                            title={o.label}
                            style={{
                              width: 36, height: 36, borderRadius: "50%",
                              border: `1.5px solid ${sel ? o.color : "#ddd"}`,
                              background: sel ? o.bg : "transparent",
                              color: sel ? o.color : "#aaa",
                              fontSize: 15, fontWeight: 500, cursor: "pointer",
                              transition: "all 0.12s", display: "inline-flex",
                              alignItems: "center", justifyContent: "center",
                            }}
                          >
                            {o.icon}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {saveError && <div style={{ fontSize: 12, color: "#c0392b", marginTop: 10 }}>{saveError}</div>}

          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{
              marginTop: "1.25rem", padding: "9px 24px", fontSize: 14, fontWeight: 500,
              borderRadius: 8, cursor: saving ? "not-allowed" : "pointer",
              background: "#1a7f4e", color: "#fff", border: "none", opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? "Saving…" : "Submit availability"}
          </button>

          {allEntries.length > 0 && (
            <div style={{ marginTop: "0.5rem", fontSize: 12, color: "#888" }}>
              {allEntries.length} {allEntries.length === 1 ? "person has" : "people have"} responded so far.
            </div>
          )}
        </>
      ) : (
        <div style={{ background: "#f0faf5", borderRadius: 12, padding: "1.25rem 1.5rem", marginBottom: "1.5rem", border: "1px solid #a3d9bc" }}>
          <div style={{ fontSize: 15, fontWeight: 500, color: "#1a7f4e", marginBottom: 4 }}>Thanks, {name}!</div>
          <div style={{ fontSize: 13, color: "#555" }}>Your availability has been saved.</div>
          <button
            onClick={() => { setSubmitted(false); setResponses({}); setName(""); }}
            style={{ marginTop: "0.75rem", fontSize: 13, padding: "6px 16px", cursor: "pointer", borderRadius: 8, border: "1px solid #ccc", background: "#fff" }}
          >
            Edit / add another response
          </button>
        </div>
      )}

      {allEntries.length > 0 && (
        <div style={{ marginTop: "2rem" }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "#888", marginBottom: "1rem", textTransform: "uppercase", letterSpacing: 0.5 }}>
            Results — {allEntries.length} {allEntries.length === 1 ? "response" : "responses"}
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", width: "100%", tableLayout: "fixed" }}>
              <colgroup>
                <col style={{ width: 80 }} />
                {allEntries.map(e => <col key={e.id} style={{ width: 60 }} />)}
                {OPTIONS.map(o => <col key={o.value} style={{ width: 48 }} />)}
              </colgroup>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", fontSize: 11, color: "#888", padding: "0 0 8px 8px", fontWeight: 500 }}>Date</th>
                  {allEntries.map(e => (
                    <th key={e.id} style={{ textAlign: "center", fontSize: 11, color: "#333", fontWeight: 500, padding: "0 2px 8px" }}>
                      {e.name.split(" ")[0]}
                    </th>
                  ))}
                  {OPTIONS.map(o => (
                    <th key={o.value} style={{ textAlign: "center", fontSize: 16, padding: "0 2px 8px" }} title={o.label}>{o.icon}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SATURDAYS.map((date, i) => {
                  const isBest = hasBestDate && date === bestDate;
                  return (
                    <tr key={date} style={{ background: isBest ? "#e6f5ed" : i % 2 !== 0 ? "#f9f9f9" : "transparent" }}>
                      <td style={{ fontSize: 12, fontWeight: isBest ? 500 : 400, color: isBest ? "#1a7f4e" : "#333", padding: "7px 0 7px 8px" }}>
                        {date}{isBest ? " ★" : ""}
                      </td>
                      {allEntries.map(e => {
                        const v = e.responses?.[date];
                        const opt = OPTIONS.find(o => o.value === v);
                        return (
                          <td key={e.id} style={{ textAlign: "center", fontSize: 14, padding: "4px 2px", color: opt ? opt.color : "#ddd" }}>
                            {opt ? opt.icon : "–"}
                          </td>
                        );
                      })}
                      {OPTIONS.map(o => {
                        const n = tally(date, o.value);
                        return (
                          <td key={o.value} style={{ textAlign: "center", fontSize: 13, fontWeight: 500, color: n > 0 ? o.color : "#ddd", padding: "4px 2px" }}>
                            {n > 0 ? n : "–"}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
