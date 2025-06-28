
const worker = new Worker(new URL('../worker/worker.js', import.meta.url), { type: "module" })

let requestId = 0;
const pending = new Map();

function promising(P, u, bit = 384) {
   const id = requestId++;
   return new Promise((resolve) => {
      pending.set(id, resolve);
      worker.postMessage({
         id,
         Q: { x: P.x, y: P.y, z: P.z },
         u,
         bit,
      });
   });
}

worker.addEventListener("message", (e) => {
   const { id, result } = e.data;
   const resolver = pending.get(id);
   if (resolver) {
      resolver(result);
      pending.delete(id);
   }
});

export { promising }