# react-async-hook

- Simplest way to get async result in your React component
- Typescript support
- Refetch on params change
- Handle concurrency issues if params change too fast
- Flexible, works with any async function, not just api calls

```jsx
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

And the typesafe async function:

```
type StarwarsHero = {
  id: string;
  name: string;
};

const fetchStarwarsHero = async (id: string): Promise<StarwarsHero> => {
  const result = await fetch(`https://swapi.co/api/people/${id}/`);
  if (result.status !== 200) {
    throw new Error('bad status = ' + result.status);
  }
  return result.json()
};
```

# Install

`yarn add react-async-hook`
or

`npm install react-async-hook --save`

# Warning

This library does not yet support React Suspense, but hopefully it will as soon as it can.

# License

MIT

# Hire a freelance expert

Looking for a React/ReactNative freelance expert with more than 5 years production experience?
Contact me from my [website](https://sebastienlorber.com/) or with [Twitter](https://twitter.com/sebastienlorber).
