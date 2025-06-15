/**
 * Options for multibase scalar multiplication.
 */
interface MultiBaseOptions {
   /** Window size (bit-width) for scalar chunking. Default: 4 */
   w?: number;
   /** Whether to normalize points in the base table. Default: false */
   normalize?: boolean;
 }
 
 /**
  * Performs scalar multiplication using precomputed base table chunks (multibase method).
  *
  * This function is optimized for repeated multiplications of a fixed base point.
  * It chunks the scalar `k` using `w`-bit groups and applies precomputed point multiples.
  *
  * @template T - Point class type supporting `.z`, `.normalize()`, `constructor.CURVE.p`, etc.
  * @param {T} P - The base point to multiply (typically in Jacobian coordinates).
  * @param {bigint} k - The scalar multiplier.
  * @param {MultiBaseOptions} [options] - Window size and normalization toggle.
  * @returns {T} - Resulting point after scalar multiplication.
  * @version __VERSION__
  */
 declare function multibase<T>(P: T, k: bigint, options?: MultiBaseOptions): T;
 
 /**
  * Asynchronous version of `multibase`, precomputing base table and scalar chunks in parallel.
  *
  * Useful for UI responsiveness or computing in browsers with large scalars.
  *
  * @template T - Point class type supporting `.z`, `.normalize()`, `constructor.CURVE.p`, etc.
  * @param {T} P - The base point to multiply.
  * @param {bigint} k - The scalar multiplier.
  * @param {MultiBaseOptions} [options] - Window size and normalization toggle.
  * @returns {Promise<T>} - A promise resolving to the resulting point.
  * @version __VERSION__
  */
 declare function multibaseAsync<T>(P: T, k: bigint, options?: MultiBaseOptions): Promise<T>;
 
 export { multibase, multibaseAsync, MultiBaseOptions };
 