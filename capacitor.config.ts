import type { CapacitorConfig } from "@capacitor/cli";
const config: CapacitorConfig = {
  appId: "com.lalalune.blunts",
  appName: "Blunts",
  webDir: "dist-native",
  loggingBehavior: "debug",
  backgroundColor: "#10150e",
  server: { androidScheme: "https" },
  ios: { contentInset: "never" },
};
export default config;
