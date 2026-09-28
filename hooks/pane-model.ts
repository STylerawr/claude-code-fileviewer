import { baseNameOf, isMarkdownPath } from './path-utils'
import type { LoadedFile } from './load-file'

/**
 * How a markdown file draws: `rendered` (the default) through `Markdown`,
 * or `raw` through `Code` — the panel's raw/rendered toggle. Every other
 * file always draws as `Code`; the field still holds `raw` for it, unread.
 */
export type ViewMode = 'rendered' | 'raw'

/**
 * The panel's whole state for one open file.
 */
export type PaneModel = {
  /** The path as given to `/fileview`, and to `$.fs.read`. */
  path: string
  /** The path's last segment, the panel's tab title. */
  title: string
  /** Whether the path's extension marks it markdown. */
  isMarkdown: boolean
  /** Ignored for a file that is not markdown, which always draws as `Code`. */
  mode: ViewMode
  /** The file's text, already cut to MAX_DISPLAY_CHARS. */
  text: string
  /** The file's whole length before any cut. */
  totalChars: number
  /** Whether `text` is short of `totalChars`. */
  isTruncated: boolean
  /** `text`'s line count, for the header. */
  lineCount: number
}

/**
 * Builds the panel's state for a freshly read file, carrying the raw/
 * rendered choice over when it is the same path shown again (a refresh
 * after Claude's own edit, or the person reopening what they last had).
 *
 * @param path the path as given to `/fileview`
 * @param loaded the file, already read
 * @param previous the panel's last state, or null when nothing was shown
 * @returns the panel's new state
 */
export function paneModelOf(
  path: string,
  loaded: Extract<LoadedFile, { kind: 'text' }>,
  previous: PaneModel | null,
): PaneModel {
  const isMarkdown = isMarkdownPath(path)
  const keepsMode = previous !== null && previous.path === path
  const mode: ViewMode = keepsMode ? previous.mode : isMarkdown ? 'rendered' : 'raw'

  return {
    path,
    title: baseNameOf(path),
    isMarkdown,
    mode,
    text: loaded.text,
    totalChars: loaded.totalChars,
    isTruncated: loaded.isTruncated,
    lineCount: loaded.text === '' ? 0 : loaded.text.split('\n').length,
  }
}
