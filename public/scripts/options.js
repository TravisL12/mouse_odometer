const distance = document.getElementById('distance');
const reset = document.getElementById('reset');

chrome.storage.sync.get(['distance'], (options) => {
  distance.textContent = options.distance;
});

reset.addEventListener('click', () => {
  chrome.storage.sync.set({ distance: 0 });
  distance.textContent = 0;
});
