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
  initialState: AsyncState<R>;
  executeOnMount: boolean;
  executeOnUpdate: boolean;
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
  initialState: InitialAsyncState,
  executeOnMount: true,
  executeOnUpdate: true,
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
  set: (value: AsyncState<R>) => void;
  setLoading: () => void;
  setResult: (r: R) => void;
  setError: (e: Error) => void;
};
const useAsyncState = <R extends {}>(
  options: UseAsyncOptionsNormalized<R>
): UseAsyncStateResult<R> => {
  const [value, setValue] = useState<AsyncState<R>>(options.initialState);
  return {
    value,
    set: setValue,
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
  get: () => Promise<R> | null;
  is: (promise: Promise<R>) => boolean;
};
const useCurrentPromise = <R>(): UseCurrentPromiseReturn<R> => {
  const ref = useRef<Promise<R> | null>(null);
  return {
    set: promise => (ref.current = promise),
    get: () => ref.current,
    is: promise => ref.current === promise,
  };
};

export type UseAsyncReturn<R> = AsyncState<R> & {
  set: (value: AsyncState<R>) => void;
  execute: () => Promise<R>;
  currentPromise: Promise<R> | null;
};
export const useAsync = <R, Args extends any[]>(
  asyncFunction: (...args: Args) => Promise<R>,
  params: Args,
  options?: UseAsyncOptions<R>
): UseAsyncReturn<R> => {
  const normalizedOptions = normalizeOptions<R>(options);

  const AsyncState = useAsyncState<R>(normalizedOptions);

  const isMounted = useIsMounted();
  const CurrentPromise = useCurrentPromise<R>();

  // We only want to handle the promise result/error
  // if it is the last operation and the comp is still mounted
  const shouldHandlePromise = (p: Promise<R>) =>
    isMounted() && CurrentPromise.is(p);

  const executeAsyncOperation = (): Promise<R> => {
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
    return promise;
  };

  // Keep this outside useEffect, because inside isMounted()
  // will be true as the component is already mounted when it's run
  const isMounting = !isMounted();
  useEffect(() => {
    if (isMounting) {
      normalizedOptions.executeOnMount && executeAsyncOperation();
    } else {
      normalizedOptions.executeOnUpdate && executeAsyncOperation();
    }
  }, params);

  return {
    ...AsyncState.value,
    set: AsyncState.set,
    execute: executeAsyncOperation,
    currentPromise: CurrentPromise.get(),
  };
};

type AddArg<H, T extends any[]> = ((h: H, ...t: T) => void) extends ((
  ...r: infer R
) => void)
  ? R
  : never;

export const useAsyncAbortable = <R, Args extends any[]>(
  asyncFunction: (...args: AddArg<AbortSignal, Args>) => Promise<R>,
  params: Args,
  options?: UseAsyncOptions<R>
): UseAsyncReturn<R> => {
  const abortControllerRef = useRef<AbortController>();

  // Wrap the original async function and enhance it with abortion login
  const asyncFunctionWrapper: (...args: Args) => Promise<R> = async (
    ...p: Args
  ) => {
    // Cancel previous async call
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    // Create/store new abort controller for next async call
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      // @ts-ignore // TODO how to type this?
      return await asyncFunction(abortController.signal, ...p);
    } finally {
      // Unset abortController ref if response is already there,
      // as it's not needed anymore to try to abort it (would it be no-op?)
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = undefined;
      }
    }
  };

  return useAsync(asyncFunctionWrapper, params, options);
};
