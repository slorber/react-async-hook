import {
  useLayoutEffect,
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';

function _extends() {
  _extends =
    Object.assign ||
    function(target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i];

        for (var key in source) {
          if (Object.prototype.hasOwnProperty.call(source, key)) {
            target[key] = source[key];
          }
        }
      }

      return target;
    };

  return _extends.apply(this, arguments);
}

// A type of promise-like that resolves synchronously and supports only one observer

const _iteratorSymbol =
  /*#__PURE__*/ typeof Symbol !== 'undefined'
    ? Symbol.iterator || (Symbol.iterator = Symbol('Symbol.iterator'))
    : '@@iterator';

const _asyncIteratorSymbol =
  /*#__PURE__*/ typeof Symbol !== 'undefined'
    ? Symbol.asyncIterator ||
      (Symbol.asyncIterator = Symbol('Symbol.asyncIterator'))
    : '@@asyncIterator';

// Asynchronously await a promise and pass the result to a finally continuation
function _finallyRethrows(body, finalizer) {
  try {
    var result = body();
  } catch (e) {
    return finalizer(true, e);
  }
  if (result && result.then) {
    return result.then(finalizer.bind(null, false), finalizer.bind(null, true));
  }
  return finalizer(false, value);
}

var useIsomorphicLayoutEffect =
  typeof window !== 'undefined' &&
  typeof window.document !== 'undefined' &&
  typeof window.document.createElement !== 'undefined'
    ? useLayoutEffect
    : useEffect; // assign current value to a ref and providing a getter.
// This way we are sure to always get latest value provided to hook and
// avoid weird issues due to closures capturing stale values...
// See https://overreacted.io/making-setinterval-declarative-with-react-hooks/

var useGetter = function useGetter(t) {
  var ref = useRef(t);
  useIsomorphicLayoutEffect(function() {
    ref.current = t;
  });
  return function() {
    return ref.current;
  };
};

var InitialAsyncState = {
  status: 'not-requested',
  loading: false,
  result: undefined,
  error: undefined,
};
var InitialAsyncLoadingState = {
  status: 'loading',
  loading: true,
  result: undefined,
  error: undefined,
};

var defaultSetLoading = function defaultSetLoading(_asyncState) {
  return InitialAsyncLoadingState;
};

var defaultSetResult = function defaultSetResult(result, _asyncState) {
  return {
    status: 'success',
    loading: false,
    result: result,
    error: undefined,
  };
};

var defaultSetError = function defaultSetError(error, _asyncState) {
  return {
    status: 'error',
    loading: false,
    result: undefined,
    error: error,
  };
};

var noop = function noop() {};

var DefaultOptions = {
  initialState: function initialState(options) {
    return options && options.executeOnMount
      ? InitialAsyncLoadingState
      : InitialAsyncState;
  },
  executeOnMount: true,
  executeOnUpdate: true,
  setLoading: defaultSetLoading,
  setResult: defaultSetResult,
  setError: defaultSetError,
  onSuccess: noop,
  onError: noop,
};

var normalizeOptions = function normalizeOptions(options) {
  return _extends({}, DefaultOptions, {}, options);
};

var useAsyncState = function useAsyncState(options) {
  var _useState = useState(function() {
      return options.initialState(options);
    }),
    value = _useState[0],
    setValue = _useState[1];

  var reset = useCallback(
    function() {
      return setValue(options.initialState(options));
    },
    [setValue, options]
  );
  var setLoading = useCallback(
    function() {
      return setValue(options.setLoading(value));
    },
    [value, setValue]
  );
  var setResult = useCallback(
    function(result) {
      return setValue(options.setResult(result, value));
    },
    [value, setValue]
  );
  var setError = useCallback(
    function(error) {
      return setValue(options.setError(error, value));
    },
    [value, setValue]
  );
  var set = setValue;
  var merge = useCallback(
    function(state) {
      return set(_extends({}, value, {}, state));
    },
    [value, set]
  );
  return {
    value: value,
    set: set,
    merge: merge,
    reset: reset,
    setLoading: setLoading,
    setResult: setResult,
    setError: setError,
  };
};

