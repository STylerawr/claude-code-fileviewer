import { messageOf } from './message-of'
import * as Limits from './limits'
import { sanitizeName } from './sanitize-name'

/**
 * A file read for the panel: its shown text, cut to MAX_DISPLAY_CHARS with
 * `isTruncated` set when it was; or, unreadable or not text, the line to
 * answer `/fileview` with instead of opening the panel.
 */
export type LoadedFile =
  | { kind: 'text'; text: string; totalChars: number; isTruncated: boolean }
  | { kind: 'error'; message: string }

/**
 * Reads a file for the panel: rejects nothing itself past what `$.fs.read`
 * already refuses (missing, over 4 MiB), and reads a decoded NUL as the
 * mark of a binary file, since text never carries one.
 *
 * @param readFile `$.fs.read`, or a test's stand-in for it
 * @param path the path as given to `/fileview`
 * @returns the file's text, cut to size, or why it can't be shown
 */
export async function loadFile(
  readFile: (path: string) => Promise<string>,
  path: string,
): Promise<LoadedFile> {
  const name = sanitizeName(path)
  let text: string

  try {
    text = await readFile(path)
  } catch (error) {
    return { kind: 'error', message: `couldn't read ${name}: ${messageOf(error)}` }
  }

  if (text.includes('\0')) {
    return {
      kind: 'error',
      message: `${name} looks like a binary file; nothing to preview`,
    }
  }

  const totalChars = text.length
  const isTruncated = totalChars > Limits.MAX_DISPLAY_CHARS
  const shown = isTruncated ? text.slice(0, Limits.MAX_DISPLAY_CHARS) : text

  return { kind: 'text', text: shown, totalChars, isTruncated }
}
