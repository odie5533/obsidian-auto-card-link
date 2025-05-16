import { App, requestUrl, normalizePath } from "obsidian";

/**
 * Downloads an image from a URL and saves it to the vault in the given mediaDir.
 * Returns the vault-relative path (e.g. AutoCardLink/filename.png) or undefined on failure.
 */
export async function downloadAndCacheImage(
  app: App,
  url: string,
  mediaDir: string = ".AutoCardLink"
): Promise<string | undefined> {
  try {
    const response = await requestUrl({ url, method: "GET" });
    // @ts-ignore
    const buffer: ArrayBuffer = response.arrayBuffer || response.body;
    let ext = url.split(".").pop()?.split(/[?#]/)[0] || "png";
    if (ext.length > 5 || /[^a-zA-Z0-9]/.test(ext)) ext = "png";
    let baseName = url.split("/").pop()?.split(".")[0] || "image";
    baseName = baseName.replace(/[^a-zA-Z0-9-_]/g, "_");
    let filename = `${baseName}.${ext}`;
    let vaultPath = normalizePath(`${mediaDir}/${filename}`);
    let counter = 1;
    const MAX_TRIES = 10000; // prevent infinite loops
    while (true) {
      if (counter > MAX_TRIES) {
        throw new Error(`Failed to find available filename after ${MAX_TRIES} attempts`);
      }
      const stat = await app.vault.adapter.stat(vaultPath);
      if (stat) {
        // file exists, bump counter and try next name
        filename = `${baseName}-${counter}.${ext}`;
        vaultPath = normalizePath(`${mediaDir}/${filename}`);
        counter++;
      } else {
        // stat is null, means file doesn't exist
        break;
      }

    }
    await app.vault.adapter.mkdir(mediaDir).catch(() => { });
    await app.vault.createBinary(vaultPath, new Uint8Array(buffer));
    return vaultPath;
  } catch (e) {
    console.error("Failed to download image:", url, e);
    return undefined;
  }
}
