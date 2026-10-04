import { readFileSync } from "node:fs";
const info = JSON.parse(readFileSync("dist-native/build-info.json", "utf8"));
const url = new URL(info.origin);
if (
  info.development ||
  url.protocol !== "https:" ||
  ["localhost", "127.0.0.1"].includes(url.hostname) ||
  url.hostname.endsWith(".invalid")
)
  throw new Error(
    "Store builds require an owned HTTPS API origin and a fresh non-development mobile:sync.",
  );
console.log(
  `Mobile release endpoint: ${url.origin}. This check does not approve live money or store publication.`,
);
