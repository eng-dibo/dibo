import sharp, {
  AvailableFormatInfo,
  AvifOptions,
  FormatEnum,
  GifOptions,
  HeifOptions,
  JpegOptions,
  Metadata,
  OutputOptions,
  PngOptions,
  ResizeOptions,
  Sharp,
  SharpOptions,
  TiffOptions,
  WebpOptions,
  OutputInfo as _OutputInfo,
} from 'sharp';
import { parsePath } from '@engineers/nodejs/fs-sync';
import { existsSync } from 'node:fs';

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
 *
 * @function resize
 * @param img  file path or image buffer;
 * @param size width or [width, height] or 'width,height',
 * if size=null just convert img format or output
 * @param options
 * @returns a Promise that resolves to:
 * - Buffer: if options.output is buffer
 * - string: if options.output is base64
 * - OutputInfo object if options.output is string (i.e output image path)
 *
 * todo:
 *  - rename size to dimensions
 *  - convert(img) = resize(img,size=null,{output=type})
 */
export function edit(img: Img, options: EditOptions = {}): Promise<ImgOutput> {
  // if(process.NO_SHARP){return Promise.resolve(img as ImgOutput);}
  let options_ = Object.assign({}, options);

  // todo: img: Obj{width,height,..} -> sharp({create:{ .. }});
  // eslint-disable-next-line unicorn/explicit-length-check
  if (!options_.size) {
    options_.size = [null, null];
  } else if (typeof options_.size === 'string') {
    options_.size = options_.size.split(',');
  } else if (typeof options_.size === 'number') {
    options_.size = [options_.size, null];
  }

  // passing (0) to img.resize() will not generate the image.
  // +el: to convert into number
  // don't use (size as number[]|string[]).map()  https://stackoverflow.com/a/49511416/12577650
  options_.size = options_.size.map((element: any) =>
    !element || element === 0 ? null : +element
  );

  let inputImage = img;

  if (typeof img === 'string' && img.indexOf('data:image/') === 0) {
    options_.output = options_.output || 'buffer';
    img = Buffer.from(img.replace(/data:image\/.+?;base64,/, ''), 'base64');
  }

  if (!(img instanceof sharp)) {
    img = sharp(img as string | Buffer, options_.sharp);
  }
  img = img as Sharp;

  if (options_.withMetadata !== false) {
    img = img.withMetadata();
  }

  if (options_.format) {
    img = img.toFormat(options_.format, options_.formatOptions);
  }

  // todo: only apply .resize() if size[] specified
  // also apply other Sharp transformers like .rotate()
  img = img.resize(
    options_.size[0] as number,
    options_.size[1] as number,
    options_.resizeOptions
  );

  return img.metadata().then((metadata: Metadata) => {
    // metadata of the original image, not the edited version.
    // for example metadata.width is the original width, not size

    // for typescript
    img = img as Sharp;
    options_.size = options_.size as number[];

    let imgOutput: Promise<ImgOutput>;

    if (typeof options_.output === 'function') {
      options_.output = options_.output(
        img,
        options_.size as number[],
        options_
      );
    }

    if (!options_.output) {
      if (typeof inputImage === 'string') {
        // automatically set the destination output, img must be string
        // todo: move to img.toFile().then(info=>{output:.., ...info})
        // so info.width and info.height of the edited image is available,
        // use info.width instead of size[0] because size[0] or size[1] may be null
        // and info.format instead of parts.extension
        // https://github.com/lovell/sharp/issues/2812
        let parts = parsePath(inputImage);
        options_.output = `${parts.dir}/${parts.file}`;
        if (options_.size[0]) {
          options_.output += `_${options_.size[0]}${
            options_.size[1] ? `X ${options_.size[1]}` : ''
          }`;
        }
        options_.output += `.${options_.format || parts.extension}`;
      } else {
        options_.output = 'buffer';
      }
    }

    if (options_.output === 'buffer') {
      imgOutput = img.toBuffer();
    } else if (options_.output === 'base64') {
      imgOutput = img
        .toBuffer()
        .then(
          (data: Buffer) =>
            `data:image/${
              options_.format || metadata.format
            };base64,${data.toString('base64')}`
        );
    } else {
      imgOutput = img.toFile(options_.output).then((info: _OutputInfo) => ({
        output: options_.output as string,
        ...info,
      }));
    }

    return imgOutput;
  });
}

/**
 * resizes images to the specified dimensions.
 * same as edit(img, {size,...options} )
 *
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
 *
 * @function resizeAll
 * @param  img  image path or Buffer
 * @param options
 * @param sizes  array of sizes
 * @returns Promise<any>
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
 *
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

export { default as sharp } from 'sharp';
