/**
 * A path or message made safe to draw as a name: tabs become spaces, and
 * every control, format and default-ignorable character is dropped, so
 * nothing invisible in a path someone typed or a filesystem error can
 * reorder, hide or pad the transcript line it lands in.
 *
 * @param text the path or message as given or as the filesystem raised it
 * @returns the drawable text
 */
export const sanitizeName = (text: string) =>
  text
    .replaceAll('\t', '  ')
    .replace(/[\p{Cc}\p{Cf}\p{Default_Ignorable_Code_Point}]/gu, '')
