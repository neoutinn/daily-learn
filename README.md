# daily-learn
a learning tool, intended to be used daily, where different prompts are given in order to write an essay in the topic. where it is then graded and tracked.

## status

A static, cozy pixel-art site (warm wood and parchment tones, "Pixelify
Sans" font), gated by a "solve the riddle to come in" arithmetic screen,
then a welcome page with a bookshelf calendar that opens into a writing
desk — the daily prompt/essay/grading/tracking loop the project is
actually for.

Note: the gate is a fun client-side puzzle, not real authentication — the
answer is generated and checked in the browser (`app.js`), so it's trivially
bypassable and there's nothing sensitive behind it.

The calendar (`calendar.js`) renders the current month as a wooden
bookshelf, one shelf per week, one book per day. Hovering today's or a
past day's book slides it partially up out of the shelf and shows a
tooltip: today's topic, or a past day's status — finished / bookmarked /
unopened — read via `progress.js` from `localStorage["daily-learn-progress"]`.
Clicking any of those books (today, or a past "unopened"/"bookmarked"/
"finished" day) opens the writing desk for that date.

The writing desk (`essay.js`) shows that day's prompt and a textarea.
"save & keep working" stores a draft (day shows as bookmarked); "finish
for today" stores it as done and runs it through a heuristic grade —
word count, sentence count/length, and vocabulary variety, mapped to a
cozy seed → sprout → sapling → oak tier plus a couple of short notes.
**This is not AI grading and not a real teacher** — it's word/sentence
counting dressed up in the theme, same honesty as the gate's "not real
security" — real grading is still a "comes next" item. A finished day
can be reopened and "revise"d, which re-runs the grade on the edited
text. Storage schema (`progress.js`):

```
localStorage["daily-learn-progress"] = {
  "YYYY-MM-DD": {
    status: "completed" | "incomplete",
    prompt: "the topic text shown that day",
    essay: "what was written",
    grade: { tier, label, words, sentences, avgWordsPerSentence, notes: [...] },
    updatedAt: "<ISO timestamp>"
  }
}
```

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
