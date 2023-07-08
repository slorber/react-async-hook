import { useAsync, useAsyncAbortable } from '../src';
import { renderHook } from '@testing-library/react-hooks';

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise((resolve, reject) => {
    if (signal && signal.aborted) reject();

    const timeout = setTimeout(() => {
      resolve(undefined);

      if (signal) signal.removeEventListener('abort', abort);
    }, ms);

    const abort = () => {
      if (signal) {
        clearTimeout(timeout);
        reject();
      }
    };

    if (signal) signal.addEventListener('abort', abort);
  });

interface StarwarsHero {
  name: string;
}

export const generateFakeResults = (pageSize: number = 5): StarwarsHero[] =>
  // @ts-ignore
  [...Array(pageSize).keys()].map(n => ({
    id: n + 1,
    name: `Starwars Hero ${n + 1}`,
  }));

export const generateFakeResultsAsync = async (
  pageSize: number = 5,
  delay = 100
): Promise<StarwarsHero[]> => {
  await sleep(delay);
  return generateFakeResults(pageSize);
};

describe('useAync', () => {
  const fakeResults = generateFakeResults();

  it('should have a useAsync hook', () => {
    expect(useAsync).toBeDefined();
  });

  it('should resolve a successful resolved promise', async () => {
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

  it('should resolve a successful real-world request + handle params update', async () => {
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const { result, waitForNextUpdate, rerender } = renderHook(
      ({ pageSize }: { pageSize: number }) =>
        useAsync(() => generateFakeResultsAsync(pageSize), [pageSize], {
          onSuccess: () => onSuccess(),
          onError: () => onError(),
        }),
      {
        initialProps: { pageSize: 5 },
      }
    );

    expect(result.current.loading).toBe(true);
    await waitForNextUpdate();
    expect(result.current.result).toEqual(generateFakeResults(5));
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();

    rerender({
      pageSize: 6,
    });

    expect(result.current.loading).toBe(true);
    await waitForNextUpdate();
    expect(result.current.result).toEqual(generateFakeResults(6));
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(onSuccess).toHaveBeenCalledTimes(2);
    expect(onError).not.toHaveBeenCalled();
  });

  // See https://github.com/slorber/react-async-hook/issues/27
  it('should handle async function without dependency array (shortcut) ', async () => {
    const getFakeResultsAsync = () => Promise.resolve(fakeResults);

    const { result, waitForNextUpdate } = renderHook(() =>
      // It is better to always required a deps array for TS users, but JS users might forget it so...
      // Should we allow this "shortcut" for TS users too? I'd rather not
      // @ts-ignore
      useAsync(getFakeResultsAsync)
    );

    expect(result.current.loading).toBe(true);

    await waitForNextUpdate();

    expect(result.current.result).toEqual(fakeResults);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
  });

  it('should resolve a successful real-world requests with potential race conditions', async () => {
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const { result, waitForNextUpdate, rerender } = renderHook(
      ({ pageSize, delay }: { pageSize: number; delay: number }) =>
        useAsync(
          () => generateFakeResultsAsync(pageSize, delay),
          [pageSize, delay],
          {
            onSuccess: () => onSuccess(),
            onError: () => onError(),
          }
        ),
      {
        initialProps: { pageSize: 5, delay: 200 },
      }
    );

    rerender({
      pageSize: 6,
      delay: 100,
    });

    rerender({
      pageSize: 7,
      delay: 0,
    });

    expect(result.current.loading).toBe(true);
    await waitForNextUpdate();
    expect(result.current.result).toEqual(generateFakeResults(7));
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();

    await sleep(100);
    expect(onSuccess).toHaveBeenCalledTimes(2);

    await sleep(100);
    expect(onSuccess).toHaveBeenCalledTimes(3);

    expect(result.current.result).toEqual(generateFakeResults(7));
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
  });

  // Test added because Jest mocks can return promises that arre not instances of Promises
  // This test ensures better testability of user code
  // See https://github.com/slorber/react-async-hook/issues/24
  it('should resolve a successful Jest mocked resolved value', async () => {
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const asyncFunction = jest.fn().mockResolvedValue(fakeResults);

    const { result, waitForNextUpdate } = renderHook(() =>
      useAsync(asyncFunction, [], {
        onSuccess: () => onSuccess(),
        onError: () => onError(),
      })
    );

    expect(result.current.loading).toBe(true);

    await waitForNextUpdate();

    expect(result.current.result).toEqual(fakeResults);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(onSuccess).toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });

  // TODO legacy: should we remove this behavior?
  it('should resolve a successful synchronous request', async () => {
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const { result, waitForNextUpdate } = renderHook(() =>
      useAsync(
        // @ts-ignore: not allowed by TS on purpose, but still allowed at runtime
        () => fakeResults,
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

  it('should set error detail for error thrown synchronously (like when preparing/formatting a payload)', async () => {
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const { result, waitForNextUpdate } = renderHook(() =>
      useAsync(
        () => {
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

  it('should handle cancel', async () => {
    const onSuccess = jest.fn();
    const onError = jest.fn();
    const onAbort = jest.fn();

    const { result, waitForNextUpdate } = renderHook(() =>
      useAsyncAbortable(
        async (signal: AbortSignal) => {
          signal.addEventListener('abort', onAbort);
          await sleep(10000, signal);
          return fakeResults;
        },
        [],
        {
          onSuccess: () => onSuccess(),
          onError: () => onError(),
        }
      )
    );

    await sleep(10);
    expect(result.current.loading).toBe(true);
    result.current.cancel();
    await waitForNextUpdate();

    expect(onAbort).toHaveBeenCalled();
    expect(result.current.error).toBeUndefined();
    expect(result.current.loading).toBe(false);
    expect(result.current.result).toBeUndefined();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalled();
  });
});
