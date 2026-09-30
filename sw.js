/* ═══════════════════════════════════════════════════════════════════════════
 * 21N2 Championship Pool Scoreboard - offline service worker
 *
 * Goal: after the app has been opened ONCE, it must start, score a whole match
 * and settle debts with the device in airplane mode. Pool halls rarely have
 * usable wifi, and a reload with no network used to lose the icon font - which
 * breaks the entire icon-driven interface.
 *
 * Strategies
 *   navigations        -> network-first, fall back to the cached app shell
 *   fonts              -> cache-first (immutable, large, needed for first paint)
 *   other same-origin  -> stale-while-revalidate (fast, self-healing)
 *
 * Bump VERSION whenever the css/js/fonts change so clients pull the new files.
 * ═══════════════════════════════════════════════════════════════════════════ */

const VERSION = "3.4.2";
const SHELL_CACHE = `21n2-shell-${VERSION}`;
const FONT_CACHE = `21n2-fonts-${VERSION}`;

/* Boot-critical assets. */
const SHELL_ASSETS = [
  "./",
  "./index.html",
  "./css/style.css",
  "./css/icons.css",
  "./css/app-fonts.css",
  "./js/script.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
];

/**
 * Cache every font file a stylesheet references, discovered from the CSS itself
 * so regenerating the fonts (tools/vendor-fonts.ps1) can never leave a stale
 * hardcoded list behind. All vendored text fonts together are only ~630 KB, so
 * caching the whole set is cheaper than shipping missing glyphs while offline.
 */
async function precacheReferencedFonts(cache, stylesheets) {
  let total = 0;

  await Promise.all(
    stylesheets.map(async (sheet) => {
      try {
        const res = await fetch(new Request(sheet, { cache: "reload" }));
        if (!res.ok) return;
        const css = await res.text();

        const refs = [...css.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)]
          .map((m) => m[1].trim())
          .filter((u) => /\.(woff2?|ttf|otf)$/i.test(u) && !/^https?:/i.test(u));

        const absolute = [...new Set(refs)].map(
          (u) => new URL(u, new URL(sheet, self.location.href)).href
        );

        await Promise.all(
          absolute.map(async (url) => {
            try {
              await cache.add(new Request(url, { cache: "reload" }));
              total++;
            } catch {
              /* one missing subset must not abort the install */
            }
          })
        );
      } catch {
        /* the stylesheet itself is already precached above */
      }
    })
  );

  return total;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);

      // Add one by one: a single missing optional asset must not fail the install.
      await Promise.all(
        SHELL_ASSETS.map(async (asset) => {
          try {
            await cache.add(new Request(asset, { cache: "reload" }));
          } catch {
            /* keep going - the app degrades gracefully for missing files */
          }
        })
      );

      await precacheReferencedFonts(cache, ["./css/icons.css", "./css/app-fonts.css"]);
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key !== SHELL_CACHE && key !== FONT_CACHE)
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

/* Lets the page trigger an immediate update from the "new version" toast. */
self.addEventListener("message", (event) => {
  if (event.data === "skip-waiting") self.skipWaiting();
});

function isFontRequest(url) {
  return (
    /\.(woff2?|ttf|otf)$/i.test(url.pathname) ||
    url.hostname === "fonts.googleapis.com" ||
    url.hostname === "fonts.gstatic.com"
  );
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  let url;
  try {
    url = new URL(req.url);
  } catch {
    return;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return;

  /* ── Page loads: try the network, otherwise serve the cached shell ── */
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          const cache = await caches.open(SHELL_CACHE);
          cache.put("./index.html", fresh.clone());
          return fresh;
        } catch {
          return (
            (await caches.match("./index.html")) ||
            (await caches.match("./")) ||
            new Response("<h1>Offline</h1><p>Reconnect once to install the app.</p>", {
              headers: { "Content-Type": "text/html; charset=utf-8" },
            })
          );
        }
      })()
    );
    return;
  }

  /* Fonts may still be cross-origin (legacy CDN links); everything else is ours. */
  if (url.origin !== self.location.origin && !isFontRequest(url)) return;

  /* ── Fonts: cache-first ── */
  if (isFontRequest(url)) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(req, { ignoreVary: true });
        if (cached) return cached;
        try {
          const res = await fetch(req);
          if (res && (res.ok || res.type === "opaque")) {
            const cache = await caches.open(FONT_CACHE);
            cache.put(req, res.clone());
          }
          return res;
        } catch {
          return cached || Response.error();
        }
      })()
    );
    return;
  }

  /* ── Same-origin css/js/icons: stale-while-revalidate ── */
  event.respondWith(
    (async () => {
      const cached = await caches.match(req, { ignoreVary: true });
      const network = fetch(req)
        .then((res) => {
          if (res && res.ok) {
            caches.open(SHELL_CACHE).then((cache) => cache.put(req, res.clone()));
          }
          return res;
        })
        .catch(() => null);

      return cached || (await network) || Response.error();
    })()
  );
});