var useIsMounted = function useIsMounted() {
  var ref = useRef(false);
  useEffect(function() {
    ref.current = true;
    return function() {
      ref.current = false;
    };
  }, []);
  return function() {
    return ref.current;
  };
};

var useCurrentPromise = function useCurrentPromise() {
  var ref = useRef(null);
  return {
    set: function set(promise) {
      return (ref.current = promise);
    },
    get: function get() {
      return ref.current;
    },
    is: function is(promise) {
      return ref.current === promise;
    },
  };
}; // Relaxed interface which accept both async and sync functions
// Accepting sync function is convenient for useAsyncCallback

var useAsyncInternal = function useAsyncInternal(
  asyncFunction,
  params,
  options
) {
  var normalizedOptions = normalizeOptions(options);

  var _useState2 = useState(null),
    currentParams = _useState2[0],
    setCurrentParams = _useState2[1];

  var AsyncState = useAsyncState(normalizedOptions);
  var isMounted = useIsMounted();
  var CurrentPromise = useCurrentPromise(); // We only want to handle the promise result/error
  // if it is the last operation and the comp is still mounted

  var shouldHandlePromise = function shouldHandlePromise(p) {
    return isMounted() && CurrentPromise.is(p);
  };

  var executeAsyncOperation = function executeAsyncOperation() {
    for (
      var _len = arguments.length, args = new Array(_len), _key = 0;
      _key < _len;
      _key++
    ) {
      args[_key] = arguments[_key];
    }

    var promise = asyncFunction.apply(void 0, args);
    setCurrentParams(args);

    if (promise instanceof Promise) {
      CurrentPromise.set(promise);
      AsyncState.setLoading();
      promise.then(
        function(result) {
          if (shouldHandlePromise(promise)) {
            AsyncState.setResult(result);
          }

          normalizedOptions.onSuccess(result, {
            isCurrent: function isCurrent() {
              return CurrentPromise.is(promise);
            },
          });
        },
        function(error) {
          if (shouldHandlePromise(promise)) {
            AsyncState.setError(error);
          }

          normalizedOptions.onError(error, {
            isCurrent: function isCurrent() {
              return CurrentPromise.is(promise);
            },
          });
        }
      );
      return promise;
    } else {
      // We allow passing a non-async function (mostly for useAsyncCallback conveniency)
      var syncResult = promise;
      AsyncState.setResult(syncResult);
      return Promise.resolve(syncResult);
    }
  }; // Keep this outside useEffect, because inside isMounted()
  // will be true as the component is already mounted when it's run

  var isMounting = !isMounted();
  useEffect(function() {
    if (isMounting) {
      normalizedOptions.executeOnMount &&
        executeAsyncOperation.apply(void 0, params);
    } else {
      normalizedOptions.executeOnUpdate &&
        executeAsyncOperation.apply(void 0, params);
    }
  }, params);
  return _extends({}, AsyncState.value, {
    set: AsyncState.set,
    merge: AsyncState.merge,
    reset: AsyncState.reset,
    execute: executeAsyncOperation,
    currentPromise: CurrentPromise.get(),
    currentParams: currentParams,
  });
};

