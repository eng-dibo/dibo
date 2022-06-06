/* eslint-disable sort-keys */
import { deepMerge } from '@engineers/javascript/merge';

export interface Object_ {
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

export type Handler = (...arguments_: any[]) => any | Promise<any>;

export interface LifecyclePoint extends Element {
  // hooks attached to each point executed a single task
  // it receives arguments based on the point's handler
  // hooks and handlers can be added later, if no hooks or handlers the point will be passed
  hooks: Array<Hook>;
  // a function to be run before handling all hooks
  // the handler decides it's signature
  beforeAll?: (point: LifecyclePoint, store: Object_) => any;
  afterAll?: (point: LifecyclePoint, store: Object_) => any;
  beforeEach?: (point: LifecyclePoint, hook: Hook, store: Object_) => any;
  afterEach?: (point: LifecyclePoint, hook: Hook, store: Object_) => any;
}

export interface Hook extends Element {
  // a function to be executed on the lifecycle point that this handler attached to.
  exec: Handler;
  // hook options provided by the user
  options?: any;
}
export type Runner = Element;
export interface Lifecycle {
  points: LifecyclePoint[];

  // save arbitrary data
  store: Object_;
  // runs before all points
  beforeAll?: (store: Object_) => any;
  afterAll?: (store: Object_) => any;
  // runs before each point
  beforeEach?: (point: LifecyclePoint) => any;
  afterEach?: (point: LifecyclePoint) => any;
}

export default class Hookable {
  private lifecycle: Lifecycle = {
    points: [],
    store: {},
  };

  constructor(lifecycle?: Lifecycle | LifecyclePoint[]) {
    if (lifecycle) {
      if (Array.isArray(lifecycle)) {
        this.replacePoints(lifecycle);
      } else {
        this.setLifeCycle(lifecycle);
      }
    }
  }

  /**
   * entirely change the lifecycle
   * confirm all points and every point.hooks are unique, i.e no name duplications
   *
   * @param lifecycle
   * @returns Hookable
   */
  setLifeCycle(lifecycle: Lifecycle): this {
    // replaces lifecycle.points with validation, i.e check for duplications
    this.replacePoints(lifecycle.points || []);
    this.lifecycle.beforeAll = lifecycle.beforeAll;
    this.lifecycle.afterAll = lifecycle.afterAll;
    this.lifecycle.beforeEach = lifecycle.beforeEach;
    this.lifecycle.afterEach = lifecycle.afterEach;
    return this;
  }

  /**
   * provides an immutable version of the specified element by its name.
   *
   * @param name the element to find by its name
   * @param elements the element array to search in
   * @returns
   */
  get<T extends Element>(name: string, elements?: T[]): T | undefined {
    // todo: return an immutable version of an element
    return elements
      ? elements.find((element) => element.name === name)
      : undefined;
  }

  /* --------- general methods ----------- */
  /**
   * safely adds an element to an elements array, and confirms that no element's name is duplicated
   *
   * @param elements the elements array
   * @param newElements the new element or elements to be added into the elements array
   * @param replace if the new elements exist replace them, otherwise throw an error
   * @returns
   */
  // todo: if !replaceAll: replace duplicates and add other elements
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
   *
   * @param elements the elements array to be modified
   * @param map a map function to modify the elements array, same as elements.map() but checks for duplications
   * @returns
   */
  modify<T extends Element>(elements: T[], map: (element: T) => T): T[] {
    if (!elements) {
      throw new Error('no element provided');
    }

    let newElements = toArray(elements).map(map);
    checkDuplication(newElements);
    return newElements;
  }

  /**
   * totally replaces an element, and confirm that no point name is duplicated.
   *
   * @param points
   * @param elements
   * @param newElements
   * @returns
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
   *
   * @param elements
   * @param elementName
   * @param newElement
   * @returns
   */
  replaceOne<T extends Element>(
    elements: T[],
    elementName: string,
    newElement: T
  ): T[] {
    let index = elements.findIndex((element) => element.name === elementName);
    if (~index) {
      elements[index] = newElement;
      return elements;
    }
    return this.add(elements, newElement);
  }

  /* --------- /general methods ----------- */

  /**
   * get an immutable version of the lifecycle
   *
   * @returns
   */
  getLifecycle(): Lifecycle {
    // todo: always provide an immutable version of lifecycle or point
    return deepMerge([this.lifecycle]);
  }

