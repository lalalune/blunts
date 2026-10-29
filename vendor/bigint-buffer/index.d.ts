import { Buffer } from "buffer";
export function toBigIntBE(bytes: Uint8Array): bigint;
export function toBigIntLE(bytes: Uint8Array): bigint;
export function toBufferBE(value: bigint, width: number): Buffer;
export function toBufferLE(value: bigint, width: number): Buffer;
