import { readFileSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { defineConfig } from "tsup";

const { version } = JSON.parse(readFileSync("package.json", "utf8")) as { version: string };

export default defineConfig({
	entry: ["src/index.ts"],
	format: ["esm", "cjs"],
	dts: true,
	clean: true,
	sourcemap: false,
	target: "es2022",
	external: ["ai", "zod"],
	define: { __VERSION__: JSON.stringify(version) },
	onSuccess: async () => {
		for (const file of ["dist/index.js", "dist/index.cjs"]) {
			const text = await readFile(file, "utf8");
			await writeFile(file, text.replace(/^\/\/ .*\n/gm, ""));
		}
	},
});
