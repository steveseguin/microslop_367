# Blueline AI control: message formats

Every transport ends in the same dispatcher, `aiCall(tool, args, context)`. Calls are queued and run one at a time. Before each call, Blueline waits for the designer to finish any drag or text edit in progress.

Editing calls are atomic. If a tool throws, every change it made is rolled back. A successful call becomes one undo entry labelled `AI · <tool>`. Errors carry a `code`:

| Code | Meaning |
| --- | --- |
| `invalid_argument` | Bad or missing arguments, or an unknown argument |
| `not_found` | No layer, component or style with that id or name |
| `unknown_tool` | No tool with that name |
| `read_only` | The designer turned off *Let agents edit* |
| `unavailable` | Something the tool needs is still loading |
| `fetch_failed` | An image URL could not be fetched |
| `tool_error` | Anything else |

Start with `get_capabilities`. It returns the conventions, the spec reference and every input schema (the same content as `tools.json`).

## VDO.Ninja room (all three formats share one connection)

Blueline joins the room as a data-only publisher with the stream id shown in the AI panel (`blueline` by default). It views every other stream it sees listed, and it pins the SDK salt to `vdo.ninja`. Agents must use the same room, the same password and the same salt.

| Preset | Room password | Matches |
| --- | --- | --- |
| ninja-p2p sidecar | `false` (no password) | `ninja-p2p start` |
| VDO.Ninja MCP | SDK default | `vdo_connect` without a password |
| Custom | whatever you type | your own peers |

### 1. ninja-p2p envelopes

Blueline speaks the ninja-p2p `v: 1` envelope:

```json
{ "v": 1, "id": "<unique>", "type": "command", "from": { "streamId": "claude", "role": "agent", "name": "Claude", "instanceId": "…" },
  "to": "blueline", "topic": null, "ts": 1760000000000,
  "payload": { "command": "update", "args": { "id": "<layer id>", "props": { "fill": "#E5484D" } } } }
```

The reply is a `command_response` addressed back to the sender:

```json
{ "type": "command_response", "payload": { "requestId": "<the command's id>", "ok": true, "result": { … } } }
{ "type": "command_response", "payload": { "requestId": "…", "ok": false, "error": "not_found: id: no layer with id …" } }
```

- **Commands:** any tool name. `help`, `profile`/`whoami`, `status` and `capabilities` are built in. `call` with `{ "tool": "...", "args": {...} }` also works.
- **Arguments:** an object, or a JSON string (which is how the CLI passes them).
- **Images:** `screenshot` and `export` to PNG/JPG reply with `{ "file": "<name>", ... }` and send the image as `file_offer`, `file_chunk` and `file_complete`. These are ninja-p2p's own messages: 12 000-byte chunks, base64, with a sha256 hex digest. The sidecar saves the image to its inbox.
- **Announcements:** on every new data channel, Blueline sends an `announce` whose `payload.agent.asks` lists every tool with an example CLI line. When *Let agents edit* is toggled it sends a `skill_update`.
- **Designer edits:** when *Tell agents when I change something* is on, edits are broadcast after 900 ms of quiet as an `event` on topic `design`: `{ kind: "design_changed", changed: [ids], removed: [ids], selection: [ids] }`.
- **Chat:** messages from agents (`type: "chat"`, `payload.text`) appear in the AI panel and as a toast. The designer's messages go out the same way.
- **Ping:** `ping` gets a `pong`.

### 2. JSON-RPC 2.0 (what `vdo_send` from @vdoninja/mcp carries)

```json
{ "jsonrpc": "2.0", "id": 1, "method": "find_nodes", "params": { "query": "button" } }
→ { "jsonrpc": "2.0", "id": 1, "result": { "matches": [ … ] } }
→ { "jsonrpc": "2.0", "id": 1, "error": { "code": -32602, "message": "…", "data": { "code": "invalid_argument" } } }
```

- **Methods:** any tool name. The MCP-shaped methods `initialize`, `tools/list` and `tools/call` (`params: { name, arguments }`) are also accepted. `tools/call` replies with MCP content; screenshots come back as an `image` content block.
- **Large replies:** a reply longer than 60 000 characters is split into `{ "jsonrpc": "2.0", "id": 1, "partial": { "index": i, "count": n, "data": "<slice>" } }`. Concatenate the `data` strings in order and JSON-parse the result. To avoid splitting, keep screenshots at `max_size` 512–768.

### 3. SDK request / onRequest

Blueline registers one handler per tool, plus a generic `blueline` handler:

```js
const tree = await vdo.request('get_tree', { depth: 2 }, blueUuid, 10000);
const res  = await vdo.request('blueline', { tool: 'create', args: { spec: { type: 'rect', w: 80, h: 80 } } }, blueUuid, 10000);
```

Tool errors reject the request with the error message.

## In the browser

### window.blueline

```js
await blueline.call('create', { spec: { type: 'text', text: 'Hi' } });
blueline.tools();            // manifest
blueline.spec();             // selection (or page) as specs
blueline.outline();          // indented text
blueline.html(frameId);      // standalone HTML document
blueline.tokens();           // { tokens, css }
await blueline.screenshot('page', 768);   // data URL
blueline.onChange(({ ids, ai }) => …);
```

### postMessage (opt-in)

The page that embeds Blueline sends a message, and Blueline replies to `event.source` with the sender's origin:

```js
frame.contentWindow.postMessage({ type: 'blueline:call', id: 7, tool: 'get_document', args: {} }, '*');
// ← { type: 'blueline:result', id: 7, ok: true, result: { … } }
```

JSON-RPC 2.0 messages are accepted here too. Until the designer ticks *Accept postMessage control* in the AI panel, every call is answered with `not_enabled`.

### WebMCP

When the browser exposes `document.modelContext` (Chrome's WebMCP origin trial) or `navigator.modelContext` (polyfills such as MCP-B), every tool is registered with its schema and a `readOnlyHint`. Results are returned as JSON text.
