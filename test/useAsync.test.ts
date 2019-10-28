import { useAsync } from '../src';
import { renderHook } from '@testing-library/react-hooks';

interface StarwarsHero {
  name: string;
}

export const generateMockResponseData = (amount: number = 5): StarwarsHero[] =>
  [...Array(amount).keys()].map(n => ({
    id: n + 1,
    name: `Starwars Hero ${n + 1}`,
  }));

describe('useAync', () => {
  const fakeResults = generateMockResponseData();

  it('should have a useAsync hook', () => {
    expect(useAsync).toBeDefined();
  });

  it('should resolve a successful request', async () => {
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const { result, waitForNextUpdate } = renderHook(() =>
      useAsync(
        async () => {
          return Promise.resolve(fakeResults);
        },
        [],
        {
          onSuccess: () => onSuccess(),
          onError: () => onError(),
        }
      )
    );

    expect(result.current.loading).toBe(true);

    await waitForNextUpdate();

    expect(result.current.result).toEqual(fakeResults);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(onSuccess).toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });

  it('should set error detail for unsuccessful request', async () => {
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const { result, waitForNextUpdate } = renderHook(() =>
      useAsync(
        async () => {
          throw new Error('something went wrong');
        },
        [],
        {
          onSuccess: () => onSuccess(),
          onError: () => onError(),
        }
      )
    );

    await waitForNextUpdate();

    expect(result.current.error).toBeDefined();
    expect(result.current.error!.message).toBe('something went wrong');
    expect(result.current.loading).toBe(false);
    expect(result.current.result).toBeUndefined();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalled();
  });
});
