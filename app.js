// daily-learn :: client-side arithmetic gate
//
// This is a vibe gate, not real security: the correct answer is computed
// and checked in the browser, so anyone reading this file (or dev tools)
// can bypass it trivially. There's no sensitive content behind it — it's
// here to fit the AI-assistant "identity verification" feel, not to
// protect anything.
(function () {
  "use strict";

  var gate = document.getElementById("gate");
  var site = document.getElementById("site");
  var problemEl = document.getElementById("problem");
  var input = document.getElementById("answer");
  var errorEl = document.getElementById("error");
  var attemptsEl = document.getElementById("attempts");
  var voiceToggle = document.getElementById("voice-toggle");

  var SESSION_KEY = "daily-learn-authed";
  var VOICE_KEY = "daily-learn-voice";

  // --- voice greeting -------------------------------------------------
  // Uses the browser's built-in speech synthesis (Web Speech API) — no
  // audio files, no external service, nothing to fetch. Voice quality
  // and availability depend entirely on the browser/OS; this just tries
  // to steer toward a calmer, deeper, RP-leaning voice when one exists.

  function isVoiceEnabled() {
    try {
      return localStorage.getItem(VOICE_KEY) !== "off";
    } catch (e) {
      return true;
    }
  }

  function setVoiceEnabled(enabled) {
    try {
      localStorage.setItem(VOICE_KEY, enabled ? "on" : "off");
    } catch (e) {
      // ignore — preference just won't persist
    }
  }

  function updateVoiceToggleLabel() {
    if (!voiceToggle) return;
    var on = isVoiceEnabled();
    voiceToggle.textContent = "VOICE: " + (on ? "ON" : "OFF");
    voiceToggle.setAttribute("aria-pressed", on ? "true" : "false");
  }

  function pickVoice(voices) {
    if (!voices || !voices.length) return null;
    var byNamedMale = voices.find(function (v) {
      return /en-GB/i.test(v.lang) && /male|daniel|arthur|george|ryan/i.test(v.name);
    });
    if (byNamedMale) return byNamedMale;
    var byBritish = voices.find(function (v) { return /en-GB/i.test(v.lang); });
    if (byBritish) return byBritish;
    var byEnglish = voices.find(function (v) { return /^en/i.test(v.lang); });
    return byEnglish || voices[0];
  }

  function speak(text) {
    if (!("speechSynthesis" in window) || !isVoiceEnabled()) return;

    var utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.92;
    utter.pitch = 0.8;
    utter.volume = 1;

    var voices = window.speechSynthesis.getVoices();
    if (voices.length) {
      var v = pickVoice(voices);
      if (v) {
        utter.voice = v;
        utter.lang = v.lang;
      }
      window.speechSynthesis.speak(utter);
    } else {
      // Chrome/Edge often report zero voices until they finish loading
      // asynchronously — pick up the real list once it's ready.
      window.speechSynthesis.onvoiceschanged = function () {
        var loaded = window.speechSynthesis.getVoices();
        var v2 = pickVoice(loaded);
        if (v2) {
          utter.voice = v2;
          utter.lang = v2.lang;
        }
        window.speechSynthesis.speak(utter);
        window.speechSynthesis.onvoiceschanged = null;
      };
    }
  }

  function announceWelcome() {
    window.setTimeout(function () {
      speak("Welcome, Gabriel. All systems online.");
    }, 400);
  }

  if (voiceToggle) {
    updateVoiceToggleLabel();
    voiceToggle.addEventListener("click", function () {
      var nowOn = !isVoiceEnabled();
      setVoiceEnabled(nowOn);
      updateVoiceToggleLabel();
      if (!nowOn && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    });
  }
  // ---------------------------------------------------------------------

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Three-step problem (multiply, then two add/subtract terms) — enough
  // that it can't be solved at a glance, but each step is still small
  // enough to do in your head. Every intermediate value is clamped to
  // stay non-negative, so the answer is always a whole number >= 0.
  function generateProblem() {
    var a = randInt(4, 12);
    var b = randInt(4, 12);
    var value = a * b;
    var display = a + " × " + b;

    for (var i = 0; i < 2; i++) {
      var op = Math.random() < 0.5 ? "+" : "-";
      var term;
      if (op === "+") {
        term = randInt(4, 25);
        value += term;
      } else {
        term = randInt(4, Math.min(25, value - 1));
        value -= term;
      }
      display += " " + op + " " + term;
    }

    return { display: display, answer: value };
  }

  var current = generateProblem();
  var attempts = 0;

  function paintProblem() {
    problemEl.textContent = current.display;
  }

  function grantAccess() {
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch (e) {
      // sessionStorage unavailable (e.g. private mode) — fine, gate just
      // reappears on next load.
    }
    gate.hidden = true;
    site.hidden = false;
    announceWelcome();
  }

  function checkAnswer() {
    var raw = input.value.trim();
    if (raw === "") return;

    var guess = Number(raw);
    if (Number.isFinite(guess) && guess === current.answer) {
      grantAccess();
      return;
    }

    attempts += 1;
    errorEl.hidden = false;
    attemptsEl.textContent = "ATTEMPTS: " + attempts;
    input.value = "";
    current = generateProblem();
    paintProblem();
    input.focus();
  }

  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter") checkAnswer();
  });

  var alreadyAuthed = false;
  try {
    alreadyAuthed = sessionStorage.getItem(SESSION_KEY) === "1";
  } catch (e) {
    alreadyAuthed = false;
  }

  if (alreadyAuthed) {
    gate.hidden = true;
    site.hidden = false;
    announceWelcome();
  } else {
    paintProblem();
    input.focus();
  }
})();
