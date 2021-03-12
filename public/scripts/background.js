function loadScript(srcUrl) {
  const script = document.createElement('script');
  script.src = chrome.extension.getURL(srcUrl);
  console.log(srcUrl, 'srcUrl srcUrl');
  (document.head || document.documentElement).appendChild(script);
}
loadScript('./public/scripts/odometer.min.js');
loadScript('./public/scripts/application.js');
