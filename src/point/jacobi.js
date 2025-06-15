import { memoized } from "../helper/memoize.js";
import { mod, modInv, sqr, sub } from "./modular.js";
import { Point3D } from "./point3d.js";

class Jacobi extends Point3D {

   static fromAffine(p) {
      const { x, y } = p || {};
      if (x === null && y === null) {
         return Jacobi.ZERO;
      }
      return new Jacobi(x, y, 1n);
   }
   constructor(x, y, z = 1n, s, t, u) {
      super(x, y, z)
      this.s = s
   }
   
   // Point addition in Jacobian coordinates (more efficient)
   add(other) {
      return add(this, other)
   }
   // Point doubling in Jacobian coordinates (very efficient)
   double() {
      return double(this)
   }

   doubleN(n) {
      return doubleN(this, n)
   }
   normalize(iz) {
      return alignMemo(this, iz)
   }
}

function add(P, other) {
   if (P.infinity) return other;
   if (other.infinity) return P;

   const { p } = P.constructor.CURVE;
   const { x, y, z } = P;
   const { x: x0, y: y0, z: z0 } = other;

   const Z1Z1 = sqr(z , p);
   const Z2Z2 = sqr(z0 , p);
   const U1 = mod(x * Z2Z2, p);//mod(x * other.zz, p);
   const U2 = mod(x0 * Z1Z1, p);//mod(x0 * P.zz, p);
   const S1 = mod(y * z0 * Z2Z2, p);//mod(y * other.zzz, p);
   const S2 = mod(y0 * z * Z1Z1, p);//mod(y0 * P.zzz, p);

   if (U1 === U2) {
      if (S1 === S2) {
         // Point doubling
         return P.double();
      } else {
         // Points are inverses
         return P.constructor.ZERO; //! Infinity
      }
   }

   const H = sub(U2 , U1, p);
   const I = mod(4n * H * H, p);
   const J = mod(H * I, p);
   const r = mod(2n * (S2 - S1), p);
   const V = mod(U1 * I, p);

   const X3 = mod(r * r - J - 2n * V, p);
   const Y3 = mod(r * (V - X3) - 2n * S1 * J, p);
   const Z3 = mod(2n * z * z0 * H, p);

   return new P.constructor(X3, Y3, Z3);
}

function double(P) {
   if (P.infinity) return P;

   const { p, a } = P.constructor.CURVE
   const { x, y, z } = P;

   const XX = sqr(x , p);//P.xx//
   const YY = sqr(y , p);//P.yy//
   const YYYY = sqr(YY , p);//P.yyyy//
   const ZZ = sqr(z , p);
   const S = mod(4n * x * YY, p)//mod(2n * ((P.x + YY) * (P.x + YY) - XX - YYYY), p);
   const M = mod(3n * XX + a * ZZ * ZZ, p);

   const X3 = mod(M * M - 2n * S, p);
   const Y3 = mod(M * (S - X3) - 8n * YYYY, p);
   const Z3 = mod(2n * y * z, p);

   return new P.constructor(X3, Y3, Z3);
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

var alignMemo = memoized((P, iz)=>{
   const { p } = P.constructor.CURVE
      if (P.infinity) return P;
      const { x, y, z } = P;
      iz = iz ? iz: modInv(z, p);
      const z2_inv = mod(iz * iz, p);
      const z3_inv = mod(z2_inv * iz, p);

      const ix = mod(x * z2_inv, p);
      const iy = mod(y * z3_inv, p);
      return new P.constructor(ix, iy);
})

export { Jacobi }