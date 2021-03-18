import { findTier, setStorage, getStorage } from './helper.js';

// elements
const history = document.getElementById('history');
const showOdometerCheckbox = document.getElementById('show-odometer');
const version = document.getElementById('version');
const selectedDate = document.getElementById('selected-date');
const mouseIcon = document.getElementById('mouse-icon');
const manifestData = chrome.runtime.getManifest();
version.textContent = `v${manifestData.version}`;

const odometer = new Odometer({
  el: document.getElementById('odometer'),
  value: 0,
  format: ',ddd',
  theme: 'default',
  duration: 100,
});

// graph values
const CONTAINER_WIDTH = 300;
const BAR_WIDTH = 10;
const BAR_HEIGHT = 50;
const DAY_SLICE = Math.floor(CONTAINER_WIDTH / (BAR_WIDTH + 2));
const dateFormatOptions = {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
};

showOdometerCheckbox.addEventListener('change', (event) => {
  setStorage({ showOdometer: event.target.checked });
});

const updateDisplay = (values) => {
  const { distance, date } = values;
  odometer.update(Math.round(distance || 0));
  selectedDate.textContent =
    date === 'today'
      ? 'Today'
      : new Date(date).toLocaleDateString(undefined, dateFormatOptions);
};

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
        <rect
          height="${height}"
          y="${yDist}"
          width="${BAR_WIDTH}"
          data-date="${date}"
          data-distance="${distance}"></rect>
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
        <rect height="${todayHeight}" y="${todayYDist}" width="${BAR_WIDTH}"
        data-date="today"
          data-distance="${currentDistance}"></rect>
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

  history.querySelectorAll('.bar').forEach((barEl) => {
    barEl.addEventListener('click', (event) => {
      updateDisplay({
        distance: event.target.dataset.distance,
        date: event.target.dataset.date,
      });
    });
  });
};

const updateIcon = (distance) => {
  mouseIcon.src = findTier(distance).path;
};

const updateDistance = () => {
  getStorage((options) => {
    if (options.previousDistances) {
      buildHistory(options);
    }
    updateIcon(options.currentDistance);
    updateDisplay({
      distance: options.currentDistance,
      date: 'today',
    });
    showOdometerCheckbox.checked = options.showOdometer || false;
  });
};

updateDistance();
