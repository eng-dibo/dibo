/*
 a webpack plugin is a js class that has a method `apply(compiler)`
 and we can attach the created plugin to a hook using `.tab()` method by [Tapable](https://github.com/webpack/tapable) package
 each hook callback receives different parameters, the hook 'done' receives the [stats](https://webpack.js.org/api/stats/) object
 then we need to add the plugin to a hook lifecycle such as [done](https://webpack.js.org/api/compiler-hooks/#done)

 https://webpack.js.org/contribute/writing-a-plugin/
*/

export type Hook = ((...arguments_: any[]) => any) | Promise<any>;
export interface HookObject {
  hook: Hook;
  name?: string;
  lifecycle?: string;
}

export interface BasePluginInterface {
  // todo: // https://stackoverflow.com/a/55506028/12577650
  // hooks: Hook | HookObj | Array<Hook | HookObj>;
  // constructor(options: any): void;
  apply(compiler: any): Promise<void[]>;
}

/**
 * creates a plugin and adds it to a hook lifecycle
 *
 * @example
 * // filter errors, remove the error `export {module} (reexported as ..) was not found in ..`
 * // use hooks.afterCompile instead of hooks.done, to control the errors before it outputted to the console
 * // the hook receives 'compilation' if hooked to the 'afterCompile' lifecycle
 * // and receives 'stats' if hooked to 'done'
 * // https://github.com/TypeStrong/ts-loader/issues/653#issuecomment-658129853
 * hooks = [{lifecycle: 'afterCompile', hook=(compilation)=>{
 *   let pattern = /export '.+?'( \(reexported as '.+?'\))?? was not found in/i;
 *   compilation.errors = compilation.errors.filter(el=> !pattern.test(el.message))
 * }}]
 */
export default class BasePlugin implements BasePluginInterface {
  /**
   * defines the plugin hooks
   */
  protected hooks: Hook | HookObject | Array<Hook | HookObject> = [
    { hook: () => {} },
  ];

  // options is provided by the user in webpack.config -> plugins[]
  // use 'protected' to allow the child class access this properties via super.$Property
  constructor(protected options?: any) {}

  /**
   * the only required method by webpack
   *
   * @param compiler
   */
  apply(compiler: any): Promise<void[]> {
    let pluginHooks = this.hooks;
    if (!Array.isArray(pluginHooks)) {
      pluginHooks = [pluginHooks];
    }
    return Promise.all(
      pluginHooks.map((hookObject) => {
        if (typeof hookObject === 'function' || hookObject instanceof Promise) {
          hookObject = { hook: hookObject } as HookObject;
        }

        hookObject.lifecycle = hookObject.lifecycle || 'afterCompile';
        hookObject.name = hookObject.name || 'plugin-' + Date.now();

        if (compiler.hooks) {
          let tap = hookObject.hook instanceof Promise ? 'tapPromise' : 'tap';
          return compiler.hooks[hookObject.lifecycle][tap](
            hookObject.name,
            hookObject.hook
          );
        } else {
          // old versions
          return compiler.plugin(this.options.lifecycle, hookObject.hook);
        }
      })
    );
  }
}
