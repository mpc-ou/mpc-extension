import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const nextVersion = process.argv[2];

if (!nextVersion) {
  console.error("[LOG] Missing version argument");
  process.exit(1);
}

const infoPath = path.resolve(process.cwd(), "assets/data/info.json");
const info = JSON.parse(fs.readFileSync(infoPath, "utf8"));

try {
  const authorsLog = execSync('git log --format="%aN" --use-mailmap').toString().trim();
  const authors = [
    ...new Set(
      authorsLog
        .split("\n")
        .map((a) => a.trim())
        .filter(Boolean)
    )
  ].filter((author) => !author.includes("[bot]") && author !== "semantic-release-bot");

  const existingContributors = new Set(info.credits.contributors);
  for (const author of authors) {
    existingContributors.add(author);
  }

  info.credits.contributors = [...existingContributors];
  console.log(`[LOG] Updated contributors: ${info.credits.contributors.length} total`);
} catch (error) {
  console.warn("[LOG] Failed to update contributors:", error);
}

fs.writeFileSync(infoPath, `${JSON.stringify(info, null, 2)}\n`, "utf8");
console.log(`[LOG] Successfully updated info.json for v${nextVersion}`);
