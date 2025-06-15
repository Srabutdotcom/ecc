/**
 * Options for windowed scalar multiplication using Jacobian coordinates.
 */
interface MultiplyOptions {
   /** Window size for wNAF decomposition. Default: 4 */
   w?: number;
   /** Whether to normalize precomputed points during oddTable generation. */
   normalize?: boolean;
 }
 
 /**
  * Performs scalar multiplication using the relative Jacobian coordinate method
  * with signed windowed Non-Adjacent Form (wNAF) and precomputed odd multiples.
  *
  * @template T - The point type (must support `z`, `constructor.CURVE.p`, etc.)
  * @param {T} P - The base point to multiply.
  * @param {bigint} scalar - The scalar multiplier.
  * @param {MultiplyOptions} [options] - Options including window size and normalization.
  * @returns {T} The resulting point after scalar multiplication.
  * @version __VERSION__
  */
 declare function multiplyJRelative<T>(P: T, scalar: bigint, options?: MultiplyOptions): T;
 
 /**
  * Async version of `multiplyJRelative`. Performs precomputation and wNAF decomposition in parallel.
  *
  * @template T - The point type (must support `z`, `constructor.CURVE.p`, etc.)
  * @param {T} P - The base point to multiply.
  * @param {bigint} scalar - The scalar multiplier.
  * @param {MultiplyOptions} [options] - Options including window size and normalization.
  * @returns {Promise<T>} A promise that resolves to the resulting point.
  * @version __VERSION__
  */
 declare function multiplyJRelativeAsync<T>(P: T, scalar: bigint, options?: MultiplyOptions): Promise<T>;
 
 export { multiplyJRelative, multiplyJRelativeAsync, MultiplyOptions };
 