import type { ElementTable, RenderElement } from 'claude-code'

import { chunkCode, chunkMarkdown } from './chunk-text'
import * as Limits from './limits'
import * as Names from './names'
import type { PaneModel } from './pane-model'
import { sanitizeName } from './sanitize-name'

/**
 * The element constructors the panel draws with, destructured from the
 * table `$.ui.resolve(e)` hands the render hook.
 */
export type Ui = Pick<
  ElementTable<'terminal' | 'desktop'>,
  'Box' | 'Text' | 'Button' | 'Markdown' | 'Code'
>

/**
 * What the panel's controls run.
 */
export type PaneActions = {
  toggleMode: () => void
}

/**
 * The file panel's body for one `ui.render`: a header with the file's
 * name and line count and, for markdown, a raw/rendered toggle; the
 * content itself as one or more `Markdown` or `Code` elements; a note
 * when the file was cut short.
 *
 * @param ui the elements `$.ui.resolve(e)` handed the hook
 * @param model the panel's state
 * @param actions what its controls run
 * @returns the tree
 */
export function paneView(ui: Ui, model: PaneModel, actions: PaneActions): RenderElement {
  const { Box, Text, Button, Markdown, Code } = ui
  const name = sanitizeName(model.title)
  const lineWord = model.lineCount === 1 ? 'line' : 'lines'

  const header = Box({
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 1,
    children: [
      Text({
        wrap: 'truncate-end',
        children: [name, Text({ dimColor: true, children: `  ${model.lineCount} ${lineWord}` })],
      }),
      model.isMarkdown
        ? Button({
            label: model.mode === 'rendered' ? 'raw' : 'rendered',
            hotkey: 'r',
            dimColor: true,
            onPress: actions.toggleMode,
          })
        : null,
    ],
  })

  const showsMarkdown = model.isMarkdown && model.mode === 'rendered'

  const body: RenderElement[] = showsMarkdown
    ? chunkMarkdown(model.text, Limits.MAX_ELEMENT_CHARS).map(chunk => Markdown({ text: chunk }))
    : chunkCode(model.text, Limits.MAX_ELEMENT_CHARS).map(chunk =>
        Code({ source: chunk.text, path: model.path, startLine: chunk.startLine }),
      )

  const footer = model.isTruncated
    ? Text({
        dimColor: true,
        children: Names.truncatedNoteOf(model.text.length, model.totalChars),
      })
    : null

  return Box({
    flexDirection: 'column',
    paddingX: 1,
    children: [header, ...body, footer],
  })
}
