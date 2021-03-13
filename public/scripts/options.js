const distance = document.getElementById('distance');
const reset = document.getElementById('reset');

chrome.storage.sync.get(['distance'], (options) => {
  console.log(options, 'options');
  distance.textContent = options.distance;
});

reset.addEventListener('click', () => {
  // need to use the message approach to reset the application.js value of distance
  chrome.storage.sync.set({ distance: 0 });
  distance.textContent = 0;
});
