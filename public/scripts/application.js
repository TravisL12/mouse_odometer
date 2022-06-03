(() => {
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

  // date is `YYYY-mm-dd` string, I miss you TS :'(
  const isDateInPast = (dateStr) => {
    if (!dateStr) {
      return true;
    }

    const firstDate = new Date(dateStr.split("-"));
    const secondDate = new Date();
    return firstDate.setHours(0, 0, 0, 0) < secondDate.setHours(0, 0, 0, 0);
  };

  const getStorage = (cb) => {
    chrome.storage.sync.get(
      ["currentDistance", "showOdometer", "currentDate"],
      cb
    );
  };

  class MouseOdometer {
    constructor() {
      this.currentDistance = 0;
      this.lastMove = { x: 0, y: 0 };
      this.throttledUpdate = throttle(this.updateStorage, STORAGE_UPDATE_DELAY);
      getStorage(this.buildOdometerWrapper.bind(this));
    }

    // Builds odometer element
    buildOdometerWrapper(options) {
      this.currentDistance =
        options.currentDistance || this.currentDistance || 0;

      if (options.showOdometer) {
        this.odometerWrapper = document.createElement("div");
        this.odometerWrapper.classList = "mouse-odometer-distance";
        const odomTarget = document.createElement("div");
        this.odometerWrapper.appendChild(odomTarget);
        document.body.appendChild(this.odometerWrapper);
        this.odometer = new Odometer({
          el: odomTarget,
          value: this.currentDistance,
          format: ",ddd",
          theme: "default",
          duration: 1000,
        });
      }

      this.syncDistance();
    }

    // Calculate distance moved
    updateMove(event) {
      const { clientX: newX, clientY: newY } = event;
      const { x: oldX, y: oldY } = this.lastMove;
      const dx = Math.abs(oldX - newX);
      const dy = Math.abs(oldY - newY);
      const move = Math.sqrt(dx ** 2 + dy ** 2);
      this.currentDistance += move;
      this.throttledUpdate();
      this.renderDistance();
      this.lastMove = { x: newX, y: newY };
    }

    // Update on screen odometer
    renderDistance() {
      if (this.odometerWrapper && this.odometer) {
        this.odometer.update(Math.round(this.currentDistance));
      }
    }

    // Gets distance from chrome.storage
    syncDistance() {
      getStorage((options) => {
        const isNewDay = isDateInPast(options.currentDate);
        this.currentDistance = isNewDay ? 0 : options.currentDistance;
      });
    }

    // Sends distance to chrome.storage
    updateStorage() {
      chrome.runtime
        .sendMessage({ latestDistance: this.currentDistance }, (response) => {
          if (!response) {
            return;
          }

          if (response?.isNewDay) {
            this.currentDistance = 0;
          }
          const currentTier = response.currentTier;
          this.odometerWrapper?.classList.add(
            `odomenter-text-color-${currentTier.background}`
          );
        })
        ?.bind(this);
    }
  }

  const mouse = new MouseOdometer();

  // Mouse movement listener
  const throttled = throttle(mouse.updateMove, THROTTLE_DELAY).bind(mouse);
  document.body.removeEventListener("mousemove", throttled);
  document.body.addEventListener("mousemove", throttled);

  // When tab becomes active, sync distance
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      mouse.syncDistance();
    }
  });

  // When showOdometer setting changes hide/show odometer
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.showOdometer?.newValue) {
      mouse.buildOdometerWrapper({
        showOdometer: changes.showOdometer.newValue,
      });
    } else if (
      mouse.odometer &&
      changes.showOdometer &&
      !changes.showOdometer.newValue
    ) {
      mouse.odometerWrapper?.remove();
      delete mouse.odometer;
    }
  });
})();
