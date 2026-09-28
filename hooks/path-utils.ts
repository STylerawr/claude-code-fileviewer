/**
 * A path's last segment, `/` or `\` separated: the file's own name.
 *
 * @param path the path as given to `/fileview`
 * @returns the base name, or the path itself when it has no separator
 */
export const baseNameOf = (path: string) =>
  path.replace(/[/\\]+$/, '').split(/[/\\]/).at(-1) || path

/**
 * A path's extension, lowercase and dot included (`.md`); empty when its
 * name has none or starts with the dot (`.gitignore`).
 *
 * @param path the path as given to `/fileview`
 * @returns the extension
 */
export const extNameOf = (path: string) => {
  const name = baseNameOf(path)
  const at = name.lastIndexOf('.')

  return at > 0 ? name.slice(at).toLowerCase() : ''
}

/**
 * The extensions drawn rendered (as `Markdown`) instead of as source.
 */
const MARKDOWN_EXTENSIONS = new Set(['.md', '.markdown', '.mdx'])

/**
 * Whether a path's extension marks it as markdown.
 *
 * @param path the path as given to `/fileview`
 * @returns whether it is markdown
 */
export const isMarkdownPath = (path: string) => MARKDOWN_EXTENSIONS.has(extNameOf(path))
