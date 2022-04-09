export interface Ctg {
  // todo: string | category{}
  main: any;
  categories: any[];
  branches: any[];
  parents: any[];
  top: any;
}

export class Categories {
  ctg: any;

  /**
   * [constructor description]
   * @method constructor
   * @param  categories  [{_id, title, slug, ...}]
   */
  constructor(categories: any) {
    this.ctg = { main: null, categories: categories || [] };
  }

  /**
   *
   * @method adjust
   * @return  main[] & categories ( and add branches, parents, top to every category)
   */
  adjust(): any {
    if (this.ctg.main) {
      return this.ctg;
    } // already adjusted
    let main = this.getMain();
    let categories = this.ctg.categories.map((ctg: any) => {
      let parents = this.getParents(ctg);
      ctg.branches = this.getBranches(ctg._id);
      ctg.parents = parents;
      ctg.top = this.getTop(ctg, parents, main);
      return ctg;
    });

    this.ctg = { main, categories };
    return this.ctg;
  }

  /**
   * add items (ex: articles) of each category to this.ctg.categories[category].items[]
   * @method itemCategories
   * @param  data      [{_id, categories[]}]
   * @return [description]
   */
  itemCategories(data: any): any {
    data = data || [];

    // remove old articles from all categories
    this.ctg.categories.map((el: any) => {
      el.items = [];
      return el;
    });

    data.forEach((el: any) => {
      if (
        el.categories &&
        el.categories instanceof Array &&
        el.categories.length > 0
      ) {
        el.categories.forEach((c: any) => {
          if (this.ctg.categories[c]) {
            this.ctg.categories[c].items.push(el._id);
          }
        });
      }
    });
    return this.ctg;
  }

  /**
   * convert categories[{...}] into ids[]
   * @method ids
   * @param  ctg array of categories
   * @return ids[]
   */
  ids(ctg: any): any[] {
    return ctg.map((el: any) => (typeof el === 'string' ? el : el._id));
  }

  /**
   * get category{} from id
   * @method getCtg
   * @param  id     [description]
   * @return category{}
   */
  getCtg(id: any): any {
    return typeof id === 'string'
      ? this.ctg.categories.find((el: any) => el._id === id) || {}
      : id;
  }

  /**
   * get main categories, i.e: have no parent
   * @method getMain
   * @param  ids  if true: return id[] instead of categories[]
   * @return categories[] | ids[]
   */
  getMain(ids = true): any {
    let data = this.ctg.main
      ? this.ctg.main
      : this.ctg.categories.filter((el: any) => !el.parent);
    return ids ? this.ids(data) : data;
  }

  // top-level category of the carent one
  getTop(ctg: any, parents: any, ids = true): any {
    let main = this.getMain(true);

    let top = (parents || this.getParents(ctg, true)).find((el: any) =>
      main.includes(el)
    );
    return ids ? top : this.getCtg(top);
  }

  // get childs of this category
  getChilds(id: any, ids = true): any {
    if (typeof id !== 'string') {
      id = id._id;
    }
    let data = this.ctg.categories.filter((el: any) => el.parent === id);
    return ids ? this.ids(data) : data;
  }

  // get childs and childs of childs etc..
  getBranches(ctg: any, ids = true): Array<any> {
    if (typeof ctg !== 'string') {
      ctg = ctg._id;
    }
    let branches = [];
    let childs = this.getChilds(ctg, ids); // ids[] or els[]

    if (childs.length > 0) {
      branches.push(...childs);
      childs.forEach((el: any) => {
        let childsOfChilds = this.getBranches(ids ? el : el._id, ids);
        if (childsOfChilds.length > 0) {
          branches.push(...childsOfChilds);
        }
      });
    }

    return [...new Set(branches)]; // get unique items
  }

  // get parent and parent of parent etc...
  getParents(ctg: any, ids = true): any[] {
    let parents = [];
    ctg = this.getCtg(ctg);
    if (!ctg) {
      return [];
    }
    let parent = ctg.parent;
    if (parent) {
      parents.push(ids ? parent : this.getCtg(parent));
      let parentsOfParent = this.getParents(parent, ids);
      if (parentsOfParent.length > 0) {
        parents.push(...parentsOfParent);
      }
    }
    return parents;
    // parents.map() may be applied internally for parentsOfParent,
    // so, applying it again here will cause an error
    // WRONG: return ids ? parents : parents.map(id => this.getCtg(id));
  }

  // create checkboxes tree
  /*
    ex:
      var inputs = c.createInputs(null, "", ["5ac348980d63be4aa0e967a2"]);
      fs.writeFileSync("./inputs.html", inputs);
      todo:
      - return array of categories & use <mat-tree>
      - use <mat-checkbox>, components must be dynamically loaded, Angular dosen't support
        injecting components into [innerHTML]
      - add btn to open a dialog to select categories
     */

  // todo: compitible with angular reactive forms, add formControl,...
  createInputs(
    ctg?: any,
    filter?: ((el: any) => boolean) | string[],
    tab = ''
  ): any {
    if (!ctg) {
      ctg = this.getMain(false);
    }
    let output = '';
    if (ctg instanceof Array) {
      if (filter) {
        if (filter instanceof Array) {
          ctg = ctg.filter((el) => filter.includes(el._id));
        }
        // todo: el.startsWith("!")? !filter.includes(): filter.includes()
        else {
          ctg = ctg.filter(filter);
        }
      }
      ctg.forEach((el: any) => {
        output += this.createInputs(el, undefined, tab);
      });
    } else {
      ctg = this.getCtg(ctg);
      output =
        tab +
        `<input type="checkbox" name="groups" value="${ctg._id}" [formControl]="formControl" [formlyAttributes]="field" />${ctg.title}<br />`;
      // `<mat-checkbox name="groups" value="${ctg._id}">${ctg.title}</mat-checkbox><br />`;
      let childs = this.getChilds(ctg, true);
      if (childs.length > 0) {
        output += this.createInputs(
          childs,
          undefined,
          tab + '&nbsp;'.repeat(5)
        );
      }
    }

    return output;
  }
}
