const distance = document.getElementById('distance');
const showOdometerOption = document.getElementById('show-odometer');
const reset = document.getElementById('reset');

const setDistanceDisplay = (amount) => {
  distance.textContent = `${amount} pixels traveled!`;
};

showOdometerOption.addEventListener('change', (event) => {
  chrome.storage.sync.set({ showOdometer: event.target.checked });
});

const updateDistance = () => {
  chrome.storage.sync.get(['distance', 'showOdometer'], (options) => {
    const amount = Math.round(options.distance).toLocaleString();
    setDistanceDisplay(amount);
    showOdometerOption.checked = options.showOdometer || false;
  });
};

reset.addEventListener('click', (event) => {
  event.preventDefault();
  chrome.storage.sync.set({ distance: 0 });
  setDistanceDisplay(0);
});

updateDistance();
setInterval(updateDistance, 1500);
