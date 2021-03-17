import { setStorage, changeIcon, buildSettings, getStorage } from './helper.js';

// Builds default settings on first load
getStorage((options) => {
  setStorage(buildSettings(options));
});

// Return true makes async response
chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
  getStorage((options) => {
    const settings = buildSettings(options);
    const newDistance =
      request.latestDistance > settings.currentDistance && !settings.isNewDay
        ? request.latestDistance
        : settings.currentDistance;
    changeIcon(newDistance);
    setStorage({ ...settings, currentDistance: newDistance });
    sendResponse({ isNewDay: settings.isNewDay });
  });
  return true;
});
