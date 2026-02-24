#!/usr/bin/env node

import path from "path";
import fs from "fs";
import { sw } from "../utils/ServiceWorkerTemplate";

const destDir = path.resolve(process.cwd(), "public");
const primaryDestPath = path.join(destDir, "hubsync-sw.js");
const legacyDestPath = path.join(destDir, "socketpush-sw.js");

try {
  fs.mkdirSync(destDir, { recursive: true });

  const targets = [primaryDestPath, legacyDestPath];

  for (const target of targets) {
    if (!fs.existsSync(target)) {
      continue;
    }

    const stat = fs.lstatSync(target);
    if (stat.isDirectory()) {
      console.warn(
        `[hubsync] WARNING: ${target} is a directory. Removing it...`
      );
      fs.rmSync(target, { recursive: true, force: true });
    }
  }

  fs.writeFileSync(primaryDestPath, sw, { flag: "w" });
  fs.writeFileSync(legacyDestPath, sw, { flag: "w" });
  console.log(
    `[hubsync] Service workers written to ${primaryDestPath} and ${legacyDestPath}`
  );
} catch (error) {
  console.error("[hubsync] Failed to write service worker:", error);
}
