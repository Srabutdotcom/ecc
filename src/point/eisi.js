import { memoized } from "../mod.ts";
import { mod, modInv, mul, sqr, sub } from "./modular.js";
import { Point3D } from "./point3d.js";

//{@link https://www.mdpi.com/2079-9292/11/19/3123}
class Eisi extends Point3D {
   constructor(x, y, z, s, t, u) {
      super(x, y, z)
   }
   add(other) { return add(this, other) }
   double() { return double(this) }
   addAffine(other) { return addAffine(this, other) }
   doubleN(n) { return doubleN(this, n) }
   tripling() { return double(this).add(this)}
   normalize(iz) { return alignMemo(this, iz) }
}


function add(P, other) {
   if (P.infinity) return other;
   if (other.infinity) return P;
   if (P.equals(other)) return P.double();

   const { p } = P.constructor.CURVE;
   const { x: xa, y: ya, z: Ua } = P;
   const { x: xb, y: yb, z: Ub } = other;

   if (Ub == 1n) return P.addAffine(other)

   const U2 = sqr(Ua, p);
   const U3 = mul(U2, Ua, p);

   const T2 = sqr(Ub, p);
   const T3 = mul(T2, Ub, p);

   const yaT3 = mul(ya, T3, p)
   const xaT2 = mul(xa, T2, p)
   const xbU2 = mul(xb, U2, p)
   if (xaT2 == xbU2) return P.constructor.ZERO;
   const Wc = mod(yb * U3 - yaT3, p);
   const qc = sub(xbU2, xaT2, p);
   const Uc = mod(Ua * Ub * qc, p);

   const qc2 = sqr(qc, p);
   const D = mul(xaT2, qc2, p)

   const xc = mod(Wc * Wc - D - xbU2 * qc2, p);
   const yc = mod(Wc * (D - xc) - yaT3 * qc2 * qc, p)
   return new P.constructor(xc, yc, Uc);
}
function double(P) {
   if (P.infinity) return P;

   const { a, p } = P.constructor.CURVE;
   const { x, y, z } = P;

   const z2 = sqr(z, p);
   const y2 = sqr(y, p);

   const B = mod(3n * x * x + a * z2 * z2, p);
   const C = mul(x, y2, p)

   const Nx = mod(B * B - 8n * C, p);
   const Ny = mod(B * (4n * C - Nx) - 8n * y2 * y2, p);
   const U = mod(2n * y * z, p);
   return new P.constructor(Nx, Ny, U);
}
function addAffine(O, P) {// PointAffine
   if (O.infinity) return P;

   const { p } = O.constructor.CURVE;

   const { x: Nx, y: Ny, z: U } = O;
   const { x, y } = P

   const U2 = sqr(U, p);

   const W = mod(Ny - y * U2 * U, p);
   const q = mod(Nx - x * U2, p);
   if (q == 0n) return P.constructor.ZERO;

   const A = mul(U, q, p);
   const A2 = sqr(A, p);
   const B = mul(x, A2, p)

   const x1 = mod(W * W - B - Nx * q * q, p);
   const y1 = mod(W * (B - x1) - y * A2 * A, p);
   return new P.constructor(x1, y1, A)
}

function doubleN(P, n) {
   if (n < 1) return P
   if (n == 1) return P.double()
   let point = P;

   for (let i = 0; i < n; i++) {
      point = point.double()
   }
   return point
}

var alignMemo = memoized((P, iz) => {
   const { p } = P.constructor.CURVE
   if (P.infinity) return P;
   const { x, y, z } = P;
   iz = iz ? iz : modInv(z, p);
   const z2_inv = mod(iz * iz, p);
   const z3_inv = mod(z2_inv * iz, p);

   const ix = mod(x * z2_inv, p);
   const iy = mod(y * z3_inv, p);
   return new P.constructor(ix, iy);
})

export { Eisi }

