# Learning library

A collection of independent interactive learning sites, with a shared homepage and category pages.

**Website:** https://simonwinther.github.io/codex-tutoring-websites/

## Local preview

Use Node.js 24 or newer. From this folder:

```sh
npm ci
npm run build
npm run preview
```

Open the URL printed by the preview server. It serves the real repository prefix so nested paths behave like GitHub Pages. Existing projects keep their own `npm run dev` commands.

The root build installs each project's dependencies when missing; use `npm run build -- --install` for a clean dependency install in every project. CI always runs `npm ci` in every discovered project.

## Add a learning site

1. Put the project anywhere under this folder, for example `ATDL/AnotherTopic/` or `Languages/Danish/Verbs/`.
2. Give it a `package.json` with Vite as a dependency, a `build` script ending in `vite build`, a committed `package-lock.json`, and an `index.html`. The build must produce `dist/index.html` and accept `--base`.
3. Optionally add `site.json` to set its homepage card:

```json
{
  "title": "A useful title",
  "description": "What you can learn and try here."
}
```

4. Run `npm run build` and `npm run test:hosting`, then commit and push to `main`.

The build finds Vite sites recursively, preserves folder names and capitalization in URLs, and creates category pages for every parent folder. Without `site.json`, card text comes from `index.html`. Hidden folders, dependency folders, build output, and conventional source/test/public directories are excluded. Discovery stops inside each project; keep other learning sites alongside it or under category folders.

For public assets referenced from JavaScript, use `import.meta.env.BASE_URL`, for example `` `${import.meta.env.BASE_URL}paper.pdf` ``. Avoid domain-root paths such as `/paper.pdf`. Hash-based app routes work directly on Pages; history-based routers need a separate routing strategy.

Only built files in `_site/` are published to Pages. The public repository contains the source files, documentation, and included learning materials. Do not commit credentials or personal notes.

## Deployment

Pushes to `main` build every project, check the combined site in Chromium, and deploy to GitHub Pages. Pull requests run the same checks without deploying. The workflow is in `.github/workflows/pages.yml`; Pages must use **GitHub Actions** as its publishing source.

The default local prefix is `/codex-tutoring-websites/`. Override it with `SITE_BASE_PATH=/ npm run build` when building for an origin root or a custom domain, and update the workflow's environment setting to match. No development server runs on the hosting service.

## Hosting checks

```sh
npm ci
npm run build
npx playwright install chromium
npm run test:hosting
```

Checks cover the homepage at desktop and phone widths, category links, each site's JavaScript and assets, MeanFlow's paper/gallery/manifest and chapter links, and the interview lab's deep links and lazy-loaded API exercise. Local checks use `/usr/bin/chromium` when available; set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to override it.

Project-specific numerical, content, and domain tests remain in their respective folders.
