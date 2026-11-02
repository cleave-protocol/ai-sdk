import { readFileSync, writeFileSync } from "node:fs";

const [next, ...extra] = process.argv.slice(2);
if (!next || !/^(@[a-z0-9-]+\/)?[a-z0-9][a-z0-9._-]*$/.test(next)) {
	console.error("usage: npm run rename -- <new-name> [more files]");
	process.exit(1);
}
const current = JSON.parse(readFileSync("package.json", "utf8")).name;
for (const file of ["package.json", "package-lock.json", "README.md", ...extra]) {
	const text = readFileSync(file, "utf8");
	const count = text.split(current).length - 1;
	writeFileSync(file, text.replaceAll(current, next));
	console.log(`${file}: ${count} replaced`);
}
