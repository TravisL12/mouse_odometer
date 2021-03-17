export const SETTING_VALUES = [
  'showOdometer',
  'currentDistance',
  'currentDate',
  'previousDistances',
];

export const setStorage = (options) => {
  chrome.storage.sync.set(options);
};

export const getStorage = (cb) => {
  chrome.storage.sync.get(SETTING_VALUES, cb);
};

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  return `${year}-${month}-${day}`;
};

const DEFAULT_VALUES = {
  showOdometer: false,
  currentDistance: 0,
  currentDate: formatDate(new Date()),
  previousDistances: [],
};

const isDateInPast = (firstDate, secondDate) => {
  return firstDate.setHours(0, 0, 0, 0) < secondDate.setHours(0, 0, 0, 0);
};

const TIER_INCREMENT = 100000;
const tiers = {
  white: { type: 'white', path: 'public/images/mouse_icon_white.png' },
  green: { type: 'green', path: 'public/images/mouse_icon_green.png' },
  blue: { type: 'blue', path: 'public/images/mouse_icon_blue.png' },
  yellow: { type: 'yellow', path: 'public/images/mouse_icon_yellow.png' },
  red: { type: 'red', path: 'public/images/mouse_icon_red.png' },
};
export const findTier = (distance) => {
  if (distance > TIER_INCREMENT * 100) {
    return tiers.red;
  }
  if (distance > TIER_INCREMENT * 50) {
    return tiers.yellow;
  }
  if (distance > TIER_INCREMENT * 25) {
    return tiers.blue;
  }
  if (distance > TIER_INCREMENT * 10) {
    return tiers.green;
  }
  return tiers.white;
};

export const buildSettings = (options) => {
  let currentDistance =
    options.currentDistance || DEFAULT_VALUES.currentDistance;
  let date = options.currentDate || DEFAULT_VALUES.currentDate;
  let previousDistances =
    testPrevious() ||
    options.previousDistances ||
    DEFAULT_VALUES.previousDistances;

  const isNewDay = isDateInPast(new Date(date), new Date());
  if (isNewDay) {
    previousDistances.push({ date, distance: options.currentDistance });
    date = formatDate(new Date());
    currentDistance = 0;
  }

  return {
    showOdometer: options.showOdometer || DEFAULT_VALUES.showOdometer,
    currentDate: date,
    currentDistance,
    previousDistances,
    isNewDay,
  };
};
// test data for previousDistances
function testPrevious() {
  return [
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
    { date: '2021-5-12', distance: 11114567 },
    { date: '2021-5-12', distance: 11114567 },
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
    { date: '2021-5-12', distance: 11114567 },
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
}
