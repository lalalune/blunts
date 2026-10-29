"use strict";
const { Buffer } = require("buffer");
// SPL layouts need fixed unsigned integer widths. Never load native bindings;
// reject excessive allocations, signed inputs, truncation and buffer overflows.
const maxWidth = 1024;
function width(value) {
  if (!Number.isSafeInteger(value) || value < 0 || value > maxWidth)
    throw new RangeError("Unsupported integer width");
}
function toBigIntBE(bytes) {
  if (!(bytes instanceof Uint8Array)) throw new TypeError("Expected bytes");
  width(bytes.byteLength);
  let value = 0n;
  for (const byte of bytes) value = (value << 8n) | BigInt(byte);
  return value;
}
function toBigIntLE(bytes) {
  if (!(bytes instanceof Uint8Array)) throw new TypeError("Expected bytes");
  width(bytes.byteLength);
  let value = 0n;
  for (let i = bytes.length - 1; i >= 0; i--)
    value = (value << 8n) | BigInt(bytes[i]);
  return value;
}
function toBufferLE(value, length) {
  width(length);
  if (
    typeof value !== "bigint" ||
    value < 0n ||
    value >= 1n << BigInt(length * 8)
  )
    throw new RangeError("Integer does not fit the requested width");
  const bytes = Buffer.alloc(length);
  for (let i = 0; i < length; i++) {
    bytes[i] = Number(value & 255n);
    value >>= 8n;
  }
  return bytes;
}
function toBufferBE(value, length) {
  return toBufferLE(value, length).reverse();
}
module.exports = { toBigIntBE, toBigIntLE, toBufferBE, toBufferLE };
