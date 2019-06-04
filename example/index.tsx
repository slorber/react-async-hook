import 'react-app-polyfill/ie11';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import '@babel/polyfill';

import {
  useAsync,
  useAsyncAbortable,
  useAsyncCallback,
  UseAsyncReturn,
} from 'react-async-hook';

import { ReactNode, useState } from 'react';
import useConstant from 'use-constant';
import AwesomeDebouncePromise from 'awesome-debounce-promise';

const AppButton = ({ onClick, children }) => {
  const asyncOnClick = useAsyncCallback(onClick);
  return (
    <button
      onClick={asyncOnClick.execute}
      disabled={asyncOnClick.loading}
      style={{ width: 200, height: 50 }}
    >
      {asyncOnClick.loading ? '...' : children}
    </button>
  );
};

type ExampleType = 'basic' | 'abortable' | 'debounced' | 'merge';

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

const searchStarwarsHero = async (
  text: string,
  abortSignal?: AbortSignal
): Promise<StarwarsHero[]> => {
  const result = await fetch(
    `https://swapi.co/api/people/?search=${encodeURIComponent(text)}`,
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

const Example = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
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
        borderBottom: 'solid thin red',
      }}
    >
      {title}
    </h1>
    <div
      style={{
        marginBottom: 10,
        paddingBottom: 10,
      }}
    >
      {children}
    </div>
  </div>
);

const StarwarsHeroRender = ({
  id,
  asyncHero,
}: {
  id: string;
  asyncHero: UseAsyncReturn<StarwarsHero, never>;
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

const StarwarsHeroLoaderBasic = ({ id }: { id: string }) => {
  const asyncHero = useAsync(fetchStarwarsHero, [id]);
  return <StarwarsHeroRender id={id} asyncHero={asyncHero} />;
};

const StarwarsHeroLoaderDebounced = ({ id }: { id: string }) => {
  const debouncedFetchStarwarsHero = useConstant(() =>
    AwesomeDebouncePromise(fetchStarwarsHero, 1000)
  );
  const asyncHero = useAsync(debouncedFetchStarwarsHero, [id]);
  return <StarwarsHeroRender id={id} asyncHero={asyncHero} />;
};

const StarwarsHeroLoaderAbortable = ({ id }: { id: string }) => {
  const asyncHero = useAsyncAbortable(
    async (abortSignal, id) => fetchStarwarsHero(id, abortSignal),
    [id]
  );
  return <StarwarsHeroRender id={id} asyncHero={asyncHero} />;
};

const StarwarsHeroLoaderMerge = ({ id }: { id: string }) => {
  const asyncHero = useAsync(fetchStarwarsHero, [id], {
    setLoading: state => ({ ...state, loading: true }),
  });
  return <StarwarsHeroRender id={id} asyncHero={asyncHero} />;
};

const StarwarsHeroLoader = ({
  id,
  exampleType,
}: {
  id: string;
  exampleType: ExampleType;
}) => {
  if (exampleType === 'basic') {
    return <StarwarsHeroLoaderBasic id={id} />;
  } else if (exampleType === 'debounced') {
    return <StarwarsHeroLoaderDebounced id={id} />;
  } else if (exampleType === 'abortable') {
    return <StarwarsHeroLoaderAbortable id={id} />;
  } else if (exampleType === 'merge') {
    return <StarwarsHeroLoaderMerge id={id} />;
  } else {
    throw new Error('unknown exampleType=' + exampleType);
  }
};

const StarwarsSliderExample = ({
  title,
  exampleType,
}: {
  title: string;
  exampleType: ExampleType;
}) => {
  const [heroId, setHeroId] = useState(1);
  const next = () => setHeroId(heroId + 1);
  const previous = () => setHeroId(heroId - 1);

  const buttonStyle = {
    border: 'solid',
    cursor: 'pointer',
    borderRadius: 50,
    padding: 10,
    margin: 10,
  };
  return (
    <Example title={title}>
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
          <StarwarsHeroLoader id={`${heroId}`} exampleType={exampleType} />
        </HeroContainer>
        <HeroContainer>
          <StarwarsHeroLoader id={`${heroId + 1}`} exampleType={exampleType} />
        </HeroContainer>
        <HeroContainer>
          <StarwarsHeroLoader id={`${heroId + 2}`} exampleType={exampleType} />
        </HeroContainer>
      </div>
    </Example>
  );
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

const SearchStarwarsHeroExample = () => {
  const { inputText, setInputText, search } = useSearchStarwarsHero();
  return (
    <Example title={'Search starwars hero'}>
      <input
        value={inputText}
        onChange={e => setInputText(e.target.value)}
        placeholder="Search starwars hero"
        style={{
          marginTop: 20,
          padding: 10,
          border: 'solid thin',
          borderRadius: 5,
          width: 300,
        }}
      />
      <div style={{ marginTop: 20 }}>
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
    </Example>
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
    <div>
      <h1>
        Example page for{' '}
        <a href="https://github.com/slorber/react-async-hook">
          react-async-hook
        </a>{' '}
        (
        <a
          href="https://github.com/slorber/react-async-hook/blob/master/example/index.tsx"
          target="_blank"
        >
          source
        </a>
        )
      </h1>
      <h2>
        by{' '}
        <a href="https://twitter.com/sebastienlorber" target="_blank">
          @sebastienlorber
        </a>
      </h2>
    </div>

    <SearchStarwarsHeroExample />

    <Example title={'useAsyncCallback example'}>
      <AppButton
        onClick={async () => {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }}
      >
        Do something async
      </AppButton>
    </Example>

    <StarwarsSliderExample
      title={'Starwars hero slider example (basic)'}
      exampleType="basic"
    />
    <StarwarsSliderExample
      title={'Starwars hero slider example (debounced)'}
      exampleType="debounced"
    />
    <StarwarsSliderExample
      title={'Starwars hero slider example (abortable)'}
      exampleType="abortable"
    />
    <StarwarsSliderExample
      title={'Starwars hero slider example (merge)'}
      exampleType="merge"
    />
  </div>
);

ReactDOM.render(<App />, document.getElementById('root'));
