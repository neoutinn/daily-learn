// daily-learn :: shared progress/storage layer
//
// Single source of truth for reading and writing daily entries. Used by
// both calendar.js (to paint book status/tooltips) and essay.js (the
// writing desk). Each entry is keyed by "YYYY-MM-DD":
//
//   localStorage["daily-learn-progress"] = {
//     "YYYY-MM-DD": {
//       status: "completed" | "incomplete",
//       prompt: "the topic text shown that day",
//       essay: "what was written",
//       grade: { tier, label, words, sentences, avgWordsPerSentence, notes: [...] } | null,
//       updatedAt: "<ISO timestamp>"
//     }
//   }
//
// Legacy note: an earlier scaffold stored a bare "completed"/"incomplete"
// string per date (no essay/grade, nothing ever wrote it). getEntry()
// below upgrades those in memory to { status: <string> } so any old data
// doesn't break the calendar.
//
// The "grade" is a heuristic — word/sentence/vocabulary counting dressed
// up in the cozy theme, computed entirely in the browser. It's not an AI
// and not a real teacher, same spirit as the gate's "not real security"
// note in app.js. Real grading is still a "comes next" item.
(function () {
  "use strict";

  var STORAGE_KEY = "daily-learn-progress";

  var TOPICS = [
    "Describe a small habit that quietly changed your life.",
    "What's a belief you held strongly and later abandoned?",
    "Write about a place that feels unlike anywhere else.",
    "Explain something you understand well to a total beginner.",
    "What does 'doing good work' mean to you?",
    "Describe a disagreement that taught you something.",
    "What's a skill you wish schools actually taught?",
    "Write about a time you were wrong in a useful way.",
    "What would you build if failure were off the table?",
    "Describe the last thing that made you genuinely curious.",
    "What's a rule you follow that most people don't?",
    "Write about a piece of advice you didn't take.",
    "What does 'enough' look like in your life right now?",
    "Describe a tool or object you couldn't work without.",
    "What's something you do differently than most people?",
    "Write about a question you don't have a good answer to.",
    "What's a compromise you made that you still think about?",
    "Describe how your thinking has changed in the last year.",
    "What's worth being stubborn about?",
    "Write about something ordinary that deserves more attention."
  ];

  function pad(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function toKey(date) {
    return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate());
  }

  // Deterministic per-date topic pick, so it's stable across reloads
  // without needing to store anything until the day is actually opened.
  function topicForDate(date) {
    var epochDay = Math.floor(date.getTime() / 86400000);
    var idx = ((epochDay % TOPICS.length) + TOPICS.length) % TOPICS.length;
    return TOPICS[idx];
  }

  function getAll() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function saveAll(all) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch (e) {
      // storage unavailable/full (e.g. private mode) — entry just won't persist.
    }
  }

  function getEntry(date) {
    var all = getAll();
    var raw = all[toKey(date)];
    if (!raw) return null;
    if (typeof raw === "string") return { status: raw }; // legacy shape, no essay/grade
    return raw;
  }

  function statusFor(date) {
    var entry = getEntry(date);
    return entry && (entry.status === "completed" || entry.status === "incomplete")
      ? entry.status
      : "none";
  }

  // --- heuristic "grading" --------------------------------------------
  //
  // Word/sentence/vocabulary counting, not real feedback on the writing
  // itself. Good enough to make the tracking feel alive; nowhere near a
  // real grader.

  function analyze(text) {
    var trimmed = (text || "").trim();
    var words = trimmed ? trimmed.split(/\s+/) : [];
    var wordCount = words.length;

    var sentenceCount = 0;
    var parts = trimmed.split(/[.!?]+/);
    for (var i = 0; i < parts.length; i++) {
      if (parts[i].trim() !== "") sentenceCount++;
    }

    var avgWordsPerSentence = sentenceCount ? wordCount / sentenceCount : 0;

    var seen = {};
    var uniqueCount = 0;
    for (var w = 0; w < words.length; w++) {
      var norm = words[w].toLowerCase().replace(/[^a-z0-9']/g, "");
      if (!norm) continue;
      if (!seen[norm]) {
        seen[norm] = true;
        uniqueCount++;
      }
    }
    var varietyRatio = wordCount ? uniqueCount / wordCount : 0;

    return {
      words: wordCount,
      sentences: sentenceCount,
      avgWordsPerSentence: avgWordsPerSentence,
      varietyRatio: varietyRatio
    };
  }

  function tierFor(wordCount) {
    if (wordCount < 40) return { tier: "seed", label: "a seed" };
    if (wordCount < 100) return { tier: "sprout", label: "a sprout" };
    if (wordCount < 250) return { tier: "sapling", label: "a sapling" };
    return { tier: "oak", label: "a full oak" };
  }

  function grade(text) {
    var stats = analyze(text);
    var t = tierFor(stats.words);
    var notes = [];

    if (stats.sentences === 0) {
      notes.push("no full sentences yet");
    } else if (stats.avgWordsPerSentence < 6) {
      notes.push("short, punchy sentences");
    } else if (stats.avgWordsPerSentence > 30) {
      notes.push("a few long sentences — try splitting some up");
    } else {
      notes.push("nicely varied sentence length");
    }

    if (stats.words >= 20) {
      if (stats.varietyRatio < 0.4) {
        notes.push("watch for repeated words");
      } else if (stats.varietyRatio > 0.7) {
        notes.push("rich vocabulary");
      }
    }

    return {
      tier: t.tier,
      label: t.label,
      words: stats.words,
      sentences: stats.sentences,
      avgWordsPerSentence: stats.avgWordsPerSentence,
      notes: notes
    };
  }

  // --- writing ----------------------------------------------------------

  function saveEntry(date, patch) {
    var all = getAll();
    var key = toKey(date);
    var existing = all[key];
    if (existing && typeof existing === "string") existing = { status: existing };
    var entry = existing || {};
    for (var k in patch) {
      if (Object.prototype.hasOwnProperty.call(patch, k)) entry[k] = patch[k];
    }
    entry.updatedAt = new Date().toISOString();
    all[key] = entry;
    saveAll(all);
    return entry;
  }

  function saveDraft(date, text) {
    return saveEntry(date, {
      status: "incomplete",
      prompt: topicForDate(date),
      essay: text,
      grade: grade(text)
    });
  }

  function finish(date, text) {
    return saveEntry(date, {
      status: "completed",
      prompt: topicForDate(date),
      essay: text,
      grade: grade(text)
    });
  }

  window.DLProgress = {
    toKey: toKey,
    topicForDate: topicForDate,
    getEntry: getEntry,
    statusFor: statusFor,
    grade: grade,
    saveDraft: saveDraft,
    finish: finish
  };
})();
