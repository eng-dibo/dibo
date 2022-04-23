export interface Obj {
  [key: string]: any;
}

/**
 * the element is a lifecyclePoint, a hook or a runner
 */
export interface Element {
  name: string;
  // for log and cli help
  description?: string;
  // a handler loads the elements and manages them
  // provides the proper arguments to each one
  // it decides the signature of hooks and before*(), after*() functions
  // if no handler provided, the current element will be skipped
  handler?: Handler;
}

export type Handler = (...args: any[]) => any | Promise<any>;

export interface LifecyclePoint extends Element {
  // hooks attached to each point executed a single task
  // it receives arguments based on the point's handler
  // hooks and handlers can be added later, if no hooks or handlers the point will be passed
  hooks: Array<Hook>;
  // a function to be run before handling all hooks
  // the handler decides it's signature
  beforeAll?: (point: LifecyclePoint, store: Obj) => any;
  afterAll?: (point: LifecyclePoint, store: Obj) => any;
  beforeEach?: (point: LifecyclePoint, hook: Hook, store: Obj) => any;
  afterEach?: (point: LifecyclePoint, hook: Hook, store: Obj) => any;
}

export interface Hook extends Element {
  // a function to be executed on the lifecycle point that this handler attached to.
  exec: Handler;
  // hook options provided by the user
  options?: any;
}
export interface Runner extends Element {}
export interface Lifecycle {
  points: LifecyclePoint[];
  // the main handler, handles the whole process and decides what to do in each step
  // the runner manages lifecycle points and triggers each point.handler function
  // it may run points in parallel or in sequent or change their running order,
  // and may pass data between points
  // it also may decide to re-run any point with new arguments, if one failed for example
  // or re-run the whole lifecycle
  runner: Handler;
  // save arbitrary data
  store: Obj;
  // runs before all points
  beforeAll?: (store: Obj) => any;
  afterAll?: (store: Obj) => any;
  // runs before each point
  beforeEach?: (point: LifecyclePoint) => any;
  afterEach?: (point: LifecyclePoint) => any;
}

export default class Hookable {
  private lifecycle: Lifecycle = {
    points: [],
    runner: defaultRunner,
    store: {},
  };

  constructor(points: LifecyclePoint[] = [], runner?: Handler) {
    if (points) {
      this.replacePoints(points);
    }
    if (runner) {
      this.lifecycle.runner = runner;
    }
  }

  /**
   * provides an immutable version of the specified element by its name.
   * @param name the element to find by its name
   * @param elements the element array to search in
   * @returns
   */
  get<T extends Element>(name: string, elements?: T[]): T | undefined {
    // todo: return an immutable version of an element
    return elements ? elements.find((el) => el.name === name) : undefined;
  }

  /* --------- general methods ----------- */
  /**
   * safely adds an element to an elements array, and confirms that no element's name is duplicated
   * @param elements the elements array
   * @param newElements the new element or elements to be added into the elements array
   * @param replace if the new elements exist replace them, otherwise throw an error
   */
  add<T extends Element>(
    elements: T[],
    newElements: T | T[] = [],
    replace = false
  ): T[] {
    newElements = toArray(newElements);

    try {
      checkDuplication<T>(newElements, elements);
    } catch (error) {
      // newElements[] must not has any duplication whether `replace` used or not
      if (error === 'some elements are duplicated') throw new Error(error);
      else if (!replace) {
        throw new Error(`${error}, use the flag 'replace' to override it`);
      }
    }

    // todo: copy elements to a new array by value, push newElements to it
    // and return the copied array to protect elements from mutating
    elements.push(...newElements);
    return elements;
  }

  /**
   * safely modifies an element and confirm that no element name is duplicated
   * @param elements the elements array to be modified
   * @param map a map function to modify the elements array, same as elements.map() but checks for duplications
   *
   */
  modify<T extends Element>(elements: T[], map: (el: T) => T): T[] {
    if (!elements) {
      throw new Error('no element provided');
    }

    let newElements = toArray(elements).map(map);
    checkDuplication(newElements);
    return newElements;
  }

  /**
   * totally replaces an element, and confirm that no point name is duplicated.
   * @param points
   */
  replace<T extends Element>(elements: T[], newElements: T | T[] = []): T[] {
    if (!elements) {
      throw new Error('elements not provided');
    }

    newElements = toArray(newElements);
    // check that newElements doesn't have duplicated items
    // no need to check duplications with elements[] as it will be totally replaced
    checkDuplication(newElements);

    // clone newElements to elements by value to make it immutable
    // so modifying `newElements` doesn't effect elements
    // this method performs a shallow copy
    // todo: if any of its elements is an array or object you need to perform a deep copy.
    elements = [...newElements];
    return elements;
  }

