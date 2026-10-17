const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const vault = fs.readFileSync(path.join(root, 'vault.html'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'assets/css/styles.css'), 'utf8');
const generator = fs.readFileSync(path.join(root, 'tools/generate_demo_pdfs.py'), 'utf8');
const agents = ['anchor', 'extract', 'radar', 'forge', 'architect', 'voice', 'launch'];

assert.match(vault, /Demo vault complete/, 'vault announces the completed demo state');
assert.doesNotMatch(vault, /status--empty|status--draft/, 'demo vault contains no unfinished assets');
assert.doesNotMatch(vault, /\[(?:Name|Years|Buyer|Current state|Desired state|Objections|Promise|Tone|Outcome|Phases|Core claim|Copy packs|Milestones)\]/, 'demo content has no legacy placeholders');

for (const agent of agents) {
  assert.match(vault, new RegExp(`id="panel-${agent}"`), `${agent} has its own vault document`);
  assert.match(vault, new RegExp(`href="chat\\.html\\?agent=${agent}"[^>]*>[^<]*(?:<[^>]+>[^<]*</[^>]+>[^<]*)*Edit with`, 's'), `${agent} has an edit route`);
  assert.match(vault, new RegExp(`href="assets/pdfs/fas-${agent}-demo\\.pdf"[^>]*target="_blank"[^>]*rel="noopener"`), `${agent} PDF opens safely in a new tab`);
  assert.match(vault, new RegExp(`href="chat\\.html\\?agent=${agent}"(?![^>]*target=)`), `${agent} edit route remains in the current tab`);
  const pdfPath = path.join(root, 'assets', 'pdfs', `fas-${agent}-demo.pdf`);
  assert.ok(fs.existsSync(pdfPath), `${agent} PDF exists`);
  const pdf = fs.readFileSync(pdfPath);
  assert.equal(pdf.subarray(0, 5).toString(), '%PDF-', `${agent} download is a real PDF`);
  const pages = pdf.toString('latin1').match(/\/Type \/Page\b/g) || [];
  assert.ok(pages.length >= 8, `${agent} PDF contains at least eight substantive pages`);
  assert.ok(pdf.length > 20000, `${agent} PDF contains expanded text and visual content`);
}

const portfolioPath = path.join(root, 'assets', 'pdfs', 'fas-complete-blueprint-demo.pdf');
assert.match(vault, /href="assets\/pdfs\/fas-complete-blueprint-demo\.pdf"[^>]*target="_blank"[^>]*rel="noopener"/, 'combined portfolio opens safely in a new tab');
assert.ok(fs.existsSync(portfolioPath), 'combined portfolio PDF exists');
const portfolio = fs.readFileSync(portfolioPath);
assert.ok((portfolio.toString('latin1').match(/\/Type \/Page\b/g) || []).length >= 56, 'combined portfolio contains the full expanded blueprint');
assert.ok(portfolio.length > 140000, 'combined portfolio includes substantial text and visual content');

assert.match(generator, /name="DocTitle"[^\n]*textColor=INK/, 'light cover uses a high-contrast dark title');
assert.match(generator, /class StrategyMatrix/, 'PDFs contain strategy-matrix visuals');
assert.match(generator, /class SignalChart/, 'PDFs contain data visualization');
assert.match(generator, /class TimelineDiagram/, 'PDFs contain implementation timelines');
['Decision rationale', 'Evidence and assumptions', 'Risks and safeguards', 'Recommended next actions'].forEach(section => {
  assert.ok(generator.includes(section), `PDF generator includes ${section} context`);
});

assert.match(styles, /\.vault-asset__preview/, 'vault assets include visual previews');
assert.match(styles, /\.vault-metric/, 'vault assets include designed metrics');
assert.match(styles, /\.vault-actions/, 'vault assets include consistent controls');

console.log('Static vault demo and PDF checks passed.');
