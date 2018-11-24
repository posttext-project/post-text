import { PluginConstructor, PluginMap, Plugin } from './Plugin'
import { Middleware } from './Middleware'

export interface PluginInputOptions {
  data?: any
  options?: any
  pluginMap: PluginMap
}

export class PluginInput {
  public data: any
  public options: any

  private pluginMap: PluginMap

  constructor(options: PluginInputOptions) {
    this.data = options.data
    this.pluginMap = options.pluginMap
  }

  public setup() {
    for (const [_, [plugin, pluginOptions]] of this.pluginMap) {
      const pluginInput = this.createNewInput(
        pluginOptions,
        this.data
      )

      plugin.setup(pluginInput)
    }
  }

  public getPlugin(
    Plugin: PluginConstructor
  ): Plugin | undefined {
    const [plugin] = this.pluginMap.get(Plugin) || [undefined]

    return plugin
  }

  public mock(
    Plugin: PluginConstructor,
    method: string,
    middleware: Function
  ) {
    const plugin = this.getPlugin(Plugin)

    return Middleware.mock(plugin, method, middleware)
  }

  public createNewInput(
    options?: any,
    data?: any
  ): PluginInput {
    return new PluginInput({
      ...(this as object),
      data,
      options
    } as PluginInputOptions)
  }

  public run(Plugin: PluginConstructor, data?: any) {
    const [plugin, pluginOptions] = this.pluginMap.get(Plugin)
    const input = this.createNewInput(pluginOptions, data)

    return plugin.run(input)
  }
}