  /**
   * replace a specific item of elements with a new one, or add a new one if not exists
   * @param elements
   * @param elementName
   * @param newElement
   */
  replaceOne<T extends Element>(
    elements: T[],
    elementName: string,
    newElement: T
  ): T[] {
    let index = elements.findIndex((el) => el.name === elementName);
    if (~index) {
      elements[index] = newElement;
      return elements;
    }
    return this.add(elements, newElement);
  }

  /* --------- /general methods ----------- */

  /**
   * get a lifecycle point by its name
   * @param name
   * @returns
   */
  getPoint(name: string): LifecyclePoint | undefined {
    return this.get(name, this.getLifecycle());
  }

  /**
   * get a hook in a lifecycle point by its name
   * @param pointName
   * @param hookName
   * @returns
   */
  getHook(pointName: string, hookName: string): Hook | undefined {
    let point = this.getPoint(pointName);
    return point ? this.get<Hook>(hookName, point.hooks) : undefined;
  }

  /**
   * get the handler (runner) of a lifecycle point by its name
   * @param pointName
   * @param handlerName
   * @returns
   */
  getHandler(pointName: string, handlerName: string): Hook | undefined {
    let point = this.getPoint(pointName);
    return point ? this.get<Hook>(handlerName, point.hooks) : undefined;
  }

  /**
   * get all points of the lifecycle
   * @returns
   */
  getLifecycle(): LifecyclePoint[] {
    // todo: always provide an immutable version of lifecycle or point
    return this.lifecycle.points;
  }

  /**
   * safely adds points to the lifecycle, see add()
   * if any point doesn't hs a handler, the defaultHandler will be attached to it
   * unless it explicity set to false
   * @param points
   * @param force
   */
  addPoints(
    points: LifecyclePoint | LifecyclePoint[],
    replace = false
  ): LifecyclePoint[] {
    return this.add<LifecyclePoint>(
      this.lifecycle.points,
      toArray(points),
      replace
    ).map((point) => {
      if (!point.handler && point.handler !== false) {
        point.handler = defaultHandler;
      }
      return point;
    });
  }

  /**
   * safely adds hooks to a lifecycle point, see add()
   * @param pointName
   * @param hooks
   */
  addHooks(
    pointName: string,
    hooks: string | Hook | Array<Hook | string>,
    replace = false
  ): Array<Hook> {
    let hooksArray: Array<Hook> = toArray(hooks).map((hook) => {
      if (typeof hook === 'string') {
        // example: '@example/my-hook:validate'
        // hook is a path to:
        // - a file that exports fileName
        // - a dir or node package containing package.json#dir or index.js that exports functionName
        // if functionName not provided use the default exported function
        let [path, functionName] = hook.split(':');
        // todo: get functionReference from functionName
        let functionReference = () => {};
        return { name: path, exec: functionReference };
      }
      return hook;
    });

    let point = this.lifecycle.points.find((el) => el.name === pointName);
    if (!point) {
      point = { name: pointName, hooks: hooksArray, handler: defaultHandler };
      this.lifecycle.points.push(point);
      return hooksArray;
    }
    return this.add<Hook>(point.hooks, hooksArray, replace);
  }

  /**
   * adds a handler to a lifecycle point, or replace the existing handler
   * if the point doesn't exist, creates one
   * every lifecycle point is handled by only one handler
   * the handler manages hooks in a particular lifecycle point
   * @param pointName
   * @param handler
   */
  addHandler(pointName: string, handler: Handler): LifecyclePoint {
    let point = this.lifecycle.points.find((el) => el.name === pointName);
    if (!point) {
      point = { name: pointName, hooks: [], handler: defaultHandler };
      this.lifecycle.points.push(point);
    }
    point.handler = handler;
    return point;
  }

  /**
   * safely modifies the lifecycle points, see modify()
   */
  modifyPints(map: (el: LifecyclePoint) => LifecyclePoint): LifecyclePoint[] {
    return this.modify<LifecyclePoint>(this.lifecycle.points, map);
  }

  /**
   * safely modifies hooks of a lifecycle point, see modify()
   * if the lifecycle point does't exist, creates a new one
   */
  modifyHooks(pointName: string, map: (el: Hook) => Hook): Hook[] {
    let point = this.getPoint(pointName);
    if (!point) {
      point = { name: pointName, hooks: [], handler: defaultHandler };
    }
    return this.modify<Hook>(point.hooks, map);
  }

