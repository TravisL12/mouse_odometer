import { setStorage, findTier, buildSettings, getStorage } from './helper.js';

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
    const currentTier = findTier(newDistance);
    const iconPath = currentTier.path;
    chrome.browserAction.setIcon({ path: iconPath });
    setStorage({ ...settings, currentDistance: newDistance });
    sendResponse({ ...settings, currentTier });
  });
  return true;
});
