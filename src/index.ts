import { useEffect, useRef, useState } from 'react';

export type AsyncState<R> = {
  loading: boolean;
  error: Error | undefined;
  result: R | undefined;
};
type SetLoading<R> = (asyncState: AsyncState<R>) => AsyncState<R>;
type SetResult<R> = (result: R, asyncState: AsyncState<R>) => AsyncState<R>;
type SetError<R> = (error: Error, asyncState: AsyncState<R>) => AsyncState<R>;

export type UseAsyncOptionsNormalized<R> = {
  setLoading: SetLoading<R>;
  setResult: SetResult<R>;
  setError: SetError<R>;
};
export type UseAsyncOptions<R> =
  | Partial<UseAsyncOptionsNormalized<R>>
  | undefined
  | null;

const InitialAsyncState: AsyncState<any> = {
  loading: true,
  result: undefined,
  error: undefined,
};

const defaultSetLoading: SetLoading<any> = _asyncState => InitialAsyncState;

const defaultSetResult: SetResult<any> = (result, _asyncState) => ({
  loading: false,
  result: result,
  error: undefined,
});

const defaultSetError: SetError<any> = (error, _asyncState) => ({
  loading: false,
  result: undefined,
  error: error,
});

const DefaultOptions = {
  setLoading: defaultSetLoading,
  setResult: defaultSetResult,
  setError: defaultSetError,
};

const normalizeOptions = <R>(
  options: UseAsyncOptions<R>
): UseAsyncOptionsNormalized<R> => ({
  ...DefaultOptions,
  ...options,
});

type UseAsyncStateResult<R> = {
  value: AsyncState<R>;
  setLoading: () => void;
  setResult: (r: R) => void;
  setError: (e: Error) => void;
};
const useAsyncState = <R extends {}>(
  options: UseAsyncOptionsNormalized<R>
): UseAsyncStateResult<R> => {
  const [value, setValue] = useState<AsyncState<R>>(InitialAsyncState);
  return {
    value,
    setLoading: () => setValue(options.setLoading(value)),
    setResult: result => setValue(options.setResult(result, value)),
    setError: error => setValue(options.setError(error, value)),
  };
};

const useIsMounted = (): (() => boolean) => {
  const ref = useRef<boolean>(false);
  useEffect(() => {
    ref.current = true;
    return () => {
      ref.current = false;
    };
  }, []);
  return () => ref.current;
};

type UseCurrentPromiseReturn<R> = {
  set: (promise: Promise<R>) => void;
  is: (promise: Promise<R>) => boolean;
};
const useCurrentPromise = <R>(): UseCurrentPromiseReturn<R> => {
  const ref = useRef<Promise<R> | null>(null);
  return {
    set: promise => (ref.current = promise),
    is: promise => ref.current === promise,
  };
};

type ArgumentsType<T> = T extends (...args: infer A) => any ? A : never;

export type UseAsyncResult<R> = AsyncState<R> & {
  execute: () => void;
};
export const useAsync = <R, Fun extends (...args: any[]) => Promise<R>>(
  asyncFunction: Fun,
  params: ArgumentsType<Fun>,
  options?: UseAsyncOptions<R>
): UseAsyncResult<R> => {
  const normalizedOptions = normalizeOptions(options);

  const AsyncState = useAsyncState(normalizedOptions);

  const isMounted = useIsMounted();

  const CurrentPromise = useCurrentPromise();

  // We only want to handle the promise result/error
  // if it is the last operation and the comp is still mounted
  const shouldHandlePromise = (p: Promise<R>) =>
    isMounted() && CurrentPromise.is(p);

  const executeAsyncOperation = () => {
    const promise = asyncFunction(...params);
    CurrentPromise.set(promise);
    AsyncState.setLoading();
    promise.then(
      result => {
        if (shouldHandlePromise(promise)) {
          AsyncState.setResult(result);
        }
      },
      error => {
        if (shouldHandlePromise(promise)) {
          AsyncState.setError(error);
        }
      }
    );
  };

  useEffect(() => {
    executeAsyncOperation();
  }, params);

  return {
    ...AsyncState.value,
    execute: executeAsyncOperation,
  };
};
