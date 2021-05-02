# Contributing guide

Your contributing is very welcome and make us happy, we'd love to have you as part of our community! 😍

you can help us improve the code base, or the docs, fix bugs, or spread the word.

[3 reasons to contribute to open source](https://opensource.com/article/20/6/why-contribute-open-source)

start by star and fork this repository.

![image](https://user-images.githubusercontent.com/57308531/116622568-34e20f80-a945-11eb-8e7a-f6eb30ae2095.png)

## Submitting a Pull Request (PR)

Before you submit your Pull Request (PR) consider the following guidelines:

- avoid duplication, search GitHub for an open or closed PR that relates to your submission.

- add a clear description to the problem you're fixing.

- any new feature you add must be unit tested and well documented, run the full test suite to ensure that all tests pass.

- submit your PR in a new [git branch](https://git-scm.com/book/en/v2/Git-Branching-Basic-Branching-and-Merging)

## Commit Message Format

we follow [conventional commits](https://conventionalcommits.org/) style, which is used in mega projects like Angular and gatsbyjs.

- commit message consists of a header, an optional body and an optional footer, with a blank line between them.
- the header includes a summary title, the action type and an optional scope
- the body including extra description.
- the footer includes the issue this commit fixes (ex: fixes #22) and may start with `BREAKING CHANGE` note.
- the scope is a project or a package or a sub-workspace.
  - multiple scopes should be separated with ', '.
  - partial scope may be used `(scope:section), for example: `fix(CMS:server)` commit is to fix a bug in the server section for the project CMS.
- commit types dovetails with [SemVer](https://semver.org/)

```
type(scope): title

body

footer
```

**types:**

- fix: a commit that fixes a bug, correlates with PATCH in SemVer.
- feat: introduces a new feature, correlates with MINOR in SemVer.
- BREAKING CHANGE: introduces a breaking API change, correlating with MAJOR in SemVer.
- docs: documentation improvement.
- lint: applying linting rules.
- test: add or modify a test.
- build: configurations that affects the building processes.
- refactor: changes that don't fix a bug, add a new feature or apply linting.
- init: initiate a new scope, i.e create a new project or package.

other commit types may be introduced, but they must be added to the contributing guide first.

if the commit introduces a BREAKING CHANGE, add '!', i.e: `type(scope)!: title`, and describe what your commit breaks in the first line in the body, in this form:
`BREAKING CHANGE: description...`

**examples:**

adding a new feature:

`feat: allow provided config object to extend other configs`

introducing a BREAKING CHANGE:

`refactor!: drop support for Node 6`

improving docs, in the scope: CMS
`docs(CMS): correct spelling of CHANGELOG`

## code style

We use linters such as [ESLint](https://eslint.org/) and [Prettier](https://prettier.io/) to format the code base, following [Google style Guides](https://google.github.io/styleguide/)..

run the script `npm run lint` to check and auto fix format issues.

each scope has it's own lint script, and the root workspace has a general lint script that affects all scopes inside it.

it is recommended to set up your IDE to format the changed file on each file save,

we provide a project-level settings for VScode that enables this feature for you, but you need to install IDE extensions for these linters.

if the source code is not properly formatted, or the CI couldn't auto fix all issues, it will fail and the PR cannot be merged.

## contributors discussion and live meeting

We organize live meeting together with all contributors time to time, to discuss and manage our planning.

you are welcome to attend our meetings.

also, you can use various channels to meet our developers and contributing, including social media accounts.

[Linkedin group](https://linkedin.com/groups/9050700)

other channels will be added if requested.
