import jestConfig from '../../jest.config';

export default Object.assign({}, jestConfig, {
  rootDir: __dirname,
});
