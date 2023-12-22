export const APPLICATION_CLASSNAME = "mouse-odometer-options-container";
export const SETTING_VALUES = [
  "showOdometer",
  "currentDistance",
  "currentDate",
  "previousDistances",
  "conversionIndex",
  "maxDistance",
];

const WHITE = "white";
const GREEN = "green";
const BLUE = "blue";
const YELLOW = "yellow";
const RED = "red";
const TIER_INCREMENT = 10000;
const MAX_DAY_HISTORY = 50;
const tiers = {
  [WHITE]: {
    type: WHITE,
    background: 1,
    path: "/public/images/mouse_icon_white.png",
  },
  [GREEN]: {
    type: GREEN,
    background: 2,
    path: "/public/images/mouse_icon_green.png",
  },
  [BLUE]: {
    type: BLUE,
    background: 3,
    path: "/public/images/mouse_icon_blue.png",
  },
  [YELLOW]: {
    type: YELLOW,
    background: 4,
    path: "/public/images/mouse_icon_yellow.png",
  },
  [RED]: {
    type: RED,
    background: 5,
    path: "/public/images/mouse_icon_red.png",
  },
};

export const setStorage = (options) => {
  chrome.storage.sync.set(options);
};

export const getStorage = (cb) => {
  chrome.storage.sync.get(SETTING_VALUES, cb);
};

export const formatDate = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  return `${year}-${month}-${day}`;
};

const DEFAULT_VALUES = {
  showOdometer: true,
  currentDistance: 0,
  currentDate: formatDate(new Date()),
  previousDistances: [],
};

// date is `YYYY-mm-dd` string, I miss you TS :'(
const isDateInPast = (dateStr) => {
  if (!dateStr) {
    return true;
  }

  const firstDate = new Date(dateStr.split("-"));
  const secondDate = new Date();
  return firstDate.setHours(0, 0, 0, 0) < secondDate.setHours(0, 0, 0, 0);
};

export const findTier = (distance) => {
  if (distance > TIER_INCREMENT * 100) {
    return tiers[RED];
  }
  if (distance > TIER_INCREMENT * 75) {
    return tiers[YELLOW];
  }
  if (distance > TIER_INCREMENT * 50) {
    return tiers[BLUE];
  }
  if (distance > TIER_INCREMENT * 25) {
    return tiers[GREEN];
  }
  return tiers[WHITE]; // default
};

export const buildSettings = (options) => {
  let currentDistance =
    options.currentDistance || DEFAULT_VALUES.currentDistance;
  let date = options.currentDate || DEFAULT_VALUES.currentDate;
  const defaultMaxDist = { date, distance: currentDistance };
  let maxDistance = options.maxDistance || defaultMaxDist;
  const previousDistances =
    options.previousDistances?.slice(`-${MAX_DAY_HISTORY}`) ||
    DEFAULT_VALUES.previousDistances;

  const isNewDay = isDateInPast(date);
  if (isNewDay) {
    if (
      !options.maxDistance ||
      currentDistance > options.maxDistance.distance
    ) {
      maxDistance = defaultMaxDist;
    }
    previousDistances.push({ date, distance: options.currentDistance });
    date = formatDate(new Date());
    currentDistance = 0;
  }

  return {
    showOdometer: options.hasOwnProperty("showOdometer")
      ? options.showOdometer
      : DEFAULT_VALUES.showOdometer,
    currentDate: date,
    currentDistance,
    previousDistances,
    isNewDay,
    maxDistance,
  };
};

export const getFormattedDate = (date) => {
  return new Date(date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};
