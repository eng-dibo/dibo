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

  connect().then(() =>
    Promise.all([
      // todo: also move topics from sub categories
      query(`${fromCollection}/@categories=${categoryId}`),
      query(`${fromCollection}_categories/${categoryId}`),
    ])
      .then(([data, category]) => {
        console.log({ data, category });
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
