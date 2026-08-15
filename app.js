// daily-learn :: client-side arithmetic gate
//
// This is a vibe gate, not real security: the correct answer is computed
// and checked in the browser, so anyone reading this file (or dev tools)
// can bypass it trivially. There's no sensitive content behind it — it's
// here to fit the "terminal login" feel, not to protect anything.
(function () {
  "use strict";

  var gate = document.getElementById("gate");
  var site = document.getElementById("site");
  var problemEl = document.getElementById("problem");
  var input = document.getElementById("answer");
  var errorEl = document.getElementById("error");
  var attemptsEl = document.getElementById("attempts");

  var SESSION_KEY = "daily-learn-authed";

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Two-step problem (multiply, then add/subtract) so it can't be solved
  // at a glance, but stays small enough to do in your head. Subtraction
  // is clamped so the answer is always a non-negative whole number.
  function generateProblem() {
    var a = randInt(4, 12);
    var b = randInt(4, 12);
    var product = a * b;
    var op = Math.random() < 0.5 ? "+" : "-";
    var c, answer;

    if (op === "+") {
      c = randInt(5, 40);
      answer = product + c;
    } else {
      c = randInt(5, Math.min(40, product - 1));
      answer = product - c;
    }

    return {
      display: a + " × " + b + " " + op + " " + c,
      answer: answer
    };
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
  } else {
    paintProblem();
    input.focus();
  }
})();
