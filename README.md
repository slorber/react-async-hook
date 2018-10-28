# react-async-hook

The easiest way to load data in your React components:

```jsx
const StarwarsHero = ({id}) => {
  const asyncHero = useAsync(fetchStarwarsHero, [id]);
  return (
    <div>
      {asyncHero.loading && (
        <div>Loading</div>
      )}
      {asyncHero.error && (
        <div>Error: {asyncHero.error.message}</div>
      )}
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

```
const fetchStarwarsHero = id => fetch(`https://swapi.co/api/people/${id}/`).then(result => {
  if ( result.status !== 200 ) {
    throw new Error("bad status = " + result.status);
  }
  return result.json();
});
```

# Warning

I'm not sure yet if this library makes any sense. Suspense is probably a better approach that solves the same usecases. 

# Why

There already a ton of way to fetch data into components. 

This library aims to be the simplest to use and be less verbose than when using alternatives based on hoc/render-props like [react-data-fetching](https://github.com/CharlesMangwa/react-data-fetching) or [react-refetch](https://github.com/heroku/react-refetch).

This library is not meant to be used everywhere, but in many cases, fetching data in an ad-hoc way is a simple solution that is good enough for the usecase. You can keep using Redux/Apollo or other libraries for more advanced usecases.


# Install

`yarn add react-async-hook` 
or
 
`npm install react-async-hook --save`


# License

MIT
