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

class MouseOdometer {
  constructor(delay = THROTTLE_DELAY) {
    this.currentMove = 0;
    this.throttledUpdate = throttle(this.updateStorage, STORAGE_UPDATE_DELAY);
    this.lastMove = { x: 0, y: 0 };
    this.od = new Odometer({
      el: this.initWrapper(),
      value: this.currentMove,
      format: ',ddd',
      theme: 'default',
    });
    document.body.addEventListener(
      'mousemove',
      throttle(this.updateMove, delay).bind(this)
    );
  }

  initWrapper() {
    const odomWrapper = document.createElement('div');
    odomWrapper.classList = 'mouse-odometer-distance';
    const odomTarget = document.createElement('div');
    odomWrapper.appendChild(odomTarget);
    document.body.appendChild(odomWrapper);
    return odomTarget;
  }

  updateMove(event) {
    const { pageX, pageY } = event;
    const { x, y } = this.lastMove;
    if (!!x && !!y) {
      const dx = Math.abs(x - pageX);
      const dy = Math.abs(y - pageY);
      this.currentMove += Math.sqrt(dx ** 2 + dy ** 2);
      this.throttledUpdate();
      this.od.update(Math.round(this.currentMove));
    }
    this.lastMove = { x: pageX, y: pageY };
  }

  updateStorage() {
    chrome.runtime.sendMessage({ lastMove: this.currentMove });
    this.currentMove = 0;
  }
}

(() => new MouseOdometer())();
