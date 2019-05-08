import 'react-app-polyfill/ie11';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import '@babel/polyfill';

import { useAsync, useAsyncAbortable, UseAsyncReturn } from 'react-async-hook';

import { ReactNode, useState } from 'react';

type StarwarsHero = {
  id: string;
  name: string;
};

const fetchStarwarsHero = async (
  id: string,
  abortSignal?: AbortSignal
): Promise<StarwarsHero> => {
  const result = await fetch(`https://swapi.co/api/people/${id}/`, {
    signal: abortSignal,
  });
  if (result.status !== 200) {
    throw new Error('bad status = ' + result.status);
  }
  return result.json();
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

const StarwarsHeroRender = ({
  id,
  asyncHero,
}: {
  id: string;
  asyncHero: UseAsyncReturn<StarwarsHero>;
}) => {
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

const StarwarsHeroLoaderNonAbortable = ({ id }: { id: string }) => {
  const asyncHero = useAsync(fetchStarwarsHero, [id]);
  return <StarwarsHeroRender id={id} asyncHero={asyncHero} />;
};
const StarwarsHeroLoaderAbortable = ({ id }: { id: string }) => {
  const asyncHero = useAsyncAbortable(
    async (abortSignal, id) => fetchStarwarsHero(id, abortSignal),
    [id]
  );
  return <StarwarsHeroRender id={id} asyncHero={asyncHero} />;
};
const StarwarsHeroLoader = ({
  id,
  abortable,
}: {
  id: string;
  abortable: boolean;
}) => {
  return abortable ? (
    <StarwarsHeroLoaderAbortable id={id} />
  ) : (
    <StarwarsHeroLoaderNonAbortable id={id} />
  );
};

const buttonStyle = {
  border: 'solid',
  cursor: 'pointer',
  borderRadius: 50,
  padding: 10,
  margin: 10,
};

const StarwarsExample = (
  { title, abortable },
  { title: string, abortable: boolean }
) => {
  const [heroId, setHeroId] = useState(1);
  const next = () => setHeroId(heroId + 1);
  const previous = () => setHeroId(heroId - 1);
  return (
    <div
      style={{
        margin: 20,
        padding: 20,
        border: 'solid',
      }}
    >
      <h1
        style={{
          marginBottom: 10,
          paddingBottom: 10,
          border: 'solid',
        }}
      >
        {title}
      </h1>
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
          <StarwarsHeroLoader id={`${heroId}`} abortable={abortable} />
        </HeroContainer>
        <HeroContainer>
          <StarwarsHeroLoader id={`${heroId + 1}`} abortable={abortable} />
        </HeroContainer>
        <HeroContainer>
          <StarwarsHeroLoader id={`${heroId + 2}`} abortable={abortable} />
        </HeroContainer>
      </div>
    </div>
  );
};

const App = () => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
    }}
  >
    <StarwarsExample title={'Starwars hero example'} abortable={false} />

    <StarwarsExample
      title={'Starwars hero example (abortable)'}
      abortable={true}
    />
  </div>
);

ReactDOM.render(<App />, document.getElementById('root'));