  /**
   * get a lifecycle point by its name
   *
   * @param name
   * @returns
   */
  getPoint(name: string): LifecyclePoint | undefined {
    return this.get(name, this.getLifecycle().points);
  }

  /**
   * get a hook in a lifecycle point by its name
   *
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
   *
   * @param pointName
   * @param handlerName
   * @returns
   */
  getHandler(pointName: string, handlerName: string): Hook | undefined {
    let point = this.getPoint(pointName);
    return point ? this.get<Hook>(handlerName, point.hooks) : undefined;
  }

  /**
   * safely adds points to the lifecycle, see add()
   * if any point doesn't hs a handler, the defaultHandler will be attached to it
   * unless it explicity set to false
   *
   * @param points
   * @param afterPoint string: add the new points after an existing point
   *                   undefined: add to end of points list
   *                   0: add to top of points list
   * @param replace
   * @returns
   */
  // todo: checkDuplicate(points) && checkDuplicate(point.hooks)
  // todo: param afterPoint
  addPoints(
    points: LifecyclePoint | LifecyclePoint[],
    afterPoint?: string | 0,
    replace = false
  ): this {
    this.lifecycle.points = this.add<LifecyclePoint>(
      this.lifecycle.points,
      toArray(points),
      replace
    ).map((point) => {
      if (!point.handler && point.handler !== false) {
        point.handler = defaultHandler;
      }
      if (!point.hooks) {
        point.hooks = [];
      }
      return point;
    });

    return this;
  }

  /**
   * safely adds hooks to a lifecycle point, see add()
   *
   * @param pointName
   * @param hooks
   * @param replace
   * @returns
   */
  addHooks(
    pointName: string,
    hooks: string | Hook | Array<Hook | string>,
    replace = false
  ): this {
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

    let point = this.lifecycle.points.find(
      (element) => element.name === pointName
    );
    if (!point) {
      point = { name: pointName, hooks: hooksArray, handler: defaultHandler };
      this.lifecycle.points.push(point);
      return this;
    }
    point.hooks = this.add<Hook>(point.hooks, hooksArray, replace);
    return this;
  }

  /**
   * adds a handler to a lifecycle point, or replace the existing handler
   * if the point doesn't exist, creates one
   * every lifecycle point is handled by only one handler
   * the handler manages hooks in a particular lifecycle point
   *
   * @param pointName
   * @param handler
   * @returns
   */
  addHandler(pointName: string, handler: Handler): this {
    let point = this.lifecycle.points.find(
      (element) => element.name === pointName
    );
    if (!point) {
      point = { name: pointName, hooks: [], handler: defaultHandler };
      this.lifecycle.points.push(point);
    }
    point.handler = handler;
    return this;
  }

  /**
   * safely modifies the lifecycle points, see modify()
   *
   * @param map
   * @returns
   */
  modifyPints(map: (element: LifecyclePoint) => LifecyclePoint): this {
    this.lifecycle.points = this.modify<LifecyclePoint>(
      this.lifecycle.points,
      map
    );
    return this;
  }

  /**
   * safely modifies hooks of a lifecycle point, see modify()
   * if the lifecycle point does't exist, creates a new one
   *
   * @param pointName
   * @param map
   * @returns
   */
  modifyHooks(pointName: string, map: (element: Hook) => Hook): this {
    let point = this.getPoint(pointName);
    if (!point) {
      point = { name: pointName, hooks: [], handler: defaultHandler };
    }
    point.hooks = this.modify<Hook>(point.hooks, map);
    return this;
  }

  /**
   * replaces the lifecycle points,see replace()
   * if any point doesn't hs a handler, the defaultHandler will be attached to it
   * unless it explicity set to false
   *
   * @param points
   * @returns
   */
  // todo: check duplication for points and every point.hooks
  replacePoints(points: LifecyclePoint | LifecyclePoint[] = []): this {
    this.lifecycle.points = this.replace<LifecyclePoint>(
      this.lifecycle.points,
      toArray(points)
    ).map((point) => {
      if (!point.handler && point.handler !== false) {
        point.handler = defaultHandler;
      }
      if (!point.hooks) {
        point.hooks = [];
      }
      // also copy hooks[] by value using the spread operator or Array.from(hooks)
      // test: points.map(el=>el) === points -> false
      return Object.assign({}, { ...point, hooks: [...(point.hooks || [])] });
    });

    return this;
  }

