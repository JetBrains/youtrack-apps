#!/usr/bin/env node

import * as path from "node:path";
import { spawnSync } from "node:child_process";

function usage(exitCode = 1): never {
  console.error("Usage: node checkoutYouTrackAppsPullRequestTargetBranch.ts [target-branch] [repository]");
  console.error("");
  console.error("The target branch may also be supplied through PULL_REQUEST_TARGET_BRANCH,");
  console.error("TEAMCITY_PULL_REQUEST_TARGET_BRANCH, or CHANGE_TARGET.");
  process.exit(exitCode);
}

function targetBranch(argument: string | undefined): string {
  const value = argument
    || process.env.PULL_REQUEST_TARGET_BRANCH
    || process.env.TEAMCITY_PULL_REQUEST_TARGET_BRANCH
    || process.env.CHANGE_TARGET;
  if (!value) {
    usage();
  }

  const normalized = value.replace(/^refs\/heads\//, "").replace(/^origin\//, "");
  const validation = spawnSync("git", ["check-ref-format", "--branch", normalized], { stdio: "ignore" });
  if (validation.error) {
    throw validation.error;
  }
  if (validation.status !== 0) {
    throw new Error(`Invalid pull request target branch: ${value}`);
  }
  return normalized;
}

function git(repository: string, args: string[]): void {
  const result = spawnSync("git", ["-C", repository, ...args], { stdio: "inherit" });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`git ${args[0]} failed with exit code ${result.status}`);
  }
}

if (process.argv[2] === "--help" || process.argv[2] === "-h") {
  usage(0);
}

const branch = targetBranch(process.argv[2]);
const repository = path.resolve(process.argv[3] || process.cwd());

git(repository, ["fetch", "--no-tags", "origin", `refs/heads/${branch}`]);
git(repository, ["switch", "--detach", "FETCH_HEAD"]);
console.log(`Checked out pull request target branch ${branch} in ${repository}`);
