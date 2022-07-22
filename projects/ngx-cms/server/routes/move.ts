/**
 * move a category and all of its topics from 'articles' to its own collection
 * todo: move the category and its children to `${toCollection}_categories`
 */

import { Request, Response } from 'express';
import { getModel as _getModel, connect, query } from '~server/database';

/**
 *
 * @param collectionName
 */
function getModel(collectionName: string) {
  return _getModel(
    collectionName,
    { _id: 'string' },
    { strict: false, validateBeforeSave: false }
  );
}

export default (request: Request, res: Response): any => {
  let fromCollection = (request.query.from as string) || 'articles',
    categoryId = request.params.category;
  let log: { [key: string]: any } = { fromCollection, categoryId };

  if (!categoryId) {
    return res.json({
      error: 'provide a category id, example: /move/$categoryId',
    });
  }

  /*
   * todo:
   * 1- get category and subCategories recursively, save to childCategories[] set
   * 2- get all data where category in childCategories[]
   * 3- remove category from childCategories[]
   * 4- forEach childCategory if(el.parent===categoryId)delete el.parent
   * 5- forEach data (el.categories||[]).filter(el!==categoryId)
   */

  connect().then(() =>
    Promise.all([
      // todo: also move topics from childCategories
      query(`${fromCollection}/@categories=${categoryId}`),
      query(`${fromCollection}_categories/${categoryId}`),
      // todo: get childCategories recursively
      query(`${fromCollection}_categories/@parent=${categoryId}`),
    ])
      .then(([data, category, subCategories]) => {
        console.log({ data, category, subCategories });
        // todo: toCollection = query.to || category.title
        let toCollection = request.query.to || category.title;

        let fromtModel = getModel(fromCollection);
        let toModel = getModel(toCollection);
        let ids = data.map((el: any) => el._id);

        log.toCollection = toCollection;
        log.ids = toCollection;
        log.data = data;
        log.category = category;

        return Promise.all([
          toModel.insertMany(data, {
            lean: true,
            rawResult: true,
          }),

          ids.map(
            async (id: any) => await fromtModel.deleteOne({ _id: id }).lean()
          ),
        ]);
      })
      // todo: improve deleteResult
      .then(([insertResult, deleteResult]) =>
        res.json({ insertResult, deleteResult, log })
      )
      .catch((error) => res.json({ error, log }))
  );
};
