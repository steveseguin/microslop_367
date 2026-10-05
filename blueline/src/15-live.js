/* ============================================================
   Live share over VDO.Ninja — share a design with a link.
   "Can edit" links carry an edit key: every change is signed with it
   (HMAC-SHA-256), so a view-only link can't forge edits even from a
   modified client. "Can view" guests see every change and cursor live,
   and anything they change locally is rolled back.
   Uses the same collaboration messages as same-browser tabs (CO.*).
   ============================================================ */
const LIVE = { sdk: null, room: '', pass: '', key: '', mode: 'off', host: false, peers: new Map(), status: 'off', hmac: null, chunks: new Map(), warned: 0 };
const LIVE_SIGNED = new Set(['ops', 'full']);
const liveRand = n => Array.from(crypto.getRandomValues(new Uint8Array(n)), b => 'abcdefghijkmnpqrstuvwxyz23456789'[b % 32]).join('');

function liveViewOnly() { return LIVE.mode === 'view'; }

function liveLink(edit) {
  const u = new URL(location.href);
  u.search = '';
  u.searchParams.set('live', [LIVE.room, LIVE.pass, edit ? LIVE.key : ''].filter(Boolean).join('~'));
  return u.href;
}

async function liveKey(secret) {
  if (!secret) return null;
  return crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}
const hexOf = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
async function liveSign(text) { return LIVE.hmac ? hexOf(await crypto.subtle.sign('HMAC', LIVE.hmac, new TextEncoder().encode(text))) : ''; }
async function liveVerify(text, sig) {
  if (!LIVE.hmac) return true; // viewers can't check; they only ever receive
  if (!sig || sig.length % 2) return false;
  const bytes = new Uint8Array(sig.match(/../g).map(h => parseInt(h, 16)));
  return crypto.subtle.verify('HMAC', LIVE.hmac, bytes, new TextEncoder().encode(text));
}

/* Called by collabSend for every outgoing collaboration message. */
async function liveSend(msg, onlyUuid) {
  if (!LIVE.sdk || LIVE.status !== 'live') return;
  if (liveViewOnly() && LIVE_SIGNED.has(msg.t)) return; // viewers never publish edits
  const text = JSON.stringify(msg);
  const sig = LIVE_SIGNED.has(msg.t) ? await liveSign(text) : '';
  const target = onlyUuid ? { uuid: onlyUuid } : undefined;
  const send = obj => { try { LIVE.sdk.sendData(obj, target); } catch (e) { } };
  const CH = 40000;
  if (text.length <= CH) return send({ bl: 1, m: text, s: sig });
  const id = uid(), n = Math.ceil(text.length / CH);
  for (let i = 0; i < n; i++) {
    send({ bl: 1, c: { id, i, n, d: text.slice(i * CH, (i + 1) * CH) }, s: i === n - 1 ? sig : '' });
    if (i % 12 === 11) await new Promise(r => setTimeout(r, 20));
  }
}

async function liveRecv(data, uuid) {
  if (!data || data.bl !== 1) return;
  let text = data.m, sig = data.s;
  if (data.c) {
    const c = data.c; if (!(c.n > 0 && c.n < 50000)) return;
    const key = uuid + ':' + c.id; const slot = LIVE.chunks.get(key) || { parts: [], got: 0, sig: '' };
    if (slot.parts[c.i] === undefined) { slot.parts[c.i] = String(c.d || ''); slot.got++; }
    if (data.s) slot.sig = data.s;
    LIVE.chunks.set(key, slot);
    if (slot.got < c.n) return;
    LIVE.chunks.delete(key); text = slot.parts.join(''); sig = slot.sig;
  }
  let msg; try { msg = JSON.parse(text); } catch (e) { return; }
  if (LIVE_SIGNED.has(msg.t) && !(await liveVerify(text, sig))) {
    if (Date.now() - LIVE.warned > 10000) { LIVE.warned = Date.now(); toast('Ignored an edit from someone with a view-only link'); }
    return;
  }
  if (msg.t === 'cursor' || msg.t === 'hello') { const p = LIVE.peers.get(uuid) || {}; LIVE.peers.set(uuid, { ...p, name: msg.name || p.name || 'Guest', color: msg.color || p.color, mode: msg.mode || p.mode }); liveRender(); }
  if (msg.t === 'full') { LIVE.gotFull = true; liveBanner(); }
  collabRecv(msg, 'live', uuid);
}

