import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const vectors = join(root, "test", "fixtures", "vectors.json");

function fail(message) {
	throw new Error(message);
}

function imports(text) {
	const patterns = [/^\s*import\s[^;]*?\sfrom\s*["']([^"']+)["']/gm, /^\s*import\s*["']([^"']+)["']/gm, /^\s*export\s[^;]*?\sfrom\s*["']([^"']+)["']/gm, /\brequire\(\s*["']([^"']+)["']\s*\)/g, /\bimport\(\s*["']([^"']+)["']\s*\)/g];
	return patterns.flatMap((p) => [...text.matchAll(p)].map((m) => m[1]));
}

for (const file of ["core.js", "core.cjs", "core.d.ts", "core.d.cts", "index.js", "index.cjs"]) {
	if (!existsSync(join(root, "dist", file))) fail(`dist/${file} is missing; run npm run build first`);
}
function main(work) {
for (const file of ["core.js", "core.cjs"]) {
	const specs = imports(readFileSync(join(root, "dist", file), "utf8"));
	const outside = specs.filter((s) => !s.startsWith("@noble/hashes/"));
	if (specs.length === 0) fail(`dist/${file}: the import scan found no imports at all`);
	if (outside.length > 0) fail(`dist/${file} imports ${outside.join(", ")}`);
}
for (const file of ["core.d.ts", "core.d.cts"]) {
	const specs = imports(readFileSync(join(root, "dist", file), "utf8"));
	if (specs.length > 0) fail(`dist/${file} imports ${specs.join(", ")}`);
}
if (!imports(readFileSync(join(root, "dist", "index.js"), "utf8")).includes("ai")) fail("the import scan does not see ai in dist/index.js");

	execFileSync("npm", ["pack", "--pack-destination", work, "--silent"], { cwd: root, stdio: ["ignore", "pipe", "inherit"] });
	const tarball = readdirSync(work).find((f) => f.endsWith(".tgz")) ?? fail("npm pack wrote no tarball");
	const app = join(work, "app");
	mkdirSync(app);
	writeFileSync(join(app, "package.json"), JSON.stringify({ name: "core-install-check", private: true, type: "commonjs" }));
	execFileSync("npm", ["install", join(work, tarball), "--no-audit", "--no-fund", "--ignore-scripts", "--no-package-lock", "--silent"], { cwd: app, stdio: "inherit" });

	const modules = readdirSync(join(app, "node_modules")).filter((n) => !n.startsWith("."));
	for (const banned of ["ai", "zod"]) if (existsSync(join(app, "node_modules", banned))) fail(`${banned} was installed`);
	if (!existsSync(join(app, "node_modules", "@cleave-protocol", "ai-sdk"))) fail("the package was not installed");

	const run = (args, input) => execFileSync("node", args, { cwd: app, input, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
	const body = (load) => `${load}
const names = Object.keys(core).sort().join(",");
const { vectors } = JSON.parse(readFileSync(${JSON.stringify(vectors)}, "utf8"));
let pass = 0, refused = 0;
for (const v of vectors) {
	const out = v.tool === "plan_swap" ? core.screenPlanSwap(v.request, v.response) : core.screenGetGas(v.request, v.response, v.context && v.context.nowSec);
	const e = out.error;
	const got = e && e.code === "address_not_allowed" && typeof e.message === "string" ? { result: "fail", rule: e.message.slice(0, 2) } : v.expect.output !== undefined ? { result: "pass", output: out } : { result: "pass" };
	if (!isDeepStrictEqual(JSON.parse(JSON.stringify(got)), v.expect)) throw new Error("vector " + v.name + " gave " + JSON.stringify(got));
	if (got.result === "pass") pass++; else refused++;
}
console.log(JSON.stringify({ names, pass, refused }));
`;
	const cjs = JSON.parse(run(["--input-type=commonjs", "-"], body(`const { readFileSync } = require("node:fs");\nconst { isDeepStrictEqual } = require("node:util");\nconst core = require("${pkg.name}/core");`)));
	const esm = JSON.parse(run(["--input-type=module", "-"], body(`import { readFileSync } from "node:fs";\nimport { isDeepStrictEqual } from "node:util";\nconst core = await import("${pkg.name}/core");`)));
	const total = JSON.parse(readFileSync(vectors, "utf8")).vectors.length;
	for (const [kind, r] of [["require", cjs], ["import", esm]]) {
		if (r.pass + r.refused !== total || r.pass === 0 || r.refused === 0) fail(`${kind}: ran ${r.pass + r.refused} of ${total} vectors`);
	}

	let rootLoad = "loaded";
	try {
		run(["--input-type=commonjs", "-e", `require("${pkg.name}")`]);
	} catch (err) {
		rootLoad = /Cannot find module '(ai|zod\/v4)'/.exec(String(err.stderr))?.[0] ?? `failed otherwise: ${String(err.stderr).split("\n")[0]}`;
	}
	if (!rootLoad.startsWith("Cannot find module")) fail(`the root entry without ai and zod: ${rootLoad}; this install does not show the core entry stands alone`);

	console.log(`core-install: OK ${pkg.name}@${pkg.version} from ${tarball}`);
	console.log(`  installed: ${modules.join(", ")}`);
	console.log(`  require("${pkg.name}/core"): ${cjs.names}; ${cjs.pass} vectors pass, ${cjs.refused} refused by the expected rule`);
	console.log(`  import("${pkg.name}/core"): ${esm.pass} pass, ${esm.refused} refused`);
	console.log(`  require("${pkg.name}") in the same install: ${rootLoad}`);
}

const work = mkdtempSync(join(tmpdir(), "cleave-core-install-"));
try {
	main(work);
} catch (err) {
	console.error(`core-install: FAIL ${err instanceof Error ? err.message : String(err)}`);
	process.exitCode = 1;
} finally {
	rmSync(work, { recursive: true, force: true });
}
