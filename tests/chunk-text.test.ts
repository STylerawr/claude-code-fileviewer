import { describe, expect, test, tier } from 'claude-code/testing'

import { chunkCode, chunkMarkdown } from '../hooks/chunk-text'

tier('user')

describe('chunkCode', () => {
  test('text under the limit is one chunk starting at line 1', () => {
    const chunks = chunkCode('a\nb\nc', 100)

    expect(chunks).toEqual([{ text: 'a\nb\nc', startLine: 1 }])
  })

  test('text past the limit splits at a line boundary, gutters kept', () => {
    const text = ['aaaaa', 'bbbbb', 'ccccc'].join('\n')
    const chunks = chunkCode(text, 11)

    expect(chunks).toEqual([
      { text: 'aaaaa\nbbbbb', startLine: 1 },
      { text: 'ccccc', startLine: 3 },
    ])
  })

  test('a single line longer than the limit is hard-split', () => {
    const chunks = chunkCode('x'.repeat(25), 10)

    expect(chunks).toEqual([
      { text: 'x'.repeat(10), startLine: 1 },
      { text: 'x'.repeat(10), startLine: 1 },
      { text: 'x'.repeat(5), startLine: 1 },
    ])
  })

  test('empty text is one empty chunk', () => {
    expect(chunkCode('', 100)).toEqual([{ text: '', startLine: 1 }])
  })
})

describe('chunkMarkdown', () => {
  test('text under the limit is one chunk', () => {
    expect(chunkMarkdown('# Title\n\nBody', 100)).toEqual(['# Title\n\nBody'])
  })

  test('never breaks inside a fenced code block', () => {
    const paragraph = 'word '.repeat(50).trim()
    const lines = [paragraph, '```', 'small fenced content', '```', paragraph]
    const text = lines.join('\n')

    // Past the fence's own close, so the break falls between the two
    // paragraphs rather than mid-fence.
    const chunks = chunkMarkdown(text, 300)

    expect(chunks.length).toEqual(2)

    for (const chunk of chunks) {
      const fenceCount = (chunk.match(/```/g) ?? []).length

      expect(fenceCount % 2).toEqual(0)
    }

    expect(chunks.join('\n')).toEqual(text)
  })

  test('breaks between lines once past the limit outside a fence', () => {
    const chunks = chunkMarkdown('aaaaa\nbbbbb\nccccc', 11)

    expect(chunks).toEqual(['aaaaa\nbbbbb', 'ccccc'])
  })

  test('empty text is one empty chunk', () => {
    expect(chunkMarkdown('', 100)).toEqual([''])
  })
})
