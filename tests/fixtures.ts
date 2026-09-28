import type { Args, CommandRunInput, On, SessionStartInput } from 'claude-code'

/**
 * An interactive terminal session in /work.
 */
export const SESSION: SessionStartInput = {
  surface: 'terminal',
  isInteractive: true,
  cwd: '/work',
}

/**
 * `/fileview <args>`, as the person types it, on a fullscreen terminal wide
 * enough to dock the panel unless a narrower `presentation` is given.
 *
 * @param args everything after the command's name, as typed
 * @param presentation the layout and width `/fileview` runs under
 * @returns the command.run input
 */
export function fileviewCommand(
  args: string,
  presentation: { isFullscreen: boolean; columns: number } = { isFullscreen: true, columns: 160 },
): CommandRunInput {
  return {
    command: 'fileview',
    args,
    origin: { kind: 'composer' },
    presentation,
  }
}

/**
 * The command that starts the conversation over, as the person types it.
 */
export const CLEAR: CommandRunInput = {
  command: 'clear',
  args: '',
  origin: { kind: 'composer' },
  presentation: { isFullscreen: true, columns: 160 },
}

/**
 * What one test's world kept: every pane opened, closed, and line logged.
 */
export type World = {
  opened: Args<'ui.open'>[]
  closed: Args<'ui.close'>[]
  logged: string[]
  invalidated: number
}

/**
 * Answers, beneath the plugin under test, everything `register` calls:
 * `$.fs.read` from a fixed set of files, `$.ui.open`/`close`/`invalidate`/
 * `log`, and `$.command.register`.
 *
 * @param on the test's own registrar, beneath the plugin under test
 * @param files the paths `$.fs.read` can answer, by their text
 * @returns what the world kept, so a test can assert on it
 */
export function world(on: On, files: Readonly<Record<string, string>>): World {
  const kept: World = { opened: [], closed: [], logged: [], invalidated: 0 }

  on('fs.read', ($, e) => {
    const text = files[e.path]

    return text === undefined
      ? { deny: `ENOENT: no such file, open '${e.path}'` }
      : { value: text }
  })

  on('ui.open', ($, e) => {
    kept.opened.push(e)

    return { value: undefined }
  })

  on('ui.close', ($, e) => {
    kept.closed.push(e)

    return { value: undefined }
  })

  on('ui.invalidate', () => {
    kept.invalidated += 1

    return { value: undefined }
  })

  on('ui.log', ($, e) => {
    kept.logged.push(e.text)

    return { value: undefined }
  })

  on('command.register', ($, e) => ({ value: { command: e.name } }))

  return kept
}
