// adds aliases for this project
// run ` npm t -- --config=projects/ngx-cms/jest.config.ts`

import { resolve } from 'path';
import jestConfig, { getPaths } from '../../jest.config';

jestConfig.rootDir = resolve(__dirname);
jestConfig.moduleNameMapper = getPaths(resolve(__dirname, './tsconfig.json'));
jestConfig.setupFilesAfterEnv = ['../../jest-setup.ts'];

export default jestConfig;
