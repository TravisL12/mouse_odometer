// elements
const distance = document.getElementById('distance');
const history = document.getElementById('history');
const showOdometerOption = document.getElementById('show-odometer');
const reset = document.getElementById('reset');

// graph values
const barWidth = 10;
const barHeight = 50;
const DAY_SLICE = 18;

const setDistanceDisplay = (amount) => {
  distance.textContent = `${amount} pixels today!`;
};

const setStorage = (options) => {
  chrome.storage.sync.set(options);
};

showOdometerOption.addEventListener('change', (event) => {
  setStorage({ showOdometer: event.target.checked });
});

const buildHistory = (options) => {
  const { previousDistances: historyData, currentDistance } = options;
  const dataSlice = historyData.slice(-1 * DAY_SLICE);
  const maxValue = Math.max.apply(
    null,
    dataSlice.map(({ distance }) => distance)
  );

  const todayHeight = (currentDistance / maxValue) * barHeight;
  const todayYDist = barHeight - todayHeight;
  const todayXTranslate = dataSlice.length * (barWidth + 1);

  const plot = dataSlice
    .map(({ date, distance }, idx) => {
      const height = (distance / maxValue) * barHeight;
      const yDist = barHeight - height;
      const xTranslate = idx + idx * barWidth;
      const formatttedDate = new Date(date).toLocaleDateString();
      return `
      <g class="bar" transform="translate(${xTranslate},0)">
        <rect height="${height}" y="${yDist}" width="${barWidth}"></rect>
      </g>`;
    })
    .join('');

  const todayPlot = `
      <g class="bar today" transform="translate(${todayXTranslate},0)">
        <rect height="${todayHeight}" y="${todayYDist}" width="${barWidth}"></rect>
      </g>`;

  history.innerHTML = `
    <svg
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink"
      class="chart"
      height="${barHeight}"
      width="100%"
      aria-labelledby="title"
      role="img"
    >
      <title id="title">A history of mousing!</title>
    ${plot}
    ${todayPlot}
    </svg>`;
};

const updateDistance = () => {
  chrome.storage.sync.get(
    ['currentDistance', 'showOdometer', 'previousDistances'],
    (options) => {
      if (options.previousDistances) {
        buildHistory(options);
      }
      const amount = Math.round(options.currentDistance || 0).toLocaleString();
      setDistanceDisplay(amount);
      showOdometerOption.checked = options.showOdometer || false;
    }
  );
};

// eventually remove this
// reset.addEventListener('click', (event) => {
//   event.preventDefault();
//   setStorage({ currentDistance: 0 });
//   setDistanceDisplay(0);
// });

updateDistance();
