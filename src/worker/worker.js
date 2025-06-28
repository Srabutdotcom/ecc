import { ECC384 } from "../curve/ecc.js";
import { signwnaf } from "../mod.ts";

onmessage = async (e) => {
   const { data } = e;
   const { id, Q, u, bit } = data;
   if (bit == 384) {
      const P = new ECC384(Q.x, Q.y, Q.z);
      const R = await signwnaf(P, u);
      postMessage({id, result:{ x: R.x, y: R.y, z: R.z }});
   }
   //postMessage("nothing")
};