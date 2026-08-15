# daily-learn
a learning tool, intended to be used daily, where different prompts are given in order to write an essay in the topic. where it is then graded and tracked.

## status

Early scaffold only — a static, dark-mode landing page styled like a sleek
Linux terminal window, gated by a "login" that asks you to solve a small
arithmetic problem. No real features yet; those come next.

Note: the login is a fun client-side gate, not real authentication — the
answer is generated and checked in the browser (`app.js`), so it's trivially
bypassable and there's nothing sensitive behind it.

## deployment

Plain static HTML/CSS served via GitHub Pages from the `main` branch
(no build step). Live at: https://neoutinn.github.io/daily-learn/

