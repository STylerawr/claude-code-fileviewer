import { isRecord } from './is-record'

/**
 * The tools whose success can change a file the panel might be showing.
 */
export const EDITING_TOOLS = ['Edit', 'Write', 'NotebookEdit'] as const

/**
 * The path an editing tool's call names: `file_path` for `Edit` and
 * `Write`, `notebook_path` for `NotebookEdit` — read loosely (an `unknown`,
 * checked at runtime) since the matcher narrows `e` to a discriminated
 * union of the three tools' own shapes, none declaring an index signature.
 *
 * @param e the `tool.call` event, its own arguments flattened onto it
 * @returns the path, or undefined when the tool or the call names none
 */
export function editedPathOf(e: unknown): string | undefined {
  if (!isRecord(e) || typeof e.tool !== 'string') {
    return undefined
  }

  const key = e.tool === 'NotebookEdit' ? 'notebook_path' : 'file_path'
  const value = e[key]

  return typeof value === 'string' ? value : undefined
}
