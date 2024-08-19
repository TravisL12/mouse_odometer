import {
  setStorage,
  findTier,
  buildSettings,
  getStorage,
} from "./utilities/helper.js";

// On first load you `getStorage` which updates the counters if it's a new day
// and updates the totalDistance. After that the onMessage listener will update
// the currentDistance for the day and everything is dependent on that value.

// Builds default settings on first load
getStorage((options) => {
  setStorage(buildSettings(options));
});

// Return true makes async response, receives from contentScript.js > updateStorage()
chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
  getStorage((options) => {
    const settings = buildSettings(options);
    const newDistance =
      request.latestDistance > settings.currentDistance && !settings.isNewDay
        ? request.latestDistance
        : settings.currentDistance;

    const currentTier = findTier(newDistance);
    const iconPath = currentTier.path;
    chrome.action.setIcon({ path: { 128: iconPath } });
    const output = {
      ...settings,
      currentDistance: newDistance,
    };
    setStorage(output); // save to chrome storage
    sendResponse({ ...output, currentTier }); // send to contentScript
  });
  return true;
});
