import { findTier, setStorage, getStorage } from './helper.js';

// elements
const distance = document.getElementById('distance');
const history = document.getElementById('history');
const showOdometerCheckbox = document.getElementById('show-odometer');
const version = document.getElementById('version');
const manifestData = chrome.runtime.getManifest();
version.textContent = `v${manifestData.version}`;

// graph values
const CONTAINER_WIDTH = 300;
const BAR_WIDTH = 10;
const BAR_HEIGHT = 50;
const DAY_SLICE = Math.floor(CONTAINER_WIDTH / (BAR_WIDTH + 2));

showOdometerCheckbox.addEventListener('change', (event) => {
  setStorage({ showOdometer: event.target.checked });
});

const buildHistory = (options) => {
  const { previousDistances: historyData, currentDistance } = options;
  const dataSlice = historyData.slice(-1 * DAY_SLICE);
  const maxValue =
    Math.max.apply(
      null,
      [...dataSlice, { distance: currentDistance }].map(
        ({ distance }) => distance
      )
    ) || 1;
  const todayHeight = (currentDistance / maxValue) * BAR_HEIGHT;
  const todayYDist = BAR_HEIGHT - todayHeight;
  const todayXTranslate = dataSlice.length * (BAR_WIDTH + 1);

  const plot = dataSlice
    .map(({ date, distance }, idx) => {
      const height = (distance / maxValue) * BAR_HEIGHT;
      const yDist = BAR_HEIGHT - height;
      const xTranslate = idx + idx * BAR_WIDTH;
      const formatttedDate = new Date(date).toLocaleDateString();
      const formattedDistance = Math.round(distance).toLocaleString();
      const tier = findTier(distance).type;
      return `
      <g class="bar ${tier}" transform="translate(${xTranslate},0)">
        <title id="title">${formattedDistance} - ${formatttedDate}</title>
        <rect height="${height}" y="${yDist}" width="${BAR_WIDTH}"></rect>
      </g>`;
    })
    .join('');

  const todayPlot = `
      <g class="bar ${
        findTier(currentDistance).type
      } today" transform="translate(${todayXTranslate},0)">
        <title id="title">Today! - ${Math.round(
          currentDistance
        ).toLocaleString()}</title>
        <rect height="${todayHeight}" y="${todayYDist}" width="${BAR_WIDTH}"></rect>
      </g>`;

  history.innerHTML = `
    <svg
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink"
      class="chart"
      height="100%"
      width="100%"
      aria-labelledby="title"
      role="img"
    >
    ${plot ?? ''}
    ${todayPlot}
    </svg>`;
};

const updateDistance = () => {
  getStorage((options) => {
    if (options.previousDistances) {
      buildHistory(options);
    }
    const amount = Math.round(options.currentDistance || 0).toLocaleString();
    distance.textContent = `${amount} pixels today!`;
    showOdometerCheckbox.checked = options.showOdometer || false;
  });
};

updateDistance();
