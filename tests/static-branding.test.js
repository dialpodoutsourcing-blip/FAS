const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
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

const logo = fs.readFileSync(path.join(root, 'assets/images/fas-monogram.svg'), 'utf8');
assert.match(logo, /<svg[^>]+viewBox="0 0 120 72"[^>]+role="img"/);
assert.match(logo, /<title[^>]*>FAS/);
assert.match(logo, /linearGradient[^>]+id="fas-gold"/);
assert.match(logo, /#E5D9CB/i, 'logo includes an ivory detail');
assert.match(logo, /<path\b/, 'logo uses geometric paths');
assert.doesNotMatch(logo, /<text\b/, 'logo does not depend on font glyphs');

const dashboard = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert.match(dashboard, /class="dashboard-progress"/, 'dashboard uses the compact current-step banner');
assert.doesNotMatch(dashboard, /class="hero"/, 'dashboard does not regress to the tall ADAM hero');
assert.match(dashboard, /class="[^"]*\bresume-cta\b[^"]*"/);
assert.match(dashboard, /class="resume-cta__default">Continue to step 2<\//);
assert.match(dashboard, /class="resume-cta__hover" aria-hidden="true">Resume with EXTRACT<\//);

const styles = fs.readFileSync(path.join(root, 'assets/css/styles.css'), 'utf8');
assert.match(styles, /\.dashboard-progress__layout\s*\{[^}]*padding:\s*18px 30px 16px 24px/s, 'compact banner keeps its bounded desktop padding');
assert.match(styles, /\.resume-cta:hover \.resume-cta__default/);
assert.match(styles, /\.resume-cta:focus-visible \.resume-cta__default/);
assert.match(styles, /\.resume-cta:hover \.resume-cta__hover/);
assert.match(styles, /\.resume-cta:focus-visible \.resume-cta__hover/);

console.log('Static branding and resume CTA checks passed.');
