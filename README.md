# DIBO

a multi-project workspace (monorepo).

star the project.

you are welcome to contribute with us.

you can host your own open-source project to gain benefits from our tools for maintenance and contributing.

## workspace structure
- **packages:**

  contains independent packages, libraries and plugins.

- **projects:**

  contains projects and sub-workspaces.

- **dist:**
 
  the distributable output of all scopes, and contains the same main structure as the workspace.

- **resouces:**

  shared resources between all scopes.

  ### structure notes:
  - every scope has its own README.md and configuration, but all configurations are extend the workspace's config, such as tsconfig and webpack config.




