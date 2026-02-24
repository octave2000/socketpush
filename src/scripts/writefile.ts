#!/usr/bin/env node

import path from "path";
import fs from "fs";
import { sw } from "../utils/ServiceWorkerTemplate";

const destDir = path.resolve(process.cwd(), "public");
const destPath = path.join(destDir, "hubsync-sw.js");

try {
  fs.mkdirSync(destDir, { recursive: true });

  if (fs.existsSync(destPath)) {
    const stat = fs.lstatSync(destPath);
    if (stat.isDirectory()) {
      console.warn(
        `[hubsync] WARNING: ${destPath} is a directory. Removing it...`
      );
      fs.rmSync(destPath, { recursive: true, force: true });
    }
  }

  fs.writeFileSync(destPath, sw, { flag: "w" });
  console.log(`[hubsync] Service worker written to ${destPath}`);
} catch (error) {
  console.error("[hubsync] Failed to write service worker:", error);
}
