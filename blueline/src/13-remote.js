/* ============================================================
   Remote control transports + the AI panel.
   - window.blueline              in-page JS API (Playwright, extensions, console)
   - postMessage                  for a page that embeds Blueline (opt-in)
   - WebMCP                       document/navigator.modelContext tools (when the browser offers it)
   - VDO.Ninja SDK data channels  ninja-p2p command envelopes, SDK request/onRequest RPC,
                                  and JSON-RPC 2.0 (what the VDO.Ninja MCP's vdo_send carries)
   ============================================================ */
const SDK_URL = 'https://cdn.jsdelivr.net/npm/@vdoninja/sdk@1.6.1/vdoninja-sdk.min.js';
const RC = {
  sdk: null, status: 'off', error: '', mode: 'ninja-p2p', room: '', password: '', streamId: 'blueline', connectedAt: 0,
  identity: null, peers: new Map(), chat: [], instanceId: Math.random().toString(36).slice(2, 10), notifyEdits: true,
  embedAllowed: false, webmcp: 'unavailable', chunks: new Map(),
};
const PRESETS = {
  'ninja-p2p': { label: 'ninja-p2p sidecar', password: 'false', hint: 'Matches `ninja-p2p start` (no signaling password). Paste the room from `ninja-p2p room`.' },
  mcp: { label: 'VDO.Ninja MCP', password: '', hint: 'Matches `vdo_connect` from @vdoninja/mcp with its default password.' },
  custom: { label: 'Custom', password: null, hint: 'Your own room password. Every peer must use the same one.' },
};
const b64url = n => { const a = new Uint8Array(n); crypto.getRandomValues(a); return btoa(String.fromCharCode(...a)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
const newRoomName = () => 'blueline_' + Array.from(crypto.getRandomValues(new Uint8Array(12)), b => b.toString(16).padStart(2, '0')).join('');
function rcSettingsLoad() {
  const s = safeLS.get('blueline:ai', {});
  RC.mode = PRESETS[s.mode] ? s.mode : 'ninja-p2p'; RC.room = s.room || ''; RC.password = s.password ?? PRESETS[RC.mode].password ?? '';
  RC.streamId = s.streamId || 'blueline'; RC.notifyEdits = s.notifyEdits !== false; AI.readOnly = !!s.readOnly; RC.embedAllowed = !!s.embedAllowed;
  // a #ai-room=… fragment pre-fills the form; it never connects without a click
  const h = new URLSearchParams(location.hash.replace(/^#/, ''));
  if (h.get('ai-room')) { RC.room = h.get('ai-room'); if (h.get('ai-mode') && PRESETS[h.get('ai-mode')]) RC.mode = h.get('ai-mode'); if (h.has('ai-pass')) RC.password = h.get('ai-pass'); RC.fromLink = true; }
}
function rcSettingsSave() { safeLS.set('blueline:ai', { mode: RC.mode, room: RC.room, password: RC.password, streamId: RC.streamId, notifyEdits: RC.notifyEdits, readOnly: AI.readOnly, embedAllowed: RC.embedAllowed }); }
const pwValue = () => { const p = String(RC.password ?? '').trim(); return p.toLowerCase() === 'false' ? false : p === '' ? undefined : p; };

/* ---------- envelopes (ninja-p2p wire format) ---------- */
function envOut(type, payload, to) { return { v: 1, id: b64url(12), type, from: RC.identity, to: to || null, topic: null, ts: Date.now(), payload }; }
function rcSend(obj, uuid) { try { return RC.sdk && RC.sdk.sendData(obj, uuid ? { uuid } : undefined) !== false; } catch (e) { return false; } }
function rcProfile() {
  return {
    runtime: 'blueline-browser', provider: 'blueline', summary: `Blueline design editor with "${root().name}" open. Send commands named after its tools; start with get_capabilities.`,
    can: AI_TOOLS.map(t => t.name),
    asks: AI_TOOLS.map(t => ({ name: t.name, description: t.description.slice(0, 180), via: 'command', example: `ninja-p2p command --id <you> ${RC.streamId} ${t.name}${toolExample(t.name)}` })),
  };
}
function toolExample(name) {
  return ({ get_tree: ` '{"depth":2}'`, find_nodes: ` '{"query":"button"}'`, screenshot: ` '{"target":"page","max_size":768}'`, create: ` '{"spec":{"type":"rect","x":0,"y":0,"w":120,"h":80,"fill":"#E5484D"}}'`, update: ` '{"id":"<layer id>","props":{"text":"Hello"}}'`, export: ` '{"format":"html","ids":["<frame id>"]}'`, delete: ` '{"ids":["<layer id>"]}'` })[name] || '';
}
function rcAnnounce(uuid) { rcSend(envOut('announce', { skills: ['design', 'blueline', 'command', 'chat'], status: AI.readOnly ? 'read-only' : 'online', statusDetail: root().name, version: AI_VERSION, topics: ['design'], agent: rcProfile() }), uuid); }
async function sha256Hex(bytes) { const h = await crypto.subtle.digest('SHA-256', bytes); return Array.from(new Uint8Array(h), b => b.toString(16).padStart(2, '0')).join(''); }
function u8ToB64(u8) { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); }
async function rcSendFile(streamId, uuid, name, mimeType, blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const sha256 = await sha256Hex(bytes);
  const chunkSize = 12000, totalChunks = Math.ceil(bytes.length / chunkSize), transferId = b64url(12);
  if (!rcSend(envOut('file_offer', { transferId, name, mimeType, kind: mimeType.startsWith('image/') ? 'image' : 'file', size: bytes.length, sha256, chunkSize, totalChunks }, streamId), uuid)) throw aiErr('send_failed', 'the agent stopped accepting data');
  for (let i = 0; i < totalChunks; i++) {
    rcSend(envOut('file_chunk', { transferId, index: i, totalChunks, data: u8ToB64(bytes.subarray(i * chunkSize, (i + 1) * chunkSize)) }, streamId), uuid);
    if (i % 8 === 7) await new Promise(r => setTimeout(r, 15));
  }
  rcSend(envOut('file_complete', { transferId, totalChunks, size: bytes.length, sha256 }, streamId), uuid);
  return transferId;
}
function peerLabel(uuid) { const p = peerForUuid(uuid); p.calls++; return p.name; }
function peerColor(key) { const cols = ['#8E4EC6', '#D6409F', '#E5484D', '#F76B15', '#12A594', '#0090FF']; let h = 0; for (const c of String(key)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return cols[h % cols.length]; }
function touchPeer(streamId, uuid, from) {
  const p = RC.peers.get(streamId) || { streamId, uuid, name: streamId, role: '', first: Date.now(), calls: 0, color: peerColor(streamId) };
  p.uuid = uuid || p.uuid; p.last = Date.now(); if (from) { p.name = from.name || p.name; p.role = from.role || p.role; }
  RC.peers.set(streamId, p); return p;
}
async function rcCommand(env, uuid) {
  const from = env.from.streamId, p = touchPeer(from, uuid, env.from);
  let cmd = String(env.payload?.command || ''), args = env.payload?.args;
  if (typeof args === 'string') { try { args = args.trim() ? JSON.parse(args) : {}; } catch (e) { args = { text: args }; } }
  if (args === null || args === undefined) args = {};
  const reply = (ok, resultOrError) => rcSend(envOut('command_response', ok ? { requestId: env.id, ok: true, result: resultOrError ?? null } : { requestId: env.id, ok: false, error: resultOrError }, from), uuid);
  const builtins = {
    help: () => ({ app: 'Blueline', file: root().name, summary: 'Design editor. Send a command named after a tool, with a JSON object of arguments. Start with get_capabilities, read with get_tree / find_nodes, change things with create / update / batch, and look with screenshot.', tools: AI_TOOLS.map(t => `${t.name}: ${t.description.split('. ')[0]}`) }),
    profile: () => ({ identity: RC.identity, agent: rcProfile() }),
    status: () => ({ file: root().name, page: pageNode().name, layers: descendants(pageNode()).length, selection: D.sel.length, readOnly: AI.readOnly, peers: [...RC.peers.values()].map(x => x.name) }),
  };
  builtins.whoami = builtins.profile; builtins.capabilities = () => aiCall('get_capabilities', {}, { via: 'ninja-p2p', agent: p.name });
  if (cmd === 'call') { cmd = args.tool; args = args.args || {}; }
  p.calls++; rcRender();
  try {
    if (builtins[cmd]) return reply(true, await builtins[cmd]());
    const result = await aiCall(cmd, args, { via: 'ninja-p2p', agent: p.name, color: p.color, sendFile: (name, mime, blob) => rcSendFile(from, uuid, name, mime, blob) });
    reply(true, result);
  } catch (e) { reply(false, `${e.code || 'tool_error'}: ${e.message}`); }
}
function peerForUuid(uuid) {
  const known = [...RC.peers.values()].find(x => x.uuid === uuid && !String(x.streamId).startsWith('rpc:'));
  if (known) return known;
  const p = touchPeer('rpc:' + uuid, uuid); if (p.name === 'rpc:' + uuid) p.name = uuid === 'embed' ? 'embedding page' : 'agent ' + String(uuid).slice(0, 6);
  return p;
}
async function rcJsonRpc(msg, uuid, send) {
  const p = peerForUuid(uuid);
  const respond = (body) => {
    const text = JSON.stringify(Object.assign({ jsonrpc: '2.0', id: msg.id ?? null }, body));
    const CH = 60000;
    if (text.length <= CH) return send(JSON.parse(text));
    const n = Math.ceil(text.length / CH);
    for (let i = 0; i < n; i++) send({ jsonrpc: '2.0', id: msg.id ?? null, partial: { index: i, count: n, data: text.slice(i * CH, (i + 1) * CH) } });
  };
  const ctx = { via: 'json-rpc', agent: p.name, color: p.color };
  p.calls++; rcRender();
  try {
    const m = msg.method, params = msg.params || {};
    if (m === 'initialize') return respond({ result: { protocolVersion: '2025-06-18', serverInfo: { name: 'blueline', version: AI_VERSION }, capabilities: { tools: {} }, instructions: 'Call tools/list, then tools/call. Start with get_capabilities.' } });
    if (m === 'tools/list') return respond({ result: { tools: aiManifest() } });
    if (m === 'tools/call') {
      const r = await aiCall(params.name, params.arguments || {}, ctx);
      const content = r && r.base64 ? [{ type: 'image', data: r.base64, mimeType: r.mime }, { type: 'text', text: JSON.stringify(Object.assign({}, r, { base64: undefined })) }] : [{ type: 'text', text: JSON.stringify(r) }];
      return respond({ result: { content } });
    }
    if (m === 'ping') return respond({ result: {} });
    if (msg.id === undefined) return;   // notification
    return respond({ result: await aiCall(m, params, ctx) });
  } catch (e) {
    if (msg.method === 'tools/call') return respond({ result: { content: [{ type: 'text', text: `${e.code || 'tool_error'}: ${e.message}` }], isError: true } });
    respond({ error: { code: e.code === 'unknown_tool' ? -32601 : e.code === 'invalid_argument' ? -32602 : -32000, message: e.message, data: { code: e.code || 'tool_error' } } });
  }
}
function rcRecv(raw, uuid, streamID) {
  let data = raw;
  if (typeof data === 'string') { try { data = JSON.parse(data); } catch (e) { return; } }
  if (!data || typeof data !== 'object' || data instanceof ArrayBuffer) return;
  if (data.__vdo_mcp) return;                                   // MCP bridge housekeeping
  if (['request', 'response', 'channelMessage', 'subscribe', 'unsubscribe'].includes(data.type) && !data.v) return; // SDK RPC handles these
  if (data.v === 1 && data.type && data.from && data.from.streamId) {
    const env = data;
    if (env.from.streamId === RC.streamId && env.from.instanceId === RC.instanceId) return;
    if (env.to && env.to !== RC.streamId) return;
    const p = touchPeer(env.from.streamId, uuid, env.from);
    switch (env.type) {
      case 'announce': case 'skill_update': p.profile = env.payload?.agent || p.profile; p.status = env.payload?.status; rcRender(); break;
      case 'ping': rcSend(envOut('pong', { pingId: env.id, pongTs: Date.now() }, env.from.streamId), uuid); break;
      case 'command': rcCommand(env, uuid); break;
      case 'chat': aiChatIn(p.name, String(env.payload?.text ?? env.payload?.message ?? JSON.stringify(env.payload)).slice(0, 4000), p.color); break;
      case 'file_ack': if (env.payload && env.payload.ok === false) aiLogPush({ t: Date.now(), agent: p.name, via: 'ninja-p2p', tool: 'file transfer', ok: false, error: env.payload.error || 'rejected' }); break;
    }
    return;
  }
  if (data.jsonrpc === '2.0' && typeof data.method === 'string') return rcJsonRpc(data, uuid, obj => rcSend(obj, uuid));
  if (data.blueline === 'call' && data.tool) {
    const p = peerForUuid(uuid); p.calls++;
    aiCall(data.tool, data.args || {}, { via: 'data-channel', agent: p.name, color: p.color })
      .then(result => rcSend({ blueline: 'result', id: data.id ?? null, ok: true, result }, uuid))
      .catch(e => rcSend({ blueline: 'result', id: data.id ?? null, ok: false, error: aiErrorOut(e) }, uuid));
  }
}
function loadScript(src) { return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.async = true; s.onload = res; s.onerror = () => rej(new Error('could not load ' + src)); document.head.appendChild(s); }); }
async function rcConnect() {
  if (RC.sdk) await rcDisconnect(true);
  RC.error = '';
  if (typeof RTCPeerConnection === 'undefined') { RC.status = 'blocked'; RC.error = "This page can't open WebRTC connections. Host Blueline yourself (GitHub Pages works) to connect agents."; rcRender(); return; }
  RC.room = RC.room.trim() || newRoomName(); RC.streamId = (RC.streamId || 'blueline').trim().replace(/[^A-Za-z0-9_]/g, '_').slice(0, 40) || 'blueline';   // the SDK turns anything else into "_"
  RC.room = RC.room.replace(/[^A-Za-z0-9_]/g, '_');
  rcSettingsSave();
  RC.status = 'connecting'; rcRender();
  try {
    if (!window.VDONinjaSDK) await loadScript(SDK_URL);
    // salt pinned to "vdo.ninja": in a browser the SDK otherwise salts with the page's hostname (e.g. you.github.io),
    // and Node agents (ninja-p2p sidecars, the MCP bridge) would never find this peer
    const sdk = new VDONinjaSDK({ host: 'wss://wss.vdo.ninja', salt: 'vdo.ninja', debug: false });
    RC.sdk = sdk; RC.peers.clear();
    RC.identity = { streamId: RC.streamId, role: 'app', name: 'Blueline', instanceId: RC.instanceId };
    sdk.addEventListener('dataChannelOpen', e => { const uuid = e.detail?.uuid; if (uuid) rcAnnounce(uuid); rcRender(); });
    sdk.addEventListener('dataReceived', e => rcRecv(e.detail?.data, e.detail?.uuid, e.detail?.streamID));
    sdk.addEventListener('peerDisconnected', e => { const uuid = e.detail?.uuid; for (const [k, p] of RC.peers) if (p.uuid === uuid) { p.gone = Date.now(); } rcRender(); });
    sdk.addEventListener('listing', e => { for (const entry of e.detail?.list || []) if (entry.streamID && entry.streamID !== RC.streamId) { try { sdk.view(entry.streamID, { audio: false, video: false }); } catch (err) { } } });
    sdk.addEventListener('disconnected', () => { if (RC.sdk === sdk && RC.status === 'live') { RC.status = 'reconnecting'; rcRender(); } });
    sdk.addEventListener('reconnected', () => { if (RC.sdk === sdk) { RC.status = 'live'; rcRender(); } });
    // SDK request/onRequest RPC: one generic entry point plus one handler per tool
    sdk.onRequest('blueline', (data, uuid) => aiCall(data?.tool, data?.args || {}, { via: 'sdk-rpc', agent: peerLabel(uuid), color: peerColor(uuid) }));
    AI_TOOLS.forEach(t => sdk.onRequest(t.name, (data, uuid) => aiCall(t.name, data || {}, { via: 'sdk-rpc', agent: peerLabel(uuid), color: peerColor(uuid) })));
    await sdk.connect();
    const join = { room: RC.room }; const pw = pwValue(); if (pw !== undefined) join.password = pw;
    await sdk.joinRoom(join);
    await sdk.announce({ streamID: RC.streamId });
    RC.status = 'live'; RC.connectedAt = Date.now();
    toast('Agents can now join room ' + RC.room.slice(0, 24) + (RC.room.length > 24 ? '…' : ''));
  } catch (e) { RC.status = 'error'; RC.error = e.message || String(e); try { RC.sdk && RC.sdk.disconnect(); } catch (_) { } RC.sdk = null; }
  rcRender();
}
async function rcDisconnect(quiet) {
  const sdk = RC.sdk; RC.sdk = null; RC.status = 'off'; RC.peers.clear();
  try { if (sdk) { sdk.disconnect(); } } catch (e) { }
  if (!quiet) { toast('AI control disconnected'); rcRender(); }
}
/* tell agents what the designer changed (debounced, ids only) */
let rcEditT = 0, rcEditIds = new Set();
listeners.change.push((changes, opts) => {
  if (opts.ai || opts.silent || !RC.sdk || RC.status !== 'live' || !RC.notifyEdits) return;
  Object.keys(changes).forEach(id => rcEditIds.add(id));
  clearTimeout(rcEditT);
  rcEditT = setTimeout(() => {
    const ids = [...rcEditIds].filter(id => N(id) && N(id).type !== 'DOCUMENT').slice(0, 100); const removed = [...rcEditIds].filter(id => !N(id)).slice(0, 100); rcEditIds.clear();
    const env = envOut('event', { kind: 'design_changed', file: root().name, by: 'designer', changed: ids, removed, selection: D.sel.slice(0, 50) });
    env.topic = 'design'; rcSend(env);
  }, 900);
});

/* ---------- chat ---------- */
function aiChatIn(who, text, color) { RC.chat.push({ who, text, t: Date.now(), color }); if (RC.chat.length > 200) RC.chat.shift(); toast(`${who}: ${text.slice(0, 140)}`, 4200); RC.unread = (RC.unread || 0) + ($('#aiPanel').hidden || UI.aiTab !== 'chat' ? 1 : 0); rcRender(); }
function aiChatOut(text) {
  if (!text.trim()) return;
  RC.chat.push({ who: 'You', text, t: Date.now(), me: true });
  if (RC.sdk && RC.status === 'live') rcSend(envOut('chat', { text })); else toast('Not connected — the message stays here until an agent joins');
  rcRender();
}

/* ---------- postMessage (embedding page) ---------- */
window.addEventListener('message', async e => {
  const d = e.data; if (!d || typeof d !== 'object' || e.source === window) return;
  const isCall = d.type === 'blueline:call' || (d.jsonrpc === '2.0' && typeof d.method === 'string');
  if (!isCall) return;
  const reply = obj => { try { e.source.postMessage(obj, e.origin && e.origin !== 'null' ? e.origin : '*'); } catch (err) { } };
  if (!RC.embedAllowed) { const err = { code: 'not_enabled', message: 'Embedding control is off. The designer can turn it on in Blueline’s AI panel.' }; return d.jsonrpc ? reply({ jsonrpc: '2.0', id: d.id ?? null, error: { code: -32001, message: err.message, data: err } }) : reply({ type: 'blueline:result', id: d.id ?? null, ok: false, error: err }); }
  if (d.jsonrpc) return rcJsonRpc(d, 'embed', reply);
  try { reply({ type: 'blueline:result', id: d.id ?? null, ok: true, result: await aiCall(d.tool, d.args || {}, { via: 'postMessage', agent: 'embedding page' }) }); }
  catch (err) { reply({ type: 'blueline:result', id: d.id ?? null, ok: false, error: aiErrorOut(err) }); }
});

/* ---------- WebMCP ---------- */
async function aiRegisterWebMCP() {
  const mc = (typeof document !== 'undefined' && document.modelContext) || navigator.modelContext;
  if (!mc) { RC.webmcp = 'unavailable'; return; }
  const viaDocument = !!document.modelContext;
  const wrap = t => async (input) => {
    try { const r = await aiCall(t.name, input || {}, { via: 'webmcp', agent: 'browser agent' }); const text = JSON.stringify(r); return viaDocument ? text : { content: [{ type: 'text', text }] }; }
    catch (e) { const text = JSON.stringify({ error: aiErrorOut(e) }); return viaDocument ? text : { content: [{ type: 'text', text }], isError: true }; }
  };
  try {
    if (typeof mc.registerTool === 'function') { for (const t of AI_TOOLS) await mc.registerTool({ name: t.name, description: t.description, inputSchema: t.inputSchema, annotations: { readOnlyHint: t.readOnly }, execute: wrap(t) }); }
    else if (typeof mc.provideContext === 'function') mc.provideContext({ tools: AI_TOOLS.map(t => ({ name: t.name, description: t.description, inputSchema: t.inputSchema, annotations: { readOnlyHint: t.readOnly }, execute: wrap(t) })) });
    else { RC.webmcp = 'unavailable'; return; }
    RC.webmcp = 'registered';
  } catch (e) { RC.webmcp = 'error: ' + e.message; }
}

/* ---------- window.blueline ---------- */
function aiSelectionOrPage(scope) {
  if (scope === 'file') return kids(root()).flatMap(p => kids(p).map(n => n.id));
  if (scope === 'page' || !D.sel.length) return kids(pageNode()).map(n => n.id);
  return topSelection(D.sel.filter(id => N(id)));
}
window.blueline = Object.freeze({
  version: AI_VERSION,
  tools: () => aiManifest(),
  call: (name, args) => aiCall(name, args || {}, { via: 'window.blueline', agent: 'script' }),
  spec: ids => (ids || aiSelectionOrPage()).map(id => nodeToSpec(resolveNode(id))),
  outline: ids => outlineOf(ids || aiSelectionOrPage()),
  html: id => htmlExport(resolveNode(id || aiSelectionOrPage()[0]).id).html,
  tokens: () => designTokens(),
  screenshot: async (target, maxSize) => { const r = await screenshotOf(target, maxSize || 1024, 'png'); return 'data:image/png;base64,' + await blobToB64(r.blob); },
  onChange: fn => { listeners.change.push((ch, o) => fn({ ids: Object.keys(ch), ai: !!o.ai })); },
});

/* ============================================================
   AI panel
   ============================================================ */
UI.aiTab = 'connect';
const AIICON = '<svg viewBox="0 0 24 24"><path d="M5 12a3 3 0 106 0 3 3 0 10-6 0M13 12a3 3 0 106 0 3 3 0 10-6 0M11 12h2M8 9V5M16 9V5M8 15v4M16 15v4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
function aiToggle(tab) {
  const p = $('#aiPanel');
  if (tab) { UI.aiTab = tab; p.hidden = false; } else p.hidden = !p.hidden;
  if (!p.hidden && UI.aiTab === 'chat') RC.unread = 0;
  rcRender(true);
}
function visiblePeers() { return [...RC.peers.values()].filter(p => !p.gone && (!String(p.streamId).startsWith('rpc:') || p.calls)); }
function updateAIButton() {
  const b = $('#aiBtn'); if (!b) return;
  const live = RC.status === 'live', n = visiblePeers().length;
  b.dataset.state = live ? 'live' : RC.status === 'connecting' || RC.status === 'reconnecting' ? 'busy' : RC.status === 'error' || RC.status === 'blocked' ? 'error' : 'off';
  b.querySelector('.ailabel').textContent = live ? (n ? `AI · ${n}` : 'AI · live') : 'AI';
  b.classList.toggle('unread', !!RC.unread);
  b.setAttribute('aria-expanded', String(!$('#aiPanel').hidden));
}
function snippetFor(mode) {
  const room = RC.room || '<room>', sid = RC.streamId || 'blueline';
  if (mode === 'ninja-p2p') return `# one-time setup\nnpm install -g @vdoninja/ninja-p2p @roamhq/wrtc\nninja-p2p install-skill claude   # or: codex\n\n# start your agent's sidecar in Blueline's room\nninja-p2p start --room ${room} --id claude\n\n# commands are Blueline tool names; args are JSON\nninja-p2p command --id claude ${sid} get_capabilities\nninja-p2p command --id claude ${sid} get_tree '{"depth":2,"format":"outline"}'\nninja-p2p command --id claude ${sid} screenshot '{"target":"page","max_size":768}'\nninja-p2p read --id claude --take 10     # replies (and screenshots as files)`;
  if (mode === 'mcp') return `// MCP tool calls (npm i @vdoninja/mcp && npx vdon-mcp-install)\nvdo_connect {"room":"${room}","stream_id":"claude","target_stream_id":"${sid}"${pwValue() === false ? ',"password":false' : pwValue() ? `,"password":"${pwValue()}"` : ''}}\nvdo_send    {"session_id":"<id>","data":{"jsonrpc":"2.0","id":1,"method":"get_capabilities"}}\nvdo_send    {"session_id":"<id>","data":{"jsonrpc":"2.0","id":2,"method":"get_tree","params":{"format":"outline"}}}\nvdo_receive {"session_id":"<id>","wait_ms":3000}\n// tools/list and tools/call (MCP-shaped) also work as JSON-RPC methods`;
  return `<script src="${SDK_URL}"><\/script>\nconst vdo = new VDONinjaSDK();\nawait vdo.connect();\nawait vdo.joinRoom({ room: '${room}'${pwValue() === false ? ', password: false' : pwValue() ? `, password: '${pwValue()}'` : ''} });\nvdo.addEventListener('dataChannelOpen', async (e) => {\n  const uuid = e.detail.uuid;\n  const tree = await vdo.request('get_tree', { depth: 2 }, uuid, 10000);\n  await vdo.request('blueline', { tool: 'update', args: { id: '<layer id>', props: { fill: '#E5484D' } } }, uuid, 10000);\n});\nawait vdo.view('${sid}', { audio: false, video: false });`;
}
function agentPrompt() {
  const sid = RC.streamId || 'blueline';
  return `You can see and edit a Blueline design file ("${root().name}") that is open in my browser, over a VDO.Ninja peer-to-peer room.\nRoom: ${RC.room || '<room>'}\nBlueline's peer id: ${sid}\n${RC.mode === 'ninja-p2p' ? `Send Blueline commands with: ninja-p2p command --id <your id> ${sid} <tool> '<json args>' and read replies from your inbox.` : RC.mode === 'mcp' ? `Use vdo_connect with target_stream_id "${sid}", then vdo_send JSON-RPC 2.0 messages ({"jsonrpc":"2.0","id":1,"method":"<tool>","params":{...}}) and read replies with vdo_receive.` : `Use the VDO.Ninja SDK: request('<tool>', args, uuid) against stream "${sid}".`}\n\nHow to work:\n1. Call get_capabilities first — it lists every tool and the layer spec format.\n2. Read before editing: get_tree (format "outline" is cheapest), find_nodes, get_selection.\n3. Edit with create (nested specs), update, delete, move, batch (one undo step).\n4. Check your work with screenshot (max_size 768 is plenty).\n5. Use notify to tell me what you changed. Every change you make can be undone.`;
}
function aiPanelHTML() {
  const live = RC.status === 'live';
  const tabs = [['connect', 'Connect'], ['chat', 'Chat' + (RC.unread ? ` (${RC.unread})` : '')], ['export', 'Export'], ['api', 'Tools']];
  let body = '';
  if (UI.aiTab === 'connect') {
    const st = { off: 'Not connected', connecting: 'Connecting…', reconnecting: 'Reconnecting…', live: `Live in the room as “${esc(RC.streamId)}”`, error: 'Connection failed', blocked: 'Unavailable here' }[RC.status];
    const peers = [...RC.peers.values()].filter(p => !String(p.streamId).startsWith('rpc:') || p.calls);
    body = `<div class="aistatus" data-state="${RC.status}"><i></i><div><b>${st}</b>${RC.error ? `<p class="hint">${esc(RC.error)}</p>` : ''}${live ? `<p class="hint">Room ${esc(RC.room)}</p>` : ''}</div></div>`
      + (RC.fromLink && !live ? `<div class="warn">A link filled in this room. Only connect if you trust whoever sent it — agents in the room can read and edit this file.</div>` : '')
      + `<label class="fl"><span>Agents connect with</span>${sel_('aiMode', 'aiMode', Object.entries(PRESETS).map(([k, v]) => [k, v.label]), RC.mode, 'wide')}</label><p class="hint">${esc(PRESETS[RC.mode].hint)}</p>`
      + `<label class="fl"><span>Room</span><div class="row"><input id="aiRoom" class="hexlike" value="${esc(RC.room)}" placeholder="Leave empty for a private random room" spellcheck="false" autocomplete="off"${live ? ' disabled' : ''}><button class="tb sm" data-ai="newroom"${live ? ' disabled' : ''}>New</button></div></label>`
      + `<div class="grid2"><label class="fl"><span>Password</span><input id="aiPass" class="hexlike" value="${esc(RC.password)}" placeholder="SDK default" spellcheck="false" autocomplete="off"${live ? ' disabled' : ''}></label><label class="fl"><span>Blueline’s peer id</span><input id="aiSid" class="hexlike" value="${esc(RC.streamId)}" spellcheck="false" autocomplete="off"${live ? ' disabled' : ''}></label></div>`
      + `<label class="chk"><input type="checkbox" id="aiEdits"${AI.readOnly ? '' : ' checked'}> Let agents edit (off = read and export only)</label>`
      + `<label class="chk"><input type="checkbox" id="aiNotify"${RC.notifyEdits ? ' checked' : ''}> Tell agents when I change something</label>`
      + `<div class="mbtns left">${live || RC.status === 'connecting' || RC.status === 'reconnecting' ? '<button class="tb danger" data-ai="disconnect">Disconnect</button>' : '<button class="tb primary" data-ai="connect">Connect</button>'}${RC.room ? '<button class="tb" data-ai="copylink">Copy invite link</button>' : ''}</div>`
      + (peers.length ? `<h4>Agents</h4><div class="peerlist">${peers.map(p => `<div class="peer${p.gone ? ' gone' : ''}"><span class="av" style="--c:${p.color}">${esc((p.name || '?').slice(0, 1))}</span><div><b>${esc(p.name)}</b><span class="hint">${esc(p.role || 'agent')} · ${p.calls || 0} call${p.calls === 1 ? '' : 's'}${p.gone ? ' · left' : ''}</span></div></div>`).join('')}</div>` : '')
      + `<h4>Give your agent this</h4><div class="codebox"><pre id="aiSnippet">${esc(snippetFor(RC.mode))}</pre><button class="tb sm" data-ai="copysnippet">Copy</button></div>`
      + `<div class="codebox"><pre id="aiPrompt">${esc(agentPrompt())}</pre><button class="tb sm" data-ai="copyprompt">Copy prompt</button></div>`
      + `<h4>In this browser</h4><ul class="facts sm"><li><code>window.blueline.call(tool, args)</code> — for Playwright, extensions and the console</li><li>WebMCP: ${RC.webmcp === 'registered' ? `${AI_TOOLS.length} tools registered for the browser's agent` : 'not offered by this browser'}</li><li><label class="chk"><input type="checkbox" id="aiEmbed"${RC.embedAllowed ? ' checked' : ''}> Accept <code>postMessage</code> control from a page that embeds Blueline</label></li></ul>`;
  } else if (UI.aiTab === 'chat') {
    body = `<div class="chatlog" id="aiChatLog">${RC.chat.length ? RC.chat.map(m => `<div class="msg${m.me ? ' me' : ''}"><b style="${m.color ? `color:${m.color}` : ''}">${esc(m.who)}</b><span>${esc(m.text)}</span></div>`).join('') : '<p class="hint">Messages between you and connected agents appear here. Ask an agent to change the design; it will answer through its tools.</p>'}</div>`
      + `<form class="chatform" id="aiChatForm"><input id="aiChatIn" placeholder="${RC.status === 'live' ? 'Message every agent in the room' : 'Connect first to reach agents'}" autocomplete="off"><button class="tb primary">Send</button></form>`
      + `<h4>Activity</h4><div class="actlog">${AI.log.length ? AI.log.slice(0, 60).map(e => `<div class="act${e.ok ? '' : ' bad'}"><span class="mono">${new Date(e.t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span><b>${esc(e.tool)}</b><span class="hint">${esc(e.agent)} · ${esc(e.via)}${e.ok ? (e.changed ? ` · ${e.changed} layer${e.changed === 1 ? '' : 's'}` : '') + (e.ms !== undefined ? ` · ${e.ms} ms` : '') : ' · ' + esc(e.error || 'failed')}</span></div>`).join('') : '<p class="hint">No tool calls yet.</p>'}</div>`;
  } else if (UI.aiTab === 'export') {
    const scope = UI.aiScope || (D.sel.length ? 'selection' : 'page');
    body = `<p class="hint">Formats that language models read well. Pick what to include, then copy or download.</p><label class="fl"><span>Include</span>${sel_('aiScope', 'aiScope', [['selection', 'Selection' + (D.sel.length ? ` (${D.sel.length})` : ' (none)')], ['page', 'Current page'], ['file', 'Whole file']], scope, 'wide')}</label>`
      + [['bundle', 'Copy for AI', 'Markdown with an outline, design tokens and the editable spec — paste it into any chat.'],
        ['spec', 'Spec JSON', 'Every layer as compact JSON. Agents can edit it and send it back through create.'],
        ['outline', 'Outline', 'Indented text tree with sizes, layout and colors. Cheapest on tokens.'],
        ['html', 'HTML + CSS', 'A standalone page per frame. Auto layout becomes flexbox.'],
        ['tokens', 'Design tokens', 'Color and text styles as DTCG JSON plus CSS variables.'],
        ['manifest', 'Tool manifest', 'Every tool with its JSON schema, for wiring up your own agent.']]
        .map(([k, l, d]) => `<div class="exai"><div><b>${l}</b><p class="hint">${d}</p></div><div class="exbtns"><button class="tb sm" data-aiexp="${k}" data-how="copy">Copy</button><button class="tb sm" data-aiexp="${k}" data-how="save">Download</button></div></div>`).join('');
  } else {
    body = `<p class="hint">${AI_TOOLS.length} tools. Every transport takes the same names and JSON arguments; edits are undoable and run one at a time.</p>` + AI_TOOLS.map(t => `<details class="tooldoc"><summary><code>${t.name}</code>${t.readOnly ? '<span class="tag">read</span>' : ''}</summary><p>${esc(t.description)}</p><pre>${esc(JSON.stringify(t.inputSchema.properties, null, 1))}</pre></details>`).join('');
  }
  return `<div class="aihead"><div class="tabs">${tabs.map(([k, l]) => `<button data-aitab="${k}" class="${UI.aiTab === k ? 'on' : ''}">${l}</button>`).join('')}</div><button class="ib" data-ai="close" title="Close">✕</button></div><div class="aibody">${body}</div>`;
}
function rcRender(force) {
  updateAIButton();
  const p = $('#aiPanel'); if (!p || p.hidden) return;
  if (!force && p.contains(document.activeElement) && document.activeElement.matches('input,textarea,select')) { UI.aiStale = true; return; }
  const sc = $('.aibody', p)?.scrollTop || 0; const same = UI.aiTabShown === UI.aiTab;
  p.innerHTML = aiPanelHTML(); UI.aiTabShown = UI.aiTab;
  const b = $('.aibody', p); if (b && same) b.scrollTop = sc;
  const log = $('#aiChatLog'); if (log) log.scrollTop = log.scrollHeight;
}
async function aiExport(kind, how) {
  const scope = UI.aiScope || (D.sel.length ? 'selection' : 'page');
  const ids = aiSelectionOrPage(scope);
  let text = '', name = root().name.replace(/[\\/:*?"<>|]+/g, '-'), ext = 'json', mime = 'application/json';
  if (kind === 'manifest') { text = JSON.stringify({ name: 'blueline', version: AI_VERSION, tools: aiManifest() }, null, 2); name += '-tools'; }
  else if (!ids.length && kind !== 'tokens') return toast('Nothing to export yet');
  else if (kind === 'spec') { text = JSON.stringify({ format: 'blueline-spec', version: 1, file: root().name, layers: ids.map(id => nodeToSpec(N(id), { ids: true })) }, null, 1); name += '.spec'; }
  else if (kind === 'outline') { text = outlineOf(ids); ext = 'md'; mime = 'text/markdown'; }
  else if (kind === 'tokens') { const t = designTokens(); text = JSON.stringify(t.tokens, null, 2) + '\n\n/* CSS */\n' + t.css; name += '.tokens'; }
  else if (kind === 'html') {
    const frames = ids.map(N).filter(n => n.visible);
    if (!frames.length) return toast('Nothing visible to export');
    text = htmlExport(frames[0].id).html; ext = 'html'; mime = 'text/html'; name = frames[0].name.replace(/[\\/:*?"<>|]+/g, '-');
    if (frames.length > 1 && how === 'copy') toast(`Copied “${frames[0].name}” — download exports one file per frame`);
    if (frames.length > 1 && how === 'save') { for (const f of frames) await downloadBlob(new Blob([htmlExport(f.id).html], { type: mime }), f.name.replace(/[\\/:*?"<>|]+/g, '-') + '.html'); return; }
  } else if (kind === 'bundle') {
    const t = designTokens(); const pg = pageNode();
    text = `# Blueline design: ${root().name} — ${pg.name}\n\n${scope === 'selection' && D.sel.length ? `Selected: ${ids.map(id => N(id).name).join(', ')}\n\n` : ''}Coordinates are CSS pixels relative to each layer's parent. Ids in [brackets] can be used with Blueline's tools.\n\n## Outline\n\n${outlineOf(ids)}\n\n## Design tokens\n\n\`\`\`json\n${JSON.stringify(t.tokens, null, 1)}\n\`\`\`\n\n## Spec (editable JSON)\n\n\`\`\`json\n${JSON.stringify(ids.map(id => nodeToSpec(N(id), { ids: true })))}\n\`\`\`\n`;
    ext = 'md'; mime = 'text/markdown'; name += '.ai';
  }
  if (how === 'copy') { const ok = await copyText(text); toast(ok ? `Copied ${(text.length / 1024).toFixed(1)} KB` : 'Copy failed — use Download'); }
  else await downloadBlob(new Blob([text], { type: mime }), `${name}.${ext}`);
}
function initAIPanel() {
  rcSettingsLoad();
  const btn = h(`<button id="aiBtn" class="aibtn" title="AI control and exports" data-state="off">${AIICON}<span class="ailabel">AI</span></button>`);
  $('#peers').before(btn);
  btn.addEventListener('click', () => aiToggle());
  const p = h('<div id="aiPanel" class="popover aipanel" hidden></div>'); document.body.appendChild(p);
  p.addEventListener('click', async e => {
    const t = e.target.closest('[data-aitab]'); if (t) { UI.aiTab = t.dataset.aitab; if (UI.aiTab === 'chat') RC.unread = 0; return rcRender(true); }
    const x = e.target.closest('[data-aiexp]'); if (x) return aiExport(x.dataset.aiexp, x.dataset.how);
    const a = e.target.closest('[data-ai]'); if (!a) return;
    switch (a.dataset.ai) {
      case 'close': p.hidden = true; updateAIButton(); break;
      case 'newroom': RC.room = newRoomName(); RC.fromLink = false; rcSettingsSave(); rcRender(true); break;
      case 'connect': readAIForm(); RC.fromLink = false; await rcConnect(); break;
      case 'disconnect': await rcDisconnect(); break;
      case 'copysnippet': toast(await copyText(snippetFor(RC.mode)) ? 'Copied' : 'Copy failed'); break;
      case 'copyprompt': toast(await copyText(agentPrompt()) ? 'Prompt copied — paste it to your agent' : 'Copy failed'); break;
      case 'copylink': { const u = location.href.split('#')[0] + `#ai-room=${encodeURIComponent(RC.room)}&ai-mode=${RC.mode}${RC.password !== PRESETS[RC.mode].password ? `&ai-pass=${encodeURIComponent(RC.password)}` : ''}`; toast(await copyText(u) ? 'Invite link copied (opens with the room filled in; it still needs a click to connect)' : 'Copy failed'); break; }
    }
  });
  p.addEventListener('change', e => {
    const d = e.target;
    if (d.dataset.sel === 'aiMode') { readAIForm(); RC.mode = d.value; if (PRESETS[RC.mode].password !== null) RC.password = PRESETS[RC.mode].password; rcSettingsSave(); rcRender(true); }
    if (d.dataset.sel === 'aiScope') { UI.aiScope = d.value; }
    if (d.id === 'aiEdits') { AI.readOnly = !d.checked; rcSettingsSave(); if (RC.sdk && RC.status === 'live') rcSend(envOut('skill_update', { skills: ['design', 'blueline', 'command', 'chat'], status: AI.readOnly ? 'read-only' : 'online', statusDetail: root().name, agent: rcProfile() })); }
    if (d.id === 'aiNotify') { RC.notifyEdits = d.checked; rcSettingsSave(); }
    if (d.id === 'aiEmbed') { RC.embedAllowed = d.checked; rcSettingsSave(); }
    if (['aiRoom', 'aiPass', 'aiSid'].includes(d.id)) { readAIForm(); rcSettingsSave(); const sn = $('#aiSnippet'); if (sn) sn.textContent = snippetFor(RC.mode); const pr = $('#aiPrompt'); if (pr) pr.textContent = agentPrompt(); }
  });
  p.addEventListener('submit', e => { e.preventDefault(); const i = $('#aiChatIn'); aiChatOut(i.value); i.value = ''; });
  p.addEventListener('keydown', e => { if (e.key === 'Escape') { p.hidden = true; updateAIButton(); } e.stopPropagation(); });
  p.addEventListener('focusout', () => setTimeout(() => { if (UI.aiStale && !p.contains(document.activeElement)) { UI.aiStale = false; rcRender(true); } }, 0));
  AI.listeners.push(() => { if (!p.hidden && UI.aiTab === 'chat') rcRender(); });
  aiRegisterWebMCP();
  updateAIButton();
  if (RC.fromLink) { UI.aiTab = 'connect'; p.hidden = false; rcRender(true); }
}
function readAIForm() { const r = $('#aiRoom'), pw = $('#aiPass'), s = $('#aiSid'); if (r) RC.room = r.value.trim(); if (pw) RC.password = pw.value.trim(); if (s) RC.streamId = s.value.trim() || 'blueline'; }