async function liveConnect() {
  if (typeof RTCPeerConnection === 'undefined') throw new Error("This browser can't open peer-to-peer connections.");
  if (!window.VDONinjaSDK) await loadScript(SDK_URL);
  LIVE.hmac = await liveKey(LIVE.key);
  const sdk = new VDONinjaSDK({ host: 'wss://wss.vdo.ninja', salt: 'vdo.ninja', debug: false });
  LIVE.sdk = sdk; LIVE.status = 'connecting'; liveRender();
  const streamID = ('bl' + CO.me.id).replace(/[^A-Za-z0-9_]/g, '').slice(0, 40);
  sdk.addEventListener('dataChannelOpen', e => {
    const uuid = e.detail?.uuid; if (!uuid) return;
    LIVE.peers.set(uuid, LIVE.peers.get(uuid) || { name: 'Guest' });
    // The person who shared sends the whole design to each new arrival.
    if (LIVE.host) { const imgs = {}; for (const k in D.images) imgs[k] = { data: D.images[k].data, w: D.images[k].w, h: D.images[k].h }; liveSend({ t: 'full', from: CO.me.id, fileId: D.fileId, nodes: D.nodes, images: imgs }, uuid); }
    liveSend({ t: 'hello', from: CO.me.id, name: CO.me.name, color: CO.me.color, mode: LIVE.mode }, uuid);
    sendPresence(); liveRender();
  });
  sdk.addEventListener('dataReceived', e => liveRecv(e.detail?.data, e.detail?.uuid));
  sdk.addEventListener('peerDisconnected', e => { LIVE.peers.delete(e.detail?.uuid); liveRender(); });
  sdk.addEventListener('listing', e => { for (const x of e.detail?.list || []) if (x.streamID && x.streamID !== streamID) { try { sdk.view(x.streamID, { audio: false, video: false }); } catch (err) { } } });
  sdk.addEventListener('disconnected', () => { if (LIVE.sdk === sdk) { LIVE.status = 'connecting'; liveRender(); } });
  sdk.addEventListener('reconnected', () => { if (LIVE.sdk === sdk) { LIVE.status = 'live'; liveRender(); } });
  await sdk.connect();
  await sdk.joinRoom({ room: LIVE.room, password: LIVE.pass });
  await sdk.announce({ streamID });
  LIVE.status = 'live'; liveRender();
}

/* Start sharing the open design (once per file; the same links keep working). */
async function liveShare() {
  if (LIVE.sdk && LIVE.host) return true;
  const saved = safeLS.get('blueline:live:' + D.fileId, null);
  Object.assign(LIVE, saved && saved.room ? saved : { room: 'bl_' + liveRand(18), pass: liveRand(20), key: liveRand(24) });
  safeLS.set('blueline:live:' + D.fileId, { room: LIVE.room, pass: LIVE.pass, key: LIVE.key });
  LIVE.mode = 'edit'; LIVE.host = true;
  try { await liveConnect(); return true; } catch (e) { LIVE.status = 'error'; LIVE.error = e.message; liveRender(); return false; }
}

function liveStop() {
  try { LIVE.sdk && LIVE.sdk.disconnect(); } catch (e) { }
  LIVE.sdk = null; LIVE.status = 'off'; LIVE.peers.clear(); LIVE.host = false;
  if (LIVE.mode === 'view') { LIVE.mode = 'off'; document.body.classList.remove('bl-viewonly'); }
  LIVE.mode = 'off'; liveBanner(); liveRender();
}

/* Guests arrive with ?live=room~pass[~key]. */
async function liveBoot() {
  const raw = new URLSearchParams(location.search).get('live');
  if (!raw) return;
  const [room, pass, key] = raw.split('~');
  if (!/^bl_[a-z0-9]{8,40}$/.test(room || '') || !pass) return;
  Object.assign(LIVE, { room, pass, key: key || '', mode: key ? 'edit' : 'view', host: false });
  if (LIVE.mode === 'view') document.body.classList.add('bl-viewonly');
  liveBanner();
  try { await liveConnect(); } catch (e) { LIVE.status = 'error'; LIVE.error = e.message; liveBanner(); }
}

function liveBanner() {
  let el = $('#liveBanner');
  if (LIVE.mode === 'off' || LIVE.host) { if (el) el.remove(); return; }
  if (!el) { el = document.createElement('div'); el.id = 'liveBanner'; document.body.appendChild(el); }
  const who = [...LIVE.peers.values()].map(p => p.name).filter(Boolean)[0];
  el.className = 'livebanner';
  el.innerHTML = LIVE.status === 'error'
    ? `<b>Could not join.</b> ${esc(LIVE.error || '')}`
    : !LIVE.gotFull
      ? `<b>Joining the shared design…</b> The person who shared it needs to have it open.`
      : liveViewOnly()
        ? `<b>Viewing live</b>${who ? ' with ' + esc(who) : ''}. You can look around, zoom and select, but not change it.`
        : `<b>Editing together</b>${who ? ' with ' + esc(who) : ''}. Changes appear for everyone instantly.`;
}

function liveRender() {
  updatePeersBadge(); liveBanner();
  const box = $('#liveStatus'); if (!box) return;
  const n = LIVE.peers.size;
  box.textContent = LIVE.status === 'live' ? (n ? `Live · ${n} ${n === 1 ? 'person' : 'people'} connected` : 'Live · waiting for people to open your link') : LIVE.status === 'connecting' ? 'Connecting…' : LIVE.status === 'error' ? (LIVE.error || 'Could not connect') : 'Not shared yet';
}

/* View-only: anything changed locally is put back at once. Called from commit(). */
function liveRevertLocal() {
  const ch = diffNodes(); if (!ch) return null;
  for (const id in ch) { const old = ch[id][0]; if (old === null) { delete D.nodes[id]; HIST.committed.delete(id); } else { D.nodes[id] = JSON.parse(old); HIST.committed.set(id, old); } }
  D.sel = D.sel.filter(id => N(id));
  if (Date.now() - LIVE.warned > 4000) { LIVE.warned = Date.now(); toast('This is a view-only link. Ask for an edit link to make changes.'); }
  renderAll();
  return null;
}
