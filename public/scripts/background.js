import {
  setStorage,
  findTier,
  buildSettings,
  getStorage,
} from "./utilities/helper.js";

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
    const newTotalDistance =
      request.totalDistance > settings.totalDistance
        ? request.totalDistance
        : settings.totalDistance;
    const currentTier = findTier(newDistance);
    const iconPath = currentTier.path;
    chrome.action.setIcon({ path: { 128: iconPath } });
    setStorage({
      ...settings,
      currentDistance: newDistance,
      totalDistance: newTotalDistance,
    });
    sendResponse({ ...settings, currentTier, totalDistance: newTotalDistance });
  });
  return true;
});
