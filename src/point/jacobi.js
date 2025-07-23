import { memoized } from "../helper/memoize.js";
import { Point3D } from "./point3d.js";

class Jacobi extends Point3D {

   static fromAffine(p) {
      const { x, y } = p || {};
      if (x === null && y === null) {
         return Jacobi.ZERO;
      }
      return new Jacobi(x, y, 1n);
   }
   constructor(x, y, z = 1n, s) {
      super(x, y, z)
      this.s = s
   }

   // Point addition in Jacobian coordinates (more efficient)
   add(other, { mod, a }) {
      return add(this, other, { mod, a })
   }
   // Point doubling in Jacobian coordinates (very efficient)
   double({ mod, a }) {
      return double(this, { mod, a })
   }

   tripling({ mod, a }) { return tripling(this, { mod, a }) }

   doubleN(n, { mod, a }) {
      return doubleN(this, n, { mod, a })
   }
   normalize(iz, { mod, inv }) {
      return alignMemo(this, iz, { mod, inv })
   }
}

function jacobiPointOperations(curve) {
   const { mod, inv, a } = curve;

   function add(P, Q) {
      if (P.infinity) return Q;
      if (Q.infinity) return P;
      if (Q.z == 1n) return addAffine(P, Q)

      const Z1Z1 = mod(P.z * P.z);
      const Z2Z2 = mod(Q.z * Q.z);
      const U1 = mod(P.x * Z2Z2);//mod(x * Q.zz);
      const U2 = mod(Q.x * Z1Z1);//mod(x0 * P.zz);
      const S1 = mod(P.y * Q.z * Z2Z2);//mod(y * Q.zzz);
      const S2 = mod(Q.y * P.z * Z1Z1);//mod(y0 * P.zzz);

      if (U1 === U2) {
         if (S1 === S2) {
            // Point doubling
            return P.double();
         } else {
            // Points are inverses
            return P.constructor.ZERO; //! Infinity
         }
      }

      const H = mod(U2 - U1);
      const I = mod(4n * H * H);
      const J = mod(H * I);
      const r = mod(2n * (S2 - S1));
      const V = mod(U1 * I);

      const X3 = mod(r * r - J - 2n * V);
      const Y3 = mod(r * (V - X3) - 2n * S1 * J);
      const Z3 = mod(2n * P.z * Q.z * H);

      return new P.constructor(X3, Y3, Z3);
   }

   function addAffine(P, Q) {
      if (P.infinity) return Q;
      if (Q.infinity) return P;

      const Z1Z1 = mod(P.z * P.z);
      const U2 = mod(Q.x * Z1Z1);//mod(x0 * P.zz);
      const S2 = mod(Q.y * P.z * Z1Z1);//mod(y0 * P.zzz);

      if (P.x === U2) {
         if (P.y === S2) {
            // Point doubling
            return P.double();
         } else {
            // Points are inverses
            return P.constructor.ZERO; //! Infinity
         }
      }

      const H = mod(U2 - P.x);
      const I = mod(4n * H * H);
      const J = mod(H * I);
      const r = mod(2n * (S2 - P.y));
      const V = mod(P.x * I);

      const X3 = mod(r * r - J - 2n * V);
      const Y3 = mod(r * (V - X3) - 2n * P.y * J);
      const Z3 = mod(2n * P.z * H);

      return new P.constructor(X3, Y3, Z3);
   }

   function double(P) {
      if (P.infinity) return P;

      const YY = mod(P.y * P.y);//P.yy//
      const ZZ = mod(P.z * P.z);
      const S = mod(4n * P.x * YY)//mod(2n * ((P.x + YY) * (P.x + YY) - XX - YYYY));
      const M = mod(3n * P.x * P.x + a * ZZ * ZZ);

      const X3 = mod(M * M - 2n * S);
      const Y3 = mod(M * (S - X3) - 8n * YY * YY);
      const Z3 = mod(2n * P.y * P.z);

      return new P.constructor(X3, Y3, Z3);
   }

   // {@link https://hyperelliptic.org/EFD/g1p/data/shortw/jacobian-3/tripling/tpl-2005-dim}
   function tripling(P) {
      if (P.infinity) return P;

      //M = 3*X12+a*Z14
      let x2 = mod(P.x * P.x), z2 = mod(P.z * P.z), y2 = mod(P.y * P.y);
      const M = mod(3n * x2 + a * z2 * z2)
      //E = 12*X1*Y12-M2
      const E = mod(12n * P.x * y2 - M * M);
      //T = 8*Y14
      const T = mod(8n * y2 * y2);

      const E2 = mod(E * E);
      const ME = mod(M * E);
      const T_ME = mod(T - ME);

      //X3 = 8*Y12*(T-M*E)+X1*E2
      const X3 = mod(8n * y2 * T_ME + P.x * E2);
      //Y3 = Y1*(4*(M*E-T)*(2*T-M*E)-E3)
      const Y3 = mod(P.y * (-4n * T_ME * (T + T_ME) - E2 * E));
      //Z3 = Z1*E
      const Z3 = mod(P.z * E);

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
      if (P.infinity) return P;
      //const { x, y, z } = P;
      iz = iz ? iz : inv(P.z);
      const z2_inv = mod(iz * iz);
      const z3_inv = mod(z2_inv * iz);

      const ix = mod(P.x * z2_inv);
      const iy = mod(P.y * z3_inv);
      return new P.constructor(ix, iy);
   })

   return {
      addJ : add,
      doubleJ: double, 
      triplingJ : tripling, 
      doubleNJ: doubleN, 
      alignMemoJ: alignMemo
   }
}


export { Jacobi, jacobiPointOperations }