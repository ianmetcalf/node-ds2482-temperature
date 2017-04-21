'use strict';

exports.convertUnits = (value, units) => (
  /^f/i.test(units) ? (value * 1.8) + 32 : value
);

exports.asyncThrottle = (fn, delay) => {
  let lastInvoked = 0;
  let timer = null;

  function throttled() {
    const now = Date.now();
    const remaining = delay - (now - lastInvoked);

    if (remaining <= 0 || remaining > delay) {
      invoke();
    } else if (!timer) {
      timer = setTimeout(invoke, remaining);
    }
  }

  let running = false;

  function invoke() {
    cancel();

    if (!running) {
      running = true;
      lastInvoked = Date.now();

      Promise.resolve(fn())
      .then(() => {
        running = false;
      })
      .catch(() => {
        running = false;
      });
    }
  }

  function cancel() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  }

  return Object.assign(throttled, {
    cancel,
  });
};
