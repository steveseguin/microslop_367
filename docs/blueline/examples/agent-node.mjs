// Drive a Blueline tab from Node over a VDO.Ninja data channel.
//
//   npm i @vdoninja/sdk @roamhq/wrtc ws
//   node agent-node.mjs <room> [blueline-peer-id] [password]
//
// In Blueline: AI → pick "Custom" (or "VDO.Ninja MCP" and leave the password empty here) → Connect.
// Use the room and peer id shown in the panel. "false" as the password means no room password (the ninja-p2p preset).
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const VDONinjaSDK = require('@vdoninja/sdk/node');

const [room, target = 'blueline', pw] = process.argv.slice(2);
if (!room) { console.error('usage: node agent-node.mjs <room> [blueline-peer-id] [password]'); process.exit(1); }
const password = pw === undefined || pw === '' ? undefined : pw === 'false' ? false : pw;

const sdk = new VDONinjaSDK({ host: 'wss://wss.vdo.ninja', salt: 'vdo.ninja' });
await sdk.connect();
await sdk.joinRoom(password === undefined ? { room } : { room, password });
await sdk.announce({ streamID: 'node_agent_' + Math.random().toString(36).slice(2, 8) });

// Wait for the data channel to Blueline.
const uuid = await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error(`no data channel to "${target}" after 20 s — check room, password and peer id`)), 20000);
  sdk.addEventListener('dataChannelOpen', e => { clearTimeout(t); resolve(e.detail.uuid); });
  sdk.view(target, { audio: false, video: false });
});

const call = (tool, args = {}) => sdk.request(tool, args, uuid, 20000);

const caps = await call('get_capabilities');
console.log(`connected to Blueline ${caps.version}: ${caps.tools.length} tools`);

const doc = await call('get_document');
console.log('file:', doc.file, '· pages:', doc.pages.map(p => p.name).join(', '));

const { outline } = await call('get_tree', { depth: 2, format: 'outline' });
console.log(outline);

// Build a card in one undo step, then point the designer at it.
const { results } = await call('batch', {
  label: 'Card from Node agent',
  steps: [
    { tool: 'create', args: { spec: {
      type: 'frame', name: 'Agent card', x: 1000, y: 0, w: 320, fill: '#FFFFFF', radius: 16,
      layout: { mode: 'column', gap: 10, padding: 20 },
      effects: [{ type: 'drop-shadow', y: 6, blur: 18, color: '#1B243014' }],
      children: [
        { type: 'text', name: 'Title', text: 'Made by a Node agent', font: { size: 20, weight: 700 }, color: '#1B2430' },
        { type: 'text', name: 'Body', text: 'Over a VDO.Ninja data channel — no server of our own.', font: { size: 14 }, color: '#5B6573', sizing: { w: 'fill' } },
      ],
    } } },
    { tool: 'select', args: { ids: ['$0'], zoom: true } },
    { tool: 'notify', args: { message: 'Added "Agent card" on the right.' } },
  ],
});
const cardId = results[0].id;

const shot = await call('screenshot', { target: cardId, max_size: 640, format: 'png' });
writeFileSync('agent-card.png', Buffer.from(shot.base64, 'base64'));
console.log(`saved agent-card.png (${shot.width}×${shot.height})`);

const { html } = await call('export', { format: 'html', ids: [cardId] });
writeFileSync('agent-card.html', html);
console.log('saved agent-card.html');

sdk.disconnect();
process.exit(0);
