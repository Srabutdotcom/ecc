/**
 * Memoizes (caches) computation result.
 * Uses WeakMap: the value is going auto-cleaned by GC after last reference is removed.
 */
export function memoized(
   fn
) {
   const map = new WeakMap();
   return (arg, ...args) => {
      const val = map.get(arg);
      if (val !== undefined) return val;
      const computed = fn(arg, ...args);
      map.set(arg, computed);
      return computed;
   };
}