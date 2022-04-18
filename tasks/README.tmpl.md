# <%= pkg.name %>

<%- pkg.description %>

## install

install the package and it's peer dependencies:

```
npm i <%= pkg.name %><%# todo: peerDependencies.toString() %>
```

you can build this package and any of our packages yourself from [source](<%= pkg.homepage.replace('#readme','') %>/tree/main/packages)

<% if(details){ %>

## details

<%- details %>
<% } %>

## contributing

contributing with us are very welcome.

read our [contributing guide](<%= pkg.homepage.replace('#readme','') %>/blob/main/CONTRIBUTING.md)

## support us

<% pkg.funding.forEach(el=>{ %>

- [<%= el.type %>](<%= el.url %>)<% })
  %>

## apps by `@engineers`

<% entries.filter(entry=>entry.startsWith('projects/')).forEach(entry=>{ %>

- [<%= entry.replace('projects/','') %>](<%= pkg.homepage.replace('#readme','') %>/tree/main/<%= entry %>)
  <% }) %>

## useful packages by `@engineers`

- check out these useful packages that created by [@engineers organization](https://www.npmjs.com/org/engineers)

<% entries.filter(entry=>entry.startsWith('packages/')).forEach(entry=>{ %>

- [<%= entry.replace('packages/','') %>](https://www.npmjs.com/package/@engineers/<%= entry.replace('packages/','') %>)
  <% }) %>
