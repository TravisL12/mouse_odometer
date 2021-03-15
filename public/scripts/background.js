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

const testPrevious = [
  { date: '2021-5-6', distance: 1234567 },
  { date: '2021-5-7', distance: 2234567 },
  { date: '2021-5-8', distance: 3234567 },
  { date: '2021-5-9', distance: 334567 },
  { date: '2021-5-9', distance: 334567 },
  { date: '2021-5-9', distance: 334567 },
  { date: '2021-5-10', distance: 4444567 },
  { date: '2021-5-11', distance: 1214567 },
  { date: '2021-5-13', distance: 1000567 },
  { date: '2021-5-14', distance: 4000567 },
  { date: '2021-5-12', distance: 1114567 },
  { date: '2021-5-12', distance: 1114567 },
  { date: '2021-5-12', distance: 1114567 },
  { date: '2021-5-12', distance: 1114567 },
  { date: '2021-5-14', distance: 2000567 },
  { date: '2021-5-14', distance: 3000567 },
  { date: '2021-5-14', distance: 2000567 },
  { date: '2021-5-14', distance: 1000567 },
  { date: '2021-5-14', distance: 2000567 },
  { date: '2021-5-14', distance: 3000567 },
  { date: '2021-5-14', distance: 2000567 },
  { date: '2021-5-14', distance: 1000567 },
  { date: '2021-5-14', distance: 2000567 },
];

const defaultValues = {
  showOdometer: false,
  currentDistance: 0,
  currentDate: formatDate(new Date()),
  previousDistances: [],
};

const buildSettings = (options) => {
  let currentDistance =
    options.currentDistance || defaultValues.currentDistance;
  let date = options.currentDate || defaultValues.currentDate;
  let previousDistances =
    testPrevious ||
    options.previousDistances ||
    defaultValues.previousDistances;

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
  };
};

// Builds default settings on first load
chrome.storage.sync.get(settingValues, (options) => {
  chrome.storage.sync.set(buildSettings(options));
});

chrome.runtime.onMessage.addListener((request) => {
  chrome.storage.sync.get(settingValues, (options) => {
    const settings = buildSettings(options);
    const newDistance =
      request.latestDistance > settings.currentDistance
        ? request.latestDistance
        : settings.currentDistance;
    chrome.storage.sync.set({ ...settings, currentDistance: newDistance });
  });
});
