# focus

A lens-based state manager. Library/Framework agnostic. Connector for React.

## Table of Contents

- [Installation](#installation)
- [Getting started (React)](#getting-started-react)
- [Motivation: why another state manager?](#motivation-why-another-state-manager)
  - [Focus vs. Redux](#focus-vs-redux)
    - [1. Reducers have too many responsibilities](#1-reducers-have-too-many-responsibilities)
    - [2. Event sourcing adds unnecessary overhead](#2-event-sourcing-adds-unnecessary-overhead)
  - [Focus vs. Zustand](#focus-vs-zustand)
  - [How do we solve this?](#how-do-we-solve-this)
- [Lenses: focusing on a specific part of the global state](#lenses-focusing-on-a-specific-part-of-the-global-state)
  - [Definition and example](#definition-and-example)
  - [Composition with reducers](#composition-with-reducers)
  - [`createLens` for handling reduction logic](#createlens-for-handling-reduction-logic)
- [Focus Packages Overview](#focus-packages-overview)

## Installation

```
npm i -S @focus-js/react-connect
```

or

```
yarn add @focus-js/react-connect
```

## Getting started (React)

```typescript
import React from 'react';
import { connect, createLens } from '@focus-js/react-connect';

type ApplicationState = {
  a: number;
  b: number;
};

const { useFocusedState } = connect<ApplicationState>({
  a: 0,
  b: 0,
});

const lens = createLens<ApplicationState, number>({
  get: ({ a }) => a,
  set: (state, a) => ({ ...state, a }),
});

const CounterA: React.FunctionComponent = () => {
  const { state, updateState } = useFocusedState(lens);

  const increment = (): void => {
    updateState((n) => n + 1);
  };

  return (
    <div>
      <div>{state}</div>
      <button onClick={increment}>Increment</button>
    </div>
  );
};
```

## Motivation: why another state manager?

State management is a central concern in modern frontend applications. Redux has played a foundational role in shaping how we think about state: immutability, updates by contract, predictable flows. But along the way, some trade-offs were made that we believe can be improved. Same thing for Zustand.

### Focus vs. Redux

#### 1. Reducers have too many responsibilities

In Redux, reducers carry two responsibilities at once:

- **Domain logic**: what the state should represent and how it evolves in business terms.
- **Storage logic**: how this evolution is persisted in the store.

Libraries like React rely on the principle of a Virtual DOM. On each render, React compares the _previous_ virtual tree with the _next_ one. To detect what has changed, it uses a simple but powerful heuristic: reference equality.

- If two object references are the same, React assumes nothing inside has changed.
- If a reference is new, React assumes that part of the tree has changed and re-renders accordingly.

This is why immutability is so important in state management. When you update the state, you must create new objects for the parts that changed, while keeping the same references for everything else.

Concretely, that means:

- nested objects that don’t change keep their reference,
- nested objects that do change are recreated,
- and this process continues all the way up to the root of the state.

If you try to manage this immutability “by hand,” reducers quickly get verbose. For example, updating a deeply nested field like `state.user.profile.settings.theme` requires carefully rebuilding the entire path:

```typescript
type State = {
  user: {
    profile: {
      settings: {
        theme: string;
        notifications: boolean;
      };
      stats: { posts: number };
    };
  };
};

function reducer(
  state: State,
  action: { type: 'updateTheme'; payload: string }
): State {
  switch (action.type) {
    case 'updateTheme':
      return {
        ...state,
        user: {
          ...state.user,
          profile: {
            ...state.user.profile,
            settings: {
              ...state.user.profile.settings,
              theme: action.payload, // update only this field
            },
          },
        },
      };
    default:
      return state;
  }
}
```

Here, the domain logic is trivial: _“set the theme to a new value.”_
But the reducer also has to express the storage logic: immutably copying every unchanged object (`user`, `profile`, `settings`) just to update one field.

This kind of boilerplate grows with the depth of nesting and can quickly make reducers harder to read and maintain. Redux does provide a way to avoid writing all this spreading manually through `combineReducers`, by splitting the state into smaller slices, each managed by its own reducer. However, this comes at the cost of additional structure and boilerplate: you now have to define multiple reducers, combine them, and maintain that structure as your application grows.

In Focus, these responsibilities are cleanly separated, as we will see later, thanks to lenses.

#### 2. Event sourcing adds unnecessary overhead

Redux made immutability mainstream, but it also chose event sourcing as its model:

- You dispatch an event.
- That event triggers one or many reducers.

In practice, most events are just a proxy to run one reducer — an extra layer of ceremony that quickly becomes boilerplate. Redux Toolkit tries to soften this by implicitly generating events from reducers, but the underlying indirection remains.

Focus takes a simpler stance: no events, just reducers. State evolves directly through reducer functions that you provide the store with, making the flow more straightforward and less verbose.

### Focus vs. Zustand

Zustand takes a very different approach from Redux. Instead of forcing you to manually maintain immutability, it delegates this responsibility to ImmerJS. With Immer, you write your update functions as if you were mutating state directly, and Immer transparently produces the new immutable state behind the scenes. This makes code much shorter and more ergonomic:

```typescript
const useStore = create((set) => ({
  count: 0,
  inc: () =>
    set((state) => {
      state.count += 1; // looks mutable, Immer ensures immutability
    }),
}));
```

This simplicity makes Zustand a great fit for small to medium applications:

- Stores are easy to define in one place.
- The immutability concerns are handled implicitly.
- For local or moderately nested state, the developer experience is excellent.

However, this model shows its limits with large, deeply nested states: Zustand itself provides no higher-level tooling for navigating or isolating nested slices of state. As a result, if your domain logic requires frequent updates deep inside a large object graph, you are left reinventing patterns to avoid repetitive and error-prone code.

In short: Zustand shines when the state is small and flat. But for complex, deeply nested domains, Focus offers a more principled approach by giving you reusable tools (lenses) to update state immutably.

### How do we solve this?

We want reducers to express _only_ business logic, not the plumbing that recreates nested objects immutably, and we want a generic way to apply that business logic to any part of a large state tree.

Lenses provide exactly that: a tiny, composable abstraction (`get` + `set`) that “focuses” a reducer on a sub-part of the state. A lens can lift a reducer written for an inner value into a reducer for the whole state and can be composed with other lenses to target arbitrarily deep fields.

That means you write the domain change once, while the lens encapsulates the immutable update logic — drastically reducing boilerplate and keeping your reducers small and reusable.

## Lenses: focusing on a specific part of the global state

When working with nested state objects, reducers often end up mixing business logic ("how should change") with storage logic ("how to rebuild the surrounding object immutably"). This makes reducers verbose and harder to reuse.

### Definition and example

A Lens is a functional abstraction that solves this problem. It is defined by two simple operations:

```typescript
type Getter<Outer, Inner> = (outer: Outer) => Inner;

type Setter<Outer, Inner> = (outer: Outer, inner: Inner) => Outer;

type Lens<Outer, Inner> = {
  get: Getter<Outer, Inner>;
  set: Setter<Outer, Inner>;
};
```

- `get` extracts a smaller piece of state from a larger one.
- `set` immutably replaces that piece inside the larger state.

Here is an example:

```typescript
type Counter = {
  name: string;
  value: number;
};

const lens: Lens<Counter, number> = {
  get: (counter) => counter.value,
  set: (counter, value) => ({ ...counter, value }),
};

const counter: Counter = {
  name: 'Counter',
  value: 0,
};

lens.get(counter); // 0
lens.set(counter, 1); // { name: 'Counter', value: 1 }
```

### Composition with reducers

This might be already useful — but lenses become especially powerful when combined with reducers.

First, let’s define a reducer: it is simply a function that evolves the state immutably:

```typescript
type Reducer<State> = (state: State) => State;
```

Without lenses, incrementing the counter value mixes responsibilities (business and storage logic):

```typescript
const increment: Reducer<Counter> = (counter) => ({
  ...counter, // storage logic
  value: counter.value + 1, // business logic
});
```

With lenses, we can keep them separate. A reducer can focus purely on the business logic (`value => value + 1`), while the lens handles the storage logic (how to update the surrounding object immutably). Let's add a `reduce` function to the `Lens` type:

```typescript
type Getter<Outer, Inner> = (outer: Outer) => Inner;

type Setter<Outer, Inner> = (outer: Outer, inner: Inner) => Outer;

type Lens<Outer, Inner> = {
  get: Getter<Outer, Inner>;
  set: Setter<Outer, Inner>;
  reduce: (reducer: Reducer<Inner>) => Reducer<Outer>;
};

// Storage logic
const lens: Lens<Counter, number> = {
  get: (counter) => counter.value,
  set: (counter, value) => ({ ...counter, value }),
  reduce: (reducer) => (counter) => set(counter, reducer(get(counter))),
};

// Business logic
const reducer: Reducer<number> = (value) => value + 1;

const increment: Reducer<Counter> = lens.reduce(reducer);

const counter: Counter = {
  name: 'Counter',
  value: 0,
};

increment(counter); // { name: 'Counter', value: 1 }
```

Here is a graphic representation of the mechanism, which may help with understanding:

```
      ┌─────────────────────────┐
      │       Outer State       │
      │ {                       │
      │   name: "Counter",      │
      │   value: 0              │
      │ }                       │
      └───────────┬─────────────┘
                  │ get(counter)
                  ▼
            ┌────────────┐
            │ Inner State│
            │    value   │
            │     0      │
            └──────┬─────┘
                   │ value => value + 1
                   ▼
            ┌────────────┐
            │ Inner State│
            │    value   │
            │     1      │
            └──────┬─────┘
                   │ set(counter, value)
                   ▼
      ┌─────────────────────────┐
      │       Outer State       │
      │ {                       │
      │   name: "Counter",      │
      │   value: 1              │
      │ }                       │
      └─────────────────────────┘

```

### `createLens` for handling reduction logic

The mechanism behind a lens reducer is completely generic. Every lens can lift a reducer defined on the inner state into a reducer on the outer state:

```typescript
const lens: Lens<Outer, Inner> = {
  // get, set
  reduce: (reducer) => (state) => set(state, reducer(get(state))),
};
```

Of course, you, as the caller, still need to define how to `get` and `set` a specific part of your state. But once those two functions are written, everything else (lifting reducers, but also composing lenses) comes for free.

That’s why Focus provides a `createLens` helper. Instead of re-implementing the boilerplate around `reduce`, you only write the essential `get` and `set`:

```typescript
const counterValueLens = createLens<Counter, number>({
  get: (counter) => counter.value,
  set: (counter, value) => ({ ...counter, value }),
});
```

From there, you immediately get:

- `lens.get` and `lens.set` (the ones you defined),
- `lens.reduce` to lift reducers automatically,
- and other things…

## Focus Packages Overview

The Focus ecosystem is split into 3 packages, each with a distinct responsibility:

- `@focus-js/core` – Implements the core lens abstractions. This is the heart of Focus: generic, composable lenses and reducer lifting. It is framework-agnostic and can be used in any TypeScript or JavaScript project.
- `@focus-js/store` – Implements the state store itself. It handles storing the application state, applying reducers, and notifying subscribers. It does not depend on any view library, making it usable in Node, React, or other environments.
- `@focus-js/react-connect` – Provides a React connector for the store, via hooks. Other view-library connectors are planned for the future.

This modular approach allows you to pick only the pieces you need: use lenses alone, combine them with the store, or integrate seamlessly with React.
