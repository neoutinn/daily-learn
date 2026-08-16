// daily-learn :: writing desk
//
// The panel opened by clicking a book on the bookshelf. Shows that day's
// article to read first, then either a textarea to write in (no entry
// yet, or an in-progress draft) or a read-back view of a finished essay
// plus its grade (see progress.js for what "grade" means — heuristic or
// AI, and how the app is honest about which one you're looking at).
(function () {
  "use strict";

  var site = document.getElementById("site");
  var desk = document.getElementById("desk");
  var backBtn = document.getElementById("desk-back");
  var dateEl = document.getElementById("desk-date");
  var articleLinkEl = document.getElementById("desk-article-link");
  var articleBylineEl = document.getElementById("desk-article-byline");
  var writeBox = document.getElementById("desk-write");
  var textarea = document.getElementById("desk-textarea");
  var wordCountEl = document.getElementById("desk-wordcount");
  var saveBtn = document.getElementById("desk-save");
  var finishBtn = document.getElementById("desk-finish");
  var viewBox = document.getElementById("desk-view");
  var essayTextEl = document.getElementById("desk-essay-text");
  var gradeEl = document.getElementById("desk-grade");
  var warningEl = document.getElementById("desk-warning");
  var reviseBtn = document.getElementById("desk-revise");
  var statusEl = document.getElementById("desk-status");
  var busyEl = document.getElementById("desk-busy");
  var busyTextEl = document.getElementById("desk-busy-text");

  var currentKey = null; // "YYYY-MM-DD" of the day currently open

  function playSound(name) {
    if (window.DLSound && typeof window.DLSound[name] === "function") {
      window.DLSound[name]();
    }
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function parseKey(key) {
    var parts = key.split("-");
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  }

  function currentDate() {
    return parseKey(currentKey);
  }

  function formatDate(date) {
    return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  }

  function updateWordCount() {
    var trimmed = textarea.value.trim();
    var count = trimmed ? trimmed.split(/\s+/).length : 0;
    wordCountEl.textContent = count + (count === 1 ? " word" : " words");
  }

  function renderArticle(article) {
    articleLinkEl.textContent = article.title;
    articleLinkEl.href = article.url;
    articleBylineEl.textContent = "by " + article.author + " — " + article.publication;
  }

  function renderGrade(grade) {
    if (!grade) {
      gradeEl.innerHTML = "";
      return;
    }

    var html = '<span class="grade-tier grade-' + grade.tier + '">' + escapeHtml(grade.label) + "</span>";
    html += '<span class="grade-stat">' + grade.words + " words &middot; " + grade.sentences + " sentences</span>";
    html +=
      '<span class="grade-source">' +
      (grade.source === "ai" ? "graded by Claude" : "quick heuristic check") +
      "</span>";

    if (grade.source === "ai") {
      if (grade.summary) {
        html += '<p class="grade-summary">' + escapeHtml(grade.summary) + "</p>";
      }
      if (grade.traits && grade.traits.length) {
        html += '<ul class="grade-traits">';
        for (var i = 0; i < grade.traits.length; i++) {
          var t = grade.traits[i];
          html +=
            "<li><span class=\"trait-name\">" + escapeHtml(t.name) + "</span>" +
            '<span class="trait-score">' + t.score + "/5</span>" +
            '<span class="trait-note">' + escapeHtml(t.note) + "</span></li>";
        }
        html += "</ul>";
      }
      if (grade.strengths && grade.strengths.length) {
        html += '<p class="grade-subhead">strengths</p><ul class="grade-notes">';
        for (var s = 0; s < grade.strengths.length; s++) {
          html += "<li>" + escapeHtml(grade.strengths[s]) + "</li>";
        }
        html += "</ul>";
      }
      if (grade.growth && grade.growth.length) {
        html += '<p class="grade-subhead">worth trying next</p><ul class="grade-notes">';
        for (var g = 0; g < grade.growth.length; g++) {
          html += "<li>" + escapeHtml(grade.growth[g]) + "</li>";
        }
        html += "</ul>";
      }
    } else if (grade.notes && grade.notes.length) {
      html += '<ul class="grade-notes">';
      for (var n = 0; n < grade.notes.length; n++) {
        html += "<li>" + escapeHtml(grade.notes[n]) + "</li>";
      }
      html += "</ul>";
    }

    gradeEl.innerHTML = html;
  }

  function setBusy(on, message) {
    busyEl.hidden = !on;
    if (message) busyTextEl.textContent = message;
    textarea.disabled = on;
    finishBtn.disabled = on;
    saveBtn.disabled = on;
  }

  function showWrite(essayText) {
    writeBox.hidden = false;
    viewBox.hidden = true;
    warningEl.hidden = true;
    textarea.value = essayText || "";
    updateWordCount();
  }

  function showView(entry) {
    writeBox.hidden = true;
    viewBox.hidden = false;
    essayTextEl.textContent = entry.essay || "";
    renderGrade(entry.grade);
  }

  function open(key) {
    currentKey = key;
    var date = parseKey(key);
    var entry = window.DLProgress.getEntry(date);
    var article = (entry && entry.article) || window.DLProgress.articleForDate(date);

    dateEl.textContent = formatDate(date);
    renderArticle(article);
    warningEl.hidden = true;

    if (entry && entry.status === "completed") {
      showView(entry);
      statusEl.textContent = "finished";
    } else if (entry && entry.status === "incomplete") {
      showWrite(entry.essay);
      statusEl.textContent = "in progress";
    } else {
      showWrite("");
      statusEl.textContent = "unopened";
    }

    site.hidden = true;
    desk.hidden = false;
    textarea.focus();
  }

  function close() {
    desk.hidden = true;
    site.hidden = false;
    if (window.DLCalendar) window.DLCalendar.rebuild();
  }

  backBtn.addEventListener("click", function () {
    playSound("click");
    close();
  });

  reviseBtn.addEventListener("click", function () {
    playSound("click");
    var date = currentDate();
    var entry = window.DLProgress.getEntry(date);
    showWrite(entry ? entry.essay : "");
    statusEl.textContent = "revising";
    textarea.focus();
  });

  saveBtn.addEventListener("click", function () {
    var text = textarea.value;
    if (!text.trim()) return;
    window.DLProgress.saveDraft(currentDate(), text);
    playSound("click");
    close();
  });

  finishBtn.addEventListener("click", function () {
    var text = textarea.value;
    if (!text.trim()) return;

    var usingAI = window.DLSettings && window.DLSettings.hasKey();
    setBusy(true, usingAI ? "grading with Claude…" : "grading…");

    window.DLProgress.finish(currentDate(), text).then(function (result) {
      setBusy(false);
      if (result.aiError) {
        playSound("error");
        showView(result.entry);
        statusEl.textContent = "finished (heuristic fallback)";
        warningEl.textContent = result.aiError;
        warningEl.hidden = false;
      } else {
        playSound("success");
        close();
      }
    });
  });

  textarea.addEventListener("input", function () {
    updateWordCount();
    playSound("type");
  });

  window.DLDesk = { open: open };
})();
