# react-async-hook


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
