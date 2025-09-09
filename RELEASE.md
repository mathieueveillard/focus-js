# Step-by-step release process

## @focus-js/core

```
cd packages/core/dist
npm version <patch|minor|major>
npx nx run core:build
npm publish --access public
```

Then:

- update dependant packages (`@focus-js/store` and `@focus-js/react-connect`)
- commit (`chore(release): @focus-js/core v<version>`)

## @focus-js/store

```
cd packages/store/dist
npm version <patch|minor|major>
npx nx run store:build
npm publish --access public
```

Then:

- update dependant packages (`@focus-js/react-connect`)
- commit (`chore(release): @focus-js/store v<version>`)

## @focus-js/react-connect

```
cd packages/react-connect/dist
npm version <patch|minor|major>
npx nx run react-connect:build
npm publish --access public
```

Then:

- update dependant packages (none)
- commit (`chore(release): @focus-js/react-connect v<version>`)
