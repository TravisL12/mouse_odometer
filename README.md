# Mouse Odometer

##### Squeak! - Keep track of how many pixels your mouse travels!

## Setup locally

Load up extension in Chrome. Go to `chrome://extensions/` or just find the "Manage Extensions" link from the plugins menu bar icon.

Click "Load Unpacked" in the top left and navigate to the root directory of this project. This option only appears when the "Developer mode" option is selected in the top right.

## How this works

Each tab independently keeps track of mouse movements and sends updated movements to the `background.js` script every few seconds. There's a maximum number of `storage.set` values that can be called and that's why it must be throttled. Once an update is sent from the tab the `currentValue` is reset to start again. This allows one source of truth (`background.js`) of the overall distance to be maintained and allow each tab to not have to worry about it.

This communication is achieved using a [simple request](https://developer.chrome.com/docs/extensions/mv3/messaging/#simple) instead of dealing with achieving a long-term connection.

The overall movement distance is saved to `chrome.storage` that will be used to maintain your distance traveled over your entire Google account (i.e. synced).

#### Manifest options notes

`content_scripts` - This allows the JS to run within the main browser DOM

`background` - This script is running in the background to receive all mouse movement updates.

`default_popup` - This is the options page JS but it cannot receive any messages unless it is open, therefore we need the `background` script to be running. Thus the options page is only for displaying the current movement value.

`web_accessible_resources` - This allows the `content_scripts` to be loaded up correctly (I think). Whatever the case this is needed for now.

## To Do

- Add a mouse icon for the menu bar

- Make the options page more flashy.