function useAsync(asyncFunction, params, options) {
  return useAsyncInternal(asyncFunction, params, options);
}
var useAsyncAbortable = function useAsyncAbortable(
  asyncFunction,
  params,
  options
) {
  var abortControllerRef = useRef(); // Wrap the original async function and enhance it with abortion login

  var asyncFunctionWrapper = function asyncFunctionWrapper() {
    for (
      var _len2 = arguments.length, p = new Array(_len2), _key2 = 0;
      _key2 < _len2;
      _key2++
    ) {
      p[_key2] = arguments[_key2];
    }

    try {
      // Cancel previous async call
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      } // Create/store new abort controller for next async call

      var abortController = new AbortController();
      abortControllerRef.current = abortController;
      return Promise.resolve(
        _finallyRethrows(
          function() {
            // @ts-ignore // TODO how to type this?
            return Promise.resolve(
              asyncFunction.apply(void 0, [abortController.signal].concat(p))
            );
          },
          function(_wasThrown, _result) {
            // Unset abortController ref if response is already there,
            // as it's not needed anymore to try to abort it (would it be no-op?)
            if (abortControllerRef.current === abortController) {
              abortControllerRef.current = undefined;
            }

            if (_wasThrown) throw _result;
            return _result;
          }
        )
      );
    } catch (e) {
      return Promise.reject(e);
    }
  };

  return useAsync(asyncFunctionWrapper, params, options);
};
var useAsyncCallback = function useAsyncCallback(asyncFunction, options) {
  return useAsyncInternal(
    asyncFunction, // Hacky but in such case we don't need the params,
    // because async function is only executed manually
    [],
    _extends({}, options, {
      executeOnMount: false,
      executeOnUpdate: false,
    })
  );
};
var useAsyncFetchMore = function useAsyncFetchMore(_ref) {
  var value = _ref.value,
    fetchMore = _ref.fetchMore,
    merge = _ref.merge,
    isEndFn = _ref.isEnd;
  var getAsyncValue = useGetter(value);

  var _useState3 = useState(false),
    isEnd = _useState3[0],
    setIsEnd = _useState3[1]; // TODO not really fan of this id thing, we should find a way to support cancellation!

  var fetchMoreId = useRef(0);
  var fetchMoreAsync = useAsyncCallback(function() {
    try {
      var freshAsyncValue = getAsyncValue();

      if (freshAsyncValue.status !== 'success') {
        throw new Error(
          "Can't fetch more if the original fetch is not a success"
        );
      }

      if (fetchMoreAsync.status === 'loading') {
        throw new Error(
          "Can't fetch more, because we are already fetching more!"
        );
      }

      fetchMoreId.current = fetchMoreId.current + 1;
      var currentId = fetchMoreId.current;
      return Promise.resolve(fetchMore(freshAsyncValue.result)).then(function(
        moreResult
      ) {
        // TODO not satisfied with this, we should just use "freshAsyncValue === getAsyncValue()" but asyncValue is not "stable"
        var isStillSameValue =
          freshAsyncValue.status === getAsyncValue().status &&
          freshAsyncValue.result === getAsyncValue().result;
        var isStillSameId = fetchMoreId.current === currentId; // Handle race conditions: we only merge the fetchMore result if the initial async value is the same

        var canMerge = isStillSameValue && isStillSameId;

        if (canMerge) {
          value.merge({
            result: merge(value.result, moreResult),
          });

          if (isEndFn(moreResult)) {
            setIsEnd(true);
          }
        } // return is useful for chaining, like fetchMore().then(result => {});

        return moreResult;
      });
    } catch (e) {
      return Promise.reject(e);
    }
  });

  var reset = function reset() {
    fetchMoreAsync.reset();
    setIsEnd(false);
  }; // We only allow to fetch more on a stable async value
  // If that value change for whatever reason, we reset the fetchmore too (which will make current pending requests to be ignored)
  // TODO value is not stable, we could just reset on value change otherwise

  var shouldReset = value.status !== 'success';
  useEffect(
    function() {
      if (shouldReset) {
        reset();
      }
    },
    [shouldReset]
  );
  return {
    canFetchMore:
      value.status === 'success' && fetchMoreAsync.status !== 'loading',
    loading: fetchMoreAsync.loading,
    status: fetchMoreAsync.status,
    fetchMore: fetchMoreAsync.execute,
    isEnd: isEnd,
  };
};

export { useAsync, useAsyncAbortable, useAsyncCallback, useAsyncFetchMore };
//# sourceMappingURL=react-async-hook.esm.js.map
