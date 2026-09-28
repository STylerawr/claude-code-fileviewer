/**
 * The one pane this plugin opens; its `requestId` at `ui.render`, and the
 * id `ui.open`/`ui.close` take.
 */
export const PANE_ID = 'fileview'

/**
 * The slash command this plugin serves.
 */
export const COMMAND_NAME = 'fileview'

/**
 * What the typeahead and `/help` show for `/fileview`.
 */
export const COMMAND_DESCRIPTION = 'Show a file in a panel beside the transcript'

/**
 * The hint drawn dim after the command's name.
 */
export const COMMAND_ARGUMENT_HINT = '<path>'

/**
 * `/fileview`'s answer with no path given and no panel already open.
 */
export const USAGE_TEXT =
  'Usage: /fileview <path> — shows the file in a panel; run it again on the ' +
  'same file, or bare while the panel is open, to hide it'

/**
 * The transcript line when the panel closes.
 */
export const PANEL_HIDDEN_TEXT = 'File panel hidden'

/**
 * `/fileview`'s answer on a terminal too narrow to dock the panel beside
 * the transcript (the diff panel's own minimum).
 */
export const RESIZE_TERMINAL_TEXT =
  'Resize your terminal to at least 110 columns to show the file panel'

/**
 * The transcript line when `/fileview` could not be registered — another
 * plugin already serves the name.
 *
 * @param reason the refusal's message
 * @returns the line
 */
export const registerFailedTextOf = (reason: string) =>
  `could not register /fileview: ${reason}; the file panel is unavailable ` +
  'this session'

/**
 * `/fileview`'s answer once the panel opened with a new file, on a
 * fullscreen layout (a docked panel says nothing else; the inline dialog
 * draws its own title and needs no line).
 *
 * @param path the path as given, sanitized for the transcript
 * @returns the line
 */
export const showingTextOf = (path: string) => `Showing ${path}`

/**
 * The note drawn under a file cut short at MAX_DISPLAY_CHARS: the pane
 * shows only the file's start, past which nothing was read.
 *
 * @param shown how many characters are drawn
 * @param total the file's whole length
 * @returns the note
 */
export const truncatedNoteOf = (shown: number, total: number) =>
  `Showing the first ${shown} of ${total} characters; the rest was left out.`
