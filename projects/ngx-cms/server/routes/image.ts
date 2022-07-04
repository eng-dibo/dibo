import { timer } from '@engineers/javascript/time';
import { TEMP } from '.';
import cache from '@engineers/nodejs/cache-fs';
import { read } from '~server/storage';
import { Size as _Size, resize as _resize } from '@engineers/graphics';
import { prod } from '~config/server';
import { Request, Response } from 'express';

/**
 *
 * @param img
 * @param {...any} args
 */

/**
 *
 * @param img
 * @param {...any} args
 */
function resize(img: any, ...args: any[]) {
  let x=1
  if(x==1)  return Promise.resolve(img);
  else return resize(img,...args)
}

export type Size = string | number | null;

/**
 * saves the article's cover image to filesystem
 *
 * @param req
 * @param request
 * @param res
 */
// todo: /\/(?<type>image|cover)\/(?<id>[^\/]+)
// https://github.com/expressjs/express/issues/4277
// example: <img src="/images/articles-cover-$topicId/slug-text.png?size=250" />
// todo: change to /api/v1/articles/image/$articleId-$imageName (move to the previous app.get(); execlude from ngsw cache)
// todo:  /api/v1/$collection/image=$name-$id/slug-text?size
export default (request: Request, res: Response): any => {
  timer('/image');

  // todo: use system.temp folder
  let collection = request.params[0],
    name = request.params[1],
    id = request.params[2],
    filePath = `${collection}/${id}/${name}.webp`,
    // todo: `${TEMP}/${req.url}.webp` -> error: name is too long
    localPath = `${TEMP}/${collection}/images/${id}/${name}.webp`;

  if (!id || !collection) {
    return res.json({
      error: { message: '[server/api] undefined id or collection ' },
    });
  }

  // use { encoding: undefined } so read() and cache() returns Buffer instead of string
  // otherwise resize(data) consider data: string as a file path
  cache(localPath, () => read(filePath, { encoding: undefined }), {
    age: 24 * 30,
    encoding: undefined,
  })
    .then((data) => {
      if (!request.query.size) {
        return data;
      }

      let size = request.query.size as Size | Size[],
        resizedPath = `${localPath.replace('.webp', '')}_${size}.webp`;

      return cache(
        resizedPath,
        () =>
          resize(data, size, {
            format:
              request.headers?.accept?.indexOf('image/webp') !== -1
                ? 'webp'
                : 'jpeg',
            // todo: add this options to resize()
            //   - allowBiggerImageDim: false,
            //   - allowBiggerFileSize: false,
          }),
        { age: 24 * 30, encoding: undefined }
      );
    })
    .then((data: any) => {
      // todo: set cache header
      // todo: resize with sharp, convert to webp
      // res.write VS res.send https://stackoverflow.com/a/54874227/12577650
      // res.write VS res.sendFile https://stackoverflow.com/a/44693016/12577650
      // res.writeHead VS res.setHeader https://stackoverflow.com/a/28094490/12577650

      res.writeHead(200, {
        'Content-Type': 'image/webp',
        'Cache-Control': 'max-age=31536000',
      });

      res.write(data);
      if (!prod) {
        console.log(
          `[server/api] get /image ${id}/${name}.webp`,
          timer('/image', true)
        );
      }
      res.end();
    })
    .catch((error: any) => res.json({ error }));
};
