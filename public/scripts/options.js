import {
  setStorage,
  getStorage,
  findTier,
  APPLICATION_CLASSNAME,
} from "./utilities/helper.js";
import { updateIcon, buildHistory } from "./utilities/historyGraph.js";

// elements
const showOdometerCheckbox = document.getElementById("show-odometer");
const selectedDate = document.getElementById("selected-date");
const totalDistance = document.getElementById("total-distance");
const odometerContainer = document.querySelector(`.${APPLICATION_CLASSNAME}`);
const versionElement = document.getElementById("version");

const manifestData = chrome.runtime.getManifest();
versionElement.textContent = `v${manifestData.version}`;

const odometer = new Odometer({
  el: document.getElementById("odometer"),
  value: 0,
  format: ",ddd",
  theme: "default",
  duration: 100,
});

// https://www.justintools.com/unit-conversion/length.php?k1=miles&k2=pixels
const PIXEL_MILES = 6082560.7663069;
const PIXEL_KM = 3779528.0352161;
const pixelConversion = [
  { label: " total pixels", unit: "pixel", pixels: 1 },
  { label: " miles in pixels", unit: "mile", pixels: PIXEL_MILES },
  { label: " kilometers in pixels", unit: "km", pixels: PIXEL_KM },
  {
    label: "x distance to moon in pixels",
    unit: "moon",
    pixels: 238855 * PIXEL_MILES, // 238,855 miles to moon
  },
];

export const updateDisplay = (values) => {
  const { distance, date } = values;
  odometer.update(Math.round(distance || 0));
  selectedDate.textContent =
    date === "today"
      ? "Today"
      : new Date(date).toLocaleDateString(undefined, {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
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
    distance: options.currentDistance,
    date: "today",
  });
  showOdometerCheckbox.checked = options.showOdometer || false;
});
