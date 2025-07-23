/**
 * Options for signed wNAF scalar multiplication.
 */
interface WNAFOptions {
   /** Window size (bit-width) for signed wNAF. Default: 4 */
   w?: number;
   /** Whether to normalize precomputed odd multiples. Default: false */
   normalize?: boolean;
 }
 
 /**
  * Performs scalar multiplication using signed wNAF (Non-Adjacent Form)
  * and odd precomputation table. This is an efficient and compact scalar multiplication
  * strategy, ideal for variable-base multiplication.
  *
  * @template T - Point class supporting `.z`, `.normalize()`, and curve metadata.
  * @param {T} P - The base point (typically in Jacobian coordinates).
  * @param {bigint} k - Scalar to multiply.
  * @param {WNAFOptions} [options] - Window size and normalization toggle.
  * @returns {T} - The resulting point after multiplication.
  * @version __VERSION__
  */
 declare function signwnaf<T>(P: T, k: bigint, options?: WNAFOptions): T;
 
 /**
  * Async version of `signwnaf`. Decomposes the scalar and precomputes odd multiples
  * in parallel for better performance or UI responsiveness.
  *
  * @template T - Point class supporting `.z`, `.normalize()`, and curve metadata.
  * @param {T} P - The base point (typically in Jacobian coordinates).
  * @param {bigint} k - Scalar to multiply.
  * @param {WNAFOptions} [options] - Window size and normalization toggle.
  * @returns {Promise<T>} - A Promise resolving to the resulting point.
  * @version __VERSION__
  */
 declare function signwnafAsync<T>(P: T, k: bigint, options?: WNAFOptions): Promise<T>;
 
 export { signwnaf, signwnafAsync };
 