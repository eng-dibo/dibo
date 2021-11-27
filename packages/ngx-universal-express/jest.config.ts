import jestConfig from '@engineers/ngx-utils/jest.config';

export default Object.assign({}, jestConfig, {
  testMatch: [`${__dirname}/**/*.spec.ts`],
});
