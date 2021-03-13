const distance = document.getElementById('distance');
const reset = document.getElementById('reset');

const setDistanceDisplay = (amount) => {
  distance.textContent = `${amount} pixels traveled!`;
};

const updateDistance = () => {
  chrome.storage.sync.get(['distance'], (options) => {
    const amount = Math.round(options.distance).toLocaleString();
    setDistanceDisplay(amount);
  });
};

reset.addEventListener('click', (event) => {
  event.preventDefault();
  chrome.storage.sync.set({ distance: 0 });
  setDistanceDisplay(0);
});

updateDistance();
setInterval(updateDistance, 1500);
