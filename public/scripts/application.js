const THROTTLE_DELAY = 250;
function throttle(callback, delay) {
  let canFireCallback = true;

  return function () {
    setTimeout(() => {
      canFireCallback = true;
    }, delay);

    if (canFireCallback) {
      canFireCallback = false;
      return callback.apply(this, Object.values(arguments));
    }

    return;
  };
}

const sendMessage = (value) => {
  chrome.runtime.sendMessage(value);
};

class MouseOdometer {
  constructor(delay = THROTTLE_DELAY) {
    const odomWrapper = document.createElement('div');
    odomWrapper.classList = 'mouse-odometer-distance';
    const odomTarget = document.createElement('div');
    odomWrapper.appendChild(odomTarget);
    document.body.appendChild(odomWrapper);
    this.distance = 0;
    this.od = new Odometer({
      el: odomTarget,
      value: this.distance,
      format: ',ddd',
      theme: 'default',
    });
    this.lastMove = { x: null, y: null };
    this.updateOdometer();
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
      this.distance += Math.sqrt(dx ** 2 + dy ** 2);
      this.updateOdometer();
    }
  }

  updateOdometer() {
    const roundedDistance = Math.round(this.distance);
    sendMessage({ distance: roundedDistance });
    this.od.update(roundedDistance);
  }
}

(() => new MouseOdometer())();
