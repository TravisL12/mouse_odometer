chrome.runtime.onMessage.addListener((request) => {
  if (request.lastMove > 0) {
    chrome.storage.sync.get(['mouseOdometer'], (options) => {
      const { mouseOdometer } = options;
      const newDistance = +mouseOdometer.currentDistance + request.lastMove;
      chrome.storage.sync.set({
        mouseOdometer: {
          ...mouseOdometer,
          currentDistance: newDistance,
        },
      });
    });
  }
});
