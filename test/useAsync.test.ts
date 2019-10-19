import { useAsync, UseAsyncReturn } from '../src';
import { FetchMock } from 'jest-fetch-mock/types';
import { renderHook } from '@testing-library/react-hooks';

const fetch: FetchMock = global.fetch;

interface StarwarsHero {
  name: string;
}

type StarwarsHeroArgs = {
  asyncFunction: () => Promise<StarwarsHero[]>;
};

export const generateMockResponseData = (amount: number = 5): StarwarsHero[] =>
  [...Array(amount).keys()].map(n => ({
    id: n + 1,
    name: `Starwars Hero ${n + 1}`,
  }));

describe('useAync', () => {
  const fetchStarwarsHeroes = async (): Promise<StarwarsHero[]> => {
    const result = await fetch(`https://swapi.co/api/people/`);

    return await result.json();
  };

  const props = {
    asyncFunction: fetchStarwarsHeroes,
  };

  const fakeResults = generateMockResponseData();

  beforeEach(() => {
    fetch.resetMocks();

    fetch.mockResponseOnce(JSON.stringify(fakeResults));
  });

  it('should have a useAsync hook', () => {
    expect(useAsync).toBeDefined();
  });

  it('should set loading flag when request is initially made', () => {
    const { result } = renderHook<
      StarwarsHeroArgs,
      UseAsyncReturn<StarwarsHero[]>
    >(p => useAsync<StarwarsHero[], any[]>(p.asyncFunction, []), {
      initialProps: { ...props },
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeUndefined();
    expect(result.current.result).toBeUndefined();
  });

  it('should resolve a successful request', async () => {
    const { result, waitForNextUpdate } = renderHook<
      StarwarsHeroArgs,
      UseAsyncReturn<StarwarsHero[]>
    >(p => useAsync<StarwarsHero[], any>(p.asyncFunction, []), {
      initialProps: { ...props },
    });

    await waitForNextUpdate();

    expect(result.current.result).toEqual(fakeResults);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
  });
});
