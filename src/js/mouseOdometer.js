import Odometer from 'odometer';
import { throttle } from 'lodash';

const THROTTLE_DELAY = 250;
class MouseOdometer {
  constructor(delay = THROTTLE_DELAY) {
    const odomWrapper = document.createElement('div');
    odomWrapper.classList = 'distance';
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
    this.od.update(Math.round(this.distance));
  }
}

export default MouseOdometer;
