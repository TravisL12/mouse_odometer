const distance = document.getElementById('distance');
const showOdometerOption = document.getElementById('show-odometer');
const reset = document.getElementById('reset');

const setDistanceDisplay = (amount) => {
  distance.textContent = `${amount} pixels traveled!`;
};

const setStorage = (options) => {
  chrome.storage.sync.set(options);
};

showOdometerOption.addEventListener('change', (event) => {
  setStorage({ showOdometer: event.target.checked });
});

const updateDistance = () => {
  chrome.storage.sync.get(['distance', 'showOdometer'], (options) => {
    const amount = Math.round(options.distance || 0).toLocaleString();
    setDistanceDisplay(amount);
    showOdometerOption.checked = options.showOdometer || false;
  });
};

reset.addEventListener('click', (event) => {
  event.preventDefault();
  setStorage({ distance: 0 });
  setDistanceDisplay(0);
});

updateDistance();
setInterval(updateDistance, 1500);
