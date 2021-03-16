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

// test data for previousDistances
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

const increment = 10000;
const changeIcon = (distance) => {
  let path = 'public/images/mouse_icon_normal.png';
  if (distance > increment * 4) {
    path = 'public/images/mouse_icon_green.png';
  }
  if (distance > increment * 6) {
    path = 'public/images/mouse_icon_blue.png';
  }
  if (distance > increment * 8) {
    path = 'public/images/mouse_icon_yellow.png';
  }
  if (distance > increment * 10) {
    path = 'public/images/mouse_icon_red.png';
  }
  chrome.browserAction.setIcon({ path });
};

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

// Return true makes async response
chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
  chrome.storage.sync.get(settingValues, (options) => {
    const settings = buildSettings(options);
    const newDistance =
      request.latestDistance > settings.currentDistance && !settings.isNewDay
        ? request.latestDistance
        : settings.currentDistance;
    changeIcon(newDistance);
    chrome.storage.sync.set({ ...settings, currentDistance: newDistance });
    sendResponse({ isNewDay: settings.isNewDay });
  });
  return true;
});
