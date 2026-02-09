# Lessons Learned

## Renderer `<script>` tags share global scope
Multiple scripts loaded via `<script src>` in Electron's renderer all execute in the
same global scope. `const` declarations in one file will collide with the same name in
another, causing `SyntaxError: Identifier has already been declared` — which silently
kills the entire renderer. **Fix: wrap every renderer script in an IIFE.**

## Vendor browser libs into renderer/
Referencing `../node_modules/tone/build/Tone.js` from renderer HTML works in dev mode
but breaks in a packaged Electron app because the asar archive doesn't resolve `../`
paths the same way. **Fix: copy the built JS file directly into `renderer/`.**

## iOS audio requires user gesture
Web Audio API on iOS Safari won't play sound until triggered by an explicit user tap.
An `AudioContext` created outside a gesture handler will be `suspended`. **Fix: create
the context inside a touch/click handler, or call `audioCtx.resume()` on first tap.**

## openrgb-sdk is at v0.6.0, not v1.x
The npm package `openrgb-sdk` latest version is `0.6.0`. The plan referenced `^1.2.1`
which doesn't exist.

## electron must be a devDependency
electron-builder expects `electron` in devDependencies, not dependencies. If it's in
dependencies it gets bundled into the asar unnecessarily.
