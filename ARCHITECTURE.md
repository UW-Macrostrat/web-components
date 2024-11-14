This is a monorepo for Macrostrat's user interface modules. Generally, apps sit
outside of this monorepo and can optionally include its content. Git submodules
are used to manage some parts of the monorepo, if it seems desirable to
reference these independently in other projects.

Monorepos with git modules: https://www.jannikbuschke.de/blog/git-submodules/

## Bundling considerations

Generally, modules are bundled using ParcelJS.

There's a lot of art in getting types/exports to be resolved correctly in a
variety of situations. This is something we keep updating in the `package.json`
files. Here are some resources:

- https://stackoverflow.com/questions/58990498/package-json-exports-field-not-working-with-typescript
