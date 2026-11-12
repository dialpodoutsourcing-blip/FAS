const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
assert.ok(pkg.devDependencies&&pkg.devDependencies['playwright-core'], 'browser geometry dependency is declared by the repository');
const geometryTest = fs.readFileSync(path.join(root, 'tests/dashboard-geometry.test.js'), 'utf8');
assert.doesNotMatch(geometryTest, /C:\/vibec\/review\/node_modules/, 'geometry tests never import from another checkout');
const pages = ['index.html', 'chat.html', 'review.html', 'vault.html', 'launch.html'];

for (const page of pages) {
  const html = fs.readFileSync(path.join(root, page), 'utf8');

  assert.match(html, /<title>[^<]+ · FAS<\/title>/, `${page} title should use FAS`);
  const logos = html.match(/<img class="brand__mark" src="assets\/images\/fas-monogram\.svg"[^>]*>/g) || [];
  assert.equal(logos.length, 2, `${page} should use the premium logo in desktop and mobile navigation`);
  assert.match(logos[0], /alt="FAS"/, `${page} mobile logo should have an accessible name`);
  assert.match(logos[1], /alt=""/, `${page} desktop logo should defer to the adjacent expanded name`);
  assert.doesNotMatch(html, /brand__letter/, `${page} should not retain the temporary letter logo`);
}

const dashboardRef = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
for (const artwork of ['dashboard-anchor-platform.png', 'dashboard-extract-platform.png']) {
  assert.match(dashboardRef, new RegExp(`assets/images/${artwork.replace('.', '\\.')}`), `${artwork} is rendered by the dashboard`);
  const artworkPath = path.join(root, 'assets', 'images', artwork);
  assert.ok(fs.existsSync(artworkPath), `${artwork} exists in source assets`);
  assert.ok(fs.statSync(artworkPath).size > 1000, `${artwork} contains production artwork`);
}
assert.match(dashboardRef,/home-focus__landscape/, 'dashboard includes a decorative landscape layer');
assert.match(dashboardRef,/home-roadmap-card--gold/, 'Anchor uses the gold roadmap treatment');
assert.match(dashboardRef,/home-roadmap-card--emerald/, 'Extract uses the emerald roadmap treatment');
assert.match(dashboardRef,/data-account-name/, 'dashboard identity remains data-driven');
assert.match(dashboardRef,/class="eyebrow home-hero__eyebrow"/, 'dashboard header uses its reference eyebrow treatment');
assert.match(dashboardRef,/class="home-hero__controls"[\s\S]*class="home-system-pill"[\s\S]*class="home-account-link"/, 'dashboard status controls match their visual selectors');
assert.match(dashboardRef,/class="resume-cta__label"[\s\S]*class="resume-cta__default"[\s\S]*class="resume-cta__hover"/, 'resume labels share the animated overlay wrapper');
assert.match(dashboardRef,/class="home-sidebar__signout"[^>]*data-account-signout/, 'dashboard sidebar exposes the dedicated Sign Out control');
assert.match(dashboardRef,/class="home-hero__artwork"[^>]*aria-hidden="true"/, 'dashboard includes a non-interactive hero artwork layer');
assert.match(dashboardRef,/class="home-encouragement__icon"[^>]*aria-hidden="true"/, 'encouragement panel uses the reference chart icon hook');
assert.match(dashboardRef,/class="home-encouragement__flourish"[^>]*aria-hidden="true"/, 'encouragement panel exposes its decorative lower flourish');
assert.match(dashboardRef,/class="home-sidebar__atmosphere"[^>]*aria-hidden="true"/, 'sidebar footer exposes an inaccessible atmospheric flourish');
assert.match(dashboardRef,/class="home-sidebar__lockup"[\s\S]*class="home-sidebar__lockup-mark"[^>]*aria-hidden="true"[\s\S]*class="home-sidebar__lockup-word">FAS/, 'dashboard uses one native non-overlapping A and FAS lockup');
assert.match(dashboardRef,/class="home-sidebar__account-shell"[\s\S]*class="user home-sidebar__account"[\s\S]*class="home-sidebar__signout"/, 'profile and Sign Out share one account shell');
assert.equal((dashboardRef.match(/class="home-roadmap-card__haze" aria-hidden="true"/g)||[]).length,2,'both cards expose contained smoke layers');
assert.equal((dashboardRef.match(/class="step-link__subtitle"/g)||[]).length,2,'visible specialists use reference subtitles');
assert.equal((dashboardRef.match(/class="step-link__chevron" aria-hidden="true"/g)||[]).length,2,'visible specialists use reference chevrons');
assert.doesNotMatch(dashboardRef,/class="step-link__action-label"/,'reference sidebar has no Review or Locked status column');
assert.match(dashboardRef,/class="resume-cta__arrow"[^>]*aria-hidden="true"/, 'focus CTA exposes a dedicated arrow detail');
assert.match(dashboardRef,/class="home-focus__details"[\s\S]*class="home-focus__chevron"[^>]*aria-hidden="true"/, 'focus detail link exposes its underline and chevron hooks');

