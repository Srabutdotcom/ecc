import { batchInverse } from "../mod.ts";

function wNAFUnsafe(W, precomputes, n, acc /* = c.ZERO */) {
   const wo = calcWOpts(W, acc.constructor.CURVE.bit);//bits);
   for (let window = 0; window < wo.windows; window++) {
      if (n === 0n) break; // Early-exit, skip 0 value
      const { nextN, offset, isZero, isNeg } = calcOffsets(n, window, wo);
      n = nextN;
      if (isZero) {
         continue;
      } else {
         const item = precomputes[offset];
         acc = acc.add(isNeg ? item.negate() : item); // Re-using acc allows to save adds in MSM
      }
   }
   return acc;
}

/**
 * Creates a wNAF precomputation window. Used for caching.
 * Default window size is set by `utils.precompute()` and is equal to 8.
 * Number of precomputed points depends on the curve size:
 * 2^(𝑊−1) * (Math.ceil(𝑛 / 𝑊) + 1), where:
 * - 𝑊 is the window size
 * - 𝑛 is the bitlength of the curve order.
 * For a 256-bit curve and window size 8, the number of precomputed points is 128 * 33 = 4224.
 * @param elm Point instance
 * @param W window size
 * @returns precomputed point tables flattened to a single array
 */
function precomputeWindow(Point, W) {
   const { windows, windowSize } = calcWOpts(W, Point.constructor.CURVE.bit);// bit
   const points = [];
   let p = Point;
   let base = p;
   for (let window = 0; window < windows; window++) {
      base = p;
      points.push(base);
      // i=1, bc we skip 0
      for (let i = 1; i < windowSize; i++) {
         base = base.add(p);
         points.push(base);
      }
      p = base.double();
   }
   return points;
}

function wNAFUS(P, k, { w = 4, normalize = true }={}) {
   const precompute = precomputeWindow(P, w);
   if (!normalize) return wNAFUnsafe(w, precompute, k, P.constructor.ZERO)
   const zs_i = batchInverse(precompute.map(e => e.z), P.constructor.CURVE.p);
   const pre = precompute.map((p, i) => p.normalize(zs_i[i]))
   return wNAFUnsafe(w, pre, k, P.constructor.ZERO)
}

function calcWOpts(W, scalarBits) {
   //validateW(W, scalarBits);
   const windows = Math.ceil(scalarBits / W) + 1; // W=8 33. Not 32, because we skip zero
   const windowSize = 2 ** (W - 1); // W=8 128. Not 256, because we skip zero
   const maxNumber = 2 ** W; // W=8 256
   const mask = bitMask(W); // W=8 255 == mask 0b11111111
   const shiftBy = BigInt(W); // W=8 8
   return { windows, windowSize, mask, maxNumber, shiftBy };
}

function calcOffsets(n, window, wOpts) {
   const { windowSize, mask, maxNumber, shiftBy } = wOpts;
   let wbits = Number(n & mask); // extract W bits.
   let nextN = n >> shiftBy; // shift number by W bits.

   // What actually happens here:
   // const highestBit = Number(mask ^ (mask >> 1n));
   // let wbits2 = wbits - 1; // skip zero
   // if (wbits2 & highestBit) { wbits2 ^= Number(mask); // (~);

   // split if bits > max: +224 => 256-32
   if (wbits > windowSize) {
      // we skip zero, which means instead of `>= size-1`, we do `> size`
      wbits -= maxNumber; // -32, can be maxNumber - wbits, but then we need to set isNeg here.
      nextN += 1n; // +256 (carry)
   }
   const offsetStart = window * windowSize;
   const offset = offsetStart + Math.abs(wbits) - 1; // -1 because we skip zero
   const isZero = wbits === 0; // is current window slice a 0?
   const isNeg = wbits < 0; // is current window slice negative?
   const isNegF = window % 2 !== 0; // fake random statement for noise
   const offsetF = offsetStart; // fake offset for noise
   return { nextN, offset, isZero, isNeg, isNegF, offsetF };
}

/**
 * Calculate mask for N bits. Not using ** operator with bigints because of old engines.
 * Same as BigInt(`0b${Array(i).fill('1').join('')}`)
 */
var bitMask = (n) => (1n << BigInt(n)) - 1n;

export { precomputeWindow, wNAFUnsafe, wNAFUS }