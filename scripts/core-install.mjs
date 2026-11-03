import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const vectors = join(root, "test", "fixtures", "vectors.json");
const allowlistVersion = JSON.parse(readFileSync(vectors, "utf8")).allowlistVersion;
const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => k.toLowerCase() !== "npm_config_dry_run"));

function fail(message) {
	throw new Error(message);
}

function imports(text) {
	const patterns = [/^\s*import\s[^;]*?\sfrom\s*["']([^"']+)["']/gm, /^\s*import\s*["']([^"']+)["']/gm, /^\s*export\s[^;]*?\sfrom\s*["']([^"']+)["']/gm, /require\(\s*["']([^"']+)["']\s*\)/g, /\bimport\(\s*["']([^"']+)["']\s*\)/g];
	return patterns.flatMap((p) => [...text.matchAll(p)].map((m) => m[1]));
}

const dist = (file) => readFileSync(join(root, "dist", file), "utf8");

function scanDist() {
	for (const file of ["core.js", "core.cjs", "core.d.ts", "core.d.cts", "index.js", "index.cjs", "index.d.ts", "index.d.cts"]) {
		if (!existsSync(join(root, "dist", file))) fail(`dist/${file} is missing; run npm run build first`);
	}
	for (const file of ["core.js", "core.cjs"]) {
		const specs = imports(dist(file));
		const outside = specs.filter((s) => !s.startsWith("@noble/hashes/"));
		if (specs.length === 0) fail(`dist/${file}: the import scan found no imports at all`);
		if (outside.length > 0) fail(`dist/${file} imports ${outside.join(", ")}`);
	}
	for (const file of ["core.d.ts", "core.d.cts"]) {
		const specs = imports(dist(file));
		if (specs.length > 0) fail(`dist/${file} imports ${specs.join(", ")}`);
	}
	for (const [file, self] of [["index.js", "./core.js"], ["index.cjs", "./core.cjs"]]) {
		const text = dist(file);
		const specs = imports(text);
		if (!specs.includes("ai")) fail(`the import scan does not see ai in dist/${file}`);
		if (!specs.includes(self)) fail(`dist/${file} does not load ${self}`);
		if (/CleaveApiError\s*=\s*class|class\s+CleaveApiError/.test(text) || text.includes(allowlistVersion) || /\b0x095ea7b3\b/.test(text)) fail(`dist/${file} carries its own copy of the core code`);
	}
}

function pack(work) {
	execFileSync("npm", ["pack", "--pack-destination", work, "--silent"], { cwd: root, env, stdio: ["ignore", "pipe", "inherit"] });
	return join(work, readdirSync(work).find((f) => f.endsWith(".tgz")) ?? fail("npm pack wrote no tarball"));
}

function install(work, name, specs) {
	const app = join(work, name);
	mkdirSync(app);
	writeFileSync(join(app, "package.json"), JSON.stringify({ name: `core-install-${name}`, private: true, type: "commonjs" }));
	execFileSync("npm", ["install", ...specs, "--no-audit", "--no-fund", "--ignore-scripts", "--no-package-lock", "--silent"], { cwd: app, env, stdio: "inherit" });
	if (!existsSync(join(app, "node_modules", "@cleave-protocol", "ai-sdk"))) fail(`${name}: the package was not installed`);
	return app;
}

const node = (app, args, input) => execFileSync("node", args, { cwd: app, input, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });

