// daily-learn :: bookshelf calendar
//
// Renders the current month as a wooden bookshelf, one shelf row per week,
// one book per day. Today's book glows faintly. Hovering a past or today's
// book slides it partially up out of the shelf and reveals a tooltip:
// today's topic, or a past day's status (finished / bookmarked / unopened)
// pulled from storage via progress.js. Clicking any interactive book opens
// the writing desk (essay.js) for that date — today to write, a past
// "unopened" day to catch up, a "bookmarked" day to keep going, a
// "finished" day to read back what was written.
(function () {
  "use strict";

  var BOOK_COLORS = 8;

  function escapeAttr(s) {
    return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  }

  function tooltipFor(date, isToday) {
    var entry = window.DLProgress.getEntry(date);

    if (entry && entry.status === "completed") {
      var g = entry.grade;
      return "finished" + (g ? " — " + g.label + " (" + g.words + " words)" : "");
    }
    if (entry && entry.status === "incomplete") {
      var g2 = entry.grade;
      return "bookmarked — in progress" + (g2 ? " (" + g2.words + " words)" : "");
    }
    if (isToday) {
      return "today's chapter: " + window.DLProgress.topicForDate(date);
    }
    return "unopened";
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
        tooltip = tooltipFor(date, true);
        interactive = true;
      } else if (date < today) {
        var status = window.DLProgress.statusFor(date);
        bookClasses.push("past", "status-" + status);
        tooltip = tooltipFor(date, false);
        interactive = true;
      } else {
        bookClasses.push("future");
      }

      html += '<div class="book-slot"><div class="' + bookClasses.join(" ") + '"' +
        (tooltip ? ' data-tooltip="' + escapeAttr(tooltip) + '"' : "") +
        (interactive ? ' tabindex="0" data-date="' + window.DLProgress.toKey(date) + '"' : "") +
        "><span class=\"book-deco\"></span><span class=\"book-num\">" + day + "</span></div></div>";
    }

    html += "</div>";
    container.innerHTML = html;

    var interactiveBooks = container.querySelectorAll(".book[data-date]");
    for (var idx = 0; idx < interactiveBooks.length; idx++) {
      interactiveBooks[idx].addEventListener("mouseenter", function () {
        if (window.DLSound) window.DLSound.hover();
      });
      interactiveBooks[idx].addEventListener("click", function (evt) {
        var key = evt.currentTarget.getAttribute("data-date");
        if (key && window.DLDesk) window.DLDesk.open(key);
      });
      interactiveBooks[idx].addEventListener("keydown", function (evt) {
        if (evt.key === "Enter" || evt.key === " ") {
          evt.preventDefault();
          var key = evt.currentTarget.getAttribute("data-date");
          if (key && window.DLDesk) window.DLDesk.open(key);
        }
      });
    }
  }

  window.DLCalendar = { rebuild: buildCalendar };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildCalendar);
  } else {
    buildCalendar();
  }
})();
