import Handlebars from '../helpers/handlebars'

import { Interpreter, Context } from '../interpreter'
import {
  TagNode,
  Node,
  DocumentNode,
  TextNode,
} from '../../ast'
import { Command } from '../command'
import { Data } from '../data'

export const interpreters: Record<string, Interpreter> = {
  render: {
    modifier: 'private',

    interpret: async function* (
      command: Command,
      context: Context
    ): AsyncGenerator<Data, any, any> {
      const node = command.node as Node

      switch (node.type) {
        case 'Document': {
          return yield* context.dispatch({
            ...command,
            name: 'renderDocument',
          })
        }

        case 'Tag': {
          return yield* context.dispatch({
            ...command,
            name: 'renderTag',
          })
        }

        case 'Text': {
          return yield* context.dispatch({
            ...command,
            name: 'renderText',
          })
        }

        case 'Block': {
          return yield* context.dispatch({
            ...command,
            name: 'renderBlock',
          })
        }
      }
    },
  },

  renderDocument: {
    modifier: 'private',

    interpret: async function* (
      command: Command,
      context: Context
    ): AsyncGenerator<Data, any, any> {
      const node = command.node as DocumentNode

      for (const childNode of node.body) {
        yield* context.dispatch({
          name: 'render',
          node: childNode,
        })
      }
    },
  },

  renderTag: {
    modifier: 'private',

    interpret: async function* (
      command: Command,
      context: Context
    ): AsyncGenerator<Data, any, any> {
      const node = command.node as TagNode

      const resolver = context.registry.getTagResolver(
        node.id.name
      )

      if (!resolver) {
        return
      }

      const iter = resolver.resolve()
      let iterResult = await iter.next()
      resolverLoop: while (!iterResult.done) {
        const resolverCommand = {
          ...iterResult.value,
          node,
        }

        const interpreter = context.interpreters.get(
          resolverCommand.name
        )

        if (
          !interpreter ||
          interpreter.modifier === 'private'
        ) {
          break
        }

        const commandIter = context.dispatch(resolverCommand)

        let commandIterResult = await commandIter.next()
        while (!commandIterResult.done) {
          if (commandIterResult.value.name === 'error') {
            break resolverLoop
          }

          yield commandIterResult.value

          commandIterResult = await commandIter.next()
        }

        iterResult = await iter.next(commandIterResult.value)
      }
    },
  },

  renderText: {
    modifier: 'private',

    interpret: async function* (
      command: Command,
      _context: Context
    ): AsyncGenerator<Data, any, any> {
      const textNode = command.node as TextNode

      yield {
        name: 'html',
        type: 'inline',
        content: textNode.value,
      }
    },
  },

  getParams: {
    interpret: async function* (
      command: Command,
      _context: Context
    ): AsyncGenerator<Data, any, any> {
      const tagNode = command.node as TagNode

      return tagNode.params.map((param) => param.value)
    },
  },

  blockCount: {
    interpret: async function* (
      command: Command,
      _context: Context
    ): AsyncGenerator<Data, any, any> {
      const tagNode = command.node as TagNode

      return tagNode.blocks.length
    },
  },

  getBlock: {
    interpret: async function* (
      command: Command,
      context: Context
    ): AsyncGenerator<Data, any, any> {
      const tagNode = command.node as TagNode
      const index = command.index ?? 0

      const block = tagNode.blocks[index]

      const renderedChildNodes: string[] = []
      for (const childNode of block.body) {
        for await (const data of context.dispatch({
          name: 'render',
          node: childNode,
        })) {
          if (data.name === 'html') {
            const content = data.content

            renderedChildNodes.push(content)
          }
        }
      }

      return renderedChildNodes.join('')
    },
  },

  getBlockChildNodes: {
    interpret: async function* (
      command: Command,
      context: Context
    ): AsyncGenerator<Data, any, any> {
      const tagNode = command.node as TagNode
      const index = command.index ?? 0

      const displayMode = command.displayMode as boolean

      const block = tagNode.blocks[index]
      if (block.body.length === 0) {
        return []
      }

      const firstChild = block.body[0]
      const childNodes =
        firstChild.type !== 'Text'
          ? [
              {
                type: 'Text',
                value: '',
              },
              ...block.body,
            ]
          : block.body

      const renderedChildNodes: string[] = []

      if (displayMode) {
        let currentNodeIsInline = true
        let renderedChunk: string[] = []

        for (const childNode of childNodes) {
          for await (const data of context.dispatch({
            name: 'render',
            node: childNode,
          })) {
            if (data.name === 'html') {
              if (
                currentNodeIsInline ===
                ((data.type as string | undefined) ===
                  'inline')
              ) {
                const content = data.content as string

                renderedChunk.push(content)
              } else {
                renderedChildNodes.push(renderedChunk.join(''))
                currentNodeIsInline = !currentNodeIsInline

                const content = data.content as string

                renderedChunk = [content]
              }
            }
          }
        }

        renderedChildNodes.push(renderedChunk.join(''))

        return renderedChildNodes
      } else {
        for (const childNode of childNodes) {
          const renderedChildNode: string[] = []

          for await (const data of context.dispatch({
            name: 'render',
            node: childNode,
          })) {
            if (data.name === 'html') {
              const content = data.content

              renderedChildNode.push(content)
            }
          }

          renderedChildNodes.push(renderedChildNode.join(''))
        }
      }

      return renderedChildNodes
    },
  },

  textContent: {
    interpret: async function* (
      command: Command,
      _context: Context
    ): AsyncGenerator<Data, any, any> {
      const tagNode = command.node as TagNode
      const index = command.index ?? 0

      const block = tagNode.blocks[index]

      return block.body
        .filter((node) => node.type === 'Text')
        .map((textNode: TextNode) => textNode.value)
        .join('')
    },
  },

  html: {
    interpret: async function* (
      command: Command,
      _context: Context
    ): AsyncGenerator<Data, any, any> {
      const template = Handlebars.compile(
        command.template ?? ''
      )
      const data = command.data ?? {}
      const type = command.type as string | undefined

      const rendered = template({ data })

      yield {
        name: 'html',
        type,
        content: rendered,
      }
    },
  },
}