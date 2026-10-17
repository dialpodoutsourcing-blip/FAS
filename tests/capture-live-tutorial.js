const fs = require('node:fs');
const path = require('node:path');

const endpoint = process.argv[2] || 'http://127.0.0.1:9223';
const output = process.argv[3] || path.resolve('.superpowers/sdd/2026-10-17-live-guided-tutorial/parity-live-adam.png');
const advanceCount = Number(process.argv[4] || 5);

async function main() {
  const pages = await fetch(`${endpoint}/json/list`).then((response) => response.json());
  const page = pages.find((item) => item.type === 'page');
  if (!page) throw new Error('No Edge page target found');
  const socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once:true }); socket.addEventListener('error', reject, { once:true }); });
  let id = 0;
  const pending = new Map();
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) return;
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message)); else resolve(message.result);
  });
  function call(method, params = {}) {
    const requestId = ++id;
    socket.send(JSON.stringify({ id:requestId, method, params }));
    return new Promise((resolve, reject) => pending.set(requestId, { resolve, reject }));
  }
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  await call('Page.enable');
  await call('Runtime.evaluate', { expression:"document.querySelector('[data-tutorial-trigger]').click()" });
  await wait(1200);
  for (let step = 0; step < advanceCount; step += 1) {
    await call('Runtime.evaluate', { expression:"document.querySelector('[data-tour-next]').click()" });
    await wait(step === advanceCount - 1 ? 1600 : 250);
  }
  const shot = await call('Page.captureScreenshot', { format:'png', captureBeyondViewport:false });
  fs.writeFileSync(output, Buffer.from(shot.data, 'base64'));
  socket.close();
  console.log(output);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
