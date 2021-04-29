# Contributing guide

Your contributing is very welcome and make us happy, we'd love to have you as part of our community! 😍

you can help us improve the code base, or the docs, fix bugs, or spread the word.

[3 reasons to contribute to open source](https://opensource.com/article/20/6/why-contribute-open-source)

## Submitting a Pull Request (PR)
Before you submit your Pull Request (PR) consider the following guidelines:

- avoid duplication, search GitHub for an open or closed PR that relates to your submission.

- add a clear describtion to the problem you're fixing.

- any new feaature you add must be unit tested and well documented, run the full test suite to ensure that all tests pass.

- submit your PR in a new [git branch](https://git-scm.com/book/en/v2/Git-Branching-Basic-Branching-and-Merging)  

## Commit Message Format
we follow [conventional commits](https://conventionalcommits.org/) style, which is used in mega projects like Angular and gatsbyjs.

- commit message consists of a header, an optional body and an optional footer, with a double blank line between them.
- the header includes a summary title, the action type and an optional scope
- the body including extra description.
- the footer includes the issue this commit fixes (ex: fixes #22) and may start with `BREAKING CHANGE` note.
- the scope is a project or a package or a sub-workspace.

```
type(scope): title

body

footer
```

**types**