  /**
   * replace a specific point with a new one, see replaceOne()
   *
   * @param pointName
   * @param point
   * @returns
   */
  replacePoint(pointName: string, point: LifecyclePoint): this {
    this.lifecycle.points = this.replaceOne(
      this.lifecycle.points,
      pointName,
      point
    );
    return this;
  }

  /**
   * totally replaces hooks of a lifecycle point, see replace()
   * if the point does'nt exist, creates a new one
   *
   * @param pointName
   * @param newHooks
   * @returns Hookable
   */
  replaceHooks(pointName: string, newHooks: Hook | Hook[] = []): this {
    let point = this.getPoint(pointName);
    if (!point) {
      point = { name: pointName, hooks: [], handler: defaultHandler };
      this.lifecycle.points.push(point);
    }
    point.hooks = this.replace<Hook>(point.hooks || [], newHooks);
    return this;
  }

  /**
   * replaces a specific hook in a lifecycle point
   *
   * @param pointName
   * @param hookName
   * @param hook
   * @returns
   */
  replaceHook(pointName: string, hookName: string, hook: Hook): this {
    let point = this.getPoint(pointName);
    if (!point) {
      throw new Error(`point ${pointName} doesn't exist`);
    }

    point.hooks = this.replaceOne(point.hooks, hookName, hook);
    return this;
  }

  /**
   * runs the project using the runner (the main handler)
   *
   * @param runner the main handler, handles the whole process and decides what to do in each step
   *   the runner manages lifecycle points and triggers each point.handler function
   *   it may run points in parallel or in sequent or change their running order,
   *   and may pass data between points
   *   it also may decide to re-run any point with new arguments, if one failed for example
   *   or re-run the whole lifecycle
   * @returns
   */
  run(runner?: Handler): Promise<Lifecycle> {
    return (runner || defaultRunner)(this.getLifecycle());
  }
}

/**
 *
 * @param elements
 * @returns
 */
function toArray(elements: any): Array<any> {
  if (!elements) {
    throw new Error('no element provided');
  }
  return Array.isArray(elements) ? elements : [elements];
}

/**
 *
 * @param newElements
 * @param elements
 */
function checkDuplication<T extends Element>(
  newElements: T[],
  elements?: T[]
): void {
  // check that all items of newElements[] are unique
  // if a Set size of element names < elements size, it has duplicated elements
  // or an element.name may be modified to an existing element.name
  if (
    new Set(newElements.map((element) => element.name)).size !==
    newElements.length
  ) {
    throw new Error(`some elements are duplicated`);
  }

  // check that no item in newElements[] already exists in elements[]
  if (elements) {
    for (let element of newElements) {
      if (elements.some((element_) => element_.name === element.name)) {
        throw new Error(`element ${element.name} already exists`);
      }
    }
  }
}

/**
 * the default runner
 * this runner runs the lifecycle points in sequence
 * wait for async and promise operations
 *
 * @param lifecycle
 * @returns store
 */
export function defaultRunner(lifecycle: Lifecycle): Promise<Lifecycle> {
  // eslint-disable-next-line no-async-promise-executor, @typescript-eslint/no-misused-promises
  return new Promise(async (resolve) => {
    // todo: use point.handler() to run all point hooks and point.before*(), point.after*() functions
    if (lifecycle.beforeAll && typeof lifecycle.beforeAll === 'function') {
      // todo: add options to before*()/after*()
      await lifecycle.beforeAll(lifecycle.store);
    }

    // don't use `lifecycle.points.forEach(async (point) => {});`
    for (let index = 0; index < lifecycle.points.length; index++) {
      let point = lifecycle.points[index];

      lifecycle.store[point.name] =
        point.handler && point.hooks
          ? await point.handler(point, lifecycle.store)
          : undefined;
    }

    if (lifecycle.afterAll && typeof lifecycle.afterAll === 'function') {
      await lifecycle.afterAll(lifecycle.store);
    }
    resolve(lifecycle);
  });
}

// todo: issue: lifecycle.store object doesn't change by reference
// workaround: this function returns store and the runner set lifecycle.store[point.name]=defaultHandler()
/**
 *
 * @param point
 * @param store
 * @returns
 */
export async function defaultHandler(
  point: LifecyclePoint,
  store: Object_
): Promise<Object_> {
  if (!point.hooks || !Array.isArray(point.hooks)) {
    return {};
  }

  store[point.name] = store[point.name] || {};

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

  return store[point.name];
}
