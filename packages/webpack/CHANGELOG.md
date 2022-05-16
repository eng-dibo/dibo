# @engineers/webpack-v1.0.0 (2022-05-16)


### Bug Fixes

* dependencies ([7c7a101](https://github.com/eng-dibo/dibo/commit/7c7a101a58148a6607bac949b4aa8b93587e9b52))
* **webpack:** eternals() ([57bf239](https://github.com/eng-dibo/dibo/commit/57bf239fcabd690e12c8a5811e7193895d81ffe0))
* **webpack:** fix types ([21aef94](https://github.com/eng-dibo/dibo/commit/21aef944ffc6e9a742264d6e9adc11037cd3759b))
* **webpack:** fix types ([a399e77](https://github.com/eng-dibo/dibo/commit/a399e77e5b0de96f52570c1e5647cd7102cdf71d))


### Features

* **webpack:** externals ([0bce113](https://github.com/eng-dibo/dibo/commit/0bce113b7efcb146315326f25b6531ecd70a84c3))
* **webpack:** externals() ([5e83401](https://github.com/eng-dibo/dibo/commit/5e8340179cf550bcb64a9681a290a78d3eec71a5))
* **webpack:** native-require ([3ec9b8d](https://github.com/eng-dibo/dibo/commit/3ec9b8dd3d7bce03e0a4f44c9943b8c615b6bfc5))
* **webpack:** plugins ([c1d97fd](https://github.com/eng-dibo/dibo/commit/c1d97fd0232c15ebdd8fbdb75b77a2c2fb9ce751))


### BREAKING CHANGES

* **webpack:** change function externals() signature.
so it executed every time with new arguments
i.e: evaluate a new transform value

- fix types
- ExternalList function now returns the matches array instead of boolean
  so we can use it in transform template
- add new variables to transform template: {{$n}}
- report[status=whiteListed now returns the matched item
- fix transform.replace() regex, so it can detect multiple vars
now: '{{v1}}-{{v2}}' -> 'v1', 'v2'
previous: '{{v1}}-{{v2}}' -> 'v1}},{{v2'
- remove: validatePackageName()
