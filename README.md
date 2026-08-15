# daily-learn
a learning tool, intended to be used daily, where different prompts are given in order to write an essay in the topic. where it is then graded and tracked.

## status

Early scaffold only — a static, cozy pixel-art landing page (warm wood
and parchment tones, "Pixelify Sans" font), gated by a "solve the riddle
to come in" arithmetic screen, then a welcome page with a bookshelf
calendar. No real prompt/essay/grading feature yet; those come next.

Note: the gate is a fun client-side puzzle, not real authentication — the
answer is generated and checked in the browser (`app.js`), so it's trivially
bypassable and there's nothing sensitive behind it.

The calendar (`calendar.js`) renders the current month as a wooden
bookshelf, one shelf per week, one book per day. Hovering today's or a
past day's book slides it partially up out of the shelf and shows a
tooltip: today's topic, or a past day's status — finished / bookmarked /
unopened — read from `localStorage["daily-learn-progress"]`. Nothing
writes into that key yet, so every past day currently reads "unopened"
until the real essay-writing flow exists.

It has synthesized cozy sound effects (`sfx.js`): a soft pluck on access
granted, a gentle double-knock on a wrong answer, quiet key-ticks while
typing, a light page-flip blip on book hover, and clicks on the toggle
button — all generated on the fly with the Web Audio API, no audio files.
A SOUND ON/OFF toggle in the footer persists via `localStorage`.

(There's no voice greeting anymore — it was tried and then dropped in
favor of this cozier direction.)

## deployment

Plain static HTML/CSS served via GitHub Pages from the `main` branch
(no build step). Live at: https://neoutinn.github.io/daily-learn/
