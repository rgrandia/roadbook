/** Trailing+leading throttle, used to coalesce zundo history snapshots while typing. */
export function throttle<A extends unknown[]>(fn: (...args: A) => void, waitMs: number) {
  let last = 0;
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let pendingArgs: A | null = null;

  const invoke = (args: A) => {
    last = Date.now();
    pendingArgs = null;
    fn(...args);
  };

  return (...args: A) => {
    const remaining = waitMs - (Date.now() - last);
    if (remaining <= 0) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      invoke(args);
    } else {
      pendingArgs = args;
      if (!timeout) {
        timeout = setTimeout(() => {
          timeout = null;
          if (pendingArgs) invoke(pendingArgs);
        }, remaining);
      }
    }
  };
}
