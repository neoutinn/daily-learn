# daily-learn
a learning tool, intended to be used daily, where different prompts are given in order to write an essay in the topic. where it is then graded and tracked.

## status

Early scaffold only — a static, dark-mode landing page styled like a
futuristic AI-assistant HUD (JARVIS-ish: glowing glass panel, corner
brackets, pulsing status indicator), gated by an "identity verification"
screen that asks you to solve a small arithmetic problem, then a welcome
page with a progress calendar. No real prompt/essay/grading feature yet;
those come next.

Note: the login is a fun client-side gate, not real authentication — the
answer is generated and checked in the browser (`app.js`), so it's trivially
bypassable and there's nothing sensitive behind it.

On unlock, it speaks a short "Welcome, Gabriel" greeting using the
browser's built-in speech synthesis (Web Speech API) — no audio files, no
external service. Voice quality/availability depends on the browser/OS. A
VOICE ON/OFF toggle in the footer persists via `localStorage`.

## deployment

Plain static HTML/CSS served via GitHub Pages from the `main` branch
(no build step). Live at: https://neoutinn.github.io/daily-learn/

