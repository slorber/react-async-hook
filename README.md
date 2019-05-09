# react-async-hook

- Simplest way to get async result in your React component
- Very good, native, typescript support
- Refetch on params change
- Handle concurrency issues if params change too fast
- Flexible, works with any async function, not just api calls
- Support for cancellation (AbortController)
- Possibility to trigger manual refetches / updates
- Options to customize state updates

```tsx
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

And the typesafe async function could be:

```tsx
type StarwarsHero = {
  id: string;
  name: string;
};

const fetchStarwarsHero = async (id: string): Promise<StarwarsHero> => {
  const result = await fetch(`https://swapi.co/api/people/${id}/`);
  if (result.status !== 200) {
    throw new Error('bad status = ' + result.status);
  }
  return result.json();
};
```

# Install

`yarn add react-async-hook`
or

`npm install react-async-hook --save`

# Warning

This library does not yet support React Suspense, but hopefully it will as soon as it can.

# FAQ

#### How can I debounce the request

It is possible to debounce a promise.
I recommend my package [awesome-debounce-promise](https://github.com/slorber/awesome-debounce-promise) instead, because it handles concucrrency issues and have React in mind (particularly building a debounced search input/autocomplete)
As debounced functions are stateful, we have to "store" the debounced function inside a component. We'll use for that [use-constant](https://github.com/Andarist/use-constant) (backed by `useRef`).

```tsx
const StarwarsHero = ({ id }) => {
  // Create a constant debounced function (created only once per component instance)
  const debouncedFetchStarwarsHero = useConstant(() =>
    AwesomeDebouncePromise(fetchStarwarsHero, 1000)
  );

  // Simply use it
  const asyncHero = useAsync(debouncedFetchStarwarsHero, [id]);
  return <div>...</div>;
};
```

#### How to use request cancellation

You can use the `useAsyncAbortable` alternative. The async function provided will receive `(abortSignal, ...params)` .
The library will take care of triggering the abort signal whenever a new async call is made so that only the last request is not cancelled.
It is your responsability to wire the abort signal appropriately.

```tsx
const StarwarsHero = ({ id }) => {
  const asyncHero = useAsync(
    async (abortSignal, id) => {
      const result = await fetch(`https://swapi.co/api/people/${id}/`, {
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

#### How can I keep previous results available while a new request is pending

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

#### How to refresh the data

```tsx
const StarwarsHero = ({ id }) => {
  const asyncHero = useAsync(fetchStarwarsHero, [id]);

  return <div onClick={() => asyncHero.execute()}>...</div>;
};
```

#### How to support retry

Use a lib that simply adds retry feature to async/promises directly. Doesn't exist? Build it.

# License

MIT

# Hire a freelance expert

Looking for a React/ReactNative freelance expert with more than 5 years production experience?
Contact me from my [website](https://sebastienlorber.com/) or with [Twitter](https://twitter.com/sebastienlorber).
