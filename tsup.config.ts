import { readFileSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { defineConfig } from "tsup";

const { version } = JSON.parse(readFileSync("package.json", "utf8")) as { version: string };

export default defineConfig({
	entry: ["src/index.ts", "src/core.ts"],
	splitting: false,
	esbuildPlugins: [
		{
			name: "core-entry-external",
			setup(build) {
				const target = build.initialOptions.format === "cjs" ? "./core.cjs" : "./core.js";
				build.onResolve({ filter: /^\.\/core\.js$/ }, () => ({ path: target, external: true }));
			},
		},
	],
	format: ["esm", "cjs"],
	dts: true,
	clean: true,
	sourcemap: false,
	target: "es2022",
	external: ["ai", "zod"],
	define: { __VERSION__: JSON.stringify(version) },
	onSuccess: async () => {
		for (const file of ["dist/index.js", "dist/index.cjs", "dist/core.js", "dist/core.cjs"]) {
			const text = await readFile(file, "utf8");
			await writeFile(file, text.replace(/^\/\/ .*\n/gm, ""));
		}
	},
});
