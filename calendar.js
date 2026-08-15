// daily-learn :: calendar widget
//
// Renders the current month with today highlighted. Hovering today shows
// that day's topic; hovering a past day shows a green/yellow/red status
// pulled from localStorage: completed, incomplete, or never started.
//
// Nothing writes "completed"/"incomplete" into storage yet — that happens
// once the actual daily-prompt/essay flow exists. Until then every past
// day reads as "never started". Schema:
//   localStorage["daily-learn-progress"] = { "YYYY-MM-DD": "completed" | "incomplete" }
(function () {
  "use strict";

  var STORAGE_KEY = "daily-learn-progress";

  // Placeholder topics until the real prompt list/generator is built —
  // just enough variety to demo the "hover today" behavior.
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
  // without needing to store anything.
  function topicForDate(date) {
    var epochDay = Math.floor(date.getTime() / 86400000);
    var idx = ((epochDay % TOPICS.length) + TOPICS.length) % TOPICS.length;
    return TOPICS[idx];
  }

  function getProgress() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function statusFor(date, progress) {
    var val = progress[toKey(date)];
    return val === "completed" || val === "incomplete" ? val : "none";
  }

  function escapeAttr(s) {
    return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  }

  function buildCalendar() {
    var container = document.getElementById("calendar");
    if (!container) return;

    var today = new Date();
    today.setHours(0, 0, 0, 0);

    var year = today.getFullYear();
    var month = today.getMonth();
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var startWeekday = new Date(year, month, 1).getDay();
    var monthLabel = today.toLocaleString("en-US", { month: "long" }) + " " + year;

    var progress = getProgress();
    var dow = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

    var html = '<div class="cal-header">' + monthLabel + "</div>";
    html += '<div class="cal-grid">';

    for (var d = 0; d < dow.length; d++) {
      html += '<div class="cal-dow">' + dow[d] + "</div>";
    }

    for (var e = 0; e < startWeekday; e++) {
      html += '<div class="cal-cell empty"></div>';
    }

    for (var day = 1; day <= daysInMonth; day++) {
      var date = new Date(year, month, day);
      var classes = ["cal-cell", "cal-day"];
      var tooltip = null;

      if (day === today.getDate()) {
        classes.push("today");
        tooltip = "today: " + topicForDate(date);
      } else if (date < today) {
        var status = statusFor(date, progress);
        var label = status === "completed" ? "completed"
          : status === "incomplete" ? "incomplete"
          : "never started";
        classes.push("past", "status-" + status);
        tooltip = label;
      } else {
        classes.push("future");
      }

      html += '<div class="' + classes.join(" ") + '"' +
        (tooltip ? ' data-tooltip="' + escapeAttr(tooltip) + '"' : "") +
        ">" + day + "</div>";
    }

    html += "</div>";
    container.innerHTML = html;

    var interactiveDays = container.querySelectorAll(".cal-day[data-tooltip]");
    for (var idx = 0; idx < interactiveDays.length; idx++) {
      interactiveDays[idx].addEventListener("mouseenter", function () {
        if (window.DLSound) window.DLSound.hover();
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildCalendar);
  } else {
    buildCalendar();
  }
})();
