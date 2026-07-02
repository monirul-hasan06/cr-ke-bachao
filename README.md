# CR কে বাঁচাও — Realistic Cartoon V3

This is the upgraded V3 version focused on a more realistic-cartoon mobile action vibe.

## Added / improved

- More cinematic classroom/campus/exam hall backgrounds
- Darker action lighting and vignette
- Character shadows for CR, player, enemies, and boss
- Normal enemy: one tap = instant kill
- Boss enemy: multiple hits with HP bar
- Better knife slash trail and red impact splash
- Slash spark particles
- Enemy knockback and death fade
- Player lunge attack movement
- Hit pause for stronger impact feel
- Camera shake and phone vibration on hit
- Layered attack sound: whoosh + hit + impact
- Footstep sound while moving
- Cleaner mobile UI
- GitHub/Vercel deploy-ready

## Run locally

```bash
npm install
npm run dev
```

Then open the local link on PC or the Network link on phone.

## Phone test

Your phone and PC must be on the same WiFi. Use the Network URL shown by Vite, for example:

```text
http://192.168.0.xxx:5173/
```

Do not use `localhost` on phone.

## Build

```bash
npm run build
```

## Important realism note

This V3 improves the game feel and visual direction as much as possible inside the prototype. For a truly commercial realistic-cartoon look, replace the placeholder files in:

```text
public/assets/characters
public/assets/backgrounds
public/assets/sounds
public/assets/ui
```

Keep the same filenames so the code works without changes.


## Optional Enemy / Anime Name

The start menu now includes **Enemy Name / Anime Name (Optional)**.

- Blank রাখলে normal enemy-দের মাথার উপরে কোনো name দেখাবে না।
- নাম দিলে every normal enemy-এর উপরে সেই নাম দেখাবে।
- Boss wave এলে label হবে `Boss + your enemy name`.

This is optional, so the game can stay clean when no enemy name is needed.


## PWA + Vibration Update

Added in this version:

- Vibration ON/OFF option in main menu
- Manual Install App button in main menu
- No automatic install popup when user opens the game link
- PWA install prompt appears only after clicking the Install App button, if the browser supports it
- Favicon and app icons added
- Manifest and service worker added

### Important PWA note

For install to work on phone, the game should be served from a secure HTTPS live link, such as Vercel. Local WiFi test is good for gameplay, but PWA install usually works best after deploying.


## Banner-based App Icon Update

This version uses the uploaded game banner to generate:

- `public/favicon.png`
- `public/favicon.ico`
- `public/assets/icons/icon-192.png`
- `public/assets/icons/icon-512.png`
- `public/assets/icons/app-icon-source.png`
- `public/assets/branding/game-banner.png`

The PWA install logo also uses the banner-derived app icon through `manifest.webmanifest`.


## Fix Note

Fixed MenuScene Install App methods and adjusted button layout to avoid overlap.
