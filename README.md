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
tooltip: today's article, or a past day's status — finished / bookmarked /
unopened — read via `progress.js` from `localStorage["daily-learn-progress"]`.
Clicking any of those books (today, or a past "unopened"/"bookmarked"/
"finished" day) opens the writing desk for that date.

**The daily prompt is a real essay, not a generated question.** Each day
deterministically picks one entry from a small hand-picked, link-checked
list of free Substack essays by recognizable, non-political,
non-scientific writers (`ARTICLES` in `progress.js`) — currently George
Saunders' *Story Club*, Austin Kleon, Ted Gioia's *The Honest Broker*, and
Elizabeth Gilbert's *Letters From Love*. The writing desk shows the day's
title/author/link and asks you to read it, then write your own response
— agree, disagree, connect it to your life, extend an idea from it.
Every URL was fetched and checked by hand for "actually free to read,
not paywalled, and not political or scientific in content" before being
added; a few well-known newsletters (Anne Helen Petersen's *Culture
Study*, Cheryl Strayed's *Dear Sugar*) were tried and dropped because the
specific free posts turned out to be about political topics.

The writing desk (`essay.js`) shows that day's article and a textarea.
"save & keep working" stores a draft (day shows as bookmarked, graded by
the quick heuristic check — see below); "finish for today" stores it as
done and grades it. A finished day can be reopened and "revise"d, which
re-runs grading on the edited text. Storage schema (`progress.js`):

```
localStorage["daily-learn-progress"] = {
  "YYYY-MM-DD": {
    status: "completed" | "incomplete",
    article: { title, author, publication, url },
    essay: "what was written",
    grade: { source: "ai" | "heuristic", tier, label, words, sentences, ... },
    updatedAt: "<ISO timestamp>"
  }
}
```

### grading: heuristic (default) or AI (opt-in)

There are two grading modes, and the writing desk always says which one
produced a given grade:

- **Heuristic** (`progress.js`'s `gradeHeuristic`, always on, no setup) —
  word count, sentence count/length, and vocabulary variety, mapped to a
  cozy seed → sprout → sapling → oak tier plus a couple of short notes.
  This is word/sentence counting dressed up in the theme, not real
  feedback on the writing — same honesty as the gate's "not real
  security" note. Used for every draft save, and for finishing a day if
  no API key is configured.
- **AI** (`progress.js`'s `gradeWithAI`, opt-in) — grades against the
  **6+1 Trait Writing model**, a real classroom rubric (Ideas &
  Content, Organization, Voice, Word Choice, Sentence Fluency,
  Conventions), with a per-trait 1–5 score, a specific note per trait, a
  holistic seed/sprout/sapling/oak tier judged on quality rather than
  word count, 2–3 concrete strengths, and 1–2 concrete things to try
  next. This is real feedback from Claude, not a simulation of it.

AI grading needs your own Anthropic API key, entered in the **settings**
panel (footer button next to the sound toggle → "AI GRADING: ON/OFF").
The site has no backend — the key is saved only in this browser's
`localStorage` (`daily-learn-api-key`) and every grading request goes
straight from this browser to `api.anthropic.com` (using Anthropic's
`anthropic-dangerous-direct-browser-access` opt-in header for
no-backend browser calls), billed to your own Anthropic account. Model
is also chooseable in settings (`daily-learn-ai-model`; defaults to
Claude Opus 5). If the API call fails for any reason — bad key, refusal,
network error — `finish()` falls back to the heuristic grade and the
desk shows why, rather than silently pretending the AI graded it. Clear
the key any time to go back to heuristic-only.

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
