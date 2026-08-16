// daily-learn :: writing desk
//
// The panel opened by clicking a book on the bookshelf. Shows that day's
// prompt and either a textarea to write in (no entry yet, or an
// in-progress draft) or a read-back view of a finished essay plus its
// heuristic grade (see progress.js for what "grade" actually means here).
(function () {
  "use strict";

  var site = document.getElementById("site");
  var desk = document.getElementById("desk");
  var backBtn = document.getElementById("desk-back");
  var dateEl = document.getElementById("desk-date");
  var promptEl = document.getElementById("desk-prompt");
  var writeBox = document.getElementById("desk-write");
  var textarea = document.getElementById("desk-textarea");
  var wordCountEl = document.getElementById("desk-wordcount");
  var saveBtn = document.getElementById("desk-save");
  var finishBtn = document.getElementById("desk-finish");
  var viewBox = document.getElementById("desk-view");
  var essayTextEl = document.getElementById("desk-essay-text");
  var gradeEl = document.getElementById("desk-grade");
  var reviseBtn = document.getElementById("desk-revise");
  var statusEl = document.getElementById("desk-status");

  var currentKey = null; // "YYYY-MM-DD" of the day currently open

  function playSound(name) {
    if (window.DLSound && typeof window.DLSound[name] === "function") {
      window.DLSound[name]();
    }
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

  function renderGrade(grade) {
    if (!grade) {
      gradeEl.innerHTML = "";
      return;
    }
    var html = '<span class="grade-tier grade-' + grade.tier + '">' + grade.label + "</span>";
    html += '<span class="grade-stat">' + grade.words + " words &middot; " + grade.sentences + " sentences</span>";
    if (grade.notes && grade.notes.length) {
      html += '<ul class="grade-notes">';
      for (var i = 0; i < grade.notes.length; i++) {
        html += "<li>" + grade.notes[i] + "</li>";
      }
      html += "</ul>";
    }
    gradeEl.innerHTML = html;
  }

  function showWrite(promptText, essayText) {
    writeBox.hidden = false;
    viewBox.hidden = true;
    promptEl.textContent = promptText;
    textarea.value = essayText || "";
    updateWordCount();
  }

  function showView(promptText, entry) {
    writeBox.hidden = true;
    viewBox.hidden = false;
    promptEl.textContent = promptText;
    essayTextEl.textContent = entry.essay || "";
    renderGrade(entry.grade);
  }

  function open(key) {
    currentKey = key;
    var date = parseKey(key);
    var entry = window.DLProgress.getEntry(date);
    var promptText = (entry && entry.prompt) || window.DLProgress.topicForDate(date);

    dateEl.textContent = formatDate(date);

    if (entry && entry.status === "completed") {
      showView(promptText, entry);
      statusEl.textContent = "finished";
    } else if (entry && entry.status === "incomplete") {
      showWrite(promptText, entry.essay);
      statusEl.textContent = "in progress";
    } else {
      showWrite(promptText, "");
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
    showWrite((entry && entry.prompt) || window.DLProgress.topicForDate(date), entry ? entry.essay : "");
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
    window.DLProgress.finish(currentDate(), text);
    playSound("success");
    close();
  });

  textarea.addEventListener("input", function () {
    updateWordCount();
    playSound("type");
  });

  window.DLDesk = { open: open };
})();
