const distance = document.getElementById('distance');
const showOdometerOption = document.getElementById('show-odometer');
const reset = document.getElementById('reset');

const setDistanceDisplay = (amount) => {
  distance.textContent = `${amount} pixels traveled!`;
};

const setStorage = (options) => {
  chrome.storage.sync.get(['mouseOdometer'], (data) => {
    const { mouseOdometer } = data;
    chrome.storage.sync.set({
      mouseOdometer: { ...mouseOdometer, ...options },
    });
  });
};

showOdometerOption.addEventListener('change', (event) => {
  setStorage({ showOdometer: event.target.checked });
});

const updateDistance = () => {
  chrome.storage.sync.get(['mouseOdometer'], (options) => {
    const { currentDistance, showOdometer } = options.mouseOdometer;
    const amount = Math.round(currentDistance || 0).toLocaleString();
    setDistanceDisplay(amount);
    showOdometerOption.checked = showOdometer || false;
  });
};

reset.addEventListener('click', (event) => {
  event.preventDefault();
  setStorage({ currentDistance: 0 });
  setDistanceDisplay(0);
});

updateDistance();
setInterval(updateDistance, 1500);