  /**
   * replaces the lifecycle points,see replace()
   * if any point doesn't hs a handler, the defaultHandler will be attached to it
   * unless it explicity set to false
   * @param points
   */
  replacePoints(
    points: LifecyclePoint | LifecyclePoint[] = []
  ): LifecyclePoint[] {
    let newPoints = this.replace<LifecyclePoint>(
      this.lifecycle.points,
      toArray(points)
    ).map((point) => {
      if (!point.handler && point.handler !== false) {
        point.handler = defaultHandler;
      }
      return point;
    });

    // also copy hooks[] by value using the spread operator or Array.from(hooks)
    // test: points.map(el=>el) === points -> false
    this.lifecycle.points = newPoints.map((point) =>
      Object.assign({}, { ...point, hooks: [...(point.hooks || [])] })
    );
    return this.lifecycle.points;
  }

  /**
   * replace a specific point with a new one, see replaceOne()
   * @param pointName
   * @param point
   * @returns
   */
  replacePoint(pointName: string, point: LifecyclePoint): Lifecycle {
    this.replaceOne(this.lifecycle.points, pointName, point);
    return this.lifecycle;
  }

  /**
   * totally replaces hooks of a lifecycle point, see replace()
   * if the point does'nt exist, creates a new one
   */
  replaceHooks(pointName: string, newHooks: Hook | Hook[] = []): Hook[] {
    let point = this.getPoint(pointName);
    if (!point) {
      point = { name: pointName, hooks: [], handler: defaultHandler };
      this.lifecycle.points.push(point);
    }

    point.hooks = point.hooks || [];
    // todo: return new hooks reference instead of mutating point.hooks
    // then replace point.hooks with the returned hooks
    return this.replace<Hook>(point.hooks, newHooks);
  }

  /**
   * replaces a specific hook in a lifecycle point
   * @param pointName
   * @param hookName
   * @param hook
   */
  replaceHook(pointName: string, hookName: string, hook: Hook): Hook[] {
    let point = this.getPoint(pointName);
    if (!point) {
      throw new Error(`point ${pointName} doesn't exist`);
    }

    return this.replaceOne(point.hooks, hookName, hook);
  }

  /**
   * runs the project using the runner (the main handler)
   */
  run(): Promise<any> {
    return this.lifecycle.runner(this.lifecycle);
  }
}

function toArray(elements: any): Array<any> {
  if (!elements) {
    throw new Error('no element provided');
  }
  return elements instanceof Array ? elements : [elements];
}

function checkDuplication<T extends Element>(
  newElements: T[],
  elements?: T[]
): void {
  // check that all items of newElements[] are unique
  // if a Set size of element names < elements size, it has duplicated elements
  // or an element.name may be modified to an existing element.name
  if (new Set(newElements.map((el) => el.name)).size !== newElements.length) {
    throw new Error(`some elements are duplicated`);
  }

  // check that no item in newElements[] already exists in elements[]
  if (elements) {
    newElements.forEach((element) => {
      if (elements.some((el) => el.name === element.name)) {
        throw new Error(`element ${element.name} already exists`);
      }
    });
  }
}

/**
 * the default runner
 * this runner runs the lifecycle points in sequence
 * wait for async and promise operations
 * @param lifecycle
 * @returns
 */
export function defaultRunner(lifecycle: Lifecycle): Promise<void> {
  return new Promise(async (resolve) => {
    // each runner defines it's own store to save arbitrary data between all lifecycle points

    // todo: use point.handler() to run all point hooks and point.before*(), point.after*() functions
    if (lifecycle.beforeAll && typeof lifecycle.beforeAll === 'function') {
      // todo: add options to before*()/after*()
      await lifecycle.beforeAll(lifecycle.store);
    }

    lifecycle.points.forEach(async (point) => {
      if (!point.handler || !point.hooks || point.hooks.length === 0) {
        return;
      }

      await point.handler(point.name, lifecycle.store);
    });

    if (lifecycle.afterAll && typeof lifecycle.afterAll === 'function') {
      await lifecycle.afterAll(lifecycle.store);
    }

    resolve();
  });
}

// todo: add this handler to any point that doesn't has one
export async function defaultHandler(point: LifecyclePoint, store: Obj = {}) {
  if (point.beforeAll && typeof point.beforeAll === 'function') {
    store[point.name]['beforeAll'] = await point.beforeAll(point, store);
  }

  for (let hook of point.hooks) {
    if (point.beforeEach && typeof point.beforeEach === 'function') {
      await point.beforeEach(point, hook, store);
    }

    store[point.name][hook.name] = await hook.exec(
      hook.options,
      point.name,
      store
    );

    if (point.afterEach && typeof point.afterEach === 'function') {
      await point.afterEach(point, hook, store);
    }
  }

  if (point.afterAll && typeof point.beforeAll === 'function') {
    store[point.name]['afterAll'] = await point.afterAll(point, store);
  }
}