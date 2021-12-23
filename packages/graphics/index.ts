import sharp, {
  Sharp,
  FormatEnum,
  AvailableFormatInfo,
  OutputOptions,
  JpegOptions,
  PngOptions,
  WebpOptions,
  AvifOptions,
  HeifOptions,
  GifOptions,
  TiffOptions,
  Metadata,
  OutputInfo as _OutputInfo,
  ResizeOptions,
  SharpOptions,
} from 'sharp';
import { parsePath } from '@engineers/nodejs/fs-sync';
import { existsSync } from 'fs';

export { sharp };
export type Format = keyof FormatEnum | AvailableFormatInfo;
export type FormatOptions =
  | OutputOptions
  | JpegOptions
  | PngOptions
  | WebpOptions
  | AvifOptions
  | HeifOptions
  | GifOptions
  | TiffOptions;

export interface EditOptions {
  format?: Format;
  formatOptions?: FormatOptions;
  // Include all metadata (EXIF, XMP, IPTC) from the input image in the output image
  // todo: rename to: meta
  withMetadata?: boolean;
  output?: string | ((img: Img, size: Size | Size[], options: any) => string);
  resizeOptions?: ResizeOptions;
  sharp?: SharpOptions;
  // todo: 'widthXheight'
  // todo: '50%' -> img.resize(Math.round(width * 0.5))
  size?: Size | Size[];
}

// adding property 'output' to the interface 'OutputInfo'
export interface OutputInfo extends _OutputInfo {
  output: string;
}

// Sharp or sharp.Sharp
export type Img = string | Buffer | Sharp;
export type Size = number | string | null;
export type ImgOutput = Buffer | string | OutputInfo;
/**
 * resizes images to a specified dimensions
 * and output the new image to any image format or as Buffer or base64 encoded string.
 * @method resize
 * @param img  file path or image buffer;
 * @param size width or [width, height] or 'width,height',
 * if size=null just convert img format or output
 * @param options
 * @return a Promise that resolves to:
 * - Buffer: if options.output is buffer
 * - string: if options.output is base64
 * - OutputInfo object if options.output is string (i.e output image path)
 *
 * todo:
 *  - rename size to dimensions
 *  - convert(img) = resize(img,size=null,{output=type})
 */
export function edit(img: Img, options: EditOptions = {}): Promise<ImgOutput> {
  let opts = Object.assign({}, options);

  // todo: img: Obj{width,height,..} -> sharp({create:{ .. }});
  if (!opts.size) {
    opts.size = [null, null];
  } else if (typeof opts.size === 'string') {
    opts.size = opts.size.split(',');
  } else if (typeof opts.size === 'number') {
    opts.size = [opts.size, null];
  }

  // passing (0) to img.resize() will not generate the image.
  // +el: to convert into number
  // don't use (size as number[]|string[]).map()  https://stackoverflow.com/a/49511416/12577650
  opts.size = opts.size.map((el: any) => (!el || el === 0 ? null : +el));

  let inputImage = img;

  if (typeof img === 'string' && img.indexOf('data:image/') === 0) {
    opts.output = opts.output || 'buffer';
    img = Buffer.from(img.replace(/data:image\/.+?;base64,/, ''), 'base64');
  }

  if (!(img instanceof sharp)) {
    img = sharp(img as string | Buffer, opts.sharp);
  }
  img = img as Sharp;

  if (opts.withMetadata !== false) {
    img = img.withMetadata();
  }

  if (opts.format) {
    img = img.toFormat(opts.format, opts.formatOptions);
  }

  // todo: only apply .resize() if size[] specified
  // also apply other Sharp transformers like .rotate()
  img = img.resize(
    opts.size[0] as number,
    opts.size[1] as number,
    opts.resizeOptions
  );

  return img.metadata().then((metadata: Metadata) => {
    // metadata of the original image, not the edited version.
    // for example metadata.width is the original width, not size

    // for typescript
    img = img as Sharp;
    opts.size = opts.size as number[];

    let imgOutput: Promise<ImgOutput>;

    if (typeof opts.output === 'function') {
      opts.output = opts.output(img, opts.size as number[], opts);
    }

    if (!opts.output) {
      if (typeof inputImage === 'string') {
        // automatically set the destination output, img must be string
        // todo: move to img.toFile().then(info=>{output:.., ...info})
        // so info.width and info.height of the edited image is available,
        // use info.width instead of size[0] because size[0] or size[1] may be null
        // and info.format instead of parts.extension
        // https://github.com/lovell/sharp/issues/2812
        let parts = parsePath(inputImage);
        opts.output = `${parts.dir}/${parts.file}`;
        if (opts.size[0]) {
          opts.output += `_${opts.size[0]}${
            opts.size[1] ? 'X' + opts.size[1] : ''
          }`;
        }
        opts.output += `.${opts.format || parts.extension}`;
      } else {
        opts.output = 'buffer';
      }
    }

    if (opts.output === 'buffer') {
      imgOutput = img.toBuffer();
    } else if (opts.output === 'base64') {
      imgOutput = img
        .toBuffer()
        .then(
          (data: Buffer) =>
            `data:image/${
              opts.format || metadata.format
            };base64,${data.toString('base64')}`
        );
    } else {
      imgOutput = img
        .toFile(opts.output as string)
        .then((info: _OutputInfo) => ({
          output: opts.output as string,
          ...info,
        }));
    }

    return imgOutput;
  });
}

/**
 * resizes images to the specified dimensions.
 * same as edit(img, {size,...options} )
 * @param img
 * @param size
 * @param options
 */
export function resize(
  img: Img,
  size: Size | Size[],
  options?: EditOptions
): Promise<ImgOutput> {
  return edit(img, Object.assign({ size }, options || {}));
}

/**
 * resizes an image to multiple sizes.
 * @method resizeAll
 * @param  img  image path or Buffer
 * @param sizes  array of sizes
 * @return Promise<any>
 */
// todo: Promise<Array<any>>
export function resizeAll(
  img: Img,
  sizes: Array<Size | Size[]>,
  options?: EditOptions
): Promise<ImgOutput[]> {
  return Promise.all(
    sizes.map((size: Size | Size[]) => resize(img, size, options))
  );
}

/**
 * converts images to another image format.
 * same as edit(img, {format,...options} )
 * @param img
 * @param format
 * @param options
 * @returns
 */
export function convert(
  img: Img,
  format: string,
  options?: EditOptions
): Promise<ImgOutput> {
  return edit(img, Object.assign({ format }, options || {}));
}
