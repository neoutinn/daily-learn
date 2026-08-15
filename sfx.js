// daily-learn :: synthesized HUD sound effects
//
// Every sound here is generated on the fly with the Web Audio API
// (oscillator + gain envelope) — no audio files, nothing fetched. Exposed
// as window.DLSound so app.js and calendar.js can both trigger cues
// without needing to know how they're made.
(function () {
  "use strict";

  var STORAGE_KEY = "daily-learn-sfx";
  var ctx = null;

  function getContext() {
    if (!ctx) {
      var AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtor) return null;
      ctx = new AudioCtor();
    }
    if (ctx.state === "suspended") {
      // Requires a prior user gesture (keydown/click) to actually resume,
      // which every call site here is triggered by anyway.
      ctx.resume().catch(function () {});
    }
    return ctx;
  }

  function isEnabled() {
    try {
      return localStorage.getItem(STORAGE_KEY) !== "off";
    } catch (e) {
      return true;
    }
  }

  function setEnabled(enabled) {
    try {
      localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
    } catch (e) {
      // ignore — preference just won't persist
    }
  }

  // Single tone with a short attack/decay envelope so it doesn't click at
  // the edges. `opts.glideTo`, if set, sweeps the frequency across the
  // tone's duration.
  function tone(audio, freq, startTime, duration, opts) {
    opts = opts || {};
    var osc = audio.createOscillator();
    var gain = audio.createGain();

    osc.type = opts.type || "sine";
    osc.frequency.setValueAtTime(freq, startTime);
    if (opts.glideTo) {
      osc.frequency.linearRampToValueAtTime(opts.glideTo, startTime + duration);
    }

    var peak = opts.volume != null ? opts.volume : 0.15;
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(peak, startTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain).connect(audio.destination);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
  }

  function guarded(fn) {
    return function () {
      if (!isEnabled()) return;
      var audio = getContext();
      if (!audio) return;
      fn(audio);
    };
  }

  var success = guarded(function (audio) {
    var t = audio.currentTime;
    tone(audio, 660, t, 0.11, { type: "sine", volume: 0.14 });
    tone(audio, 880, t + 0.09, 0.16, { type: "sine", volume: 0.16 });
  });

  var error = guarded(function (audio) {
    tone(audio, 220, audio.currentTime, 0.18, {
      type: "sawtooth",
      volume: 0.09,
      glideTo: 150
    });
  });

  var click = guarded(function (audio) {
    tone(audio, 520, audio.currentTime, 0.045, { type: "square", volume: 0.06 });
  });

  var hover = guarded(function (audio) {
    tone(audio, 920, audio.currentTime, 0.035, { type: "sine", volume: 0.03 });
  });

  var type = guarded(function (audio) {
    tone(audio, 700, audio.currentTime, 0.025, { type: "square", volume: 0.03 });
  });

  window.DLSound = {
    isEnabled: isEnabled,
    setEnabled: setEnabled,
    success: success,
    error: error,
    click: click,
    hover: hover,
    type: type
  };
})();
