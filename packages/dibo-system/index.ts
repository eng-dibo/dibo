export interface LifecyclePoint extends Element {
  // hooks attached to each point executed a single task
  // it receives arguments based on the point's handler
  // hooks and handlers can be added later, if no hooks or handlers the point will be passed
  hooks: Array<Hook>;
  // a handler loads the hooks and manages them
  // provides the proper arguments to each one
  // it decides the signature of hooks and before*(), after*()
  // if no handler provided, the current point will be skipped
  handler?: Exec;
  // a function to be run before handling all hooks
  // it may be act as the initial hook
  // the handler decides it's signature
  beforeAll?: (point: LifecyclePoint, store: Store) => any;
  beforeEach?: (point: LifecyclePoint, hook: Hook, store: Store) => any;
  afterEach?: (point: LifecyclePoint, hook: Hook, store: Store) => any;
  // a function to be run after handling all hooks
  // it may be act as the last hook
  afterAll?: (point: LifecyclePoint, store: Store) => any;
  // point-level store
  store?: Store;
}

export interface Element {
  name: string;
  // for log and cli help
  description?: string;
}

export type Exec = (...args: any[]) => any | Promise<any>;

export interface ElementExec extends Element {
  exec: Exec;
}
export interface Hook extends ElementExec {}

export interface Runner extends Element {}

export interface Store {
  [key: string]: any;
}

export default class Dibo {
  // contains lifecycle points
  private lifecycle: LifecyclePoint[];
  // contains any arbitrary data that different handlers may pollute.
  // should be available to every element (handler / hook) and read only, use instance methods to modify it.
  private store: Store;

  // handles what DIBO SYSTEM do in each step
  // like handlers, but handle DIBO steps instead of the external hooks.
  // for example runner[name=beforeAll] decides how to handle any point.beforeAll
  private runner: Runner;

  constructor(lifecycle?: LifecyclePoint[]) {
    if (lifecycle) {
      this.addPoints(lifecycle);
    }
  }

  /**
   * provides an immutable version of the specified element by its name.
   * @param name
   * @param element
   * @returns
   */
  get<T extends Element>(name: string, element?: T[]): T | undefined {
    if (!element) {
      return;
    }
    // todo: return an immutable version of an element
    return element.find((el) => el.name === name);
  }

  /* --------- general methods ----------- */
  /**
   * safely adds an element to an elements array, and confirms that no element's name is duplicated
   */
  add<T extends Element>(
    elements: T[],
    newElements: T | T[],
    force = false
  ): T[] {
    newElements = toArray(newElements);

    if (!force) {
      // throw an error if any point already exists
      newElements.forEach((element) => {
        if (this.lifecycle.some((el) => (el.name = element.name))) {
          let error = `element ${element.name} already exists`;
          if (arguments[1]) {
            // if `force` flag provided, mention it
            error += ', use the flag `force` or replace*() to override it';
          }
          throw new Error(error);
        }
      });
    }

    elements.push(...newElements);
    return elements;
  }

  /**
   * safely modifies an element and confirm that no element name is duplicated
   */
  modify<T extends Element>(map: (el: T) => T, element: T[]): T[] {
    if (!element) {
      throw new Error('no element provided');
    }

    let newElement = element.map(map);

    // if a Set size of element names < element size, it has duplicated elements
    // or an element.name may be modified to an existing element.name
    if (new Set(newElement.map((el) => el.name)).size !== element.length) {
      throw new Error(`some points are duplicated`);
    }
    return element;
  }

  /**
   * totally replaces an element, and confirm that no point name is duplicated.
   * @param points
   */
  replace<T extends Element>(elements: T[], newElements: T | T[] = []): T[] {
    if (!elements) {
      throw new Error('no element provided');
    }

    newElements = toArray(newElements);

    if (new Set(newElements.map((el) => el.name)).size !== newElements.length) {
      throw new Error(`some elements are duplicated`);
    }

    // clone newElements to elements by value to make it immutable
    // so newElement=anotherValue; doesn't effect elements
    // this method performs a shallow copy
    // if any of its elements is an array or object you need to perform a deep copy.
    elements = [...newElements];
    return elements;
  }

  /* --------- /general methods ----------- */

  getPoint(name: string): LifecyclePoint | undefined {
    return this.get(name, this.getLifecycle());
  }

  getHook(pointName: string, hookName: string): Hook | undefined {
    let point = this.getPoint(pointName);
    if (!point) {
      return;
    }
    return this.get<Hook>(hookName, point.hooks);
  }

