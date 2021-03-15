const dateInPast = (firstDate, secondDate) => {
  return firstDate.setHours(0, 0, 0, 0) < secondDate.setHours(0, 0, 0, 0);
};

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  return `${year}-${month}-${day}`;
};

const optionValues = [
  'showOdometer',
  'currentDistance',
  'currentDate',
  'previousDistances',
];

const defaultValues = {
  showOdometer: false,
  currentDistance: 0,
  currentDate: formatDate(new Date()),
  previousDistances: Array(7).fill(0),
};

const buildOptions = (options) => {
  const showOdometer = options.showOdometer || defaultValues.showOdometer;
  let currentDistance =
    options.currentDistance || defaultValues.currentDistance;
  let date = options.currentDate || defaultValues.currentDate;
  let previousDistances =
    options.previousDistances || defaultValues.previousDistances;
  const isNewDay = dateInPast(new Date(date), new Date());

  if (isNewDay) {
    date = formatDate(new Date());
    previousDistances.unshift(options.currentDistance);
    previousDistances.pop();
    currentDistance = 0;
  }

  return {
    showOdometer,
    currentDate: date,
    currentDistance,
    previousDistances,
  };
};

chrome.storage.sync.get(optionValues, (options) => {
  chrome.storage.sync.set(buildOptions(options));
});

chrome.runtime.onMessage.addListener((request) => {
  if (request.lastMove > 0) {
    chrome.storage.sync.get(optionValues, (options) => {
      const settings = buildOptions(options);
      const newDistance = settings.currentDistance + request.lastMove;
      chrome.storage.sync.set({ ...settings, currentDistance: newDistance });
    });
  }
});
