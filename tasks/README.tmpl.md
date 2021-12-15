# <%= pkg.name %>

<%- about || pkg.description %>

## install

install the package and it's peer dependencies:

```
npm i <%= pkg.name %><%# todo: peerDependencies.toString() %>
```

you can build this package and any of our packages yourself from [source](<%= pkg.homepage.replace('#readme','') %>/tree/main/packages)

## contributing

contributing with us are very welcome.

read our [contributing guide](<%= pkg.homepage.replace('#readme','') %>/blob/main/CONTRIBUTING.md)

## support us

<% pkg.funding.forEach(el=>{ %>

- [<%= el.type %>](<%= el.url %>)<% })
  %>

## useful packages by `@engineers`

- check out these useful packages that created by [@engineers organization](https://www.npmjs.com/org/engineers)
  <%# todo: packages.forEach() & npm/$packageName %>
  <% entries.forEach(el=>{
  if(el.startsWith('projects/')){ return} %>
  - [<%= el.replace('packages/','') %>](<%= pkg.homepage.replace('#readme','') %>/tree/main/<%= el %>)
    <% }) %>
