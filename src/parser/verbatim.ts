import { Cursor } from '../cursor'
import { BlockNode, BlockChildNode } from './nodes'

export function parseVerbatimBlock(cursor: Cursor): BlockNode {
  /**
   * ```
   * \code(md) ==={ Hello, World! }===
   *               ^
   *               cursor
   * ```
   */
  let verbatimPrefix = 0
  const body: BlockChildNode[] = []

  while (cursor.startsWith('=') && !cursor.isEof()) {
    cursor.next(1)
    ++verbatimPrefix
  }

  cursor.next(1)

  /**
   * ```
   * \code(md) ==={ Hello, World! }===
   *               ^
   *               cursor
   * ```
   */
  const mark = cursor.clone()

  while (!cursor.isEof()) {
    if (cursor.startsWith('}')) {
      const lookahead = cursor.clone()

      lookahead.next(1)

      const verbatimPostfix = verbatimPostfixLevel(lookahead)

      if (verbatimPrefix === verbatimPostfix) {
        /**
         * ```
         * \code(md) ==={ Hello, World! }===
         *               ^              ^   ^
         *               mark           |   lookahead
         *                              cursor
         * ```
         */
        if (mark.index !== cursor.index) {
          const value = mark.takeUntil(cursor)

          body.push({
            type: 'TextNode',
            value
          })
        }

        cursor.moveTo(lookahead)
        mark.moveTo(cursor)
        /**
         * ```
         * \code(md) ==={ Hello, World! }===
         *                                  ^
         *                                  lookahead
         *                                  cursor
         *                                  mark
         * ```
         */

        break
      }
    } else {
      cursor.next(1)
    }
  }

  if (mark.index !== cursor.index) {
    /**
     * ```
     * \code(md) ==={ Hello, World!
     *               ^             ^
     *               mark          EOF
     *                             cursor
     * ```
     */
    const value = mark.takeUntil(cursor)

    body.push({
      type: 'TextNode',
      value
    })
  }

  return {
    type: 'Block',
    verbatim: true,
    body
  }
}

export function verbatimPostfixLevel(cursor: Cursor) {
  let verbatimPostfix = 0

  while (cursor.startsWith('=') && !cursor.isEof()) {
    ++verbatimPostfix
    cursor.next(1)
  }

  return verbatimPostfix
}