const THROTTLE_DELAY = 500;
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
    const odomWrapper = document.createElement('div');
    odomWrapper.classList = 'mouse-odometer-distance';
    const odomTarget = document.createElement('div');
    odomWrapper.appendChild(odomTarget);
    document.body.appendChild(odomWrapper);

    this.currentMove = 0;
    this.throttledUpdate = throttle(this.updateStorage, STORAGE_UPDATE_DELAY);

    this.od = new Odometer({
      el: odomTarget,
      value: this.currentMove,
      format: ',ddd',
      theme: 'default',
    });
    this.lastMove = { x: null, y: null };
    document.body.addEventListener(
      'mousemove',
      throttle(this.updateMove, delay).bind(this)
    );
  }

  updateMove(event) {
    const { pageX: x, pageY: y } = event;
    this.calculateOdometer(x, y);
    this.lastMove = { x, y };
  }

  calculateOdometer(newX, newY) {
    const { x: oldX, y: oldY } = this.lastMove;
    if (!!oldX && !!oldY) {
      const dx = Math.abs(oldX - newX);
      const dy = Math.abs(oldY - newY);
      this.currentMove += Math.sqrt(dx ** 2 + dy ** 2);
      this.updateOdometer();
    }
  }

  updateOdometer() {
    this.throttledUpdate();
    this.od.update(Math.round(this.currentMove));
  }

  updateStorage() {
    chrome.runtime.sendMessage({ lastMove: this.currentMove });
    this.currentMove = 0;
  }
}

(() => new MouseOdometer())();