  getHandler(pointName: string, handlerName: string): Hook | undefined {
    let point = this.getPoint(pointName);
    if (!point) {
      return;
    }
    return this.get<Hook>(handlerName, point.hooks);
  }

  getLifecycle(): LifecyclePoint[] {
    // todo: always provide an immutable version of lifecycle or point
    return this.lifecycle;
  }

  /**
   * safely adds points to the lifecycle, see add()
   * @param points
   * @param force
   */
  addPoints(
    points: LifecyclePoint | LifecyclePoint[],
    force = false
  ): LifecyclePoint[] {
    return this.add<LifecyclePoint>(this.lifecycle, points, force);
  }

  /**
   * safely adds hooks to a lifecycle point, see add()
   * @param pointName
   * @param hooks
   */
  addHooks(
    pointName: string,
    hooks: Hook | Array<Hook>,
    force = false
  ): Array<Hook> {
    let point = this.lifecycle.find((el) => el.name === pointName);
    if (!point) {
      point = { name: pointName, hooks: [] };
      this.lifecycle.push(point);
    }

    // hooks must be exists in hooks, otherwise this.add() will not add hooks to points.hooks
    // don't use this.add(point.hooks || [], ...) as this code will add hooks to [],
    // which is not a member of point
    point.hooks = point.hooks || [];

    return this.add<Hook>(point.hooks, hooks, force);
  }

  /**
   * safely adds handlers to a lifecycle point, see add()
   * @param pointName
   * @param handler
   */
  addHandler(pointName: string, handler: Exec, force = false): LifecyclePoint {
    let point = this.lifecycle.find((el) => el.name === pointName);
    if (!point) {
      point = { name: pointName, hooks: [] };
      this.lifecycle.push(point);
    }
    point.handler = handler;

    return point;
  }

  /**
   * safely modifies the lifecycle points, see modify()
   */
  modifyPints(map: (el: LifecyclePoint) => LifecyclePoint): LifecyclePoint[] {
    return this.modify<LifecyclePoint>(map, this.lifecycle);
  }

  /**
   * safely modifies hooks of a lifecycle point, see modify()
   */
  modifyHooks(pointName: string, map: (el: Hook) => Hook): Hook[] {
    let point = this.getPoint(pointName);
    if (!point) {
      throw new Error(`point ${pointName} doesn't exist`);
    }
    return this.modify<Hook>(map, point.hooks || []);
  }

  /**
   * totally replaces the lifecycle,see replace()
   * @param points
   */
  replacePoints(
    points: LifecyclePoint | LifecyclePoint[] = []
  ): LifecyclePoint[] {
    let newPoints = this.replace<LifecyclePoint>(this.lifecycle, points);

    // also copy hooks[] by value using the spread operator or Array.from(hooks)
    // test: points.map(el=>el) === points -> false
    this.lifecycle = newPoints.map((point) =>
      Object.assign({}, { ...point, hooks: [...(point.hooks || [])] })
    );
    return this.lifecycle;
  }

  /**
   * totally replaces hooks of a lifecycle point, see replace()
   */
  replaceHooks(pointName: string, newHooks: Hook | Hook[] = []): Hook[] {
    let point = this.getPoint(pointName);
    if (!point) {
      point = { name: pointName, hooks: [] };
      this.lifecycle.push(point);
    }

    point.hooks = point.hooks || [];
    return this.replace<Hook>(point.hooks, newHooks);
  }

  /**
   * runs the project
   */
  run(): Promise<any> {
    return new Promise((r) => {
      this.lifecycle.forEach(async (point) => {
        if (!point.handler || !point.hooks || point.hooks.length < 1) {
          return;
        }

        if (point.beforeAll && typeof point.beforeAll === 'function') {
          // todo: this.runner[name=beforeAll](point)
          // runner=[{name: beforeAll, exec: (point,store)=>{if(point.beforeAll){..}})}]
          await point.beforeAll(point, this.store);
        }

        // running all handlers on every hook in the current lifecycle point
        // todo: or: `for (let handler of point.handlers) {handler.exec(point, this.store);}`
        // this needs a handler (only one handler) handles before*() and after*().
        for (let hook of point.hooks) {
          if (point.beforeEach && typeof point.beforeEach === 'function') {
            await point.beforeEach(point, hook, this.store);
          }

          await point.handler(point.name, hook, this.store);

          if (point.afterEach && typeof point.afterEach === 'function') {
            await point.afterEach(point, hook, this.store);
          }
        }

        if (point.afterAll && typeof point.beforeAll === 'function') {
          await point.afterAll(point, this.store);
        }
      });
    });
  }
}

function toArray(element: any): Array<any> {
  return element instanceof Array ? element : [element];
}
