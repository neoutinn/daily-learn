// daily-learn :: shared progress/storage layer
//
// Single source of truth for reading and writing daily entries. Used by
// both calendar.js (to paint book status/tooltips) and essay.js (the
// writing desk). Each entry is keyed by "YYYY-MM-DD":
//
//   localStorage["daily-learn-progress"] = {
//     "YYYY-MM-DD": {
//       status: "completed" | "incomplete",
//       article: { title, author, publication, url },
//       essay: "what was written",
//       grade: { source: "ai" | "heuristic", tier, label, words, sentences, ... } | null,
//       updatedAt: "<ISO timestamp>"
//     }
//   }
//
// Legacy note: earlier scaffolds stored a bare "completed"/"incomplete"
// string per date, or a plain-text `prompt` instead of `article`. getEntry()
// upgrades the bare-string shape in memory; entries from before the article
// system just show today's/that day's article afresh instead of a stored
// snapshot.
//
// Two grading modes, and the app is honest about which one produced a
// grade (see grade.source):
//
//  - "heuristic" (always available, no setup): word/sentence/vocabulary
//    counting dressed up in the cozy theme. Computed entirely in the
//    browser, instantly, for free. Not real feedback on the writing itself.
//  - "ai" (opt-in, requires your own Anthropic API key in Settings): the
//    essay is sent directly from your browser to the Claude API and graded
//    against the 6+1 Trait Writing model (Ideas, Organization, Voice, Word
//    Choice, Sentence Fluency, Conventions) by Claude itself, with specific
//    written feedback per trait. See settings.js for where the key lives
//    (your browser's localStorage only) and gradeWithAI() below for the
//    request. If the API call fails for any reason, finish() falls back to
//    the heuristic grade and says so rather than pretending.
(function () {
  "use strict";

  var STORAGE_KEY = "daily-learn-progress";

  // Each day's "prompt" is a real, freely-readable Substack essay from a
  // recognizable, non-political, non-scientific writer — read it, then
  // write your own response to it (agree, disagree, connect it to your
  // own life, extend an idea from it). Picked and link-checked by hand;
  // see README for how this list was chosen.
  var ARTICLES = [
    {
      title: "Welcome to Story Club...",
      author: "George Saunders",
      publication: "Story Club",
      url: "https://georgesaunders.substack.com/p/welcome-to-story-club"
    },
    {
      title: "On the Perils of Self-Assessing...",
      author: "George Saunders",
      publication: "Story Club",
      url: "https://georgesaunders.substack.com/p/on-the-perils-of-self-assessing"
    },
    {
      title: "The Natural-Born Artist.",
      author: "George Saunders",
      publication: "Story Club",
      url: "https://georgesaunders.substack.com/p/the-natural-born-artist"
    },
    {
      title: "Choose your own Odyssey",
      author: "Austin Kleon",
      publication: "Austin Kleon",
      url: "https://austinkleon.substack.com/p/choose-your-own-odyssey"
    },
    {
      title: "Weep to Water the Trees",
      author: "Austin Kleon",
      publication: "Austin Kleon",
      url: "https://austinkleon.substack.com/p/weep-to-water-the-trees"
    },
    {
      title: "Inside the man is a teenager",
      author: "Austin Kleon",
      publication: "Austin Kleon",
      url: "https://austinkleon.substack.com/p/inside-the-man-is-a-teenager"
    },
    {
      title: "How I Became the Honest Broker",
      author: "Ted Gioia",
      publication: "The Honest Broker",
      url: "https://www.honest-broker.com/p/how-i-became-the-honest-broker"
    },
    {
      title: "The Return of the Weirdo",
      author: "Ted Gioia",
      publication: "The Honest Broker",
      url: "https://www.honest-broker.com/p/the-return-of-the-weirdo"
    },
    {
      title: "Welcome to LETTERS FROM LOVE",
      author: "Elizabeth Gilbert",
      publication: "Letters From Love",
      url: "https://elizabethgilbert.substack.com/p/welcome-to-letters-from-love"
    }
  ];

  var TIER_LABELS = {
    seed: "a seed",
    sprout: "a sprout",
    sapling: "a sapling",
    oak: "a full oak"
  };

  function pad(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function toKey(date) {
    return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate());
  }

  // Deterministic per-date article pick, so it's stable across reloads
  // without needing to store anything until the day is actually opened.
  function articleForDate(date) {
    var epochDay = Math.floor(date.getTime() / 86400000);
    var idx = ((epochDay % ARTICLES.length) + ARTICLES.length) % ARTICLES.length;
    return ARTICLES[idx];
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

  // --- heuristic grading (always available) -----------------------------
  //
  // Word/sentence/vocabulary counting, not real feedback on the writing
  // itself. Good enough to make the tracking feel alive; nowhere near a
  // real grader. Used for every draft save, and used to finish a day when
  // no Anthropic API key is configured (see gradeWithAI below).

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
    if (wordCount < 40) return "seed";
    if (wordCount < 100) return "sprout";
    if (wordCount < 250) return "sapling";
    return "oak";
  }

  function gradeHeuristic(text) {
    var stats = analyze(text);
    var tier = tierFor(stats.words);
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
      source: "heuristic",
      tier: tier,
      label: TIER_LABELS[tier],
      words: stats.words,
      sentences: stats.sentences,
      avgWordsPerSentence: stats.avgWordsPerSentence,
      notes: notes
    };
  }

  // --- AI grading (opt-in, needs a key from settings.js) -----------------
  //
  // Grades against the 6+1 Trait Writing model — a real, widely used
  // classroom rubric (Ideas & Content, Organization, Voice, Word Choice,
  // Sentence Fluency, Conventions; "Presentation" is skipped since this is
  // plain text) — instead of word-counting. The request goes straight from
  // this browser to Anthropic's API using the key from Settings; nothing
  // passes through any server of ours. See the
  // "anthropic-dangerous-direct-browser-access" header below — that's
  // Anthropic's opt-in for calling the API directly from a browser instead
  // of a backend, which is what makes a no-backend static site able to do
  // this at all. It also means the key lives in this browser's
  // localStorage and every grading call is billed straight to your
  // Anthropic account — see the Settings panel for that tradeoff.

  var GRADE_JSON_SCHEMA = {
    type: "object",
    properties: {
      tier: {
        type: "string",
        enum: ["seed", "sprout", "sapling", "oak"],
        description:
          "Holistic overall quality tier for the whole piece, seed (just starting out) through oak (mature, distinctive craft). Judge quality, not length."
      },
      summary: {
        type: "string",
        description: "2-3 warm, specific sentences in a supportive teacher's voice, grounded in details from this actual essay."
      },
      traits: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: {
              type: "string",
              enum: ["Ideas", "Organization", "Voice", "Word Choice", "Sentence Fluency", "Conventions"]
            },
            score: { type: "integer", description: "1 (just beginning) to 5 (strong, distinctive)" },
            note: { type: "string", description: "One specific, actionable sentence tied to actual details from the essay — never generic praise." }
          },
          required: ["name", "score", "note"],
          additionalProperties: false
        }
      },
      strengths: {
        type: "array",
        items: { type: "string" },
        description: "2-3 short, concrete strengths grounded in the actual text."
      },
      growth_areas: {
        type: "array",
        items: { type: "string" },
        description: "1-2 short, concrete, actionable things to try next."
      }
    },
    required: ["tier", "summary", "traits", "strengths", "growth_areas"],
    additionalProperties: false
  };

  var AI_GRADER_SYSTEM_PROMPT = [
    "You are a warm, encouraging writing teacher grading a short daily reflection essay for a personal writing-practice app called daily-learn.",
    "Grade using the 6+1 Trait Writing model: Ideas & Content, Organization, Voice, Word Choice, Sentence Fluency, and Conventions (skip Presentation — this is plain text).",
    "For each trait give an integer score 1-5 and one specific, actionable sentence of feedback tied to actual details from the essay — never generic praise like \"good job\" or \"well written.\"",
    "Then choose one overall tier using tree-growth language matching the app's theme: seed (just starting out), sprout (developing, real effort and some clear moments), sapling (solid, developing voice and control), or oak (mature, distinctive, strong control of craft). Base the tier on overall quality, not length — a short, sharp, well-observed paragraph can be a sapling; a long rambling one can be a sprout.",
    "Write a short (2-3 sentence) warm holistic summary in a supportive teacher's voice, grounded in specifics from this essay.",
    "List 2-3 concrete strengths and 1-2 concrete growth areas as short phrases, grounded in the actual text.",
    "The writer was responding to a specific piece they read today (given below). If their essay actually engages with it — agrees, disagrees, connects it to their own life, extends an idea from it — you can note that. A personal essay that only loosely connects to the source is fine and shouldn't be penalized; personal reflection is the point of the practice, not summary or analysis of the source."
  ].join(" ");

  function graderError(message) {
    var err = new Error(message);
    err.isGraderError = true;
    return err;
  }

  function gradeWithAI(text, article, apiKey, model) {
    var stats = analyze(text);
    var userContent =
      "Source piece the writer read today: “" + article.title + "” by " + article.author +
      " (" + article.publication + "), " + article.url + "\n\n" +
      "What they wrote:\n\n" + text;

    return fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        // Opt-in required by Anthropic for calling the API directly from a
        // browser (no backend) instead of from a server.
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 1200,
        thinking: { type: "disabled" },
        system: AI_GRADER_SYSTEM_PROMPT,
        output_config: {
          effort: "low",
          format: { type: "json_schema", schema: GRADE_JSON_SCHEMA }
        },
        messages: [{ role: "user", content: userContent }]
      })
    })
      .then(function (response) {
        if (!response.ok) {
          return response
            .json()
            .catch(function () {
              return null;
            })
            .then(function (body) {
              var detail = body && body.error && body.error.message;
              throw graderError(
                "Claude API error (" + response.status + ")" + (detail ? ": " + detail : "") +
                  " — showing the quick heuristic grade instead."
              );
            });
        }
        return response.json();
      })
      .then(function (data) {
        if (data.stop_reason === "refusal") {
          throw graderError("Claude declined to grade this piece — showing the quick heuristic grade instead.");
        }
        var textBlock = null;
        var content = data.content || [];
        for (var i = 0; i < content.length; i++) {
          if (content[i].type === "text") {
            textBlock = content[i];
            break;
          }
        }
        if (!textBlock) {
          throw graderError("Claude's response didn't include a grade — showing the quick heuristic grade instead.");
        }
        var parsed;
        try {
          parsed = JSON.parse(textBlock.text);
        } catch (e) {
          throw graderError("Couldn't read Claude's grade — showing the quick heuristic grade instead.");
        }
        return {
          source: "ai",
          tier: parsed.tier,
          label: TIER_LABELS[parsed.tier] || parsed.tier,
          words: stats.words,
          sentences: stats.sentences,
          summary: parsed.summary,
          traits: parsed.traits || [],
          strengths: parsed.strengths || [],
          growth: parsed.growth_areas || []
        };
      })
      .catch(function (err) {
        if (err && err.isGraderError) throw err;
        throw graderError("Couldn't reach Claude — showing the quick heuristic grade instead.");
      });
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
      article: articleForDate(date),
      essay: text,
      grade: gradeHeuristic(text)
    });
  }

  // Always resolves (never rejects) with { entry, aiError }. aiError is
  // null on a clean save (no key configured, or the AI call succeeded);
  // otherwise it's a short human-readable reason the heuristic grade was
  // used instead, so the desk can be honest about what happened.
  function finish(date, text) {
    var article = articleForDate(date);
    var heuristic = gradeHeuristic(text);
    var apiKey = window.DLSettings && window.DLSettings.getApiKey();

    if (!apiKey) {
      var entry = saveEntry(date, {
        status: "completed",
        article: article,
        essay: text,
        grade: heuristic
      });
      return Promise.resolve({ entry: entry, aiError: null });
    }

    var model = (window.DLSettings && window.DLSettings.getModel()) || "claude-opus-5";

    return gradeWithAI(text, article, apiKey, model).then(
      function (aiGrade) {
        var entry = saveEntry(date, {
          status: "completed",
          article: article,
          essay: text,
          grade: aiGrade
        });
        return { entry: entry, aiError: null };
      },
      function (err) {
        var entry = saveEntry(date, {
          status: "completed",
          article: article,
          essay: text,
          grade: heuristic
        });
        return {
          entry: entry,
          aiError: (err && err.message) || "Claude grading failed — showing the quick heuristic grade instead."
        };
      }
    );
  }

  window.DLProgress = {
    toKey: toKey,
    articleForDate: articleForDate,
    getEntry: getEntry,
    statusFor: statusFor,
    gradeHeuristic: gradeHeuristic,
    saveDraft: saveDraft,
    finish: finish
  };
})();
