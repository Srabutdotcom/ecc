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

   tripling(){ return tripling(this)}

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
   if (P.equals(other)) return P.double()

   const { p } = P.constructor.CURVE;
   const { x, y, z } = P;
   const { x: x0, y: y0, z: z0 } = other;

   if (z0 == 1n) return addAffine(P, other)

   const Z1Z1 = sqr(z, p);
   const Z2Z2 = sqr(z0, p);
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

   const H = sub(U2, U1, p);
   const I = mod(4n * H * H, p);
   const J = mod(H * I, p);
   const r = mod(2n * (S2 - S1), p);
   const V = mod(U1 * I, p);

   const X3 = mod(r * r - J - 2n * V, p);
   const Y3 = mod(r * (V - X3) - 2n * S1 * J, p);
   const Z3 = mod(2n * z * z0 * H, p);

   return new P.constructor(X3, Y3, Z3);
}

function addAffine(P, other) {
   if (P.infinity) return other;
   if (other.infinity) return P;

   const { p } = P.constructor.CURVE;
   const { x, y, z } = P;
   const { x: x0, y: y0, z: z0 } = other;

   const Z1Z1 = sqr(z, p);
   const U2 = mod(x0 * Z1Z1, p);//mod(x0 * P.zz, p);
   const S2 = mod(y0 * z * Z1Z1, p);//mod(y0 * P.zzz, p);

   if (x === U2) {
      if (y === S2) {
         // Point doubling
         return P.double();
      } else {
         // Points are inverses
         return P.constructor.ZERO; //! Infinity
      }
   }

   const H = sub(U2, x, p);
   const I = mod(4n * H * H, p);
   const J = mod(H * I, p);
   const r = mod(2n * (S2 - y), p);
   const V = mod(x * I, p);

   const X3 = mod(r * r - J - 2n * V, p);
   const Y3 = mod(r * (V - X3) - 2n * y * J, p);
   const Z3 = mod(2n * z * H, p);

   return new P.constructor(X3, Y3, Z3);
}

function double(P) {
   if (P.infinity) return P;

   const { p, a } = P.constructor.CURVE
   const { x, y, z } = P;

   const YY = sqr(y, p);//P.yy//
   const ZZ = sqr(z, p);
   const S = mod(4n * x * YY, p)//mod(2n * ((P.x + YY) * (P.x + YY) - XX - YYYY), p);
   const M = mod(3n * x * x + a * ZZ * ZZ, p);

   const X3 = mod(M * M - 2n * S, p);
   const Y3 = mod(M * (S - X3) - 8n * YY * YY, p);
   const Z3 = mod(2n * y * z, p);

   return new P.constructor(X3, Y3, Z3);
}

// {@link https://hyperelliptic.org/EFD/g1p/data/shortw/jacobian-3/tripling/tpl-2005-dim}
function tripling(P) {
   if (P.infinity) return P;
   const { p, a } = P.constructor.CURVE
   const { x, y, z } = P;
   //M = 3*X12+a*Z14
   let x2 = sqr(x, p), z2 = sqr(z, p), y2 = sqr(y, p);
   const M = mod(3n * x2 + a * z2 * z2, p)
   //E = 12*X1*Y12-M2
   const E = mod(12n * x * y2 - M * M, p);
   //T = 8*Y14
   const T = mod(8n * y2 * y2, p);

   const E2 = sqr(E, p);
   const ME = mod(M * E, p);
   const T_ME = sub(T, ME, p);

   //X3 = 8*Y12*(T-M*E)+X1*E2
   const X3 = mod(8n * y2 * T_ME + x * E2, p);
   //Y3 = Y1*(4*(M*E-T)*(2*T-M*E)-E3)
   const Y3 = mod(y * (-4n * T_ME * (T + T_ME) - E2 * E), p);
   //Z3 = Z1*E
   const Z3 = mod(z * E, p);

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


export { Jacobi }