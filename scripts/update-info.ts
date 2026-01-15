import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const COMMIT_REGEX = /^([a-z]+)(?:\([^)]+\))?:\s*(.+)$/i;
const CLEAN_LINE_REGEX = /^[-*]\s+/;

const nextVersion = process.argv[2];
const releaseNotes = process.argv[3] || "";

if (!nextVersion) {
  console.error("[LOG] Missing version argument");
  process.exit(1);
}

const infoPath = path.resolve(process.cwd(), "assets/data/info.json");
const info = JSON.parse(fs.readFileSync(infoPath, "utf8"));

// 1. Update Contributors
try {
  const authorsLog = execSync('git log --format="%aN"').toString().trim();
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

// 2. Update Changelog
if (releaseNotes) {
  const typeMapping: Record<string, string> = {
    feat: "✨ Tính năng mới",
    fix: "🐛 Sửa lỗi",
    docs: "📝 Tài liệu",
    style: "💄 Giao diện",
    refactor: "♻️ Cấu trúc code",
    perf: "⚡️ Hiệu năng",
    test: "✅ Kiểm thử",
    chore: "🔧 Khác"
  };

  const changes = releaseNotes
    .split("\n")
    .filter((line) => line.trim().startsWith("- ") || line.trim().startsWith("* "))
    .map((line) => {
      let content = line.replace(CLEAN_LINE_REGEX, "").trim();

      const match = content.match(COMMIT_REGEX);

      if (match) {
        const type = match[1].toLowerCase();
        const subject = match[2];
        const prefix = typeMapping[type];

        if (prefix) {
          return `${prefix}: ${subject}`;
        }
      }

      return content;
    });

  if (changes.length > 0) {
    const newEntry = {
      version: nextVersion,
      date: new Date().toISOString().split("T")[0],
      changes
    };

    // Add new entry to the beginning
    info.changelog.unshift(newEntry);
    console.log(`[LOG] Added new changelog entry for v${nextVersion}`);
  }
}

fs.writeFileSync(infoPath, `${JSON.stringify(info, null, 2)}\n`, "utf8");
console.log(`[LOG] Successfully updated info.json for v${nextVersion}`);
