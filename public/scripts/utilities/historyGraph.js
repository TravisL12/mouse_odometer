import { formatDate, findTier, APPLICATION_CLASSNAME } from "./helper.js";
import { updateDisplay } from "../options.js";
const history = document.getElementById("history");
const mouseIcon = document.getElementById("mouse-icon");
const selectBars = () => history.querySelectorAll(".bar");
const odometerContainer = document.querySelector(`.${APPLICATION_CLASSNAME}`);
const black = getComputedStyle(odometerContainer).getPropertyValue("--black");

// graph values
const CONTAINER_WIDTH = 300;
const BAR_WIDTH = 10;
const BAR_HEIGHT = 50;
const DAY_SLICE = Math.floor(CONTAINER_WIDTH / (BAR_WIDTH + 2));

const getPreviousDays = () => {
  const dates = [];
  for (let i = 1; i < DAY_SLICE; i++) {
    const today = new Date(new Date().setHours(0, 0, 0, 0));
    const date = formatDate(new Date(today.setDate(today.getDate() - i)));
    dates.push(date);
  }
  return dates;
};

export const updateIcon = (path) => {
  mouseIcon.src = path;
};

// SVG axes
let axesPolyline = ``;
for (let i = 0; i < DAY_SLICE + 1; i++) {
  axesPolyline += ` ${i * (BAR_WIDTH + 1)},${BAR_HEIGHT}`;
}
const axes = `
    <polyline
    marker-start="url(#dot)"
    marker-mid="url(#dot)"
    marker-end="url(#dot)"
    stroke-width='1'
    stroke=${black}
    points="${axesPolyline}"></polyline>
  `;

export const buildHistory = (options) => {
  const { previousDistances: historyData, currentDistance } = options;
  const prevDays = getPreviousDays();
  const maxValue =
    Math.max.apply(
      null,
      [...historyData, { distance: currentDistance }].map(
        ({ distance }) => distance
      )
    ) || 1;
  const todayHeight = (currentDistance / maxValue) * BAR_HEIGHT;
  const todayYDist = BAR_HEIGHT - todayHeight;
  const todayXTranslate = prevDays.length * (BAR_WIDTH + 1);

  const plot = prevDays
    .reverse()
    .map((day, idx) => {
      const dayData = historyData.find(({ date }) => date === day);
      const distance = dayData?.distance || 0;
      const date = dayData?.date || day;
      const height = (distance / maxValue) * BAR_HEIGHT;
      const yDist = BAR_HEIGHT - height;
      const xTranslate = idx + idx * BAR_WIDTH;
      const formattedDate = new Date(date).toLocaleDateString();
      const formattedDistance = Math.round(distance).toLocaleString();
      const tier = findTier(distance).type;
      return `
      <g class="bar ${tier}" transform="translate(${xTranslate},0)">
        <title id="title">${formattedDistance} - ${formattedDate}</title>
        <rect
          height="${height}"
          x="1"
          y="${yDist}"
          width="${BAR_WIDTH}"
          data-date="${date}"
          data-distance="${distance}"></rect>
      </g>`;
    })
    .join("");

  const todayPlot = `
      <g class="bar ${
        findTier(currentDistance).type
      } today selected" transform="translate(${todayXTranslate + 1},0)">
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
      <defs>
        <marker id="dot" viewBox="0 0 10 10" refX="0" refY="0" markerWidth="5" markerHeight="50">
          <rect height="10" width="2" fill=${black}></rect>
        </marker>
      </defs>
      ${plot ?? ""}
      ${todayPlot}
      ${axes}
    </svg>`;

  const bars = selectBars();
  bars.forEach((barEl) => {
    barEl.addEventListener("click", (event) => {
      bars.forEach((bar) => bar.classList.remove("selected"));
      barEl.classList.add("selected");
      const { distance, date } = event.target.dataset;
      const currentTier = findTier(distance);
      updateIcon(currentTier.path);
      updateDisplay({ options, date });
    });
  });
};

// click anywhere in history box selects 'today'
history.addEventListener("click", (event) => {
  if (event.target.nodeName === "svg") {
    selectBars().forEach((bar) => bar.classList.remove("selected"));
    const todayBar = document.querySelector(".bar.today");
    todayBar.classList.add("selected");
    const { distance, date } = todayBar.querySelector("rect").dataset;
    const currentTier = findTier(distance);
    updateIcon(currentTier.path);
    updateDisplay({ options: { currentDistance: distance }, date: "today" });
  }
});
