import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

// See https://gist.github.com/gaearon/e7d97cdf38a2907924ea12e4ebdf3c85
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' &&
  typeof window.document !== 'undefined' &&
  typeof window.document.createElement !== 'undefined'
    ? useLayoutEffect
    : useEffect;

// Assign current value to a ref and returns a stable getter to get the latest value.
// This way we are sure to always get latest value provided to hook and
// avoid weird issues due to closures capturing stale values...
// See https://github.com/facebook/react/issues/16956
// See https://overreacted.io/making-setinterval-declarative-with-react-hooks/
const useGetter = <T>(t: T) => {
  const ref = useRef(t);
  useIsomorphicLayoutEffect(() => {
    ref.current = t;
  });
  return useCallback(() => ref.current, [ref]);
};

type UnknownResult = unknown;

// Convenient to avoid declaring the type of args, which may help reduce type boilerplate
//type UnknownArgs = unknown[];
// TODO unfortunately it seems required for now if we want default param to work...
// See https://twitter.com/sebastienlorber/status/1170003594894106624
type UnknownArgs = any[];

export type AsyncStateStatus =
  | 'not-requested'
  | 'loading'
  | 'success'
  | 'error';

export type AsyncState<R> = {
  status: AsyncStateStatus;
  loading: boolean;
  error: Error | undefined;
  result: R | undefined;
};
type SetLoading<R> = (asyncState: AsyncState<R>) => AsyncState<R>;
type SetResult<R> = (result: R, asyncState: AsyncState<R>) => AsyncState<R>;
type SetError<R> = (error: Error, asyncState: AsyncState<R>) => AsyncState<R>;

type MaybePromise<T> = Promise<T> | T;

type PromiseCallbackOptions = {
  // Permit to know if the success/error belongs to the last async call
  isCurrent: () => boolean;

  // TODO this can be convenient but need some refactor
  // params: Args;
};

export type UseAsyncOptionsNormalized<R> = {
  initialState: (options?: UseAsyncOptionsNormalized<R>) => AsyncState<R>;
  executeOnMount: boolean;
  executeOnUpdate: boolean;
  setLoading: SetLoading<R>;
  setResult: SetResult<R>;
  setError: SetError<R>;
  onSuccess: (r: R, options: PromiseCallbackOptions) => void;
  onError: (e: Error, options: PromiseCallbackOptions) => void;
};
export type UseAsyncOptions<R> =
  | Partial<UseAsyncOptionsNormalized<R>>
  | undefined
  | null;

const InitialAsyncState: AsyncState<any> = {
  status: 'not-requested',
  loading: false,
  result: undefined,
  error: undefined,
};

const InitialAsyncLoadingState: AsyncState<any> = {
  status: 'loading',
  loading: true,
  result: undefined,
  error: undefined,
};

const defaultSetLoading: SetLoading<any> = _asyncState =>
  InitialAsyncLoadingState;

const defaultSetResult: SetResult<any> = (result, _asyncState) => ({
  status: 'success',
  loading: false,
  result: result,
  error: undefined,
});

const defaultSetError: SetError<any> = (error, _asyncState) => ({
  status: 'error',
  loading: false,
  result: undefined,
  error: error,
});

const noop = () => {};

const DefaultOptions: UseAsyncOptionsNormalized<any> = {
  initialState: options =>
    options && options.executeOnMount
      ? InitialAsyncLoadingState
      : InitialAsyncState,
  executeOnMount: true,
  executeOnUpdate: true,
  setLoading: defaultSetLoading,
  setResult: defaultSetResult,
  setError: defaultSetError,
  onSuccess: noop,
  onError: noop,
};

const normalizeOptions = <R>(
  options: UseAsyncOptions<R>
): UseAsyncOptionsNormalized<R> => ({
  ...DefaultOptions,
  ...options,
});

