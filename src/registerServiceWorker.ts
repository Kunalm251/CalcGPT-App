// Service worker registration utility

export function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("[ServiceWorker] Registered successfully with scope:", registration.scope);

          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === "installed") {
                  if (navigator.serviceWorker.controller) {
                    console.log("[ServiceWorker] New version available! Reloading...");
                  } else {
                    console.log("[ServiceWorker] Content cached for offline use.");
                  }
                }
              };
            }
          };
        })
        .catch((error) => {
          console.error("[ServiceWorker] Registration failed:", error);
        });
    });
  }
}
