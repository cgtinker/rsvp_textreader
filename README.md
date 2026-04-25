# TextPlayer

Speed reader — select text on any page and read it at your own pace.

Built with SvelteKit + TypeScript. Targets Firefox/Safari browser extensions and Tauri desktop.

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [pnpm](https://pnpm.io/) — `npm install -g pnpm`
- [web-ext](https://extensionworkshop.com/documentation/develop/getting-started-with-web-ext/) — `npm install -g web-ext`

## Browser Extension — Firefox

### Build

```sh
pnpm build:ext:firefox
```

This runs `vite build` then `node scripts/ext-postbuild.mjs firefox`, which:
- Copies `src-ext/manifest.firefox.json` → `build/manifest.json`
- Extracts the inline SvelteKit bootstrap script to `build/init.js`
- Rewrites all asset paths to be extension-relative (`/_app/` → `./_app/`)

### Test with web-ext

```sh
cd build
web-ext run --verbose
```

Firefox will launch with the extension temporarily installed. The TextPlayer popup opens as a resizable window via the toolbar button, keyboard shortcut (`Alt+Shift+R`), or right-click → **Read with TextPlayer** on selected text.

To reload after a rebuild, stop web-ext, re-run `pnpm build:ext:firefox`, then `web-ext run` again from the `build/` directory.

### Package for distribution

```sh
cd build
web-ext build
```

Produces a signed-ready `.zip` in `build/web-ext-artifacts/`.

## Browser Extension — Safari

```sh
pnpm build:ext:safari
```

Then open the generated Xcode project in `safari-ext/` and run on a simulator or device.

## Desktop (Tauri)

```sh
pnpm tauri dev      # development
pnpm tauri build    # production binary
```

## Project structure

```
src/                  SvelteKit app (shared across all targets)
src-ext/              Browser extension manifests
static/               Static assets (background.js for the extension)
scripts/              Build helpers (ext-postbuild.mjs)
src-tauri/            Tauri Rust backend
build/                Compiled output (git-ignored)
```
