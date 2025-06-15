/**
 * Performs scalar multiplication on an elliptic curve point using the double-and-add method.
 *
 * This function computes `k * P`, where `P` is an elliptic curve point and `k` is a BigInt scalar.
 * It uses a standard double-and-add binary method, suitable for general-purpose use.
 *
 * @template T - A class representing a point on an elliptic curve. It must implement `add()`, `double()`, and `negate()` methods, and expose a `ZERO` (point at infinity).
 *
 * @param {T} P - The base point to multiply.
 * @param {bigint} k - The scalar multiplier. Can be positive, negative, or zero.
 * @returns {T} The resulting point after scalar multiplication.
 * @version __VERSION__
 */
declare function doubleadd<T extends {
   add(other: T): T;
   double(): T;
   negate(): T;
   constructor: { ZERO: T };
 }>(P: T, k: bigint): T;
 
 export = doubleadd;
 