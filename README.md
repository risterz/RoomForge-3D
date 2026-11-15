# RoomForge

**Your space, reimagined.** Design a room in your browser with an interactive 3D workspace, editable furniture, and flexible finishes.

RoomForge is a client-side React application. It requires no account, backend, or API key, and saves designs in your browser.

## Features

- **3D workspace:** orbit, zoom, switch to a top view, and display room dimensions and a floor grid.
- **15-piece catalog:** seating, tables, lighting, decor, doors, windows, and appliances.
- **Direct editing:** add pieces by clicking or dragging from the catalog, then move, rotate, resize, recolor, duplicate, or remove them.
- **Wall-aware placement:** doors and windows create wall openings; wall-mounted pieces stay aligned when moved or resized.
- **Room customization:** change room dimensions, wall and floor colors, and lighting.
- **Local design library:** automatically retain the current room and save up to 20 named designs.
- **History and responsive controls:** undo and redo edits, including clearing the room, on desktop and mobile layouts.

## Quick start

**Requirements:** Node.js 22 or later, npm, and a WebGL 2-capable browser with hardware acceleration enabled.

```sh
git clone https://github.com/risterz/RoomForge-3D.git
cd RoomForge-3D
npm ci
npm run dev
```

Open **http://localhost:5173**.

To create and preview a production build:

```sh
npm run build
npm run preview
```

The build is written to `dist/`. No runtime environment variables are required.

## Using the editor

1. Choose a furniture category or search the catalog.
2. Click a piece to add it, or drag it onto the canvas.
3. Select and drag furniture to arrange the room.
4. Use the selection controls to rotate, resize, recolor, duplicate, or remove a piece.
5. Open **Room** to adjust dimensions, finishes, and lighting.
6. Select **Save design** to name the room and add it to **My designs**.

Rooms can be 3–12 meters wide and deep. Furniture can be resized from 60% to 140% of its catalog size. Saving a design with an existing name replaces that saved version; the library retains up to 20 designs.

### Controls

| Action | Control |
| --- | --- |
| Orbit the camera | Drag empty canvas space |
| Zoom | Scroll or use browser touch gestures |
| Move an item | Drag the item |
| Rotate selected item | `R` or the rotation buttons |
| Remove selected item | `Delete`, `Backspace`, or **Remove** |
| Undo | `Ctrl+Z` / `Cmd+Z` |
| Redo | `Ctrl+Shift+Z` / `Cmd+Shift+Z` |
| Deselect or close a dialog | `Escape` |

## Project structure

```text
RoomForge/
├── public/                  # Favicon
├── src/
│   ├── App.tsx              # Editor state, history, and local persistence
│   ├── Scene.tsx            # Canvas, room geometry, lighting, and camera
│   ├── Furniture.tsx        # Procedural models and pointer interactions
│   ├── FurniturePreview.tsx # Catalog and selection icons
│   ├── wallPlacement.ts     # Shared wall snapping and clamping
│   ├── data.ts              # Catalog, starter room, and design validation
│   ├── types.ts             # Design and furniture model
│   ├── styles.css           # Responsive interface styles
│   └── main.tsx             # Application entry point
├── tests/                   # Playwright browser regression tests
├── index.html
├── package.json
├── playwright.config.ts
└── vite.config.ts
```

`App` owns the design model and editing history. `Scene` renders the model with React Three Fiber, while `Furniture` supplies procedural geometry and pointer interactions.

Item dimensions use meters, and positions are world-coordinate `[x, y, z]` tuples. The selected item's parent transform applies its scale once; models use unscaled base dimensions. `wallPlacement.ts` centralizes wall coordinates for placement, dragging, duplication, rotation, and room resizing.

## Privacy and local storage

Room designs are stored only in the browser's `localStorage`; RoomForge does not send them to an application server.

| Key | Contents |
| --- | --- |
| `roomforge-current-design` | The current room, automatically saved after edits |
| `roomforge-saved-designs` | Up to 20 named design snapshots |
| `roomforge-drag-kind` | The furniture kind during a catalog drag operation |

Saved data is specific to the browser and site origin. Clearing site data or changing the host or port can make designs unavailable. Designs cannot currently be exported, imported, shared between devices, or synchronized to an account.

The interface requests Manrope and DM Sans from Google Fonts. All furniture, materials, and scene geometry are generated locally, without external model or image downloads.

## Testing

Install Playwright's Chromium, then run the suite:

```sh
npx playwright install chromium
npm test
```

Playwright starts the development server if port 5173 is not already in use. Tests use software WebGL. To use an existing Chrome installation, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to its executable path for the test command.

The regression tests cover furniture editing, room finishes, saved designs, mobile layout, catalog drag and drop, room dimensions, clear-room undo, doors, wall openings, appliances, local persistence, and left-wall placement after resizing and reloading.

Generated screenshots, test reports, dependencies, and production output are excluded from Git.

## Deployment

RoomForge is a static single-page application. Run `npm run build` and serve `dist/` from a static host with SPA fallback routing. HTTPS is recommended for production.

## Current limitations

- The room supports a back wall and a left wall; arbitrary floor plans and multiple rooms are not supported.
- Furniture placement is not collision-aware, and wall openings can overlap.
- Furniture models are stylized procedural geometry, not manufacturer-specific assets.
- Local-only persistence is not a substitute for portable design files or cloud backup.
- Production builds emit a Vite warning for the large Three.js application chunk. This is a performance warning, not a build failure.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, development conventions, and testing expectations.

## Built with

[React](https://react.dev/) · [TypeScript](https://www.typescriptlang.org/) · [Vite](https://vite.dev/) · [Three.js](https://threejs.org/) · [React Three Fiber](https://r3f.docs.pmnd.rs/) · [Drei](https://drei.docs.pmnd.rs/) · [Lucide](https://lucide.dev/) · [Playwright](https://playwright.dev/)

## License

[MIT](LICENSE)
