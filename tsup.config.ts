import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["index.ts"],
	outDir: "dist",
	format: ["esm"],
	dts: true,
	sourcemap: true,
});
