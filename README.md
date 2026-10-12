# AutoPass AI

Online outpass requests and approvals that replace manual paperwork. Plain HTML, CSS and JavaScript, no build step.

## Features
- Student request form, warden approval dashboard, gate verification screen
- **Smart verification:** every request gets an explainable risk score (late-night exit, trip length, repeat requests, vague reason, invalid guardian phone). The warden sees *why* a request was flagged.
- Approved passes get a QR code and a signed pass code. Altered, expired or too-early passes are rejected at the gate.
- Data is stored in the browser (`localStorage`) so it works offline as a demo.

## Run it
Open `index.html` in a browser, or run `python -m http.server` and visit `localhost:8000`.

## How the AI part works
`scoring.js` is a transparent rule-based scorer. To upgrade it, train a classifier on past approvals and replace `riskScore()` with a model call. The UI already shows score and reasons.

## Limits (be honest in interviews)
Pass signing is demo-grade and runs in the browser. For production, move storage, auth and HMAC signing to a backend.

## Team
Built as part of AS TEAM. Role: Frontend Design.
