import { useEffect, useRef, useState } from "react";

const InitialAsyncState = {
  loading: true,
  result: undefined,
  error: undefined,
};

const defaultSetLoading = (asyncState) => InitialAsyncState;
const defaultSetResult = (result, asyncState) => ({
  loading: false,
  result: result,
  error: undefined,
});
const defaultSetError = (error, asyncState) => ({
  loading: false,
  result: undefined,
  error: error,
});


const DefaultOptions = {
  setLoading: defaultSetLoading,
  setResult: defaultSetResult,
  setError: defaultSetError,
};
const normalizeOptions = options => ({
  ...DefaultOptions,
  ...options,
});


const useAsyncState = options => {
  const [value, setValue] = useState(InitialAsyncState);
  return {
    value,
    setLoading: () => setValue(options.setLoading(value)),
    setResult: result => setValue(options.setResult(result, value)),
    setError: error => setValue(options.setError(error, value)),
  }
};


const useIsMounted = () => {
  const ref = useRef(true);
  useEffect(() => {
    return () => ref.current = false;
  }, []);
  return () => ref.current;
};


const useCurrentPromise = () => {
  const ref = useRef(null);
  return {
    set: (promise => ref.current = promise),
    is: (promise => ref.current === promise),
  };
};


export const useAsync = (asyncFunction, params = [], options) => {

  options = normalizeOptions(options);

  const AsyncState = useAsyncState(options);

  const isMounted = useIsMounted();

  const CurrentPromise = useCurrentPromise();

  // We only want to handle the promise result/error
  // if it is the last operation and the comp is still mounted
  const shouldHandlePromise = p => isMounted() && CurrentPromise.is(p);

  const executeAsyncOperation = () => {
    const promise = asyncFunction(params);
    CurrentPromise.set(promise);
    AsyncState.setLoading();
    promise.then(
      result => {
        if ( shouldHandlePromise(promise) ) {
          AsyncState.setResult(result);
        }
      },
      error => {
        if ( shouldHandlePromise(promise) ) {
          AsyncState.setError(error);
        }
      }
    );
  };

  useEffect(() => {
    executeAsyncOperation();
  }, params);


  const result = {
    ...AsyncState.value,
    execute: () => executeAsyncOperation(),
  };

  return result;
};


