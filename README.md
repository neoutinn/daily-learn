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

It also has HUD-style sound effects (`sfx.js`): a confirm chime on access
granted, an error buzz on a wrong answer, soft key-ticks while typing the
answer, a light blip on calendar hover, and clicks on the toggle buttons.
These are synthesized on the fly with the Web Audio API — again, no audio
files. A separate SFX ON/OFF toggle sits next to the voice one.

## deployment

Plain static HTML/CSS served via GitHub Pages from the `main` branch
(no build step). Live at: https://neoutinn.github.io/daily-learn/

