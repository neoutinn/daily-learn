// daily-learn :: synthesized cozy sound effects
//
// Every sound here is generated on the fly with the Web Audio API
// (oscillator + lowpass filter + gain envelope) — no audio files, nothing
// fetched. Triangle waves + a gentle lowpass give everything a soft,
// muffled-wood character rather than a digital/sci-fi beep. Exposed as
// window.DLSound so app.js and calendar.js can both trigger cues without
// needing to know how they're made.
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

  // Single tone with a short attack/decay envelope and a lowpass filter
  // so it doesn't click at the edges or sound too digital. `opts.glideTo`,
  // if set, sweeps the frequency across the tone's duration.
  function tone(audio, freq, startTime, duration, opts) {
    opts = opts || {};
    var osc = audio.createOscillator();
    var gain = audio.createGain();
    var filter = audio.createBiquadFilter();

    filter.type = "lowpass";
    filter.frequency.value = opts.filterFreq || 2000;

    osc.type = opts.type || "triangle";
    osc.frequency.setValueAtTime(freq, startTime);
    if (opts.glideTo) {
      osc.frequency.linearRampToValueAtTime(opts.glideTo, startTime + duration);
    }

    var peak = opts.volume != null ? opts.volume : 0.15;
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(peak, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(filter).connect(gain).connect(audio.destination);
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

  // Warm two-note pluck, like a soft harp/kalimba tap — the door creaking open.
  var success = guarded(function (audio) {
    var t = audio.currentTime;
    tone(audio, 392, t, 0.16, { volume: 0.13, filterFreq: 1800 });
    tone(audio, 523, t + 0.11, 0.22, { volume: 0.15, filterFreq: 1800 });
  });

  // A soft low double-knock, not an alarm — "no, try again."
  var error = guarded(function (audio) {
    var t = audio.currentTime;
    tone(audio, 150, t, 0.09, { volume: 0.11, filterFreq: 900 });
    tone(audio, 130, t + 0.11, 0.11, { volume: 0.1, filterFreq: 900 });
  });

  // Little wooden "tock" for buttons.
  var click = guarded(function (audio) {
    tone(audio, 300, audio.currentTime, 0.06, { volume: 0.08, filterFreq: 1400 });
  });

  // Quick page-flip chirp for hovering a book.
  var hover = guarded(function (audio) {
    tone(audio, 520, audio.currentTime, 0.05, {
      volume: 0.045,
      filterFreq: 2600,
      glideTo: 420
    });
  });

  // Very soft tick while typing.
  var type = guarded(function (audio) {
    tone(audio, 340, audio.currentTime, 0.03, { volume: 0.035, filterFreq: 1200 });
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
