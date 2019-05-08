import 'react-app-polyfill/ie11';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { useAsync } from 'react-async-hook';

import { useState } from 'react';

type StarwarsHero = {
  id: string;
  name: string;
};

const fetchStarwarsHero = async (id: string): Promise<StarwarsHero> => {
  const result = await fetch(`https://swapi.co/api/people/${id}/`);
  if (result.status !== 200) {
    throw new Error('bad status = ' + result.status);
  }
  const json = await result.json();
  return json as StarwarsHero;
};

const HeroContainer = ({ children }) => (
  <div
    style={{
      margin: 10,
      padding: 10,
      border: 'solid',
      borderRadius: 10,
      width: 200,
      height: 80,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    {children}
  </div>
);

const StarwarsHero = ({ id }) => {
  const asyncHero = useAsync(fetchStarwarsHero, [id]);
  return (
    <div>
      {asyncHero.loading && <div>Loading</div>}
      {asyncHero.error && <div>Error: {asyncHero.error.message}</div>}
      {asyncHero.result && (
        <div>
          <div>Success!</div>
          <div>Id: {id}</div>
          <div>Name: {asyncHero.result.name}</div>
        </div>
      )}
    </div>
  );
};

const buttonStyle = {
  border: 'solid',
  cursor: 'pointer',
  borderRadius: 50,
  padding: 10,
  margin: 10,
};

const App = () => {
  const [heroId, setHeroId] = useState(1);
  const next = () => setHeroId(heroId + 1);
  const previous = () => setHeroId(heroId - 1);
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
      }}
    >
      <div style={{ display: 'flex' }}>
        <div style={buttonStyle} onClick={previous}>
          Previous
        </div>
        <div style={buttonStyle} onClick={next}>
          Next
        </div>
      </div>

      <div style={{ display: 'flex', marginTop: 50 }}>
        <HeroContainer>
          <StarwarsHero id={heroId} />
        </HeroContainer>
        <HeroContainer>
          <StarwarsHero id={heroId + 1} />
        </HeroContainer>
        <HeroContainer>
          <StarwarsHero id={heroId + 2} />
        </HeroContainer>
      </div>
    </div>
  );
};
ReactDOM.render(<App />, document.getElementById('root'));
