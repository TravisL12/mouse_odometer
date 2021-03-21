import { setStorage, getStorage } from './helper.js';
import { updateIcon, buildHistory } from './historyGraph.js';

// elements
const showOdometerCheckbox = document.getElementById('show-odometer');
const selectedDate = document.getElementById('selected-date');
const totalDistance = document.getElementById('total-distance');
const version = document.getElementById('version');

const manifestData = chrome.runtime.getManifest();
version.textContent = `v${manifestData.version}`;

const odometer = new Odometer({
  el: document.getElementById('odometer'),
  value: 0,
  format: ',ddd',
  theme: 'default',
  duration: 100,
});

const dateFormatOptions = {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
};

// https://www.justintools.com/unit-conversion/length.php?k1=miles&k2=pixels
const pixelConversion = [
  { label: 'total pixels', unit: 'pixel', pixels: 1 },
  { label: 'miles in pixels', unit: 'mile', pixels: 6082560.7663069 },
  { label: 'kilometers in pixels', unit: 'km', pixels: 3779528.0352161 },
  {
    label: '% distance to moon in pixels',
    unit: 'moon',
    pixels: 1452858135793.2,
  },
];

showOdometerCheckbox.addEventListener('change', (event) => {
  setStorage({ showOdometer: event.target.checked });
});

export const updateDisplay = (values) => {
  const { distance, date } = values;
  odometer.update(Math.round(distance || 0));
  selectedDate.textContent =
    date === 'today'
      ? 'Today'
      : new Date(date).toLocaleDateString(undefined, dateFormatOptions);
};

let totalDistanceCalculated = 0;
let conversionIndex = 0;
const convertPixels = () => {
  const conversion = pixelConversion[conversionIndex % pixelConversion.length];
  conversionIndex++;
  totalDistance.textContent = `${(
    totalDistanceCalculated / conversion.pixels
  ).toLocaleString()} ${conversion.label}!`;
};

totalDistance.addEventListener('click', convertPixels);

const calcTotalDistance = (distances, currentDistance) => {
  const total = distances.reduce((acc, { distance }) => {
    return acc + distance;
  }, 0);
  totalDistanceCalculated = Math.round(total + currentDistance);
  convertPixels();
};

getStorage((options) => {
  if (options.previousDistances) {
    buildHistory(options);
  }
  calcTotalDistance(options.previousDistances, options.currentDistance);
  updateIcon(options.currentDistance);
  updateDisplay({
    distance: options.currentDistance,
    date: 'today',
  });
  showOdometerCheckbox.checked = options.showOdometer || false;
});
