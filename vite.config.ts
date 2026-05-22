import { copyFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vue from "@vitejs/plugin-vue";
import { build as buildWithEsbuild } from "esbuild";
import { defineConfig, type Plugin } from "vite";

const rootDir = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(rootDir, "dist");

const buildExtensionFiles = (): Plugin => {
  const files = [
    "manifest.json",
    "icons/icon-16.png",
    "icons/icon-32.png",
    "icons/icon-48.png",
    "icons/icon-128.png"
  ];

  return {
    name: "build-extension-files",
    async closeBundle() {
      await Promise.all(
        files.map(async (file) => {
          const target = resolve(distDir, file);
          await mkdir(dirname(target), { recursive: true });
          await copyFile(resolve(rootDir, file), target);
        })
      );
      await buildWithEsbuild({
        entryPoints: [resolve(rootDir, "src/content.ts")],
        outfile: resolve(distDir, "src/content.js"),
        bundle: true,
        format: "iife",
        minify: true,
        supported: {
          arrow: false
        },
        target: "chrome114"
      });
    }
  };
};

export default defineConfig({
  base: "./",
  esbuild: {
    supported: {
      arrow: false
    }
  },
  plugins: [vue(), buildExtensionFiles()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    minify: "esbuild",
    rollupOptions: {
      input: resolve(rootDir, "popup.html")
    }
  }
});
