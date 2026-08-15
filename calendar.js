// daily-learn :: bookshelf calendar
//
// Renders the current month as a wooden bookshelf, one shelf row per week,
// one book per day. Today's book glows faintly. Hovering a past or today's
// book slides it partially up out of the shelf and reveals a tooltip:
// today's topic, or a past day's status (finished / bookmarked / unopened)
// pulled from localStorage.
//
// Nothing writes "completed"/"incomplete" into storage yet — that happens
// once the actual daily-prompt/essay flow exists. Until then every past
// day reads as "unopened". Schema:
//   localStorage["daily-learn-progress"] = { "YYYY-MM-DD": "completed" | "incomplete" }
(function () {
  "use strict";

  var STORAGE_KEY = "daily-learn-progress";
  var BOOK_COLORS = 8;

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

    var html = '<div class="shelf-title">' + monthLabel + "</div>";

    html += '<div class="shelf-labels">';
    for (var d = 0; d < dow.length; d++) {
      html += '<span class="shelf-label">' + dow[d] + "</span>";
    }
    html += "</div>";

    html += '<div class="bookshelf">';

    for (var e = 0; e < startWeekday; e++) {
      html += '<div class="book-slot empty"></div>';
    }

    for (var day = 1; day <= daysInMonth; day++) {
      var date = new Date(year, month, day);
      var bookClasses = ["book", "book-c" + ((day - 1) % BOOK_COLORS)];
      var tooltip = null;
      var interactive = false;

      if (day === today.getDate()) {
        bookClasses.push("today");
        tooltip = "today's chapter: " + topicForDate(date);
        interactive = true;
      } else if (date < today) {
        var status = statusFor(date, progress);
        var label = status === "completed" ? "finished"
          : status === "incomplete" ? "bookmarked — in progress"
          : "unopened";
        bookClasses.push("past", "status-" + status);
        tooltip = label;
        interactive = true;
      } else {
        bookClasses.push("future");
      }

      html += '<div class="book-slot"><div class="' + bookClasses.join(" ") + '"' +
        (tooltip ? ' data-tooltip="' + escapeAttr(tooltip) + '"' : "") +
        (interactive ? ' tabindex="0"' : "") +
        "><span class=\"book-deco\"></span><span class=\"book-num\">" + day + "</span></div></div>";
    }

    html += "</div>";
    container.innerHTML = html;

    var interactiveBooks = container.querySelectorAll(".book[data-tooltip]");
    for (var idx = 0; idx < interactiveBooks.length; idx++) {
      interactiveBooks[idx].addEventListener("mouseenter", function () {
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
