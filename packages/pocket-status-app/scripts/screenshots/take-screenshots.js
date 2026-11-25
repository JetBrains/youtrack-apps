// Renders the built widgets with a mocked YouTrack host and saves the screenshots
// for JetBrains Marketplace and the README to `screenshots/`.
// Playwright is not a dependency. Install it first: npm install --no-save playwright && npx playwright install chromium
// Run: npm run screenshots (builds the app first when `dist` is missing)
import {chromium} from 'playwright';
import {dirname, extname, join, resolve} from 'node:path';
import {existsSync, mkdirSync} from 'node:fs';
import {readFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const DIST = join(REPO, 'dist');
const OUTPUT = join(REPO, 'screenshots');

if (!existsSync(join(DIST, 'widgets/pocket-status/index.html'))) {
  console.log('Building app...');
  execFileSync('npm', ['run', 'build'], {cwd: REPO, stdio: 'inherit'});
}
mkdirSync(OUTPUT, {recursive: true});

// ─── Mock data ────────────────────────────────────────────────────────────────

const v = (name, color, textColor) => ({name, color, textColor});

const WORKFLOW = {
  name: 'Workflow',
  values: [v('To do', '#C9CCD6', '#27282E'), v('In progress', '#FED277', '#734803'), v('Review', '#A2BEF8', '#203C72'), v('Done', '#1F8039', '#E3F7E7')]
};
const APPROVAL = {
  name: 'Approval',
  values: [v('Not started', '#f7f8fa', '#27282e'), v('Needs changes', '#FCC3E2', '#C01173'), v('Approved', '#C0E3C8', '#1a5b2c')]
};
const RISK = {
  name: 'Risk',
  values: [v('Low', '#B6E5E7', '#096a6e'), v('Medium', '#E56D17', '#351706'), v('High', '#DB3B4B', '#fff')]
};
const PROJECT_SETS = [WORKFLOW, APPROVAL, RISK];
const MY_SETS = [
  {name: 'My focus', values: [v('Today', '#3574F0', '#FFF'), v('This week', '#D0DFFC', '#27498A'), v('Later', '#EBDCAB', '#514931')]},
  {name: 'Code review', values: [v('Waiting', '#F477BD', '#62073A'), v('Reviewing', '#7BCCCF', '#053537'), v('Merged', '#208A3C', '#fff')]}
];

const STATES = [
  {name: 'Open', color: {id: '21', background: '#D0DFFC', foreground: '#27498A'}},
  {name: 'In Progress', color: {id: '18', background: '#FED277', foreground: '#734803'}},
  {name: 'Fixed', color: {id: '17', background: '#C0E3C8', foreground: '#1a5b2c'}},
  {name: 'Verified', color: {id: '3', background: '#1F8039', foreground: '#E3F7E7'}}
];
const PRIORITIES = [
  {name: 'Critical', color: {id: '20', background: '#DB3B4B', foreground: '#fff'}},
  {name: 'Major', color: {id: '11', background: '#E56D17', foreground: '#351706'}},
  {name: 'Normal', color: {id: '27', background: '#C9CCD6', foreground: '#27282E'}}
];

const mkIssue = (id, summary, state, priority) => ({
  id: `2-${id.split('-')[1]}`,
  idReadable: id,
  summary,
  project: {id: '0-1'},
  customFields: [
    {id: 'f1', name: 'State', $type: 'StateIssueCustomField', value: STATES.find(s => s.name === state), projectCustomField: {isPublic: true, bundle: {values: STATES}}},
    {id: 'f2', name: 'Priority', $type: 'SingleEnumIssueCustomField', value: PRIORITIES.find(p => p.name === priority), projectCustomField: {isPublic: true, bundle: {values: PRIORITIES}}}
  ]
});

const ISSUES = Object.fromEntries([
  mkIssue('MOB-101', 'Saved cards are not shown after sign-in', 'Fixed', 'Critical'),
  mkIssue('MOB-108', 'Apple Pay button overlaps the total on small screens', 'In Progress', 'Major'),
  mkIssue('MOB-112', 'Add address autocomplete to the shipping step', 'Open', 'Normal'),
  mkIssue('MOB-117', 'Track checkout drop-off in analytics', 'Verified', 'Normal')
].map(issue => [issue.idReadable, issue]));

// Runs in every frame. Each widget iframe reads its own config from the URL hash.
const MOCK = /* js */`(() => {
  const DATA = ${JSON.stringify({PROJECT_SETS, MY_SETS, ISSUES})};
  const params = new URLSearchParams(location.hash.slice(1));
  const cfg = params.get('cfg') ? JSON.parse(params.get('cfg')) : null;
  const open = params.get('open');
  const sets = (list, canEdit) => ({sets: JSON.stringify({sets: list}), canEdit, issueTracking: true});
  const fetchYouTrack = async (path) => {
    const issueId = path.match(/^issues\\/([^/]+)$/)?.[1];
    if (issueId) {
      return DATA.ISSUES[decodeURIComponent(issueId)] ?? {project: {id: '0-1'}};
    }
    if (path.startsWith('admin/projects/')) { return sets(DATA.PROJECT_SETS, true); }
    if (path.startsWith('users/')) { return sets(DATA.MY_SETS, true); }
    if (path === 'permissions/cache') { return [{global: true, permission: {key: 'JetBrains.YouTrack.UPDATE_ISSUE'}}]; }
    return {};
  };
  const noop = async () => {};
  window.YTApp = {
    locale: 'en',
    baseUrl: 'https://youtrack.example.com/api',
    me: {id: '1-1', login: 'alex', name: 'Alex'},
    entity: JSON.parse(params.get('entity') ?? '{"id":"2-1","type":"issue"}'),
    register: async (appApi) => {
      if (open === 'config') { setTimeout(() => appApi?.onConfigure?.(), 300); }
      return {
        fetchYouTrack, fetchApp: fetchYouTrack,
        readConfig: async () => cfg, storeConfig: noop, readCache: async () => null, storeCache: noop,
        enterConfigMode: noop, exitConfigMode: noop, enterModalMode: noop, exitModalMode: noop,
        setTitle: noop, setLoadingAnimationEnabled: noop, setError: noop, clearError: noop,
        alert: () => {}, collapse: () => {}, closeWidget: () => {}, removeWidget: () => {}
      };
    }
  };
})();`;

// ─── Host pages: a plain issue, article and project page around the widget iframes ──

const status = (set, name) => {
  const value = set.values.find(item => item.name === name);
  return {isConfigured: true, key: set.name, name, backgroundColor: value.color, textColor: value.textColor};
};
const widgetUrl = (path, hash) => `/widgets/${path}/index.html#${new URLSearchParams(hash)}`;
// The host gives a MARKDOWN widget a fixed size; the tag sits at the left of its frame
const tag = (set, name) => `<iframe class="inline" style="width:${Math.ceil(name.length * 7.2) + 28}px"
  src="${widgetUrl('pocket-status', {editable: 'true', cfg: JSON.stringify(status(set, name))})}"></iframe>`;
const tracked = (issueId, fieldName = 'State') => `<iframe class="inline" style="width:480px"
  src="${widgetUrl('pocket-status', {editable: 'true', cfg: JSON.stringify({isConfigured: true, issueId, fieldName})})}"></iframe>`;

const CSS = `
  * { box-sizing: border-box; }
  body { margin: 0; min-height: 100vh;
    /* The soft gradient of the screenshots in the other app repositories */
    background: radial-gradient(circle at 0 0, rgba(216,180,254,.45), transparent 45%), radial-gradient(circle at 100% 100%, rgba(249,168,212,.35), transparent 45%),
      radial-gradient(circle at 85% 30%, rgba(147,197,253,.22), transparent 40%), #f8f6ff; color: #1f2326; font: 14px/20px system-ui, -apple-system, sans-serif; -webkit-font-smoothing: antialiased; }
  .page { padding: 32px 48px; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; }
  /* Issue and article pages are short, so they are zoomed to fill the 1280 × 800 frame */
  .zoom { zoom: 1.3; }
  .card { background: #fff; border-radius: 12px; padding: 28px 36px 32px; box-shadow: 0 0 0 1px rgba(0,0,0,.06), 0 8px 32px rgba(80,40,120,.12); }
  .crumbs { color: #737577; font-size: 13px; }
  .card-head { display: flex; align-items: center; justify-content: space-between; }
  .brand { display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 15px; }
  .brand img { width: 24px; height: 24px; }
  h1 { font-size: 24px; line-height: 32px; margin: 4px 0 16px; letter-spacing: -.01em; }
  h2 { font-size: 16px; margin: 24px 0 8px; }
  p { margin: 0 0 12px; }
  iframe { border: 0; display: block; }
  iframe.inline { display: inline-block; height: 27px; vertical-align: middle; }
  table { border-collapse: collapse; width: 100%; margin-top: 8px; }
  th, td { text-align: left; padding: 6px 12px; border: 1px solid #dfe5eb; }
  th { background: #f7f8fa; font-weight: 600; }
  .muted { color: #737577; }
  .overlay { position: fixed; inset: 0; background: rgba(31,35,38,.45); display: grid; place-items: center; }
  .dialog { background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 12px 48px rgba(0,0,0,.25); }
  .dialog-head { padding: 16px 24px 0; font-weight: 600; font-size: 16px; }
  /* Project page, laid out after the YouTrack project page: icon rail, project menu, top bar */
  .app { display: flex; height: calc(100vh - 64px); margin: 32px 48px; border-radius: 12px; overflow: hidden; background: #fff; font-size: 13px; box-shadow: 0 0 0 1px rgba(0,0,0,.06), 0 8px 32px rgba(80,40,120,.12); }
  .rail { width: 48px; flex-shrink: 0; display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 10px 0; background: #1f2326; color: #b4b8bf; }
  .rail svg { width: 18px; height: 18px; }
  .rail i { width: 32px; height: 32px; border-radius: 6px; display: grid; place-items: center; }
  .rail .active { background: #3b3f46; color: #fff; }
  .rail .mark { width: 28px; height: 28px; margin-bottom: 14px; border-radius: 7px; background: linear-gradient(135deg, #3574F0, #C01173); }
  .rail .spacer { flex: 1; }
  .rail .avatar { width: 24px; height: 24px; border-radius: 50%; background: #5fb878; color: #fff; font: 600 10px/24px system-ui; text-align: center; }
  .body { flex: 1; min-width: 0; display: flex; flex-direction: column; }
  .topbar { height: 38px; flex-shrink: 0; display: flex; align-items: center; gap: 8px; padding: 0 18px; border-bottom: 1px solid #e8eaed; color: #5d6066; }
  .topbar .current { color: #1f2326; }
  .columns { flex: 1; display: flex; min-height: 0; }
  .project-menu { width: 200px; flex-shrink: 0; display: flex; flex-direction: column; padding: 12px 10px; border-right: 1px solid #e8eaed; }
  .project-card { display: flex; gap: 8px; align-items: center; padding: 0 8px 14px; }
  .project-card b { display: block; color: #1f2326; }
  .project-card small { color: #737577; font-size: 11px; }
  .project-avatar { width: 32px; height: 32px; border-radius: 4px; background: #1f2326; color: #4fd1c5; font: 600 10px/32px system-ui; text-align: center; box-shadow: inset 0 -3px 0 #4fd1c5; }
  .menu-item { display: flex; align-items: center; gap: 4px; height: 26px; white-space: nowrap; padding: 0 8px; border-radius: 4px; color: #1f2326; }
  .menu-item svg { width: 14px; height: 14px; color: #5d6066; }
  .menu-item.active { background: #e9effc; }
  .content { flex: 1; min-width: 0; display: flex; }
  .content iframe { flex: 1; }
`;
// Icons of the project page, from the Ring UI icon set
const ICONS = Object.fromEntries(await Promise.all(
  ['ok', 'table', 'analytics', 'project', 'article', 'bars', 'time', 'folder', 'add', 'settings', 'help', 'bell', 'double-chevron-right']
    .map(async name => [name, await readFile(join(REPO, `node_modules/@jetbrains/icons/${name}-20px.svg`), 'utf8')])
));
const RAIL_ICONS = ['ok', 'table', 'analytics', 'project', 'article', 'bars', 'time'];
const railIcon = (name, active) => `<i${name === active ? ' class="active"' : ''}>${ICONS[name]}</i>`;
const rail = active => `<nav class="rail"><div class="mark"></div>${RAIL_ICONS.map(name => railIcon(name, active)).join('')}
  <div class="spacer"></div>${['add', 'settings', 'help', 'bell'].map(name => railIcon(name)).join('')}<div class="avatar">AL</div>${railIcon('double-chevron-right')}</nav>`;
const menuItem = label => `<div class="menu-item">${label}</div>`;


const LOGO = `data:image/svg+xml;base64,${(await readFile(join(REPO, 'src/pocket-status-icon.svg'))).toString('base64')}`;

const page = body => `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>${CSS}</style></head><body>${body}</body></html>`;

// A YouTrack page with a side menu that ends with the Pocket Status tab, which shows the sets widget of the entity
const tabPage = ({crumbs, current, menuHead = '', menu, entity, activeRail}) => page(`<div class="app">${rail(activeRail)}<div class="body">
  <header class="topbar">${crumbs} <span>/</span><span class="current">${current}</span></header>
  <div class="columns"><aside class="project-menu">${menuHead}${menu.map(menuItem).join('')}
    <div class="menu-item active">${ICONS.folder}Pocket Status</div></aside>
    <main class="content"><iframe src="${widgetUrl('pocket-status-settings', {entity: JSON.stringify(entity)})}"></iframe></main>
  </div>
</div></div>`);

const ISSUE_TABLE = `
  <div class="card-head">
    <div class="crumbs">Mobile App / MOB-96</div>
    <div class="brand"><img src="${LOGO}" alt="">Pocket Status</div>
  </div>
  <h1>Checkout redesign: release readiness</h1>
  <p>Readiness of each part of the new checkout for release 2026.3. Overall: ${tag(WORKFLOW, 'In progress')}</p>
  <p class="muted">Click a tag to move it to the next status. The table stays up to date without extra fields or issues.</p>
  <table>
    <tr><th>Area</th><th>Owner</th><th>Design</th><th>Development</th><th>QA</th><th>Risk</th></tr>
    <tr><td>Cart summary</td><td>Dana Ivers</td><td>${tag(APPROVAL, 'Approved')}</td><td>${tag(WORKFLOW, 'Done')}</td><td>${tag(WORKFLOW, 'Done')}</td><td>${tag(RISK, 'Low')}</td></tr>
    <tr><td>Payment form</td><td>Sam Ortega</td><td>${tag(APPROVAL, 'Approved')}</td><td>${tag(WORKFLOW, 'Review')}</td><td>${tag(WORKFLOW, 'In progress')}</td><td>${tag(RISK, 'Medium')}</td></tr>
    <tr><td>Shipping address</td><td>Lee Park</td><td>${tag(APPROVAL, 'Needs changes')}</td><td>${tag(WORKFLOW, 'In progress')}</td><td>${tag(WORKFLOW, 'To do')}</td><td>${tag(RISK, 'High')}</td></tr>
    <tr><td>Order confirmation</td><td>Kim Novak</td><td>${tag(APPROVAL, 'Not started')}</td><td>${tag(WORKFLOW, 'To do')}</td><td>${tag(WORKFLOW, 'To do')}</td><td>${tag(RISK, 'Low')}</td></tr>
  </table>`;

const PAGES = {
  'issue-table': page(`<div class="page"><div class="card zoom">${ISSUE_TABLE}</div></div>`),
  'tracked-issues': page(`<div class="page"><div class="card zoom">
    <div class="crumbs">Knowledge Base / Mobile App</div>
    <h1>Release 2026.3 checklist</h1>
    <p>Each row shows the live State of an issue. The tag changes when the issue changes, and a click on it sets a new value.</p>
    <table>
      <tr><th>Blocker</th><th>Owner</th><th>Sign-off</th></tr>
      <tr><td>${tracked('MOB-101')}</td><td>Dana Ivers</td><td>${tag(APPROVAL, 'Approved')}</td></tr>
      <tr><td>${tracked('MOB-108')}</td><td>Sam Ortega</td><td>${tag(APPROVAL, 'Needs changes')}</td></tr>
      <tr><td>${tracked('MOB-112')}</td><td>Lee Park</td><td>${tag(APPROVAL, 'Not started')}</td></tr>
      <tr><td>${tracked('MOB-117')}</td><td>Kim Novak</td><td>${tag(APPROVAL, 'Approved')}</td></tr>
    </table>
    <h2>Notes</h2>
    <p>Payment provider contract renewed ${tag(MY_SETS[0], 'This week')} &nbsp; Store listing screenshots ${tag(MY_SETS[0], 'Today')}</p>
  </div></div>`),
  'config-dialog': page(`<div class="page"><div class="card">${ISSUE_TABLE}</div></div>
    <div class="overlay"><div class="dialog">
      <div class="dialog-head">Pocket Status</div>
      <iframe style="width:560px;height:330px" src="${widgetUrl('pocket-status', {editable: 'true', open: 'config', cfg: JSON.stringify(status(WORKFLOW, 'Review'))})}"></iframe>
    </div></div>`),
  'project-sets': tabPage({
    crumbs: '← Projects',
    current: 'Mobile App',
    menuHead: '<div class="project-card"><div class="project-avatar">MOB</div><div><b>Mobile App</b><small>MOB</small></div></div>',
    menu: ['Issues', 'Agile Boards', 'Gantt Charts', 'Knowledge Base', 'Settings'],
    entity: {id: '0-1', type: 'project'},
    activeRail: 'project'
  }),
  'my-sets': tabPage({
    crumbs: 'Users',
    current: 'alex',
    menu: ['General', 'Workspace', 'Tags and Saved Searches', 'Comment Templates', 'Notifications', 'Account Security', 'Groups', 'Roles'],
    entity: {id: '1-1', type: 'user'}
  })
};

// ─── Local HTTP server: serves `dist` and the host pages ─────────────────────

const MIME = {'.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json'};
const server = createServer(async (req, res) => {
  const path = req.url.split('?')[0].replace(/\.\./g, '');
  const hostPage = PAGES[path.slice(1)];
  if (hostPage) {
    res.writeHead(200, {'Content-Type': MIME['.html']});
    res.end(hostPage);
    return;
  }
  try {
    const data = await readFile(join(DIST, path));
    res.writeHead(200, {'Content-Type': MIME[extname(path)] ?? 'application/octet-stream'});
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
});
await new Promise(done => server.listen(4322, '127.0.0.1', done));

// ─── Screenshot engine ────────────────────────────────────────────────────────

const browser = await chromium.launch({channel: 'chrome'});

async function shot(outFile, pageName, {selector, prepare, viewport = {width: 1280, height: 800}} = {}) {
  // deviceScaleFactor 2 gives retina output: 2560 × 1600 for the default viewport
  const context = await browser.newContext({deviceScaleFactor: 2, viewport, reducedMotion: 'reduce'});
  await context.addInitScript({content: MOCK});
  const tab = await context.newPage();
  await tab.goto(`http://127.0.0.1:4322/${pageName}`);
  // Every widget frame has rendered its content: a tag, a tracked issue, a dialog or the sets
  for (const frame of tab.frames().slice(1)) {
    await frame.waitForSelector('.ring-tag-tag, .settings, .widget .section', {timeout: 15000});
  }
  if (prepare) {
    await prepare(tab);
  }
  await tab.waitForTimeout(400);
  const target = selector ? tab.locator(selector) : tab;
  await target.screenshot({path: join(OUTPUT, outFile)});
  await context.close();
  console.log(`✓ ${outFile}`);
}

await shot('marketplace-01-status-table.png', 'issue-table');
await shot('marketplace-02-tracked-issues.png', 'tracked-issues');
await shot('marketplace-03-config-dialog.png', 'config-dialog', {
  prepare: tab => tab.frames().find(frame => frame.url().includes('open=config')).waitForSelector('.tag-current')
});
await shot('marketplace-04-project-sets.png', 'project-sets');
await shot('marketplace-05-my-sets.png', 'my-sets');
// README preview: the issue card on the background, without the empty space of the 800px frame
await shot('preview.png', 'issue-table', {viewport: {width: 1280, height: 600}});

await browser.close();
server.close();
