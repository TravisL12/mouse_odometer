chrome.runtime.onMessage.addListener((request) => {
  if (request.lastMove > 0) {
    chrome.storage.sync.get(['distance'], (options) => {
      const newDistance = +options.distance + request.lastMove;
      chrome.storage.sync.set({ distance: newDistance });
    });
  }
});
