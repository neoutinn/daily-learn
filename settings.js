// daily-learn :: AI grading settings
//
// Owns the (optional) Anthropic API key and model choice used by
// progress.js's gradeWithAI(). Both live only in this browser's
// localStorage and are read fresh at grading time — nothing here ever
// sends the key anywhere except directly to api.anthropic.com from the
// browser (see progress.js). Clearing the key (or never setting one)
// falls back to the built-in heuristic grade with no loss of function.
(function () {
  "use strict";

  var KEY_STORAGE = "daily-learn-api-key";
  var MODEL_STORAGE = "daily-learn-ai-model";
  var DEFAULT_MODEL = "claude-opus-5";

  function getApiKey() {
    try {
      return localStorage.getItem(KEY_STORAGE) || "";
    } catch (e) {
      return "";
    }
  }

  function setApiKey(key) {
    try {
      if (key) localStorage.setItem(KEY_STORAGE, key);
      else localStorage.removeItem(KEY_STORAGE);
    } catch (e) {
      // storage unavailable (e.g. private mode) — key just won't persist.
    }
  }

  function getModel() {
    try {
      return localStorage.getItem(MODEL_STORAGE) || DEFAULT_MODEL;
    } catch (e) {
      return DEFAULT_MODEL;
    }
  }

  function setModel(model) {
    try {
      localStorage.setItem(MODEL_STORAGE, model || DEFAULT_MODEL);
    } catch (e) {
      // ignore
    }
  }

  function hasKey() {
    return !!getApiKey();
  }

  window.DLSettings = {
    getApiKey: getApiKey,
    setApiKey: setApiKey,
    getModel: getModel,
    setModel: setModel,
    hasKey: hasKey
  };

  function playSound(name) {
    if (window.DLSound && typeof window.DLSound[name] === "function") {
      window.DLSound[name]();
    }
  }

  function wire() {
    var site = document.getElementById("site");
    var panel = document.getElementById("settings");
    var openBtn = document.getElementById("ai-status");
    var backBtn = document.getElementById("settings-back");
    var keyInput = document.getElementById("settings-key");
    var modelSelect = document.getElementById("settings-model");
    var saveBtn = document.getElementById("settings-save");
    var clearBtn = document.getElementById("settings-clear");
    var statusEl = document.getElementById("settings-status");

    if (!panel || !openBtn || !site) return;

    function refreshOpenBtn() {
      var on = hasKey();
      openBtn.textContent = "AI GRADING: " + (on ? "ON" : "OFF");
      openBtn.setAttribute("aria-pressed", on ? "true" : "false");
    }

    function refreshStatus() {
      var key = getApiKey();
      if (key) {
        var tail = key.length > 4 ? key.slice(-4) : key;
        statusEl.textContent = "a key is saved, ending in …" + tail;
      } else {
        statusEl.textContent = "no key saved — using the quick heuristic grade";
      }
    }

    refreshOpenBtn();

    openBtn.addEventListener("click", function () {
      playSound("click");
      keyInput.value = "";
      modelSelect.value = getModel();
      refreshStatus();
      site.hidden = true;
      panel.hidden = false;
    });

    backBtn.addEventListener("click", function () {
      playSound("click");
      panel.hidden = true;
      site.hidden = false;
    });

    saveBtn.addEventListener("click", function () {
      playSound("click");
      var typed = keyInput.value.trim();
      if (typed) setApiKey(typed);
      setModel(modelSelect.value);
      keyInput.value = "";
      refreshStatus();
      refreshOpenBtn();
    });

    clearBtn.addEventListener("click", function () {
      playSound("click");
      setApiKey("");
      keyInput.value = "";
      refreshStatus();
      refreshOpenBtn();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wire);
  } else {
    wire();
  }
})();
