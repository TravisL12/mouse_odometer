(() => {
  const RENDER_DELAY = 250;
  const STORAGE_UPDATE_DELAY = 3000;
  const HOT_VALUES = ["currentDistance", "currentDate"];

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

  // Mirrors helper.js getStorage: the hot counter lives in `local`, the rest in
  // `sync`. See LOCAL_VALUES there for why.
  const getStorage = async () => {
    const [synced, local] = await Promise.all([
      chrome.storage.sync.get([
        "currentDistance",
        "showOdometer",
        "currentDate",
      ]),
      chrome.storage.local.get(HOT_VALUES),
    ]);

    for (const key of HOT_VALUES) {
      if (local[key] !== undefined) {
        synced[key] = local[key];
      }
    }

    return synced;
  };

  class MouseOdometer {
    constructor() {
      this.currentDistance = 0;
      this.throttledUpdate = throttle(this.updateStorage, STORAGE_UPDATE_DELAY);
      this.throttledRender = throttle(this.renderDistance, RENDER_DELAY);
      getStorage().then(this.buildOdometerWrapper.bind(this));
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

    // Calculate distance moved.
    //
    // movementX/Y are the deltas the browser already computed between the real
    // consecutive positions, so accumulating them measures the actual path.
    // Sampling clientX/Y on a throttled listener instead measured the straight
    // line between samples -- circles registered as ~nothing -- and the first
    // event on every page load counted the whole distance from the origin.
    updateMove(event) {
      const move = Math.hypot(event.movementX || 0, event.movementY || 0);
      if (!move) {
        return;
      }

      this.currentDistance += move;
      this.throttledUpdate();
      this.throttledRender();
    }

    // Update on screen odometer
    renderDistance() {
      if (this.odometerWrapper && this.odometer) {
        this.odometer.update(Math.round(this.currentDistance));
      }
    }

    // Gets distance from chrome.storage
    syncDistance() {
      getStorage().then((options) => {
        const isNewDay = isDateInPast(options.currentDate);
        this.currentDistance = isNewDay ? 0 : options.currentDistance;
        this.renderDistance();
      });
    }

    // Sends distance to chrome.storage in background.js
    updateStorage() {
      chrome.runtime
        .sendMessage({ latestDistance: this.currentDistance })
        .then((response) => {
          if (!response) {
            return;
          }

          this.currentDistance = response.isNewDay
            ? 0
            : response.currentDistance;

          this.odometerWrapper?.classList.add(
            `odometer-text-color-${response.currentTier.background}`
          );
          this.renderDistance();
        })
        .catch(() => {
          // No receiver: the extension was reloaded or updated under us.
        });
    }
  }

  const mouse = new MouseOdometer();

  // Mouse movement listener. Not throttled -- accumulating a delta is cheaper
  // than the throttle's own bookkeeping, and dropping events loses distance.
  document.body.addEventListener("mousemove", mouse.updateMove.bind(mouse));

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
