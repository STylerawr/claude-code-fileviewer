# fileview

A Claude Code [mod](https://github.com/anthropics/claude-code/tree/main/mods)
(a plugin whose behaviour lives in a hooks module), modeled directly on the
built-in `/diff` mod's own source. `/fileview <path>` opens a panel beside
the transcript showing that one file's content: markdown rendered by
default (a button switches it to raw source), everything else syntax
highlighted. Run it again on the same file — or bare, while the panel is
open — to hide it; a different path replaces what is shown without closing
the panel. The panel refreshes itself when Claude's own `Edit`, `Write` or
`NotebookEdit` lands on the file currently shown.

Mods are early access: hooks modules load only where function hooks are
turned on, and the API they are written against may change between
releases without notice.

## Try it

```sh
CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1 claude --plugin-dir /path/to/claude-code-fileviewer
```

then, inside a session, `/fileview README.md` (or any other file).

## What it hooks

| event | what the hook does |
| --- | --- |
| `session.start` | Binds the engine once and registers `/fileview`. |
| `ui.render` of `Pane` | Draws the panel: a header (name, line count, and for markdown a raw/rendered toggle) and the file's content as one or more `Markdown` or `Code` elements. |
| `command.run` of `fileview` | Reads the path, opens or replaces the panel's content, or closes it when the same path is given while it is open (or the command is run bare). |
| `ui.close` of the panel | Tracks whether the panel is open. |
| `command.run` of `clear`, `resume` | Closes the panel and forgets what was shown. |
| `tool.call` of `Edit`, `Write`, `NotebookEdit` | After an edit that landed on the path currently shown, re-reads it and redraws. |

## What it calls on `$`

`command.register`, `fs.read`, `ui.close`, `ui.invalidate`, `ui.log`,
`ui.open`, `ui.resolve`.

## Layout

`hooks/register.ts` is the module `hooks/hooks.json` names; everything
else under `hooks/` is its parts:

- `names.ts`, `limits.ts` — the panel's text and numeric constants
- `path-utils.ts`, `sanitize-name.ts`, `is-record.ts`, `message-of.ts` —
  small pure helpers, in the same shape the `diff` mod's own use
- `load-file.ts` — reads a file through `$.fs.read`, and reads a decoded
  NUL as the mark of a binary file, since text never carries one
- `chunk-text.ts` — splits a file's text into `Code`- or `Markdown`-sized
  pieces (10,000 characters is the most either element accepts), at a line
  boundary, and for markdown never inside a fenced code block
- `pane-model.ts` — the panel's state for one open file
- `tools.ts` — which editing tool's call names which path
- `view.ts` — the panel's render tree, built directly from the element
  constructors `$.ui.resolve` hands out (no JSX: every constructor is a
  plain function from props to a `RenderElement`)

`types/claude-code.d.ts` is the engine's own declaration file, copied from
[`anthropics/claude-code`](https://github.com/anthropics/claude-code)'s
`mods/types/`, kept here so `hooks/` and `tests/` typecheck against it.

## Verifying

```sh
npm install
npm run typecheck
```

`tests/` is written against `claude-code/testing` (`describe`/`test`/
`expect`/`tier`), the same harness the `diff` mod's own tests use, and is
meant to run with `claude plugin test .` once that command ships to this
build. `chunk-text.test.ts` covers the chunking helpers directly, no
engine needed; `register.test.ts` drives `/fileview` through
`$.session.start`/`$.command.run`/`$.tool.call` against a small in-memory
filesystem (`tests/fixtures.ts`).
