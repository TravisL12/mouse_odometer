export const APPLICATION_CLASSNAME = "mouse-odometer-options-container";
export const SETTING_VALUES = [
  "showOdometer",
  "currentDistance",
  "currentDate",
  "previousDistances",
  "conversionIndex",
  "maxDistance",
  "totalDistance",
];

// `currentDistance`/`currentDate` are rewritten every few seconds by every open
// tab, which blows past the chrome.storage.sync quota (120 writes/min, 1800/hr)
// with only a handful of active tabs -- and over quota the writes fail silently.
// So they are written to `local` on the hot path and only mirrored into `sync`
// on a slow interval (and on day rollover) so a second device still picks them
// up. Everything else is cold and goes straight to `sync`.
export const LOCAL_VALUES = ["currentDistance", "currentDate"];

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

// Reads both areas and lets the hot `local` copy win where it exists.
export const getStorage = async () => {
  const [synced, local] = await Promise.all([
    chrome.storage.sync.get(SETTING_VALUES),
    chrome.storage.local.get(LOCAL_VALUES),
  ]);

  for (const key of LOCAL_VALUES) {
    if (local[key] !== undefined) {
      synced[key] = local[key];
    }
  }

  return synced;
};

// Routes each key to its area. Pass `syncNow` to also mirror the hot keys into
// `sync` -- callers on the hot path should leave it off. Keys outside
// SETTING_VALUES (e.g. the derived `isNewDay`) are dropped rather than persisted.
export const setStorage = async (options, { syncNow = false } = {}) => {
  const local = {};
  const synced = {};

  for (const [key, value] of Object.entries(options)) {
    if (!SETTING_VALUES.includes(key)) continue;
    if (LOCAL_VALUES.includes(key)) {
      local[key] = value;
    } else {
      synced[key] = value;
    }
  }

  const mirrored = syncNow ? { ...synced, ...local } : synced;
  const writes = [];
  if (Object.keys(local).length) writes.push(chrome.storage.local.set(local));
  if (Object.keys(mirrored).length)
    writes.push(chrome.storage.sync.set(mirrored));

  try {
    await Promise.all(writes);
  } catch (err) {
    // Over quota, or the extension context went away mid-write.
    console.warn("Mouse Odometer: storage write failed", err);
  }
};

export const formatDate = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  return `${year}-${month}-${day}`;
};

const DEFAULT_VALUES = {
  totalDistance: 0,
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
  if (distance > TIER_INCREMENT * 175) {
    return tiers[RED];
  }
  if (distance > TIER_INCREMENT * 100) {
    return tiers[YELLOW];
  }
  if (distance > TIER_INCREMENT * 75) {
    return tiers[BLUE];
  }
  if (distance > TIER_INCREMENT * 50) {
    return tiers[GREEN];
  }
  return tiers[WHITE]; // default
};

export const buildSettings = (options) => {
  let currentDistance =
    options.currentDistance || DEFAULT_VALUES.currentDistance;
  let date = options.currentDate || DEFAULT_VALUES.currentDate;
  const previousDistances =
    options.previousDistances?.slice(`-${MAX_DAY_HISTORY}`) ||
    DEFAULT_VALUES.previousDistances;

  let totalDistance =
    options.totalDistance > 0
      ? options.totalDistance
      : sumDistances(previousDistances) || DEFAULT_VALUES.totalDistance;
  const defaultMaxDist = { date, distance: currentDistance };
  const previousMaxDist = findMaxDistance(previousDistances);

  // check current, history dates, or existing max to see what's the current highest
  const maxDistance = [
    previousMaxDist,
    defaultMaxDist,
    options.maxDistance,
  ].reduce(
    (acc, dist) => {
      if (!acc?.date || dist?.distance > acc?.distance) {
        acc = dist;
      }
      return acc;
    },
    { date: null, distance: 0 }
  );

  const isNewDay = isDateInPast(date);
  if (isNewDay) {
    // Guard against the same day being rolled over twice (two tabs racing, or
    // the service worker dying mid-write) -- a duplicate entry would be
    // double-counted by sumDistances() and totalDistance forever after.
    if (!previousDistances.some((day) => day.date === date)) {
      previousDistances.push({ date, distance: currentDistance });
      totalDistance = totalDistance + currentDistance;
    }
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
    totalDistance,
  };
};

export const getFormattedDate = (date) => {
  return new Date(date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const findMaxDistance = (previousDistances) => {
  if (!previousDistances || previousDistances.length === 0) {
    return undefined;
  }
  return previousDistances.reduce(
    (max, day) => {
      return !max || day.distance > max.distance ? day : max;
    },
    { date: formatDate(new Date()), distance: 0 }
  );
};

export const sumDistances = (distances) => {
  return (
    distances?.reduce((sum, day) => {
      return sum + day.distance;
    }, 0) || 0
  );
};

export const findAvgDistance = (previousDistances) => {
  if (!previousDistances) {
    return 0;
  }
  const sum = sumDistances(previousDistances);
  return sum / previousDistances.length;
};
