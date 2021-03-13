const distance = document.getElementById('distance');

chrome.storage.sync.get(['distance'], (options) => {
  console.log(options, 'options');
  distance.textContent = options.distance;
});
