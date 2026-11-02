import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as { name: string; peerDependencies: Record<string, string>; dependencies?: Record<string, string> };
const readme = readFileSync(new URL("../README.md", import.meta.url), "utf8");

describe("package", () => {
	it("README uses the package name in the install line and the import", () => {
		expect(readme).toContain(`npm install ${pkg.name} ai zod`);
		expect(readme).toContain(`from '${pkg.name}'`);
	});

	it("has one exact-pinned runtime dependency beside the ai and zod peers", () => {
		expect(pkg.dependencies).toEqual({ "@noble/hashes": "1.8.0" });
		expect(Object.keys(pkg.peerDependencies).sort()).toEqual(["ai", "zod"]);
	});
});
