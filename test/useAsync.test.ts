import { useAsync } from '../src';
import { cleanup } from '@testing-library/react';
import { FetchMock } from 'jest-fetch-mock/types';

const fetch: FetchMock = global.fetch;

interface StarwarsHero {
  name: string;
}

export const generateMockResponseData = (amount: number = 5): StarwarsHero[] =>
  [...Array(amount).keys()].map(n => ({
    id: n + 1,
    name: `Starwars Hero ${n + 1}`,
  }));

describe('useAync', () => {
  afterEach(cleanup);

  beforeEach(() => {
    fetch.resetMocks();
  });

  it('should have a useAsync hook', () => {
    expect(useAsync).toBeDefined();
  });

  // it('should set loading flag when request is initially made', () => {

  // });
});
