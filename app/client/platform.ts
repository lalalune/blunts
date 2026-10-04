import { Capacitor, CapacitorHttp } from "@capacitor/core";
import { App } from "@capacitor/app";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
export const native = Capacitor.isNativePlatform();
const origin = import.meta.env.VITE_API_ORIGIN as string | undefined;
export async function request(
  path: string,
  body: unknown,
  headers: Record<string, string>,
) {
  if (native) {
    if (!origin) throw new Error("This app needs a configured server.");
    // Cookies remain in the native HTTP cookie store; never persist tokens in JS storage.
    const response = await CapacitorHttp.request({
      url: `${origin}/api${path}`,
      method: body === undefined ? "GET" : "POST",
      headers: { ...headers, Origin: origin },
      data: body,
      responseType: "json",
      connectTimeout: 15000,
      readTimeout: 20000,
      disableRedirects: true,
    });
    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      data: response.data,
    };
  }
  const response = await fetch(`/api${path}`, {
    method: body === undefined ? "GET" : "POST",
    credentials: "same-origin",
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return {
    ok: response.ok,
    status: response.status,
    data: await response.json(),
  };
}
async function cleanStatements() {
  try {
    const { files } = await Filesystem.readdir({
      path: "statements",
      directory: Directory.Cache,
    });
    for (const file of files) {
      if (file.type === "file" && file.mtime < Date.now() - 86400000)
        await Filesystem.deleteFile({
          path: `statements/${file.name}`,
          directory: Directory.Cache,
        });
    }
  } catch {
    /* The cache directory may not exist yet. */
  }
}
export async function shareStatement(data: unknown) {
  await cleanStatements();
  const path = `statements/blunts-${crypto.randomUUID()}.json`;
  const file = await Filesystem.writeFile({
    path,
    data: JSON.stringify(data, null, 2),
    directory: Directory.Cache,
    encoding: Encoding.UTF8,
    recursive: true,
  });
  // Android may resolve when a recipient is selected, before it reads the URI.
  // Retain the cache file until a later cleanup instead of racing that reader.
  await Share.share({ title: "Blunts statement", url: file.uri });
}
export function onResume(callback: () => void) {
  if (!native) return () => {};
  void cleanStatements();
  const listener = App.addListener("appStateChange", ({ isActive }) => {
    if (isActive) {
      void cleanStatements();
      callback();
    }
  });
  return () => {
    void listener.then((handle) => handle.remove());
  };
}
export function onBack(callback: () => boolean) {
  if (!native) return () => {};
  const listener = App.addListener("backButton", () => {
    if (!callback()) void App.minimizeApp();
  });
  return () => {
    void listener.then((handle) => handle.remove());
  };
}
