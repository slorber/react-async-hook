# React-async-hook

[![NPM](https://img.shields.io/npm/dm/react-async-hook.svg)](https://www.npmjs.com/package/react-async-hook)
[![Build Status](https://travis-ci.com/slorber/react-async-hook.svg?branch=master)](https://travis-ci.com/slorber/react-async-hook)

This **tiny** library only **does one thing**, and **does it well**.

Don't expect it to grow in size, it is **feature complete**:

- Handle fetches (`useAsync`)
- Handle mutations (`useAsyncCallback`)
- Handle cancellation (`useAsyncAbortable` + `AbortController`)
- Handle [race conditions](https://sebastienlorber.com/handling-api-request-race-conditions-in-react)
- Platform agnostic
- Works with any async function, not just backend API calls, not just fetch/axios...
- Very good, native, Typescript support
- Small, no dependency
- Rules of hooks: ESLint find missing dependencies
- Refetch on params change
- Can trigger manual refetch
- Options to customize state updates
- Can mutate state after fetch

## Small size

- Tiny
- Way smaller than popular alternatives
- CommonJS + ESM bundles
- Tree-shakable

| Lib                  | min                                                                                                                    | min.gz                                                                                                                    |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **React-Async-Hook** | [![](https://img.shields.io/bundlephobia/min/react-async-hook.svg)](https://bundlephobia.com/package/react-async-hook) | [![](https://img.shields.io/bundlephobia/minzip/react-async-hook.svg)](https://bundlephobia.com/package/react-async-hook) |
| **SWR**              | [![](https://img.shields.io/bundlephobia/min/swr.svg)](https://bundlephobia.com/package/swr)                           | [![](https://img.shields.io/bundlephobia/minzip/swr.svg)](https://bundlephobia.com/package/swr)                           |
| **React-Query**      | [![](https://img.shields.io/bundlephobia/min/react-query.svg)](https://bundlephobia.com/package/react-query)           | [![](https://img.shields.io/bundlephobia/minzip/react-query.svg)](https://bundlephobia.com/package/react-query)           |
| **React-Async**      | [![](https://img.shields.io/bundlephobia/min/react-async.svg)](https://bundlephobia.com/package/react-async)           | [![](https://img.shields.io/bundlephobia/minzip/react-async.svg)](https://bundlephobia.com/package/react-async)           |
| **Use-HTTP**         | [![](https://img.shields.io/bundlephobia/min/use-http.svg)](https://bundlephobia.com/package/use-http)                 | [![](https://img.shields.io/bundlephobia/minzip/use-http.svg)](https://bundlephobia.com/package/use-http)                 |
| **Rest-Hooks**       | [![](https://img.shields.io/bundlephobia/min/rest-hooks.svg)](https://bundlephobia.com/package/rest-hooks)             | [![](https://img.shields.io/bundlephobia/minzip/rest-hooks.svg)](https://bundlephobia.com/package/rest-hooks)             |

## Things we don't support (by design):

- stale-while-revalidate
- refetch on focus / resume
- caching
- polling
- request deduplication
- platform-specific code
- scroll position restoration
- SSR
- router integration for render-as-you-fetch pattern

You can build on top of this little lib to provide more advanced features (using composition), or move to popular full-featured libraries like [SWR](https://github.com/vercel/swr) or [React-Query](https://github.com/tannerlinsley/react-query).

## Use-case: loading async data into a component

The ability to inject remote/async data into a React component is a very common React need. Later we might support Suspense as well.

```tsx
import { useAsync } from 'react-async-hook';

const fetchStarwarsHero = async id =>
  (await fetch(`https://swapi.dev/api/people/${id}/`)).json();

const StarwarsHero = ({ id }) => {
  const asyncHero = useAsync(fetchStarwarsHero, [id]);
  return (
    <div>
      {asyncHero.loading && <div>Loading</div>}
      {asyncHero.error && <div>Error: {asyncHero.error.message}</div>}
      {asyncHero.result && (
        <div>
          <div>Success!</div>
          <div>Name: {asyncHero.result.name}</div>
        </div>
      )}
    </div>
  );
};
```

## Use-case: injecting async feedback into buttons

If you have a Todo app, you might want to show some feedback into the "create todo" button while the creation is pending, and prevent duplicate todo creations by disabling the button.

Just wire `useAsyncCallback` to your `onClick` prop in your primitive `AppButton` component. The library will show a feedback only if the button onClick callback is async, otherwise it won't do anything.

```tsx
import { useAsyncCallback } from 'react-async-hook';

const AppButton = ({ onClick, children }) => {
  const asyncOnClick = useAsyncCallback(onClick);
  return (
    <button onClick={asyncOnClick.execute} disabled={asyncOnClick.loading}>
      {asyncOnClick.loading ? '...' : children}
    </button>
  );
};

const CreateTodoButton = () => (
  <AppButton
    onClick={async () => {
      await createTodoAPI('new todo text');
    }}
  >
    Create Todo
  </AppButton>
);
```

# Examples

Examples are running on [this page](https://react-async-hook.netlify.com/) and [implemented here](https://github.com/slorber/react-async-hook/blob/master/example/index.tsx) (in Typescript)

# Install

`yarn add react-async-hook`
or

`npm install react-async-hook --save`

## ESLint

If you use ESLint, use this [`react-hooks/exhaustive-deps`](https://github.com/facebook/react/blob/master/packages/eslint-plugin-react-hooks/README.md#advanced-configuration) setting:

```ts
// .eslintrc.js
module.exports = {
  // ...
  rules: {
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': [
      'error',
      {
        additionalHooks: '(useAsync|useAsyncCallback)',
      },
    ],
  },
};
```

# FAQ

#### How can I debounce the request

It is possible to debounce a promise.

I recommend [awesome-debounce-promise](https://github.com/slorber/awesome-debounce-promise), as it handles nicely potential concurrency issues and have React in mind (particularly the common use-case of a debounced search input/autocomplete)

As debounced functions are stateful, we have to "store" the debounced function inside a component. We'll use for that [use-constant](https://github.com/Andarist/use-constant) (backed by `useRef`).

```tsx
const StarwarsHero = ({ id }) => {
  // Create a constant debounced function (created only once per component instance)
  const debouncedFetchStarwarsHero = useConstant(() =>
    AwesomeDebouncePromise(fetchStarwarsHero, 1000)
  );

  // Simply use it with useAsync
  const asyncHero = useAsync(debouncedFetchStarwarsHero, [id]);

  return <div>...</div>;
};
```

#### How can I implement a debounced search input / autocomplete?

This is one of the most common use-case for fetching data + debouncing in a component, and can be implemented easily by composing different libraries.
All this logic can easily be extracted into a single hook that you can reuse. Here is an example:

```tsx
const searchStarwarsHero = async (
  text: string,
  abortSignal?: AbortSignal
): Promise<StarwarsHero[]> => {
  const result = await fetch(
    `https://swapi.dev/api/people/?search=${encodeURIComponent(text)}`,
    {
      signal: abortSignal,
    }
  );
  if (result.status !== 200) {
    throw new Error('bad status = ' + result.status);
  }
  const json = await result.json();
  return json.results;
};

const useSearchStarwarsHero = () => {
  // Handle the input text state
  const [inputText, setInputText] = useState('');

  // Debounce the original search async function
  const debouncedSearchStarwarsHero = useConstant(() =>
    AwesomeDebouncePromise(searchStarwarsHero, 300)
  );

  const search = useAsyncAbortable(
    async (abortSignal, text) => {
      // If the input is empty, return nothing immediately (without the debouncing delay!)
      if (text.length === 0) {
        return [];
      }
      // Else we use the debounced api
      else {
        return debouncedSearchStarwarsHero(text, abortSignal);
      }
    },
    // Ensure a new request is made everytime the text changes (even if it's debounced)
    [inputText]
  );

  // Return everything needed for the hook consumer
  return {
    inputText,
    setInputText,
    search,
  };
};
```

And then you can use your hook easily:

```tsx
const SearchStarwarsHeroExample = () => {
  const { inputText, setInputText, search } = useSearchStarwarsHero();
  return (
    <div>
      <input value={inputText} onChange={e => setInputText(e.target.value)} />
      <div>
        {search.loading && <div>...</div>}
        {search.error && <div>Error: {search.error.message}</div>}
        {search.result && (
          <div>
            <div>Results: {search.result.length}</div>
            <ul>
              {search.result.map(hero => (
                <li key={hero.name}>{hero.name}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
```

#### How to use request cancellation?

You can use the `useAsyncAbortable` alternative. The async function provided will receive `(abortSignal, ...params)` .

The library will take care of triggering the abort signal whenever a new async call is made so that only the last request is not cancelled.
It is your responsability to wire the abort signal appropriately.

```tsx
const StarwarsHero = ({ id }) => {
  const asyncHero = useAsyncAbortable(
    async (abortSignal, id) => {
      const result = await fetch(`https://swapi.dev/api/people/${id}/`, {
        signal: abortSignal,
      });
      if (result.status !== 200) {
        throw new Error('bad status = ' + result.status);
      }
      return result.json();
    },
    [id]
  );

  return <div>...</div>;
};
```

#### How can I keep previous results available while a new request is pending?

It can be annoying to have the previous async call result be "erased" everytime a new call is triggered (default strategy).
If you are implementing some kind of search/autocomplete dropdown, it means a spinner will appear everytime the user types a new char, giving a bad UX effect.
It is possible to provide your own "merge" strategies.
The following will ensure that on new calls, the previous result is kept until the new call result is received

```tsx
const StarwarsHero = ({ id }) => {
  const asyncHero = useAsync(fetchStarwarsHero, [id], {
    setLoading: state => ({ ...state, loading: true }),
  });
  return <div>...</div>;
};
```

#### How to refresh / refetch the data?

If your params are not changing, yet you need to refresh the data, you can call `execute()`

```tsx
const StarwarsHero = ({ id }) => {
  const asyncHero = useAsync(fetchStarwarsHero, [id]);

  return <div onClick={() => asyncHero.execute()}>...</div>;
};
```

#### How to have better control when things get fetched/refetched?

Sometimes you end up in situations where the function tries to fetch too often, or not often, because your dependency array changes and you don't know how to handle this.

In this case you'd better use a closure with no arg define in the dependency array which params should trigger a refetch:

Here, both `state.a` and `state.b` will trigger a refetch, despite b is not passed to the async fetch function.

```tsx
const asyncSomething = useAsync(() => fetchSomething(state.a), [
  state.a,
  state.b,
]);
```

Here, only `state.a` will trigger a refetch, despite b being passed to the async fetch function.

```tsx
const asyncSomething = useAsync(() => fetchSomething(state.a, state.b), [
  state.a,
]);
```

Note you can also use this to "build" a more complex payload. Using `useMemo` does not guarantee the memoized value will not be cleared, so it's better to do:

```tsx
const asyncSomething = useAsync(async () => {
  const payload = buildFetchPayload(state);
  const result = await fetchSomething(payload);
  return result;
}), [state.a, state.b, state.whateverNeedToTriggerRefetch]);
```

You can also use `useAsyncCallback` to decide yourself manually when a fetch should be done:

```tsx
const asyncSomething = useAsyncCallback(async () => {
  const payload = buildFetchPayload(state);
  const result = await fetchSomething(payload);
  return result;
}));

// Call this manually whenever you need:
asyncSomething.execute();
```

#### How to support retry?

Use a lib that adds retry feature to async/promises directly.

# License

MIT

# Hire a freelance expert

Looking for a React/ReactNative freelance expert with more than 5 years production experience?
Contact me from my [website](https://sebastienlorber.com/) or with [Twitter](https://twitter.com/sebastienlorber).
