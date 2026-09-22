import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = join(root, '_site');
const ignored = new Set(['node_modules', 'dist', '_site', 'public', 'src', 'scripts', 'tests', 'test-results', 'playwright-report']);
const exists = async path => { try { await stat(path); return true; } catch (error) { if (error.code === 'ENOENT') return false; throw error; } };
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const urlPath = path => path.split('/').map(encodeURIComponent).join('/');
const rawBase = process.env.SITE_BASE_PATH ?? '/codex-tutoring-websites/';
if (!rawBase.startsWith('/') || rawBase.startsWith('//') || /[?#\\]/.test(rawBase) || rawBase.split('/').some(part => part === '..' || part === '.')) throw new Error('SITE_BASE_PATH must be an absolute URL path, e.g. /codex-tutoring-websites/ or /.');
const base = rawBase.replace(/\/+$/, '') + '/';

async function discover(directory = root) {
  const sites = [];
  for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isDirectory() || entry.name.startsWith('.') || ignored.has(entry.name)) continue;
    const folder = join(directory, entry.name);
    const packagePath = join(folder, 'package.json');
    if (await exists(packagePath)) {
      const pkg = JSON.parse(await readFile(packagePath, 'utf8'));
      if (pkg.scripts?.build && (pkg.devDependencies?.vite || pkg.dependencies?.vite) && await exists(join(folder, 'index.html'))) {
        if (!await exists(join(folder, 'package-lock.json'))) throw new Error(`${folder} needs a committed package-lock.json (run npm install there).`);
        const html = await readFile(join(folder, 'index.html'), 'utf8');
        const metadata = await exists(join(folder, 'site.json')) ? JSON.parse(await readFile(join(folder, 'site.json'), 'utf8')) : {};
        const path = relative(root, folder).split(sep).join('/');
        sites.push({ folder, path, title: metadata.title || html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim() || entry.name, description: metadata.description || html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i)?.[1] || 'Open this interactive learning site.' });
        continue;
      }
    }
    sites.push(...await discover(folder));
  }
  return sites;
}

function run(args, cwd) {
  const result = spawnSync('npm', args, { cwd, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`npm ${args.join(' ')} failed in ${relative(root, cwd)}.`);
}

const sites = await discover();
if (!sites.length) throw new Error('No Vite sites found. Add a folder with package.json, package-lock.json, index.html, and a build script.');
if (process.argv.includes('--list')) {
  for (const site of sites) console.log(`${site.path} → ${base}${urlPath(site.path)}/`);
  process.exit(0);
}

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const site of sites) {
  console.log(`\nBuilding ${site.path}`);
  if (process.env.CI || process.argv.includes('--install') || !await exists(join(site.folder, 'node_modules'))) run(['ci', '--no-audit', '--no-fund'], site.folder);
  run(['run', 'build', '--', '--base', `${base}${urlPath(site.path)}/`], site.folder);
  if (!await exists(join(site.folder, 'dist/index.html'))) throw new Error(`${site.path} must build to dist/index.html.`);
  await cp(join(site.folder, 'dist'), join(output, site.path), { recursive: true, dereference: true });
}

const template = await readFile(join(root, 'website/index.html'), 'utf8');
const groups = new Set(['']);
for (const site of sites) {
  const parts = site.path.split('/');
  for (let i = 1; i < parts.length; i++) groups.add(parts.slice(0, i).join('/'));
}
for (const group of groups) {
  const members = sites.filter(site => !group || site.path.startsWith(group + '/'));
  const cards = members.map((site, index) => `<a class="site-card" href="${escape(base + urlPath(site.path) + '/')}"><span class="card-top"><span class="category">${escape(site.path.includes('/') ? dirname(site.path) : 'Practice')}</span><span class="number">${String(index + 1).padStart(2, '0')}</span></span><h2>${escape(site.title)}</h2><p>${escape(site.description)}</p><span class="card-bottom"><span>Open & explore</span><span aria-hidden="true">↗</span></span></a>`).join('\n');
  const folders = [...groups].filter(path => path && dirname(path) === (group || '.')).map(path => `<a class="folder" href="${escape(base + urlPath(path) + '/')}">${escape(path.split('/').at(-1))}<span aria-hidden="true"> ↗</span></a>`).join('');
  const values = { TITLE: group ? `${escape(group)} · Learning library` : 'Learning library', HEADING: group ? escape(group.split('/').at(-1)) : 'A place to<br><em>figure things out.</em>', INTRO: group ? `Explore the interactive guides in ${escape(group)}.` : 'Interactive guides, small experiments, and a little room to practice. Pick something you’re curious about.', BASE: escape(base), COUNT: String(members.length), CARDS: cards, FOLDERS: folders, BREADCRUMB: group ? `<a class="back-link" href="${escape(base)}">← All learning sites</a>` : '<span class="eyebrow">YOUR PERSONAL LEARNING LIBRARY</span>' };
  const html = template.replace(/\{\{([A-Z]+)\}\}/g, (_, key) => values[key] ?? '');
  await mkdir(join(output, group), { recursive: true });
  await writeFile(join(output, group, 'index.html'), html);
}
await cp(join(root, 'website/styles.css'), join(output, 'styles.css'));
await writeFile(join(output, '.nojekyll'), '');
await writeFile(join(output, 'sites.json'), JSON.stringify({ base, sites: sites.map(({ folder, ...site }) => site) }, null, 2) + '\n');
await writeFile(join(output, '404.html'), `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Page not found</title><link rel="stylesheet" href="${escape(base)}styles.css"><main class="wrap"><h1>That page isn’t here.</h1><p><a href="${escape(base)}">Return to the learning library →</a></p></main></html>`);
console.log(`\nBuilt ${sites.length} sites into _site/ at ${base}`);
