# Dominion — TODO

## 1. TypeScript Audit & Fix

| File | Error | Fix |
|---|---|---|
| All `*.store.ts` (session, terminal, window, settings) | Zustand + immer `setState` returns `void`, not `Partial<State>` | Add `immer` middleware to the store, or wrap mutations with `produce()` |
| `features/fs/components/DiffView.tsx:3-4` | Wrong relative import paths (`../features/fs/...` from inside `features/fs/`) | Fix to `../fs.service` and `../../lib/utils` |
| `components/EmptyState.tsx`, `components/TitleBar.tsx` | `Cannot find module '*.png'` | Add `src/renderer/env.d.ts` with `declare module '*.png'` |
| `tsconfig.node.json` | `bundler` moduleResolution incompatible with current `module` setting | Change to `module: preserve` or switch moduleResolution to `node16` |
| `renderer/lib/ipc.ts` | Imports preload file outside `tsconfig.web.json` include scope | Use a shared types-only import instead of importing preload directly |

---

## 2. Markdown Preview

Add a markdown viewer in the file viewer panel when clicking `.md` files.

- **Parser**: `marked` (simpler) — already have `shiki` for code block syntax highlighting
- **Dark mode styles**: custom CSS matching app's zinc/brand palette (GH dark theme as reference)
- **Component**: `MarkdownPane.tsx` in `features/fs/components/` backed by `useMarkdownPane` hook
- **Toggle**: preview / raw toggle button in the pane header

---

## 3. Cross-Platform Build & Distribution

Targets:
- **Windows** — NSIS installer (`.exe`) + portable
- **Mac** — DMG + `.app`
- **Linux** — AppImage + `.deb` (both; `.deb` is friendliest for Ubuntu testers)

Steps:
1. Install `electron-builder` as a dev dep
2. Add `build` config block to `package.json` (appId, productName, icons, targets)
3. Add platform icons: `logo.ico` (Windows), `logo.icns` (Mac), `logo.png` already exists for Linux
4. Wire scripts: `"dist"`, `"dist:win"`, `"dist:mac"`, `"dist:linux"`
5. Add `asarUnpack` entry for `node-pty` native module — required or the packaged app will crash
6. Set up GitHub Actions CI: Windows runner + ubuntu-latest + macos-latest for cross-platform builds

> Note: cross-compiling Linux from Windows requires a Linux CI runner or Docker.
> GitHub Actions `ubuntu-latest` produces both AppImage and .deb without a local Linux machine.

---

## 4. Claude Session Resume on Reconnect

When restoring a saved session, automatically run `claude /resume <session-id>` so the agent picks up exactly where it left off instead of starting fresh.

- **How `claude /resume` works**: Claude CLI accepts a `--resume <conversation-id>` flag (or `/resume` as a slash command) that restores the previous conversation context
- **Where to hook in**: `session-service.ts` `createSession` — if a saved session has a stored `claudeConversationId`, append `--resume <id>` to the spawn args
- **Storage**: persist `claudeConversationId` in the session metadata (already goes through `persistence-store`) — need to capture it from the terminal output or let the user set it manually
- **Open question**: Claude CLI prints the conversation ID on startup — could parse it from early PTY output and auto-save it to the session meta

---

## 5. Tab Color Coding & Rename

Let users color-code tabs and rename them inline so sessions are easy to identify at a glance.

- **Rename**: double-click the tab label → inline `<input>` replaces the text, Enter/blur to confirm → IPC `session:rename` → updates `SessionMeta.name` in the registry and broadcasts `session:meta-update`
- **Color picker**: right-click tab (or via pane context menu) → small color swatch grid (8–12 brand-safe colors) → stores `color` on `SessionMeta`
- **Tab rendering**: left border or background tint uses the session color — needs to be added to `SessionTab.tsx` and `PaneHeader` in `App.tsx`
- **Persistence**: `color` and `name` saved to `persistence-store` alongside the rest of session layout

---

## 6. Agent Activity Indicator on Tabs

Show at a glance whether a Claude agent is actively running inside a session.

- **Detection**: parse PTY output stream for Claude's "thinking" / activity patterns — e.g. the spinner characters or known output prefixes Claude emits while working. Flag goes on `SessionMeta` as `agentStatus: 'idle' | 'running' | 'waiting-input'`
- **Where to detect**: `PtyProcess.onData` in `pty-process.ts` — run a lightweight regex against each chunk, emit `session:agent-status` IPC event when state changes
- **Tab indicator**: animated pulse dot on `SessionTab.tsx` — green pulse = agent running, yellow = waiting for input, grey = idle. Already have the pulse dot in `PaneHeader`, wire the same pattern into the tab strip
- **Pane header**: `PaneHeader` in `App.tsx` already has a status dot — extend it to reflect `agentStatus` with distinct colors

---

## 7. Diff & Change Review View

A dedicated panel for reviewing code changes in isolation — diffs, staged/unstaged hunks, easy accept/reject.

- **Trigger**: button in the file tree toolbar or command palette action → opens a diff view panel alongside or replacing the file viewer
- **Data source**: run `git diff` (or `git diff --staged`) via IPC `fs:exec-git` → parse unified diff output into hunks
- **Rendering**: side-by-side or unified view — already have `DiffView.tsx` as a starting point, expand it to handle full file diffs with hunk navigation
- **Hunk navigation**: prev/next hunk keybinds, jump-to-file in the file tree
- **Future**: stage/unstage individual hunks (`git apply --cached`), inline comments

---

## 8. File Tree Context Menu

Right-click on any file in the tree to get a context menu with quick actions.

**"Open In" submenu** — lists detected installed editors, opening the file directly:
- VS Code (`code <path>`)
- Zed (`zed <path>`)
- Cursor (`cursor <path>`)
- Sublime Text (`subl <path>`)
- Notepad++ (Windows only — `notepad++ <path>`)
- System default (`shell.openPath(path)` via Electron)
- Detection: probe common install locations + `PATH` at startup, cache the list; on Mac also check `/Applications`

**"Preview" option** — only shown for `.md` files — opens the markdown preview pane (ties into todo #2)

**Other actions**:
- Copy relative path
- Copy absolute path
- Reveal in Explorer / Finder (`shell.showItemInFolder`)
- Rename (inline, same pattern as tab rename)
- Delete (with confirmation)

**Implementation**:
- `FileTreeContextMenu.tsx` in `features/fs/components/` — same portal + fixed-position pattern as `PaneContextMenu`
- `useInstalledEditors.ts` hook — probes on mount, returns `{ name, command }[]`
- IPC handler `fs:open-in-editor` → main process `shell.openExternal` or `exec` the editor command

---

## Order of Attack

1. TypeScript errors first — they block the build step
2. Tab color coding & rename (self-contained UI change)
3. Agent activity indicator (requires PTY output parsing)
4. Markdown preview + file tree context menu "Preview" (do together)
5. File tree context menu — Open In + copy path + reveal
6. Diff & change review view
7. Claude session resume (needs more investigation on conversation ID capture)
8. Packaging + CI
