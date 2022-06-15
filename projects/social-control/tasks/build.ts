import build, { BuildOptions } from '~~projects/ngx-cms/tasks/build';
import { dist as distribution, projectPath, rootPath } from './index';

/**
 *
 * @param options
 */
export default function (options?: BuildOptions): void {
  build(
    Object.assign(
      { project: 'social-control', distribution, projectPath, rootPath },
      options || {}
    )
  );
}
