import {
  setStorage,
  findTier,
  buildSettings,
  getStorage,
} from "./utilities/helper.js";

// On first load you `getStorage` which updates the counters if it's a new day
// and updates the totalDistance. After that the onMessage listener will update
// the currentDistance for the day and everything is dependent on that value.

// How often the hot counter is mirrored from storage.local into storage.sync.
// This is a per-service-worker throttle, not per-tab, so the write rate is
// capped at ~12/min regardless of how many tabs are reporting -- well under the
// sync quota of 120/min.
const SYNC_MIRROR_INTERVAL = 5000;

let lastSyncMirror = 0;
let lastIconPath = null;

// Every update is a read-modify-write on shared storage, so they have to run
// one at a time. Without this two tabs messaging in the same tick both read the
// pre-update value: the slower tab's distance is discarded, and on a day
// rollover both of them push the day into previousDistances.
let queue = Promise.resolve();
const serialize = (task) => {
  const run = queue.then(task);
  queue = run.catch(() => {}); // a failed update must not stall the queue
  return run;
};

const applyUpdate = async ({ latestDistance, distanceDate }) => {
  const settings = buildSettings(await getStorage());

  // A tab accumulates its running total in memory and only learns about a day
  // rollover from the response to its own message. Whichever tab triggers the
  // rollover is told about it, but every other open tab is still holding
  // yesterday's total -- and by the time it reports in, `isNewDay` is already
  // false, so the old number would be written back as today's. Tabs therefore
  // stamp the day their total belongs to, and anything not stamped with the
  // current day is dropped rather than counted. (`distanceDate` is undefined
  // for a content script left over from a previous extension version.)
  const isStale =
    settings.isNewDay ||
    (distanceDate !== undefined && distanceDate !== settings.currentDate);

  const newDistance =
    latestDistance > settings.currentDistance && !isStale
      ? latestDistance
      : settings.currentDistance;

  const currentTier = findTier(newDistance);
  if (currentTier.path !== lastIconPath) {
    lastIconPath = currentTier.path;
    chrome.action.setIcon({ path: { 128: currentTier.path } });
  }

  const output = { ...settings, currentDistance: newDistance };

  // Mirror to sync on rollover (previousDistances/totalDistance just changed
  // and must survive) or once the interval has elapsed. `lastSyncMirror` resets
  // whenever the service worker restarts, so a cold start always mirrors.
  const now = Date.now();
  const syncNow = settings.isNewDay || now - lastSyncMirror >= SYNC_MIRROR_INTERVAL;
  if (syncNow) {
    lastSyncMirror = now;
  }

  await setStorage(output, { syncNow });
  return { ...output, currentTier };
};

// Builds default settings on first load
serialize(async () => {
  const settings = buildSettings(await getStorage());
  await setStorage(settings, { syncNow: true });
});

// Return true makes async response, receives from contentScript.js > updateStorage()
chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
  serialize(() => applyUpdate(request)).then(sendResponse, (err) => {
    console.warn("Mouse Odometer: update failed", err);
    sendResponse(null);
  });
  return true;
});