const logo = fs.readFileSync(path.join(root, 'assets/images/fas-monogram.svg'), 'utf8');
assert.match(logo, /<svg[^>]+viewBox="0 0 120 72"[^>]+role="img"/);
assert.match(logo, /<title[^>]*>FAS/);
assert.match(logo, /linearGradient[^>]+id="fas-gold"/);
assert.match(logo, /#E5D9CB/i, 'logo includes an ivory detail');
assert.match(logo, /<path\b/, 'logo uses geometric paths');
assert.doesNotMatch(logo, /<text\b/, 'logo does not depend on font glyphs');

const dashboard = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert.match(dashboard, /Welcome Back, <span data-account-name>/, 'dashboard greeting matches the reference capitalization and uses the authenticated customer name');
assert.match(dashboard, /assets\/js\/dashboard\.js/, 'dashboard loads live customer progress');
assert.match(dashboard, /class="[^"]*\bdashboard-progress\b[^"]*"/, 'dashboard uses the compact current-step banner');
assert.doesNotMatch(dashboard, /class="hero"/, 'dashboard does not regress to the tall ADAM hero');
assert.match(dashboard, /class="[^"]*\bresume-cta\b[^"]*"/);
assert.match(dashboard, /class="resume-cta__default" data-dashboard-action>Continue to step 2<\//);
assert.match(dashboard, /class="resume-cta__hover" data-dashboard-hover aria-hidden="true">Resume with EXTRACT<\//);

const styles = fs.readFileSync(path.join(root, 'assets/css/styles.css'), 'utf8');
assert.match(styles, /\.dashboard-progress__layout\s*\{[^}]*padding:\s*18px 30px 16px 24px/s, 'compact banner keeps its bounded desktop padding');
assert.match(styles, /\.resume-cta:hover \.resume-cta__default/);
assert.match(styles, /\.resume-cta:focus-visible \.resume-cta__default/);
assert.match(styles, /\.resume-cta:hover \.resume-cta__hover/);
assert.match(styles, /\.resume-cta:focus-visible \.resume-cta__hover/);
assert.match(styles, /body\[data-page="home"\][\s\S]*radial-gradient/, 'dashboard has the reference emerald and gold atmosphere');
assert.match(styles, /\.home-content\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s+minmax\(260px,\s*320px\)/s, 'dashboard uses the reference roadmap and utility split');
assert.match(styles, /\.home-roadmap-card--gold[\s\S]*\.home-roadmap-card--emerald/, 'dashboard cards retain distinct gold and emerald treatments');
assert.match(styles, /@media\s*\(max-width:\s*900px\)[\s\S]*\.home-content/, 'dashboard collapses cleanly for tablet and mobile');
assert.match(styles, /\.home-focus__action \.resume-cta\s*\{[^}]*width:\s*100%[^}]*min-width:\s*0/s, 'focus action cannot overflow its responsive column');
assert.match(styles, /@media\s*\(max-width:\s*1180px\)[\s\S]*\.home-content\s*\{[^}]*grid-template-columns:\s*1fr/s, 'utility rail collapses before roadmap cards become cramped');
assert.match(styles, /overflow-wrap:\s*anywhere/, 'long authenticated names remain contained');
assert.match(styles, /Dashboard pixel match v2/, 'dashboard uses the approved pixel-match stylesheet');
assert.match(styles, /body\[data-page="home"\] \.app\s*\{[^}]*grid-template-columns:\s*312px\s+minmax\(0,\s*1fr\)/s, 'desktop dashboard uses the reference sidebar width');
assert.match(styles, /body\[data-page="home"\][^}]*height:\s*100dvh/s, 'desktop dashboard is bounded to one viewport');
assert.match(styles, /\.home-roadmap-card__art img\s*\{[^}]*object-fit:\s*contain/s, 'generated scenes are fitted without cropping');
assert.match(styles,/\.home-roadmap-card--gold \.status--done\s*\{[^}]*background:\s*linear-gradient[^}]*color:\s*#0/s,'completed Anchor uses the reference filled gold pill');
assert.match(styles,/\.home-roadmap-card__haze::before\s*\{[^}]*clip-path:/s,'card haze includes a native mountain-smoke silhouette');
assert.match(styles, /@media\s*\(max-width:\s*1440px\)[\s\S]*@media\s*\(max-width:\s*1024px\)[\s\S]*@media\s*\(max-width:\s*768px\)/s, 'dashboard has explicit desktop, tablet, and mobile compaction points');

console.log('Static branding and resume CTA checks passed.');
