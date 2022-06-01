# @engineers/firebase-admin-v1.0.0 (2022-05-16)

### Bug Fixes

- dependencies ([7c7a101](https://github.com/eng-dibo/dibo/commit/7c7a101a58148a6607bac949b4aa8b93587e9b52))
- **firebase-admin:** fix initializeApp ([0ba62f9](https://github.com/eng-dibo/dibo/commit/0ba62f92d6e885f3638a17f6d159cbd84c89106c))
- **firebase-admin:** get projectId ([8150c91](https://github.com/eng-dibo/dibo/commit/8150c91246877186f9d9c94168e66dc09d4946fc))
- **firebase-admin:** init ([30fa883](https://github.com/eng-dibo/dibo/commit/30fa883c8f9a6ce48ba11b51823ef9c624e3d0e2))
- **firebase-admin:** init, storage ([bc52974](https://github.com/eng-dibo/dibo/commit/bc529741cdb36295bbb0b2eaf7a6d343acaaa5cc))
- **firebase-admin:** storage.write() ([d3f1884](https://github.com/eng-dibo/dibo/commit/d3f1884acc3014d926ecab96a0ef98bd549107ed))
- **firebase-admin:** storage/download() ([f5e17c8](https://github.com/eng-dibo/dibo/commit/f5e17c8be7e753cd189805df30722d7045eb62e2))
- **ngx-cms:** config/storage ([35b2990](https://github.com/eng-dibo/dibo/commit/35b29902a2a78a1a7542d32ca435f3f1d274fbc5))
- **packages/firebase-admin:** update all non-major dependencies [whitesourcesoftware.com] ([31ca6f9](https://github.com/eng-dibo/dibo/commit/31ca6f96e2c21c2c104dbfd8cd8da6c2b547d484))

- feat(firebase-admin)!: storage.write() ([98c6030](https://github.com/eng-dibo/dibo/commit/98c6030db7c3988bfeafa88b348efa4c8a4c387b))

### Features

- **firebase-admin:** init ([6983325](https://github.com/eng-dibo/dibo/commit/698332553392f6cb7fd62affaebe2e26750747e1))
- **firebase-admin:** server ([ce7fc64](https://github.com/eng-dibo/dibo/commit/ce7fc64a6af74072730ba831e130f801579f63c9))
- **firebase-admin:** storage ([a0f653a](https://github.com/eng-dibo/dibo/commit/a0f653a2e41df788a4cd3af6bd80fed8c9631754))
- **webpack:** native-require ([3ec9b8d](https://github.com/eng-dibo/dibo/commit/3ec9b8dd3d7bce03e0a4f44c9943b8c615b6bfc5))

### BREAKING CHANGES

- upload() now accepts 'file' param as string
  not buffer
  upload() now only uploads a local file
  and doesn't write to the remote file
  use write()
