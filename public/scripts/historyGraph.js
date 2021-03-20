import { findTier } from './helper.js';
import { updateDisplay } from './options.js';
const history = document.getElementById('history');
const mouseIcon = document.getElementById('mouse-icon');
const selectBars = () => history.querySelectorAll('.bar');

// graph values
const CONTAINER_WIDTH = 300;
const BAR_WIDTH = 10;
const BAR_HEIGHT = 50;
const DAY_SLICE = Math.floor(CONTAINER_WIDTH / (BAR_WIDTH + 2));

export const updateIcon = (distance) => {
  mouseIcon.src = findTier(distance).path;
};

export const buildHistory = (options) => {
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
      } today selected" transform="translate(${todayXTranslate},0)">
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

  const bars = selectBars();
  bars.forEach((barEl) => {
    barEl.addEventListener('click', (event) => {
      console.log(event.target, 'event.target');
      bars.forEach((bar) => bar.classList.remove('selected'));
      barEl.classList.add('selected');
      const { distance, date } = event.target.dataset;
      updateIcon(distance);
      updateDisplay({ distance, date });
    });
  });
};

// click anywhere in history box selects 'today'
history.addEventListener('click', (event) => {
  if (event.target.nodeName === 'svg') {
    selectBars().forEach((bar) => bar.classList.remove('selected'));
    const todayBar = document.querySelector('.bar.today');
    todayBar.classList.add('selected');
    const { distance, date } = todayBar.querySelector('rect').dataset;
    updateIcon(distance);
    updateDisplay({ distance, date });
  }
});
