import * as Limits from './limits'

/**
 * Text split at character `maxChars`, whole when it already fits — the
 * last resort for one line longer than a `Code`/`Markdown` element allows,
 * since neither may be told to wrap what it is handed.
 *
 * @param text the text to split
 * @param maxChars the most one piece may hold
 * @returns the pieces, in order, covering the whole text
 */
function splitHard(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) {
    return [text]
  }

  const pieces: string[] = []

  for (let start = 0; start < text.length; start += maxChars) {
    pieces.push(text.slice(start, start + maxChars))
  }

  return pieces
}

/**
 * One `Code` element's worth of a file: its text and the 1-based line
 * number its gutter should start counting from.
 */
export type CodeChunk = {
  text: string
  startLine: number
}

/**
 * Splits a file's text into `Code`-sized chunks at line boundaries, so a
 * file past `maxChars` draws as several `Code` elements in a row, each
 * keeping the real file's line numbers in its gutter.
 *
 * A single line longer than `maxChars` is hard-split (`Code` still refuses
 * anything past the limit); that one line's own gutter then repeats its
 * number across its pieces.
 *
 * @param text the file's whole text
 * @param maxChars the most one chunk may hold
 * @returns the chunks, in order, covering the whole text
 */
export function chunkCode(
  text: string,
  maxChars: number = Limits.MAX_ELEMENT_CHARS,
): CodeChunk[] {
  const lines = text.split('\n')
  const chunks: CodeChunk[] = []

  let current: string[] = []
  let currentLen = 0
  let currentStart = 1

  const flush = () => {
    if (current.length > 0) {
      chunks.push({ text: current.join('\n'), startLine: currentStart })
      current = []
      currentLen = 0
    }
  }

  lines.forEach((line, index) => {
    const lineNumber = index + 1
    const joinedLen = current.length === 0 ? line.length : currentLen + 1 + line.length

    if (joinedLen > maxChars && current.length > 0) {
      flush()
    }

    if (line.length > maxChars) {
      flush()

      for (const piece of splitHard(line, maxChars)) {
        chunks.push({ text: piece, startLine: lineNumber })
      }

      currentStart = lineNumber + 1

      return
    }

    if (current.length === 0) {
      currentStart = lineNumber
    }

    current.push(line)
    currentLen = current.length === 1 ? line.length : currentLen + 1 + line.length
  })

  flush()

  return chunks.length > 0 ? chunks : [{ text: '', startLine: 1 }]
}

/**
 * A line that opens or closes a fenced code block (` ``` ` or `~~~`, any
 * indent): markdown chunking never breaks inside one, so a fence's own
 * highlighting never straddles two `Markdown` elements.
 *
 * @param line one line of markdown
 * @returns whether it toggles fence state
 */
const isFenceLine = (line: string) => /^\s*(```|~~~)/.test(line)

/**
 * Splits a markdown file's text into `Markdown`-sized chunks, breaking
 * only between lines outside a fenced code block — except a fence so long
 * alone it would still exceed `maxChars`, cut anyway rather than handed to
 * `Markdown` past what it accepts (that one chunk then opens mid-fence,
 * drawing as plain text until the fence's own close).
 *
 * @param text the file's whole text
 * @param maxChars the most one chunk may hold
 * @returns the chunks, in order, covering the whole text
 */
export function chunkMarkdown(
  text: string,
  maxChars: number = Limits.MAX_ELEMENT_CHARS,
): string[] {
  const lines = text.split('\n')
  const chunks: string[] = []

  let current: string[] = []
  let currentLen = 0
  let inFence = false
  // `currentLen` right after the open fence marker was added: the safety
  // valve below compares against this, not zero, so content accumulated
  // before the fence opened never counts toward its own budget.
  let fenceStartLen = 0

  const flush = () => {
    if (current.length > 0) {
      chunks.push(current.join('\n'))
      current = []
      currentLen = 0
    }
  }

  const push = (line: string) => {
    current.push(line)
    currentLen = current.length === 1 ? line.length : currentLen + 1 + line.length
  }

  for (const line of lines) {
    const joinedLen = current.length === 0 ? line.length : currentLen + 1 + line.length
    const canBreakBefore = !inFence && current.length > 0

    if (joinedLen > maxChars && canBreakBefore) {
      flush()
    }

    if (line.length > maxChars) {
      flush()
      chunks.push(...splitHard(line, maxChars))
    } else {
      push(line)
    }

    if (isFenceLine(line)) {
      inFence = !inFence

      if (inFence) {
        fenceStartLen = currentLen
      }
    }

    if (inFence && currentLen - fenceStartLen > maxChars) {
      // The open fence's own content, past its marker, already exceeds
      // the limit: cut here rather than exceed what `Markdown` accepts.
      // This chunk's fence is left open; the next one draws as plain text
      // until the fence's own close.
      flush()
      inFence = false
    }
  }

  flush()

  return chunks.length > 0 ? chunks : ['']
}
