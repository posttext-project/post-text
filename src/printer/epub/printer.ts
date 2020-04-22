import { Printer, RootInterpreter } from '../printer'
import { HtmlInterpreter } from '../interpreters/html'
import { TreeInterpreter } from '../interpreters/tree'
import { Command } from '../command'
import { TextInterpreter } from '../interpreters/text'

export class EpubPrinter extends Printer<null> {
  static new(): EpubPrinter {
    const rootInterpreter = RootInterpreter.new()

    rootInterpreter.registerInterpreters({
      tree: new TreeInterpreter(),
      html: new HtmlInterpreter(),
      text: new TextInterpreter()
    })

    return new EpubPrinter({ rootInterpreter })
  }

  protected async run(application: Command[]): Promise<null> {
    return null
  }
}