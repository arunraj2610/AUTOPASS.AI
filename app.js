const SECRET = "autopass-demo-secret"; // demo only; real systems sign on the server
const $ = (id) => document.getElementById(id);
const load = () => JSON.parse(localStorage.getItem("autopass") || "[]");
const save = (d) => localStorage.setItem("autopass", JSON.stringify(d));
const fmt = (t) => new Date(t).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

document.querySelectorAll("nav button").forEach((b) => (b.onclick = () => {
  document.querySelectorAll("nav button").forEach((x) => x.classList.toggle("on", x === b));
  document.querySelectorAll(".tab").forEach((t) => (t.hidden = t.id !== b.dataset.tab));
  render();
}));

$("submit").onclick = () => {
  const req = {};
  ["name", "rollNo", "outTime", "returnTime", "guardianPhone", "reason"].forEach((k) => (req[k] = $(k).value.trim()));
  if (Object.values(req).some((v) => !v)) { $("submitMsg").textContent = "Fill in every field before submitting."; return; }
  const data = load();
  req.id = "AP-" + Date.now().toString(36).toUpperCase();
  req.createdAt = Date.now(); req.status = "Pending"; req.used = null;
  req.risk = Scoring.riskScore(req, data);
  data.push(req); save(data);
  $("submitMsg").textContent = `Request ${req.id} sent. Risk check: ${req.risk.level}.`;
  ["reason"].forEach((k) => ($(k).value = ""));
  render();
};

function decide(id, status) {
  const data = load(); const r = data.find((x) => x.id === id);
  r.status = status;
  if (status === "Approved") r.code = r.id + "-" + Scoring.sign(r.id + r.rollNo + r.returnTime, SECRET);
  save(data); render();
}

function render() {
  const data = load().reverse();
  $("mine").innerHTML = data.length ? data.map((r) => `
    <article class="card"><div class="top"><strong>${esc(r.name)} (${esc(r.rollNo)})</strong><span class="pill ${r.status}">${r.status}</span></div>
    <div>${fmt(r.outTime)} to ${fmt(r.returnTime)}</div><div>${esc(r.reason)}</div>
    ${r.status === "Approved" ? `<div class="pass"><div id="qr-${r.id}"></div><div><div class="code">${r.code}</div>
      <small>Show this at the gate</small></div></div>` : ""}</article>`).join("") : "<p>No requests yet.</p>";
  data.filter((r) => r.status === "Approved").forEach((r) => {
    const el = $("qr-" + r.id);
    if (el && window.QRCode) new QRCode(el, { text: r.code, width: 96, height: 96 });
  });
  const pend = data.filter((r) => r.status === "Pending");
  $("pending").innerHTML = pend.length ? pend.map((r) => `
    <article class="card"><div class="top"><strong>${esc(r.name)} (${esc(r.rollNo)})</strong>
      <span class="pill ${r.risk.level}">${r.risk.level} risk (${r.risk.score})</span></div>
    <div>${fmt(r.outTime)} to ${fmt(r.returnTime)}</div><div>${esc(r.reason)}</div>
    <ul class="reasons">${r.risk.reasons.map((x) => `<li>${esc(x)}</li>`).join("") || "<li>No flags raised</li>"}</ul>
    <div class="actions"><button onclick="decide('${r.id}','Approved')">Approve</button>
    <button class="no" onclick="decide('${r.id}','Rejected')">Reject</button></div></article>`).join("") : "<p>Nothing waiting for approval.</p>";
}

$("verify").onclick = () => {
  const code = $("code").value.trim().toUpperCase();
  const r = load().find((x) => x.code === code);
  let ok = false, msg = "Pass not found. Do not let the student out.";
  if (r) {
    const sigOk = r.code === r.id + "-" + Scoring.sign(r.id + r.rollNo + r.returnTime, SECRET);
    if (!sigOk) msg = "Signature mismatch. This pass was altered.";
    else if (Date.now() > new Date(r.returnTime)) msg = "Pass expired.";
    else if (Date.now() < new Date(r.outTime) - 36e5) msg = "Too early. Valid from " + fmt(r.outTime) + ".";
    else {
      ok = true; msg = `Valid pass for ${r.name} (${r.rollNo}). Return by ${fmt(r.returnTime)}.`;
      const data = load(); data.find((x) => x.id === r.id).used = Date.now(); save(data);
    }
  }
  $("verdict").innerHTML = `<div class="verdict ${ok ? "ok" : "bad"}" role="status">${esc(msg)}</div>`;
};

window.decide = decide;
render();
