import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const codec = createRequire(import.meta.url)(
  "../../vendor/bigint-buffer/index.cjs",
);
test("pure bigint codec handles SPL widths and rejects overflow, mutation and large allocations", () => {
  for (const size of [0, 1, 8, 16, 32, 64])
    for (const value of [0n, (1n << BigInt(size * 8)) - 1n]) {
      const le = codec.toBufferLE(value, size),
        be = codec.toBufferBE(value, size);
      assert.equal(codec.toBigIntLE(le), value);
      assert.equal(codec.toBigIntBE(be), value);
      assert.deepEqual(le, Buffer.from(be).reverse());
    }
  const input = Buffer.from([1, 2, 3]);
  codec.toBigIntLE(input);
  assert.deepEqual(input, Buffer.from([1, 2, 3]));
  for (const f of [
    () => codec.toBufferLE(-1n, 8),
    () => codec.toBufferLE(256n, 1),
    () => codec.toBufferLE(0n, 1e9),
    () => codec.toBigIntLE(Buffer.alloc(1025)),
  ])
    assert.throws(f);
});
