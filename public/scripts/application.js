const THROTTLE_DELAY = 250;
const STORAGE_UPDATE_DELAY = 3000;

// https://codeburst.io/throttling-and-debouncing-in-javascript-b01cad5c8edf
const throttle = (func, limit) => {
  let lastFunc;
  let lastRan;
  return function () {
    const context = this;
    const args = arguments;
    if (!lastRan) {
      func.apply(context, args);
      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(function () {
        if (Date.now() - lastRan >= limit) {
          func.apply(context, args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
};

const getStorage = (cb) => {
  chrome.storage.sync.get(['currentDistance', 'showOdometer'], cb);
};

class MouseOdometer {
  constructor(delay = THROTTLE_DELAY) {
    this.currentMove = 0;
    this.throttledUpdate = throttle(this.updateStorage, STORAGE_UPDATE_DELAY);
    this.lastMove = { x: 0, y: 0 };
    document.body.addEventListener(
      'mousemove',
      throttle(this.updateMove, delay).bind(this)
    );

    getStorage(this.initWrapper.bind(this));

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.syncDistance();
      }
    });

    chrome.storage.onChanged.addListener((changes) => {
      if (changes.showOdometer?.newValue) {
        this.initWrapper({ showOdometer: changes.showOdometer.newValue });
      } else if (
        this.odometer &&
        changes.showOdometer &&
        !changes.showOdometer.newValue
      ) {
        this.odometerWrapper.remove();
        delete this.odometer;
      }
    });
  }

  initWrapper(options) {
    if (options.showOdometer) {
      this.odometerWrapper = document.createElement('div');
      this.odometerWrapper.classList = 'mouse-odometer-distance';
      this.currentDistance =
        options.currentDistance || this.currentDistance || 0;
      const odomTarget = document.createElement('div');
      this.odometerWrapper.appendChild(odomTarget);
      document.body.appendChild(this.odometerWrapper);
      this.odometer = new Odometer({
        el: odomTarget,
        value: this.currentDistance,
        format: ',ddd',
        theme: 'default',
      });
      this.syncDistance();
    }
  }

  syncDistance() {
    getStorage((options) => {
      this.currentDistance = options.currentDistance;
      this.renderDistance();
    });
  }

  renderDistance() {
    if (this.odometerWrapper) {
      this.odometer.update(Math.round(this.currentDistance));
    }
  }

  updateMove(event) {
    const { clientX: newX, clientY: newY } = event;
    const { x: oldX, y: oldY } = this.lastMove;

    const dx = Math.abs(oldX - newX);
    const dy = Math.abs(oldY - newY);
    this.currentMove += Math.sqrt(dx ** 2 + dy ** 2);
    this.currentDistance += this.currentMove;
    this.throttledUpdate();
    this.renderDistance();

    this.lastMove = { x: newX, y: newY };
  }

  updateStorage() {
    chrome.runtime.sendMessage({ latestDistance: this.currentDistance });
    this.currentMove = 0;
  }
}

(() => new MouseOdometer())();
