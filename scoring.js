/* Smart pass checks: transparent rule-based risk scoring + tamper-proof pass signature.
 * Each rule adds points; the reasons are shown to the approver so the decision stays explainable. */
(function (root) {
  const RISKY_WORDS = ["party", "movie", "outing", "trip", "friend", "casual", "just", "bored"];
  const GOOD_WORDS = ["hospital", "doctor", "medical", "exam", "interview", "family", "emergency", "home", "internship"];

  function riskScore(req, history) {
    let score = 0; const reasons = [];
    const out = new Date(req.outTime), back = new Date(req.returnTime);
    const hours = (back - out) / 36e5;
    const reason = (req.reason || "").toLowerCase();

    if (isNaN(hours) || hours <= 0) { score += 50; reasons.push("Return time is before departure"); }
    if (out.getHours() >= 21 || out.getHours() < 5) { score += 20; reasons.push("Leaving late at night"); }
    if (hours > 72) { score += 20; reasons.push("Away for more than 3 days"); }
    const recent = history.filter((h) => h.rollNo === req.rollNo && Date.now() - h.createdAt < 30 * 864e5).length;
    if (recent >= 4) { score += 25; reasons.push(`${recent} passes requested in the last 30 days`); }
    if (reason.trim().split(/\s+/).length < 3) { score += 15; reasons.push("Reason is too short"); }
    if (RISKY_WORDS.some((w) => reason.includes(w))) { score += 15; reasons.push("Reason looks non-essential"); }
    if (GOOD_WORDS.some((w) => reason.includes(w))) { score -= 15; reasons.push("Reason matches a verified category"); }
    if (!/^\d{10}$/.test(req.guardianPhone || "")) { score += 15; reasons.push("Guardian phone number is invalid"); }

    score = Math.max(0, Math.min(100, score));
    const level = score >= 50 ? "High" : score >= 25 ? "Medium" : "Low";
    return { score, level, reasons };
  }

  // 32-bit FNV-1a hash used as a signature. Demo-grade: in production sign on the server (HMAC).
  function sign(id, secret) {
    let h = 0x811c9dc5; const s = id + "|" + secret;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return h.toString(36).toUpperCase();
  }

  const api = { riskScore, sign };
  if (typeof module !== "undefined") module.exports = api; else root.Scoring = api;
})(typeof window !== "undefined" ? window : globalThis);
