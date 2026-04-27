# Periodic Table Explorer

Interactive React + TypeScript periodic table with search, element detail cards,
local persistence, installable PWA metadata, and offline support.

## Scripts

```bash
npm ci
npm run dev
npm run lint
npm run build
npm run serve:dist
```

`npm run build` compiles the app with Vite and then generates a production
service worker containing the exact hashed bundle files from `dist/`.

## PWA behavior

- Relative asset paths work from the site root or a project-page subdirectory.
- The web manifest declares install metadata, scope, icons, theme color, and
  standalone display.
- The service worker precaches the app shell, generated JS/CSS bundle, icons,
  manifest, and element dataset.
- Navigations use a network-first strategy with an offline app-shell fallback.
- Static assets use cache-first loading after the precache is installed.

## Install on a phone

The app must be served from HTTPS before a phone can install it. This repo
includes a GitHub Pages workflow that builds and deploys the PWA from the
`finalizce` branch.

1. Push this branch to GitHub.
2. In the repository settings, set Pages source to GitHub Actions.
3. Open the deployed URL on your phone.
4. Android Chrome or Edge: tap the browser menu and choose **Install app**.
5. iPhone Safari: tap Share, then **Add to Home Screen**.

For this repository, the GitHub Pages URL is expected to be:

```text
https://movysah.github.io/PeriodicTable/
```

## Test from a phone on local Wi-Fi

`127.0.0.1` only points to the current device. On a phone, it points to the
phone, not the computer running Vite.

To open the local preview from your phone:

1. Run `npm run build`.
2. Run `npm run serve:dist`.
3. Find your computer's local IPv4 address with `ipconfig`.
4. Open `http://YOUR_COMPUTER_IP:4173/` on the phone.

Example:

```text
http://192.168.100.108:4173/
```

If the phone cannot connect, make sure both devices are on the same Wi-Fi and
allow Node.js through Windows Firewall.
