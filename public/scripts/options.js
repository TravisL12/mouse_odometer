const distance = document.getElementById('distance');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (!isNaN(request.distance)) {
    distance.textContent = request.distance;
  }
});
