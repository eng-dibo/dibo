import jestConfig from '../../jest.config';

export default Object.assign({}, jestConfig, {
  testMatch: [`${__dirname}/**/*.spec.ts`],
});
