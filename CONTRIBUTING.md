# Contributing to RoomForge

Thank you for helping make RoomForge better.

## Development setup

Use Node.js 22 or later and npm.

```sh
npm install
npm run dev
```

The editor is available at `http://localhost:5173`.

## Before submitting changes

1. Create a focused branch from `main`.
2. Keep changes small and related to one improvement.
3. Run the complete verification suite:

   ```sh
   npm run build
   npm test
   ```

4. For UI changes, exercise the feature in a browser at desktop and mobile sizes. Include screenshots in your pull request when they help explain the change.
5. Add or update Playwright coverage for user-facing behavior and regressions.
6. Do not commit `node_modules`, `dist`, test artifacts, local environment files, or credentials.

## Working with the editor

- The design model is the source of truth. Rendering, persistence, and editor controls should consume the same model.
- Room dimensions and item sizes use meters. Positions use world coordinates.
- Keep the `Furniture` parent transform and its geometry consistent: base dimensions belong in the item's geometry, while `item.scale` belongs to the parent transform.
- Use `getWallPlacement` for doors, windows, and wall-mounted appliances. The left wall uses a different local coordinate orientation; preserve that conversion when adding wall-based features.
- Extend `src/types.ts` and `src/data.ts` when adding an item type. Add its catalog entry, preview, 3D representation, and browser coverage together.
- Preserve keyboard controls, accessible labels, responsive layouts, and reduced-motion support.

## Testing

Playwright starts the development server automatically when it is not already running. It reuses an existing server on port 5173.

`playwright.config.ts` uses Playwright's Chromium with software WebGL enabled. Install its browser before the first test run:

```sh
npx playwright install chromium
```

To use an existing Chrome installation instead, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to its executable path for the test command. Do not commit machine-specific browser paths.

The suite covers furniture editing, room finishes, local persistence, responsive behavior, drag and drop, clear-room undo, appliances, wall openings, and left-wall placement after resizing.

## Commit and pull request style

- Use concise, imperative commit messages, such as `Fix left-wall opening placement`.
- Explain the motivation and user impact in the pull request, not just the changed files.
- List the verification performed and disclose anything that could not be tested.
- Note intentional visual changes and include before/after screenshots where practical.

## Reporting issues

Include the expected behavior, actual behavior, reproduction steps, browser, viewport size, and any browser-console errors. For visual issues, attach a screenshot. Never include saved-room data that contains private information.
