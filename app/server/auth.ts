import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { promisify } from "node:util";
const scrypt = promisify(scryptCallback);
export const token = () => randomBytes(32).toString("base64url");
export const digest = (s: string) =>
  createHash("sha256").update(s).digest("hex");
export async function hashPassword(value: string) {
  const salt = randomBytes(16).toString("hex");
  const key = (await scrypt(value, salt, 64)) as Buffer;
  return `${salt}:${key.toString("hex")}`;
}
export async function verifyPassword(value: string, stored: string) {
  const [salt, hex] = stored.split(":");
  const key = (await scrypt(value, salt, 64)) as Buffer;
  const expected = Buffer.from(hex, "hex");
  return expected.length === key.length && timingSafeEqual(expected, key);
}
