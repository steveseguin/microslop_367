# Blueline

A design tool that runs entirely in the browser: vector editing, frames and auto layout, components with overrides, boolean operations, prototyping, and PNG / JPG / SVG / HTML export. Files live in the browser's IndexedDB. There is no backend, so it hosts anywhere static files do, including GitHub Pages.

AI agents can read and edit the open file, from another machine or from inside the browser, through one set of 36 tools.

## OfficeNinja integration

Blueline is the design editor in [OfficeNinja](https://microslop.xyz/), served at `/blueline/`. Use the workspace launcher to create a blank design, or the recent-file list to reopen one. Direct links use `?id=<local-file-id>`; those files exist only in the browser that saved them. Export a `.blueline` file to move a design to another device. Opening `/blueline/` without parameters resumes the last design or shows the starter example.

The suite navigation saves before switching apps. Light/dark preferences use `officeninja_theme` across all four tools. Designs retain the original `blueline` IndexedDB database and file format; the workspace reads its metadata and can delete a design after confirmation.

From `suite/`, run `npm run dev` or `npm run build:pages`. Both rebuild Blueline from `src/` using `scripts/build-blueline.mjs`; the latter also publishes the complete suite to the repository's `docs/` directory for GitHub Pages. `python build.py` remains a convenience wrapper. Generated `suite/public/blueline/` is ignored; edit the sources here instead.

`index.html` is the built editor. Two scripts come from jsDelivr at runtime: paper.js (boolean operations, SVG import) and, only when you connect an agent, the VDO.Ninja SDK. Fonts load from Google Fonts. AI transport permissions are unchanged and connections remain opt-in.

## Letting an AI drive it

Every transport below calls the same tool layer (`src/12-ai.js`). Tools take a JSON object and return JSON. Each editing call becomes one undo step labelled `AI · <tool>`. The layers an agent changed flash on the canvas, and every call is listed in the AI panel's activity log.

| Where the agent runs | How it connects | Setup |
| --- | --- | --- |
| Another machine or a CLI agent (Claude Code, Codex…) | [ninja-p2p](https://github.com/steveseguin/ninja-p2p) room over VDO.Ninja | Open the **AI** panel, pick *ninja-p2p sidecar*, Connect, copy the snippet |
| Any MCP client | [@vdoninja/mcp](https://github.com/steveseguin/ninjamcp) `vdo_send` / `vdo_receive` with JSON-RPC | Pick *VDO.Ninja MCP* in the AI panel |
| Your own code (browser or Node) | [@vdoninja/sdk](https://github.com/steveseguin/ninjasdk) `request(tool, args, uuid)` | See `examples/agent-node.mjs` |
| An agent built into the browser | WebMCP (`document.modelContext`), registered automatically when the browser offers it | Nothing to do |
| Playwright, an extension, the console | `window.blueline.call(tool, args)` | Nothing to do |
| A page that embeds Blueline in an iframe | `postMessage` | Turn on *Accept postMessage control* in the AI panel; see `examples/embed.html` |

Only the VDO.Ninja handshake goes through VDO.Ninja's signaling server. Tool calls and results travel over an encrypted WebRTC data channel between the agent and the browser tab.

### Quick start with ninja-p2p

In Blueline: **AI → Connect** (it generates a private room), then copy the snippet. On the agent's machine:

```bash
npm install -g @vdoninja/ninja-p2p @roamhq/wrtc
ninja-p2p start --room <room from Blueline> --id claude
ninja-p2p command --id claude blueline get_capabilities
ninja-p2p command --id claude blueline get_tree '{"depth":2,"format":"outline"}'
ninja-p2p command --id claude blueline screenshot '{"target":"page","max_size":768}'
ninja-p2p read --id claude --take 10
```

Commands are tool names and their arguments are JSON. Over ninja-p2p, screenshots and image exports arrive as files in the agent's inbox, using ninja-p2p's own file-transfer messages with sha256 checks. The agent can then open them like any image. Blueline also announces an agent profile listing every tool, so `ninja-p2p peers` and `capabilities` show what it can do. Chat messages in either direction appear in the AI panel's **Chat** tab.

### Quick start with the VDO.Ninja MCP

```text
vdo_connect {"room":"<room>","stream_id":"claude","target_stream_id":"blueline"}
vdo_send    {"session_id":"<id>","data":{"jsonrpc":"2.0","id":1,"method":"get_capabilities"}}
vdo_receive {"session_id":"<id>","wait_ms":3000}
```

`method` can be any tool name, or the MCP-shaped `tools/list` and `tools/call`. Replies longer than 60 KB come back as numbered `partial` messages; join their `data` strings and parse the result. Pick the *VDO.Ninja MCP* preset in Blueline so both sides use the SDK's default room password. The *ninja-p2p* preset uses no password, matching `ninja-p2p start`.

The room password and salt must match on both ends. Blueline pins the salt to `vdo.ninja`, the value Node agents use; in a browser the SDK would otherwise salt with the page's hostname.

## The tools

Read with `get_capabilities` (always first), `get_document`, `get_tree` (`format: "outline"` is the cheapest), `get_nodes`, `find_nodes`, `get_selection`, `list_components`, `list_styles`, `screenshot` and `export`.

Change things with `create`, `update`, `delete`, `move`, `duplicate`, `group`, `ungroup`, `wrap_in_frame`, `boolean`, `flatten`, `mask`, `create_component`, `detach_instance`, `reset_overrides`, `align`, `distribute`, `reorder`, `import_svg`, `create_style`, `pages`, `undo` and `redo`.

Talk to the designer with `select`, `view` and `notify`. `batch` runs several calls as one undo step. Later steps can refer to earlier results as `"$0"`, `"$1"`, or `"$0.created.Card/Title"`. If any step fails, the whole batch rolls back.

`tools.json` holds every tool's JSON schema, the conventions, and the spec reference.

### The layer spec

`create` takes, and `export {format:"spec"}` returns, the same compact JSON. An agent can read a frame, change it, and send it back.

```json
{
  "type": "frame", "name": "Card", "w": 320, "fill": "#FFFFFF", "radius": 16,
  "layout": { "mode": "column", "gap": 8, "padding": 20 },
  "effects": [{ "type": "drop-shadow", "y": 6, "blur": 18, "color": "#1B243014" }],
  "children": [
    { "type": "text", "text": "Ridge Loop", "font": { "family": "Inter", "size": 18, "weight": 600 }, "color": "#1B2430" },
    { "type": "rect", "h": 120, "sizing": { "w": "fill" }, "radius": 10,
      "fill": { "type": "linear", "angle": 120, "stops": [[0, "#8CC9A6"], [1, "#1F6B4F"]] } },
    { "type": "instance", "component": "Button/Primary", "overrides": { "Label": { "text": "Start hike" } } }
  ]
}
```

- **Types:** frame, group, component, instance, rect, image, ellipse, polygon, star, line, arrow, vector (SVG path data), text, boolean.
- **Coordinates:** CSS pixels relative to the parent.
- **Colors:** hex, with an optional alpha byte.
- **Auto layout:** children of an auto layout frame ignore x/y and use `sizing` instead.
- **Instances:** layers inside an instance take only overrides.
- **Round trip:** exporting a frame and creating it again reproduces it exactly. The test suite checks this.

## AI-friendly exports

Open the AI panel's **Export** tab, or add an HTML / Spec JSON export setting to any layer.

- **Copy for AI:** Markdown with an outline, design tokens, and the editable spec. Paste it into any chat.
- **Spec JSON:** the format above.
- **Outline:** an indented text tree with sizes, layout, colors, and ids.
- **HTML + CSS:** a standalone page per frame. Auto layout becomes flexbox, vectors become inline SVG, and fonts load from Google Fonts.
- **Design tokens:** color and text styles in DTCG JSON, plus CSS variables.
- **Tool manifest:** the same content as `tools.json`.

## Security model

- **Connecting:** nothing connects until the designer clicks **Connect**. An invite link (`#ai-room=…`, kept in the URL fragment so it never reaches a server log) only fills in the form. It shows a warning and still needs the click.
- **Who can edit:** anyone in the room can call tools, so rooms are random 24-hex-character names by default. Add a password for more.
- **Read-only:** untick *Let agents edit* to allow reading and exporting but not editing.
- **Embedding:** `postMessage` control is off until the designer turns it on. WebMCP access is mediated by the browser.
- **Scope:** tools can only touch the open design file. There is no file system, network or script evaluation behind them.

## Layout

```
index.html        built app (the only file Pages needs)
build.py          concatenates src/ into index.html
tools.json        tool schemas + spec reference for agents
llms.txt          short orientation for LLMs
docs/ai-control.md  transport details and message formats
examples/         Node agent over the SDK, iframe embedding demo
src/              01-util … 11-app (editor), 12-ai (tools, spec, exports), 13-remote (transports, AI panel)
```

Third-party code loads from CDNs unmodified: paper.js (MIT) and the VDO.Ninja SDK (MPL-2.0).
