/**
 * The terminal width from which the panel docks beside the transcript
 * (the diff panel's own minimum); narrower, `/fileview` asks for more room
 * instead of opening.
 */
export const OPEN_MIN_COLUMNS = 110

/**
 * The most characters one `Code` or `Markdown` element may carry (the
 * engine's own limit on both); past it a file's content is split across
 * several elements, at a line boundary.
 */
export const MAX_ELEMENT_CHARS = 10_000

/**
 * The most characters of a file shown in the panel; the rest is left out
 * with a note, so a huge file never draws thousands of chunked elements.
 */
export const MAX_DISPLAY_CHARS = 1_000_000
