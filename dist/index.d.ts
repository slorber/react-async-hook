declare type UnknownResult = unknown;
declare type UnknownArgs = any[];
export declare type AsyncStateStatus =
  | 'not-requested'
  | 'loading'
  | 'success'
  | 'error';
export declare type AsyncState<R> = {
  status: AsyncStateStatus;
  loading: boolean;
  error: Error | undefined;
  result: R | undefined;
};
declare type SetLoading<R> = (asyncState: AsyncState<R>) => AsyncState<R>;
declare type SetResult<R> = (
  result: R,
  asyncState: AsyncState<R>
) => AsyncState<R>;
declare type SetError<R> = (
  error: Error,
  asyncState: AsyncState<R>
) => AsyncState<R>;
declare type MaybePromise<T> = Promise<T> | T;
declare type PromiseCallbackOptions = {
  isCurrent: () => boolean;
};
export declare type UseAsyncOptionsNormalized<R> = {
  initialState: (options?: UseAsyncOptionsNormalized<R>) => AsyncState<R>;
  executeOnMount: boolean;
  executeOnUpdate: boolean;
  setLoading: SetLoading<R>;
  setResult: SetResult<R>;
  setError: SetError<R>;
  onSuccess: (r: R, options: PromiseCallbackOptions) => void;
  onError: (e: Error, options: PromiseCallbackOptions) => void;
};
export declare type UseAsyncOptions<R> =
  | Partial<UseAsyncOptionsNormalized<R>>
  | undefined
  | null;
export declare type UseAsyncReturn<
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
export declare function useAsync<
  R = UnknownResult,
  Args extends any[] = UnknownArgs
>(
  asyncFunction: () => Promise<R>,
  params: Args,
  options?: UseAsyncOptions<R>
): UseAsyncReturn<R, Args>;
export declare function useAsync<
  R = UnknownResult,
  Args extends any[] = UnknownArgs
>(
  asyncFunction: (...args: Args) => Promise<R>,
  params: Args,
  options?: UseAsyncOptions<R>
): UseAsyncReturn<R, Args>;
declare type AddArg<H, T extends any[]> = ((h: H, ...t: T) => void) extends ((
  ...r: infer R
) => void)
  ? R
  : never;
export declare const useAsyncAbortable: <
  R = unknown,
  Args extends any[] = any[]
>(
  asyncFunction: (...args: AddArg<AbortSignal, Args>) => Promise<R>,
  params: Args,
  options?: UseAsyncOptions<R>
) => UseAsyncReturn<R, Args>;
declare type LegacyOmit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export declare type UseAsyncCallbackOptions<R> =
  | LegacyOmit<
      Partial<UseAsyncOptionsNormalized<R>>,
      'executeOnMount' | 'executeOnUpdate' | 'initialState'
    >
  | undefined
  | null;
export declare const useAsyncCallback: <
  R = unknown,
  Args extends any[] = any[]
>(
  asyncFunction: (...args: Args) => MaybePromise<R>,
  options?: UseAsyncCallbackOptions<R>
) => UseAsyncReturn<R, Args>;
export declare const useAsyncFetchMore: <R, Args extends any[]>({
  value,
  fetchMore,
  merge,
  isEnd: isEndFn,
}: {
  value: UseAsyncReturn<R, Args>;
  fetchMore: (result: R) => Promise<R>;
  merge: (result: R, moreResult: R) => R;
  isEnd: (moreResult: R) => boolean;
}) => {
  canFetchMore: boolean;
  loading: boolean;
  status: AsyncStateStatus;
  fetchMore: () => Promise<R>;
  isEnd: boolean;
};
export {};
