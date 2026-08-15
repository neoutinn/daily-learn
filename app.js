// daily-learn :: client-side arithmetic gate
//
// This is a vibe gate, not real security: the correct answer is computed
// and checked in the browser, so anyone reading this file (or dev tools)
// can bypass it trivially. There's no sensitive content behind it — it's
// here for the "solve the riddle to come in" feel, not to protect
// anything.
(function () {
  "use strict";

  var gate = document.getElementById("gate");
  var site = document.getElementById("site");
  var problemEl = document.getElementById("problem");
  var input = document.getElementById("answer");
  var errorEl = document.getElementById("error");
  var attemptsEl = document.getElementById("attempts");
  var sfxToggle = document.getElementById("sfx-toggle");

  var SESSION_KEY = "daily-learn-authed";

  function playSound(name) {
    if (window.DLSound && typeof window.DLSound[name] === "function") {
      window.DLSound[name]();
    }
  }

  function updateSfxToggleLabel() {
    if (!sfxToggle || !window.DLSound) return;
    var on = window.DLSound.isEnabled();
    sfxToggle.textContent = "SOUND: " + (on ? "ON" : "OFF");
    sfxToggle.setAttribute("aria-pressed", on ? "true" : "false");
  }

  if (sfxToggle && window.DLSound) {
    updateSfxToggleLabel();
    sfxToggle.addEventListener("click", function () {
      window.DLSound.setEnabled(!window.DLSound.isEnabled());
      updateSfxToggleLabel();
      playSound("click"); // no-op if just turned off, audible if just turned on
    });
  }

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
    playSound("success");
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
    attemptsEl.textContent = "attempts: " + attempts;
    input.value = "";
    current = generateProblem();
    paintProblem();
    input.focus();
    playSound("error");
  }

  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter") checkAnswer();
  });

  input.addEventListener("input", function () {
    playSound("type");
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
  } else {
    paintProblem();
    input.focus();
  }
})();