const vectorRun = `
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

const identityRun = `
const shared = ["CHAIN_IDS", "CleaveApiError", "DEFAULT_BASE_URL", "DEFAULT_TIMEOUT_MS", "checkGetGas", "checkPlanSwap", "screenGetGas", "screenPlanSwap"];
for (const name of shared) if (root[name] === undefined || root[name] !== core[name]) throw new Error(name + " differs between the entries");
const notJson = async () => new Response("not json", { status: 200 });
let fromCore = null;
try { await core.callTool("find_token", { chainId: 8453, query: "USDC" }, { fetch: notJson }); } catch (e) { fromCore = e; }
if (!(fromCore instanceof root.CleaveApiError) || !(fromCore instanceof core.CleaveApiError)) throw new Error("an error from the core entry is not the main entry's CleaveApiError");
let fromRoot = null;
try { await root.findToken({ fetch: notJson }).execute({ chainId: 8453, query: "USDC" }, { toolCallId: "t", messages: [] }); } catch (e) { fromRoot = e; }
if (!(fromRoot instanceof core.CleaveApiError)) throw new Error("an error from the main entry's tool is not the core entry's CleaveApiError");
console.log(JSON.stringify({ shared: shared.length, status: fromCore.status }));
`;

function main(work) {
	scanDist();
	const tarball = pack(work);
	const total = JSON.parse(readFileSync(vectors, "utf8")).vectors.length;

	const bare = install(work, "bare", [tarball]);
	const modules = readdirSync(join(bare, "node_modules")).filter((n) => !n.startsWith("."));
	for (const banned of ["ai", "zod"]) if (existsSync(join(bare, "node_modules", banned))) fail(`${banned} was installed`);
	const cjs = JSON.parse(node(bare, ["--input-type=commonjs", "-"], `const { readFileSync } = require("node:fs");\nconst { isDeepStrictEqual } = require("node:util");\nconst core = require("${pkg.name}/core");${vectorRun}`));
	const esm = JSON.parse(node(bare, ["--input-type=module", "-"], `import { readFileSync } from "node:fs";\nimport { isDeepStrictEqual } from "node:util";\nconst core = await import("${pkg.name}/core");${vectorRun}`));
	for (const [kind, r] of [["require", cjs], ["import", esm]]) {
		if (r.pass + r.refused !== total || r.pass === 0 || r.refused === 0) fail(`${kind}: ran ${r.pass + r.refused} of ${total} vectors`);
	}
	let rootLoad = "loaded";
	try {
		node(bare, ["--input-type=commonjs", "-e", `require("${pkg.name}")`]);
	} catch (err) {
		rootLoad = /Cannot find module '(ai|zod\/v4)'/.exec(String(err.stderr))?.[0] ?? `failed otherwise: ${String(err.stderr).split("\n")[0]}`;
	}
	if (!rootLoad.startsWith("Cannot find module")) fail(`the root entry without ai and zod: ${rootLoad}; this install does not show the core entry stands alone`);

	const peer = (name) => `${name}@${JSON.parse(readFileSync(join(root, "node_modules", name, "package.json"), "utf8")).version}`;
	const full = install(work, "full", [tarball, peer("ai"), peer("zod")]);
	const idCjs = JSON.parse(node(full, ["--input-type=commonjs", "-"], `(async () => {\nconst root = require("${pkg.name}");\nconst core = require("${pkg.name}/core");${identityRun}})().catch((e) => { console.error(e); process.exit(1); });`));
	const idEsm = JSON.parse(node(full, ["--input-type=module", "-"], `const root = await import("${pkg.name}");\nconst core = await import("${pkg.name}/core");${identityRun}`));
	const mixed = JSON.parse(node(full, ["--input-type=module", "-"], `import { createRequire } from "node:module";\nconst require = createRequire(${JSON.stringify(join(full, "x.cjs"))});\nconst root = await import("${pkg.name}");\nconst cjsCore = require("${pkg.name}/core");\nconst e = await cjsCore.callTool("find_token", { chainId: 8453, query: "USDC" }, { fetch: async () => new Response("x", { status: 200 }) }).catch((err) => err);\nif (e.name !== "CleaveApiError" || root.CleaveApiError.name !== "CleaveApiError") throw new Error("CleaveApiError is not named");\nconsole.log(JSON.stringify({ name: e.name, instance: e instanceof root.CleaveApiError }));`));

	console.log(`core-install: OK ${pkg.name}@${pkg.version} from ${tarball.split("/").pop()}`);
	console.log(`  without ai and zod, installed: ${modules.join(", ")}`);
	console.log(`  require("${pkg.name}/core"): ${cjs.names}; ${cjs.pass} vectors pass, ${cjs.refused} refused by the expected rule`);
	console.log(`  import("${pkg.name}/core"): ${esm.pass} pass, ${esm.refused} refused`);
	console.log(`  require("${pkg.name}") in the same install: ${rootLoad}`);
	console.log(`  with ${peer("ai")} and ${peer("zod")}: the main and core entries share ${idCjs.shared} exports by identity under require and ${idEsm.shared} under import; CleaveApiError from either entry is an instance of the other's`);
	console.log(`  ESM import of the main entry with a CJS require of /core in one process: error.name is ${mixed.name}; instanceof across the formats is ${mixed.instance}, as the README says`);
}

const work = mkdtempSync(join(tmpdir(), "cleave-core-install-"));
try {
	main(work);
} catch (err) {
	console.error(`core-install: FAIL ${err instanceof Error ? err.message : String(err)}`);
	if (err && typeof err === "object" && "stderr" in err) console.error(String(err.stderr));
	process.exitCode = 1;
} finally {
	rmSync(work, { recursive: true, force: true });
}
