import { memoized } from "../mod.ts";
import { Point3D } from "./point3d.js";


class Edward extends Point3D {

   constructor(x, y, z = 1n, t = 1n) {
      super(x, y, z)
      this.t = t;
   }
   add(P, isNext0 = false, { mod, mul, d, a }) { return pointAdd(this, P, isNext0, { mod, mul, d, a }) /* return addTwistedEdwards(this, P) */ }//
   double(isNext0 = false, { mod, mul, a }) { return pointDouble(this, isNext0, { mod, mul, a }) /* return doubleTwistedEdwards(this, isNext0) */ }
   doubleN(n) { return doubleN(this, n) }
   normalize(iz, { mod, inv }) { return alignMemo(this, iz, { mod, inv }) }
   negate() { return new this.constructor(-this.x, this.y, this.z, -this.t) }
}

function edwardPointOperation(curve) {

   const { mod, mul, d, a, inv } = curve

   function pointAdd(P, Q, isNext0 = false) {
      if(P.identity)return Q;
      const A = mod(P.x * Q.x); // A = x*Q.x
      const B = mod(P.y * Q.y); // B = y*Q.y
      const C = mod(P.t * d * Q.t); // C = t*d*Q.t
      const D = mod(P.z * Q.z); // D = z*Q.z
      const E = mod((P.x + P.y) * (Q.x + Q.y) - A - B); // E = (x+y)*(Q.x+Q.y)-A-B
      const F = D - C; // F = D-C
      const G = D + C; // G = D+C
      const H = mod(B - a * A); // H = B-a*A
      return new P.constructor(mul(E, F), mul(G, H), mul(F, G), isNext0 ? 1n : mul(E, H));
   }

   function pointDouble(P, isNext0 = false) {
      if(P.identity)return P;
      const A = mul(P.x, P.x);
      const B = mul(P.y, P.y);
      const C = mod(2n * P.z * P.z);//mul(2n, mul(P.z, P.z));//mod(2n * z * z);
      const D = mod(a * A); // 
      const xy = P.x + P.y;
      const E = mod(xy * xy - (A + B));//sub(mul(xy, xy), add(A, B));//
      const G = D + B;//add(D, B);//
      const F = G - C;//sub(G, C);//
      const H = D - B;//sub(D, B);//
      return new P.constructor(mul(E, F), mul(G, H), mul(F, G), isNext0 ? 1n : mul(E, H));
   }

   function doubleN(P, n) {
      if (n < 1) return P
      if (n == 1) return P.double()
      let point = P;

      for (let i = 0; i < n; i++) {
         point = point.double(i < n - 1)
      }
      return point
   }


   var alignMemo = memoized((P, iz) => {
      if (P.infinity) return P;

      iz = iz ? iz : inv(P.z);

      const ix = mod(P.x * iz);
      const iy = mod(P.y * iz);
      return new P.constructor(ix, iy);
   })

   return {
      pointAdd,
      pointDouble,
      doubleN,
      alignMemo
   }
}

export { Edward, edwardPointOperation }