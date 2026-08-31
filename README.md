# Mouse Odometer

##### Squeak! - Keep track of how many pixels your mouse travels!

## Setup locally

Load up extension in Chrome. Go to `chrome://extensions/` or just find the "Manage Extensions" link from the plugins menu bar icon.

Click "Load Unpacked" in the top left and navigate to the root directory of this project. This option only appears when the "Developer mode" option is selected in the top right.

## How this works

Each tab independently accumulates mouse movement and sends its running total to the `background.js` service worker every few seconds. Distance is accumulated from `event.movementX/movementY` on every `mousemove` -- the deltas the browser already computed -- so the measurement follows the actual path of the cursor. (Sampling `clientX/clientY` on a throttled listener instead measures the straight line between samples, which undercounts badly: circles register as almost nothing.) Only the sync to storage is throttled, because that's the expensive part.

`background.js` is the single source of truth. Updates are a read-modify-write on shared storage, so they are pushed through a promise queue and run one at a time -- otherwise two tabs messaging in the same tick both read the pre-update value, and on a day rollover both would archive the same day.

Storage is split across two areas:

- `chrome.storage.local` holds `currentDistance` and `currentDate`. These are rewritten every few seconds by every open tab, and `chrome.storage.sync` only allows 120 writes/minute (1800/hour) before it starts failing -- silently. A handful of active tabs is enough to hit that.
- `chrome.storage.sync` holds everything else (daily history, totals, settings), which only changes on a day rollover or a user action. The hot keys are mirrored into `sync` about once a minute, and always on rollover, so the count still carries across devices.

This communication is achieved using a [simple request](https://developer.chrome.com/docs/extensions/mv3/messaging/#simple) instead of dealing with achieving a long-term connection.

#### Manifest options notes

`content_scripts` - This allows the JS to run within the main browser DOM

`background` - This script is running in the background to receive all mouse movement updates.

`default_popup` - This is the options page JS but it cannot receive any messages unless it is open, therefore we need the `background` script to be running. Thus the options page is only for displaying the current movement value.

`web_accessible_resources` - This allows the `content_scripts` to be loaded up correctly (I think). Whatever the case this is needed for now.

## To Do

- Add a mouse icon for the menu bar

- Make the options page more flashy.
