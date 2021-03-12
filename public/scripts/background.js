const script = document.createElement('script');
script.src = chrome.extension.getURL('./public/scripts/application.js');
(document.head || document.documentElement).appendChild(script);