type UseAsyncStateResult<R> = {
  value: AsyncState<R>;
  set: Dispatch<SetStateAction<AsyncState<R>>>;
  merge: (value: Partial<AsyncState<R>>) => void;
  reset: () => void;
  setLoading: () => void;
  setResult: (r: R) => void;
  setError: (e: Error) => void;
};
const useAsyncState = <R extends {}>(
  options: UseAsyncOptionsNormalized<R>
): UseAsyncStateResult<R> => {
  const [value, setValue] = useState<AsyncState<R>>(() =>
    options.initialState(options)
  );

  const reset = useCallback(() => setValue(options.initialState(options)), [
    setValue,
    options,
  ]);

  const setLoading = () => setValue(value => options.setLoading(value));
  const setResult = (result: R) =>
    setValue(value => options.setResult(result, value));

  const setError = (error: Error) =>
    setValue(value => options.setError(error, value));

  const merge = (state: Partial<AsyncState<R>>) =>
    setValue(value => ({
      ...value,
      ...state,
    }));

  return {
    value,
    set: setValue,
    merge,
    reset,
    setLoading,
    setResult,
    setError,
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

export type UseAsyncReturn<
  R = UnknownResult,
  Args extends any[] = UnknownArgs
> = AsyncState<R> & {
  set: (value: AsyncState<R>) => void;
  merge: (value: Partial<AsyncState<R>>) => void;
  reset: () => void;
  execute: (...args: Args) => Promise<R>;
  currentPromise: Promise<R> | null;
  currentParams: Args | null;
};

// Relaxed interface which accept both async and sync functions
// Accepting sync function is convenient for useAsyncCallback
const useAsyncInternal = <R = UnknownResult, Args extends any[] = UnknownArgs>(
  asyncFunction: (...args: Args) => MaybePromise<R>,
  params: Args,
  options?: UseAsyncOptions<R>
): UseAsyncReturn<R, Args> => {
  // Fallback missing params, only for JS users forgetting the deps array, to prevent infinite loops
  // https://github.com/slorber/react-async-hook/issues/27
  // @ts-ignore
  !params && (params = []);

  const normalizedOptions = normalizeOptions<R>(options);

  const [currentParams, setCurrentParams] = useState<Args | null>(null);

  const AsyncState = useAsyncState<R>(normalizedOptions);

  const isMounted = useIsMounted();
  const CurrentPromise = useCurrentPromise<R>();

  // We only want to handle the promise result/error
  // if it is the last operation and the comp is still mounted
  const shouldHandlePromise = (p: Promise<R>) =>
    isMounted() && CurrentPromise.is(p);

  const executeAsyncOperation = (...args: Args): Promise<R> => {
    // async ensures errors thrown synchronously are caught (ie, bug when formatting api payloads)
    // async ensures promise-like and synchronous functions are handled correctly too
    // see https://github.com/slorber/react-async-hook/issues/24
    const promise: Promise<R> = (async () => asyncFunction(...args))();
    setCurrentParams(args);
    CurrentPromise.set(promise);
    AsyncState.setLoading();
    promise.then(
      result => {
        if (shouldHandlePromise(promise)) {
          AsyncState.setResult(result);
        }
        normalizedOptions.onSuccess(result, {
          isCurrent: () => CurrentPromise.is(promise),
        });
      },
      error => {
        if (shouldHandlePromise(promise)) {
          AsyncState.setError(error);
        }
        normalizedOptions.onError(error, {
          isCurrent: () => CurrentPromise.is(promise),
        });
      }
    );
    return promise;
  };

  const getLatestExecuteAsyncOperation = useGetter(executeAsyncOperation);

  const executeAsyncOperationMemo: (...args: Args) => Promise<R> = useCallback(
    (...args) => getLatestExecuteAsyncOperation()(...args),
    [getLatestExecuteAsyncOperation]
  );

  // Keep this outside useEffect, because inside isMounted()
  // will be true as the component is already mounted when it's run
  const isMounting = !isMounted();
  useEffect(() => {
    const execute = () => getLatestExecuteAsyncOperation()(...params);
    isMounting && normalizedOptions.executeOnMount && execute();
    !isMounting && normalizedOptions.executeOnUpdate && execute();
  }, params);

  return {
    ...AsyncState.value,
    set: AsyncState.set,
    merge: AsyncState.merge,
    reset: AsyncState.reset,
    execute: executeAsyncOperationMemo,
    currentPromise: CurrentPromise.get(),
    currentParams,
  };
};

// override to allow passing an async function with no args:
// gives more user-freedom to create an inline async function
export function useAsync<R = UnknownResult, Args extends any[] = UnknownArgs>(
  asyncFunction: () => Promise<R>,
  params: Args,
  options?: UseAsyncOptions<R>
): UseAsyncReturn<R, Args>;
export function useAsync<R = UnknownResult, Args extends any[] = UnknownArgs>(
  asyncFunction: (...args: Args) => Promise<R>,
  params: Args,
  options?: UseAsyncOptions<R>
): UseAsyncReturn<R, Args>;

export function useAsync<R = UnknownResult, Args extends any[] = UnknownArgs>(
  asyncFunction: (...args: Args) => Promise<R>,
  params: Args,
  options?: UseAsyncOptions<R>
): UseAsyncReturn<R, Args> {
  return useAsyncInternal(asyncFunction, params, options);
}

type AddArg<H, T extends any[]> = ((h: H, ...t: T) => void) extends ((
  ...r: infer R
) => void)
  ? R
  : never;

export const useAsyncAbortable = <
  R = UnknownResult,
  Args extends any[] = UnknownArgs
>(
  asyncFunction: (...args: AddArg<AbortSignal, Args>) => Promise<R>,
  params: Args,
  options?: UseAsyncOptions<R>
): UseAsyncReturn<R, Args> => {
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

// keep compat with TS < 3.5
type LegacyOmit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

// Some options are not allowed for useAsyncCallback
export type UseAsyncCallbackOptions<R> =
  | LegacyOmit<
      Partial<UseAsyncOptionsNormalized<R>>,
      'executeOnMount' | 'executeOnUpdate' | 'initialState'
    >
  | undefined
  | null;

export const useAsyncCallback = <
  R = UnknownResult,
  Args extends any[] = UnknownArgs
>(
  asyncFunction: (...args: Args) => MaybePromise<R>,
  options?: UseAsyncCallbackOptions<R>
): UseAsyncReturn<R, Args> => {
  return useAsyncInternal(
    asyncFunction,
    // Hacky but in such case we don't need the params,
    // because async function is only executed manually
    [] as any,
    {
      ...options,
      executeOnMount: false,
      executeOnUpdate: false,
    }
  );
};
