// Runs in the page's MAIN world at document_start before YouTube's base.js loads.
(() => {
  const TARGET_ATTR = "data-auto-skip-target";
  const EVENT_NAME = "yt-auto-skip:click";

  let trustedDispatchDepth = 0;
  const listenerMap = new WeakMap();

  const origAddEventListener = EventTarget.prototype.addEventListener;
  const origRemoveEventListener = EventTarget.prototype.removeEventListener;

  function createTrustedEventProxy(event) {
    return new Proxy(event, {
      get(target, prop) {
        if (prop === "isTrusted") return true;
        const value = Reflect.get(target, prop, target);
        return typeof value === "function" ? value.bind(target) : value;
      },
    });
  }

  EventTarget.prototype.addEventListener = function (type, listener, options) {
    if (!listener) {
      return origAddEventListener.call(this, type, listener, options);
    }

    let wrapped = listenerMap.get(listener);
    if (!wrapped) {
      if (typeof listener === "function") {
        wrapped = function (event) {
          const arg =
            trustedDispatchDepth > 0 && event && !event.isTrusted
              ? createTrustedEventProxy(event)
              : event;
          return listener.call(this, arg);
        };
      } else if (typeof listener === "object" && typeof listener.handleEvent === "function") {
        wrapped = {
          handleEvent(event) {
            const arg =
              trustedDispatchDepth > 0 && event && !event.isTrusted
                ? createTrustedEventProxy(event)
                : event;
            return listener.handleEvent.call(listener, arg);
          },
        };
      } else {
        wrapped = listener;
      }
      listenerMap.set(listener, wrapped);
    }

    return origAddEventListener.call(this, type, wrapped, options);
  };

  EventTarget.prototype.removeEventListener = function (type, listener, options) {
    const wrapped = (listener && listenerMap.get(listener)) || listener;
    return origRemoveEventListener.call(this, type, wrapped, options);
  };

  document.addEventListener(EVENT_NAME, () => {
    const element = document.querySelector(`[${TARGET_ATTR}="true"]`);
    if (!element) return;
    element.removeAttribute(TARGET_ATTR);

    const rect = element.getBoundingClientRect();
    const clientX = Math.round(rect.left + rect.width / 2) || 10;
    const clientY = Math.round(rect.top + rect.height / 2) || 10;

    const baseInit = {
      bubbles: true,
      cancelable: true,
      composed: true,
      view: window,
      detail: 1,
      screenX: clientX,
      screenY: clientY,
      clientX,
      clientY,
      button: 0,
    };

    trustedDispatchDepth += 1;
    try {
      element.dispatchEvent(
        new PointerEvent("pointerdown", {
          ...baseInit,
          buttons: 1,
          pointerId: 1,
          pointerType: "mouse",
          isPrimary: true,
        })
      );
      element.dispatchEvent(new MouseEvent("mousedown", { ...baseInit, buttons: 1 }));
      element.dispatchEvent(
        new PointerEvent("pointerup", {
          ...baseInit,
          buttons: 0,
          pointerId: 1,
          pointerType: "mouse",
          isPrimary: true,
        })
      );
      element.dispatchEvent(new MouseEvent("mouseup", { ...baseInit, buttons: 0 }));
      element.dispatchEvent(new MouseEvent("click", { ...baseInit, buttons: 0 }));
    } finally {
      trustedDispatchDepth -= 1;
    }
  });
})();