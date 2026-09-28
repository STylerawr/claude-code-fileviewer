import { describe, expect, test, tier } from 'claude-code/testing'

import * as Fixtures from './fixtures'

tier('user')

describe('register', () => {
  test('/fileview with no path and no panel open answers usage', async ($, on) => {
    Fixtures.world(on, {})

    await $.session.start(Fixtures.SESSION)

    const result = await $.command.run(Fixtures.fileviewCommand(''))

    expect(result.text).toContain('Usage: /fileview')
  })

  test('/fileview <path> opens the panel and shows the file', async ($, on) => {
    const w = Fixtures.world(on, { 'notes.md': '# Hi\n\nBody' })

    await $.session.start(Fixtures.SESSION)

    const result = await $.command.run(Fixtures.fileviewCommand('notes.md'))

    expect(result.text).toEqual('Showing notes.md')
    expect(w.opened.length).toEqual(1)
    expect(w.opened[0]?.id).toEqual('fileview')
  })

  test('running it again on the same file closes the panel', async ($, on) => {
    const w = Fixtures.world(on, { 'notes.md': 'Body' })

    await $.session.start(Fixtures.SESSION)
    await $.command.run(Fixtures.fileviewCommand('notes.md'))

    const result = await $.command.run(Fixtures.fileviewCommand('notes.md'))

    expect(result.text).toEqual('File panel hidden')
    expect(w.closed.length).toEqual(1)
  })

  test('a different path replaces the file without closing the panel', async ($, on) => {
    const w = Fixtures.world(on, { 'a.md': 'A', 'b.md': 'B' })

    await $.session.start(Fixtures.SESSION)
    await $.command.run(Fixtures.fileviewCommand('a.md'))

    const result = await $.command.run(Fixtures.fileviewCommand('b.md'))

    expect(result.text).toEqual('Showing b.md')
    expect(w.opened.length).toEqual(2)
    expect(w.closed.length).toEqual(0)
  })

  test('bare /fileview while the panel is open closes it', async ($, on) => {
    const w = Fixtures.world(on, { 'notes.md': 'Body' })

    await $.session.start(Fixtures.SESSION)
    await $.command.run(Fixtures.fileviewCommand('notes.md'))

    const result = await $.command.run(Fixtures.fileviewCommand(''))

    expect(result.text).toEqual('File panel hidden')
    expect(w.closed.length).toEqual(1)
  })

  test('a missing file answers without opening the panel', async ($, on) => {
    const w = Fixtures.world(on, {})

    await $.session.start(Fixtures.SESSION)

    const result = await $.command.run(Fixtures.fileviewCommand('missing.md'))

    expect(result.text).toContain("couldn't read missing.md")
    expect(w.opened.length).toEqual(0)
  })

  test('a binary file answers without opening the panel', async ($, on) => {
    const w = Fixtures.world(on, { 'app.bin': 'PK\0\0garbage' })

    await $.session.start(Fixtures.SESSION)

    const result = await $.command.run(Fixtures.fileviewCommand('app.bin'))

    expect(result.text).toContain('looks like a binary file')
    expect(w.opened.length).toEqual(0)
  })

  test('too narrow a fullscreen terminal asks to resize instead of opening', async ($, on) => {
    const w = Fixtures.world(on, { 'notes.md': 'Body' })

    await $.session.start(Fixtures.SESSION)

    const result = await $.command.run(
      Fixtures.fileviewCommand('notes.md', { isFullscreen: true, columns: 80 }),
    )

    expect(result.text).toEqual(
      'Resize your terminal to at least 110 columns to show the file panel',
    )
    expect(w.opened.length).toEqual(0)
  })

  test('a narrow non-fullscreen layout still opens the panel inline', async ($, on) => {
    const w = Fixtures.world(on, { 'notes.md': 'Body' })

    await $.session.start(Fixtures.SESSION)

    const result = await $.command.run(
      Fixtures.fileviewCommand('notes.md', { isFullscreen: false, columns: 60 }),
    )

    expect(result.text).toEqual(undefined)
    expect(w.opened.length).toEqual(1)
    expect(w.opened[0]?.focus).toEqual(true)
  })

  test('/clear closes an open panel', async ($, on) => {
    const w = Fixtures.world(on, { 'notes.md': 'Body' })

    on('command.run', { command: 'clear' }, () => ({}))

    await $.session.start(Fixtures.SESSION)
    await $.command.run(Fixtures.fileviewCommand('notes.md'))
    await $.command.run(Fixtures.CLEAR)

    expect(w.closed.length).toEqual(1)
  })

  test('an edit that lands on the shown file refreshes it', async ($, on) => {
    const files: Record<string, string> = { 'notes.md': 'before' }
    const w = Fixtures.world(on, files)

    on('tool.call', () => ({ result: 'done' }))

    await $.session.start(Fixtures.SESSION)
    await $.command.run(Fixtures.fileviewCommand('notes.md'))

    const invalidatedByOpen = w.invalidated
    files['notes.md'] = 'after'

    await $.tool.call({
      tool: 'Edit',
      file_path: 'notes.md',
      old_string: 'before',
      new_string: 'after',
    })

    expect(w.invalidated > invalidatedByOpen).toEqual(true)
  })

  test('an edit on a different file does not refresh the shown one', async ($, on) => {
    const files: Record<string, string> = { 'notes.md': 'before', 'other.md': 'x' }
    const w = Fixtures.world(on, files)

    on('tool.call', () => ({ result: 'done' }))

    await $.session.start(Fixtures.SESSION)
    await $.command.run(Fixtures.fileviewCommand('notes.md'))

    const invalidatedByOpen = w.invalidated

    await $.tool.call({
      tool: 'Edit',
      file_path: 'other.md',
      old_string: 'x',
      new_string: 'y',
    })

    expect(w.invalidated).toEqual(invalidatedByOpen)
  })
})
