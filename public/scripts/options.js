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

const calcTotalDistance = (distances, currentDistance) => {
  const total = distances.reduce((acc, { distance }) => {
    return acc + distance;
  }, 0);
  totalDistance.textContent = `${Math.round(
    total + currentDistance
  ).toLocaleString()} total pixels!`;
};

const updateDistance = () => {
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
};

updateDistance();
