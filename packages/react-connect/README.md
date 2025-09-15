# @focus-js/react-connect

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
  - [Utility lenses provided by @focus/core](#utility-lenses-provided-by-focuscore)
- [Packages overview](#packages-overview)
- [Best practices](#best-practices)
  - [Common state management knowledge](#common-state-management-knowledge)
  - [Structuring the state object](#structuring-the-state-object)
  - [Organizing your own lenses](#organizing-your-own-lenses)

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

### Utility lenses provided by @focus/core

To make lens creation easier, `@focus/core` provides a few ready-made lenses that cover common scenarios. Each can be used directly in your reducers, or as a building block for composing more advanced ones.

#### `attributeLens`

Focuses on a single attribute of an object.
Useful for updating a property without manually spreading the rest of the object:

```typescript
// @focus-js/core
const attributeLens = <State, Key extends keyof State>(key: Key) =>
  createLens<State, State[Key]>({
    get: (state) => state[key],
    set: (state, value) => ({ ...state, [key]: value }),
  });

// Example
type User = {
  name: string;
  age: number; // for example only (usually not a best practice)
};

const user = { name: 'Alice', age: 30 };

const ageLens = attributeLens<typeof user, 'age'>('age');

ageLens.get(user); // 30
ageLens.set(user, 31); // { name: "Alice", age: 31 }
```

#### `arrayLens`

Focuses on an element at a specific index in an array.
This lets you immutably update a list item without re-implementing the index logic yourself:

```typescript
// @focus-js/core
const arrayLens = <T>(index: number) =>
  createLens<T[], T>({
    get: (state) => state[index],
    set: (state, t) => {
      const nextState = [...state];
      nextState[index] = t;
      return nextState;
    },
  });

// Example
const numbers = [1, 2, 3];

const secondLens = arrayLens<number>(1);

secondLens.get(numbers); // 2
secondLens.set(numbers, 42); // [1, 42, 3]
```

#### `recordLens`

Focuses on a value in a key-value dictionary (`Record<string, T>`).
Handy for managing states organized as maps:

```typescript
// @focus-js/core
const recordLens = <T>(id: string) =>
  createLens<Record<string, T>, T>({
    get: (state) => state[id],
    set: (state, t) => ({
      ...state,
      [id]: t,
    }),
  });

// Example
type Project = {
  id: string;
  name: string;
};

const projects: Record<string, Project> = {
  'project-1': { id: 'project-1', name: 'Website' },
  'project-2': { id: 'project-2', name: 'Mobile App' },
};

const newProjectLens = recordLens<Project>('project-3');

const updatedProjects = newProjectLens.set(projects, {
  id: 'project-3',
  name: 'Legacy refactoring',
});

newProjectLens.get(updatedProjects); // { id: "project-3", name: "Legacy refactoring" }
```

By combining these utility lenses, you can quickly drill down into complex state structures. For instance, you could compose an `arrayLens` with an `attributeLens` to directly update a single field of an object stored inside a list — without writing any manual spread operations.

## Packages overview

The Focus ecosystem is split into 3 packages, each with a distinct responsibility:

- `@focus-js/core` – Implements the core lens abstractions. This is the heart of Focus: generic, composable lenses and reducer lifting. It is framework-agnostic and can be used in any TypeScript or JavaScript project.
- `@focus-js/store` – Implements the state store itself. It handles storing the application state, applying reducers, and notifying subscribers. It does not depend on any view library, making it usable in Node, React, or other environments.
- `@focus-js/react-connect` – Provides a React connector for the store, via hooks. Other view-library connectors are planned for the future.

This modular approach allows you to pick only the pieces you need: use lenses alone, combine them with the store, or integrate seamlessly with React.

https://www.npmjs.com/settings/focus-js/packages

## Best practices

### Common state management knowledge

Using @focus-js/react-connect follows the same best practices as Redux or any other global state management library. Keep in mind the following guidelines to get the most out of it:

1. **Use Focus only when you really need it**
   Global state management adds complexity. Reach for Focus only if your use case cannot be solved with simpler local state.

2. **Keep local state local**
   Not every piece of state needs to live in Focus. UI-related or short-lived state (e.g., form inputs, modals) should remain in component state.

3. **Connect at the lowest possible level**
   Avoid connecting high-level container components unless necessary. Instead, connect components closer to where the data is actually used—this prevents props drilling and ensures better encapsulation.

4. **Enforce clear architectural boundaries**
   Focus encourages you to separate persistence, business (domain) logic, and application logic. Go further by structuring your project around a clean architecture (e.g., hexagonal architecture) to keep concerns well-isolated and maintainable.

### Structuring the state object

One major difference between Redux and Focus is **how you structure the state**.

In Redux, the common best practice is to organize your state into **slices**, similar to tables in a relational database. This avoids deep nesting and makes it easier to update entities independently. For example, with an `Invoice` that contains multiple `LineItems` (a typical 1-N relationship):

```js
// Redux: normalized slices
{
  invoices: {
    byId: {
      "invoice-1": { id: "invoice-1", customer: "ACME Corp", lineItems: ["line-item-1", "line-item-2"] }
    },
    allIds: ["invoice-1"]
  },
  lineItems: {
    byId: {
      "line-item-1": { id: "line-item-1", invoiceId: "invoice-1", product: "Laptop", quantity: 1 },
      "line-item-2": { id: "line-item-2", invoiceId: "invoice-1", product: "Mouse", quantity: 2 }
    },
    allIds: ["line-item-1", "line-item-2"]
  }
}
```

With Focus, you can afford to keep a **more nested state**. Since Focus provides fine-grained subscriptions and efficient updates, a tree-like structure is often easier to work with and closer to your domain and mental model:

```js
// Focus: nested state
{
  invoices: {
    "invoice-1": {
      id: "invoice-1",
      customer: "ACME Corp",
      lineItems: [
        { id: "line-item-1", product: "Laptop", quantity: 1 },
        { id: "line-item-2", product: "Mouse", quantity: 2 }
      ]
    }
  }
}
```

This means you don’t always need to flatten your entities into slices. A nested structure can be simpler, more expressive, and reduce boilerplate—especially when entities are naturally contained within each other.

That said, there are cases where normalization is still the right approach:

- **1-N relationships with high volume**: For example, `Discussion` → `Messages`. A discussion might contain thousands of messages. In such cases, a normalized state makes it easier to load, paginate, and update messages efficiently.

- **N-N relationships**: When entities are not strictly composed but can be linked in multiple ways, normalization avoids duplication and inconsistencies. For example, `Students` and `Courses` (a student can enroll in many courses, and a course has many students). Storing them in slices ensures updates remain consistent across relationships.

### Organizing your own lenses

While `@focus/core` provides utility lenses such as `attributeLens`, `arrayLens`, and `recordLens`, the real power of Focus comes when you define lenses that are specific to your domain model. By composing small, generic lenses into larger, domain-oriented ones, you keep your codebase expressive, readable, and easy to maintain.

The recommended practice is to **centralize your domain lenses in one place** (e.g., a `L` object) so that the rest of your application can rely on them without duplicating `get`/`set` logic. This way, your components and reducers can work at the right level of abstraction, without worrying about deeply nested state paths.

For example, let’s imagine a simple application state that manages projects and a selection index. By composing lenses, we can easily express concepts like “focus on one project,” or “focus on the rank of a given project”:

```typescript
import {
  createLens,
  connect,
  attributeLens,
  recordLens,
} from '@focus-js/react-connect';

// A domain model
type Project = {
  id: string;
  name: string;
  meta: {
    rank: number;
  };
};

// state.ts
export type AllProjects = Record<string, Project>;

export type ApplicationState = {
  projects: AllProjects;
  selection: number;
};

export const { useGlobalState, useFocusedState } = connect<ApplicationState>({
  projects: {},
  selection: 0,
});

export const L = {
  // Focus on the "projects" attribute of the application state
  allProjects: attributeLens<ApplicationState, 'projects'>('projects'),

  // Focus on a specific project by id
  oneProject: (id: string) => L.allProjects.focus(recordLens<Project>(id)),

  // Focus on the rank field of a given project
  rank: (id: string) =>
    L.oneProject(id)
      .focus(attributeLens<Project, 'meta'>('meta'))
      .focus(attributeLens('rank')),

  // Focus on the selection attribute of the application state
  selection: attributeLens<ApplicationState, 'selection'>('selection'),
};
```

With this setup:

- `L.allProjects` points to the dictionary of all projects.
- `L.oneProject(id)` zooms into a specific project by id.
- `L.rank(id)` drills all the way down to the `rank` field of that project.
- `L.selection` gives direct access to the current selection index.

Once your lenses are defined in this centralized way, you can use them anywhere in your application to both read and update state with minimal boilerplate. For example, accessing and updating the rank of project `"project-3"` is as simple as:

```typescript
const { state: rank, updateState: updateRank } = useFocusedState(
  L.rank('project-3')
);
```

Here, `rank` contains the current value (`number`) and `updateRank` lets you apply reducers directly to that piece of state. For instance, incrementing the rank becomes trivial:

```typescript
updateRank((r) => r + 1);
```
