import type { CommandSpec, On, PaneOpenArgs, ResultOf } from 'claude-code'

import { isRecord } from './is-record'
import { loadFile } from './load-file'
import * as Limits from './limits'
import { messageOf } from './message-of'
import * as Names from './names'
import type { PaneModel } from './pane-model'
import { paneModelOf } from './pane-model'
import { sanitizeName } from './sanitize-name'
import { editedPathOf, EDITING_TOOLS } from './tools'
import { paneView } from './view'

/**
 * What `session.start` binds once: the engine calls this plugin's other
 * hooks make, kept behind one narrow surface so a test can stand in for it.
 */
export type Host = {
  readFile: (path: string) => Promise<string>
  invalidate: () => void
  uiLog: (text: string) => void
  openPane: (pane: PaneOpenArgs) => Promise<unknown>
  closePane: (pane: { id: string }) => Promise<void>
  registerCommand: (spec: CommandSpec) => Promise<unknown>
}

/**
 * Registers the file panel: `/fileview <path>` opens or replaces it, run
 * again on the same file (or bare while it is open) closes it, and an
 * `Edit`/`Write`/`NotebookEdit` that lands on the file shown refreshes it.
 *
 * @param on the engine's registrar
 */
export function register(on: On) {
  let host: Host | null = null
  let isPaneOpen = false
  let model: PaneModel | null = null

  function dialogPane(): PaneOpenArgs {
    return {
      id: Names.PANE_ID,
      title: model?.title ?? Names.PANE_ID,
      holdToasts: true,
      focus: true,
      closeOnEscape: true,
    }
  }

  function dockPane(): PaneOpenArgs {
    return { id: Names.PANE_ID, title: model?.title ?? Names.PANE_ID, holdToasts: true }
  }

  async function openPane(engine: Host, isFullscreen: boolean): Promise<boolean> {
    const opened = await engine.openPane(isFullscreen ? dockPane() : dialogPane())
    const isWaiting = isRecord(opened) && opened.isPlaced === false

    if (isWaiting) {
      await engine.closePane({ id: Names.PANE_ID }).catch(() => undefined)

      return false
    }

    isPaneOpen = true

    return true
  }

  async function closePane(engine: Host): Promise<void> {
    await engine.closePane({ id: Names.PANE_ID })
    isPaneOpen = false
  }

  on('session.start', async ($, e, next) => {
    const engine: Host = {
      readFile: path => $.fs.read(path),
      invalidate: () => $.ui.invalidate('ui.render'),
      uiLog: text => $.ui.log(text),
      openPane: pane => $.ui.open(pane),
      closePane: pane => $.ui.close(pane),
      registerCommand: spec => $.command.register(spec),
    }

    host = engine

    try {
      await engine.registerCommand({
        name: Names.COMMAND_NAME,
        description: Names.COMMAND_DESCRIPTION,
        argumentHint: Names.COMMAND_ARGUMENT_HINT,
      })
    } catch (error) {
      engine.uiLog(Names.registerFailedTextOf(sanitizeName(messageOf(error))))
    }

    return next(e)
  })

  on('ui.render', { component: 'Pane' }, async ($, e, next) => {
    if (e.requestId !== Names.PANE_ID || !host || !model) {
      return next(e)
    }

    const { Box, Text, Button, Markdown, Code } = await $.ui.resolve(e)
    const engine = host

    return paneView({ Box, Text, Button, Markdown, Code }, model, {
      toggleMode: () => {
        if (!model) {
          return
        }

        model = { ...model, mode: model.mode === 'rendered' ? 'raw' : 'rendered' }
        engine.invalidate()
      },
    })
  })

  on('command.run', { command: Names.COMMAND_NAME }, async ($, e, next) => {
    if (!host) {
      return next(e)
    }

    const path = e.args.trim()

    if (path === '') {
      if (isPaneOpen) {
        await closePane(host)

        return { text: Names.PANEL_HIDDEN_TEXT }
      }

      return { text: Names.USAGE_TEXT }
    }

    const isSamePath = model !== null && model.path === path

    if (isPaneOpen && isSamePath) {
      await closePane(host)

      return { text: Names.PANEL_HIDDEN_TEXT }
    }

    const loaded = await loadFile(host.readFile, path)

    if (loaded.kind === 'error') {
      return { text: loaded.message }
    }

    const { isFullscreen, columns } = e.presentation

    if (isFullscreen && columns < Limits.OPEN_MIN_COLUMNS) {
      return { text: Names.RESIZE_TERMINAL_TEXT }
    }

    model = paneModelOf(path, loaded, model)

    const isDone = await openPane(host, isFullscreen)

    if (!isDone) {
      return { text: Names.RESIZE_TERMINAL_TEXT }
    }

    host.invalidate()

    return isFullscreen ? { text: Names.showingTextOf(sanitizeName(path)) } : {}
  })

  on('ui.close', { id: Names.PANE_ID }, async ($, e, next) => {
    const result = await next(e)

    if (result.deny === undefined) {
      isPaneOpen = false
    }

    return result
  })

  on('command.run', { command: ['clear', 'resume'] }, async ($, e, next) => {
    const result = await next(e)

    if (host && isPaneOpen) {
      await closePane(host).catch(() => undefined)
    }

    model = null

    return result
  })

  on('tool.call', { tool: EDITING_TOOLS }, async ($, e, next) => {
    let result: ResultOf['tool.call'] | undefined

    try {
      result = await next(e)

      return result
    } finally {
      const hasLanded = result !== undefined && result.deny === undefined && result.isError !== true
      const shown = model

      if (hasLanded && host && isPaneOpen && shown) {
        const editedPath = editedPathOf(e)

        if (editedPath !== undefined && editedPath === shown.path) {
          const engine = host
          const loaded = await loadFile(engine.readFile, shown.path)

          if (loaded.kind === 'text' && model && model.path === shown.path) {
            model = paneModelOf(shown.path, loaded, model)
            engine.invalidate()
          }
        }
      }
    }
  })
}
