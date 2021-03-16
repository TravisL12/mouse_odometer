const isDateInPast = (firstDate, secondDate) => {
  return firstDate.setHours(0, 0, 0, 0) < secondDate.setHours(0, 0, 0, 0);
};

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  return `${year}-${month}-${day}`;
};

const settingValues = [
  'showOdometer',
  'currentDistance',
  'currentDate',
  'previousDistances',
];

const defaultValues = {
  showOdometer: false,
  currentDistance: 0,
  currentDate: formatDate(new Date()),
  previousDistances: [],
};

chrome.browserAction.setIcon({ path: 'public/images/mouse.svg' });

const buildSettings = (options) => {
  let currentDistance =
    options.currentDistance || defaultValues.currentDistance;
  let date = options.currentDate || defaultValues.currentDate;
  let previousDistances =
    options.previousDistances || defaultValues.previousDistances;

  const isNewDay = isDateInPast(new Date(date), new Date());
  if (isNewDay) {
    previousDistances.push({ date, distance: options.currentDistance });
    date = formatDate(new Date());
    currentDistance = 0;
  }

  return {
    showOdometer: options.showOdometer || defaultValues.showOdometer,
    currentDate: date,
    currentDistance,
    previousDistances,
    isNewDay,
  };
};

// Builds default settings on first load
chrome.storage.sync.get(settingValues, (options) => {
  chrome.storage.sync.set(buildSettings(options));
});

chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
  chrome.storage.sync.get(settingValues, (options) => {
    const settings = buildSettings(options);
    sendResponse({ isNewDay: settings.isNewDay });
    const newDistance =
      request.latestDistance > settings.currentDistance && !settings.isNewDay
        ? request.latestDistance
        : settings.currentDistance;
    chrome.storage.sync.set({ ...settings, currentDistance: newDistance });
  });
  return true;
});
