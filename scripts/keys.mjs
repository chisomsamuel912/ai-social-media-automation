#!/usr/bin/env node
// Local key vault: stores secrets in .env (gitignored, never pushed).
// Usage:
//   npm run keys -- list              show key names + masked values
//   npm run keys -- show NAME         print one full value
//   npm run keys -- set NAME          paste a value interactively (hidden input not possible portably; pasted text may echo)
//   npm run keys -- set NAME value    set directly (value stays in shell history — prefer interactive)
//   npm run keys -- delete NAME       remove a key
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";

const ENV_PATH = path.join(process.cwd(), ".env");

function load() {
  if (!fs.existsSync(ENV_PATH)) return [];
  return fs.readFileSync(ENV_PATH, "utf8").split("\n").filter((l) => l.trim() && !l.trim().startsWith("#"));
}

function save(lines) {
  fs.writeFileSync(ENV_PATH, lines.join("\n") + "\n");
}

function mask(v) {
  if (!v) return "(empty)";
  if (v.length <= 10) return "***";
  return `${v.slice(0, 4)}...${v.slice(-3)}`;
}

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => {
    rl.close();
    resolve(ans.trim());
  }));
}

const [cmd, name, ...rest] = process.argv.slice(2);

if (cmd === "list" || !cmd) {
  const lines = load();
  if (lines.length === 0) console.log("No keys stored yet.");
  for (const line of lines) {
    const i = line.indexOf("=");
    console.log(`${line.slice(0, i)}=${mask(line.slice(i + 1))}`);
  }
} else if (cmd === "show") {
  const line = load().find((l) => l.startsWith(`${name}=`));
  console.log(line ? line.slice(name.length + 1) : `No key named "${name}".`);
} else if (cmd === "set") {
  if (!name) {
    console.log("Usage: npm run keys -- set NAME [value]");
    process.exit(1);
  }
  const value = rest.length > 0 ? rest.join(" ") : await ask(`Paste value for ${name}: `);
  if (!value) {
    console.log("Empty value — nothing saved.");
    process.exit(1);
  }
  const lines = load().filter((l) => !l.startsWith(`${name}=`));
  lines.push(`${name}=${value}`);
  save(lines);
  console.log(`Saved ${name}. Restart the dev server so the app picks it up.`);
} else if (cmd === "delete") {
  const before = load();
  const after = before.filter((l) => !l.startsWith(`${name}=`));
  if (after.length === before.length) {
    console.log(`No key named "${name}".`);
  } else {
    save(after);
    console.log(`Deleted ${name}.`);
  }
} else {
  console.log("Commands: list | show NAME | set NAME [value] | delete NAME");
}
