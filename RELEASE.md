# Step-by-step release process

## @focus-js/core

```
cd packages/core/dist
npm version [<newversion> | major | minor | patch | premajor | preminor | prepatch | prerelease | from-git]
npx nx run core:build
npm publish --access public
```

Then:

- update dependant packages (`@focus-js/store` and `@focus-js/react-connect`)
- commit (`chore(release): @focus-js/core v<version>`)

## @focus-js/store

```
cd packages/store/dist
npm version [<newversion> | major | minor | patch | premajor | preminor | prepatch | prerelease | from-git]
npx nx run store:build
npm publish --access public
```

Then:

- update dependant packages (`@focus-js/react-connect`)
- commit (`chore(release): @focus-js/store v<version>`)

## @focus-js/react-connect

```
cd packages/react-connect/dist
npm version [<newversion> | major | minor | patch | premajor | preminor | prepatch | prerelease | from-git]
npx nx run react-connect:build
npm publish --access public
```

Then:

- update dependant packages (none)
- commit (`chore(release): @focus-js/react-connect v<version>`)

## Dry run

```
npm pack --dry-run
```

## Semantic versioning

- https://docs.npmjs.com/about-semantic-versioning
- https://semver.org/
