import {
  setStorage,
  getStorage,
  findTier,
  APPLICATION_CLASSNAME,
  getFormattedDate,
  formatDate,
} from "./utilities/helper.js";
import { updateIcon, buildHistory } from "./utilities/historyGraph.js";

// elements
const showOdometerCheckbox = document.getElementById("show-odometer");
const selectedDate = document.getElementById("selected-date");
const maxDate = document.getElementById("max-date");
const avgCount = document.getElementById("avg-count");
const totalDistance = document.getElementById("total-distance");
const odometerContainer = document.querySelector(`.${APPLICATION_CLASSNAME}`);
const versionElement = document.getElementById("version");

const manifestData = chrome.runtime.getManifest();
versionElement.textContent = `v${manifestData.version}`;

const createOdometer = (selector) => {
  return new Odometer({
    el: document.getElementById(selector),
    value: 0,
    format: ",ddd",
    theme: "default",
    duration: 100,
  });
};

const odometer = createOdometer("odometer");
const maxOdometer = createOdometer("max-odometer");
const avgOdometer = createOdometer("avg-odometer");

// https://www.justintools.com/unit-conversion/length.php?k1=miles&k2=pixels
const PIXEL_MILES = 6082560.7663069;
const PIXEL_KM = 3779528.0352161;
const pixelConversion = [
  { label: " total pixels", pixels: 1 },
  { label: " miles in pixels", pixels: PIXEL_MILES },
  { label: " kilometers in pixels", pixels: PIXEL_KM },
  {
    label: "x distance to moon in pixels",
    pixels: 238855 * PIXEL_MILES, // 238,855 miles to moon
  },
];

const findMaxDistance = (previousDistances) => {
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

const findAvgDistance = (previousDistances) => {
  const sum = previousDistances?.reduce((sum, day) => {
    return sum + day.distance;
  }, 0);
  return sum / previousDistances.length;
};

export const updateDisplay = ({ options, date }) => {
  const { currentDistance, previousDistances } = options;

  odometer.update(Math.round(currentDistance || 0));
  selectedDate.textContent =
    date === "today" ? "Today" : getFormattedDate(date);

  const maxDay = findMaxDistance(previousDistances);
  if (maxDay) {
    maxOdometer.update(Math.round(maxDay.distance || 0));
    maxDate.textContent = getFormattedDate(maxDay.date);
  }

  const avgDay = findAvgDistance(previousDistances);
  if (avgDay) {
    avgOdometer.update(Math.round(avgDay || 0));
    avgCount.textContent = `Over ${previousDistances.length} days`;
  }
};

let totalDistanceCalculated = 0;
let conversionIndex = 0;
const toggleTotalDistanceConversions = () => {
  const conversion = pixelConversion[conversionIndex % pixelConversion.length];
  setStorage({ conversionIndex });
  conversionIndex++;
  totalDistance.textContent = `${(
    totalDistanceCalculated / conversion.pixels
  ).toLocaleString()}${conversion.label}!`;
};

totalDistance.addEventListener("click", toggleTotalDistanceConversions);
showOdometerCheckbox.addEventListener("change", (event) => {
  setStorage({ showOdometer: event.target.checked });
});

const calcTotalDistance = (distances, currentDistance) => {
  const total = distances.reduce((acc, { distance }) => acc + distance, 0);
  totalDistanceCalculated = Math.round(total + currentDistance);
  toggleTotalDistanceConversions();
};

getStorage((options) => {
  if (options.previousDistances) {
    buildHistory(options);
  }
  conversionIndex = options.conversionIndex || 0;
  calcTotalDistance(options.previousDistances, options.currentDistance);
  const currentTier = findTier(options.currentDistance);
  updateIcon(currentTier.path);
  odometerContainer.classList.add(`background-${currentTier.background}`);
  updateDisplay({
    options,
    date: "today",
  });
  showOdometerCheckbox.checked = options.showOdometer || false;
});
