const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");

const toml = require("@iarna/toml");
const sort = require("sort-package-json");

function escapeRegExp(string) {
  // $& means the whole matched string
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getRandomString(length) {
  return crypto.randomBytes(length).toString("hex");
}

async function main({ rootDirectory }) {
  console.log(`🚀  Making something cool with this template ...`);

  const README_PATH = path.join(rootDirectory, "README.md");
  const FLY_TOML_PATH = path.join(rootDirectory, "fly.toml");
  const EXAMPLE_ENV_PATH = path.join(rootDirectory, ".env.example");
  const ENV_PATH = path.join(rootDirectory, ".env");
  const PACKAGE_JSON_PATH = path.join(rootDirectory, "package.json");
  const STACK_GITHUB_ACTION = path.join(
    rootDirectory,
    ".github/workflows/for-this-stack-repo-only.yml"
  );

  const REPLACER = "supa-fly-stack-template";

  const DIR_NAME = path.basename(rootDirectory);
  const SUFFIX = getRandomString(2);
  const APP_NAME = (DIR_NAME + "-" + SUFFIX)
    // get rid of anything that's not allowed in an app name
    .replace(/[^a-zA-Z0-9-_]/g, "-");

  const [prodContent, readme, env, packageJson] = await Promise.all([
    fs.readFile(FLY_TOML_PATH, "utf-8"),
    fs.readFile(README_PATH, "utf-8"),
    fs.readFile(EXAMPLE_ENV_PATH, "utf-8"),
    fs.readFile(PACKAGE_JSON_PATH, "utf-8"),
    fs.rm(STACK_GITHUB_ACTION),
  ]);

  const newEnv = env.replace(
    /^SESSION_SECRET=.*$/m,
    `SESSION_SECRET="${getRandomString(16)}"`
  );

  const prodToml = toml.parse(prodContent);
  prodToml.app = prodToml.app.replace(REPLACER, APP_NAME);

  const newReadme = readme.replace(
    new RegExp(escapeRegExp(REPLACER), "g"),
    APP_NAME
  );

  const newPackageJson =
    JSON.stringify(
      sort({ ...JSON.parse(packageJson), name: APP_NAME }),
      null,
      2
    ) + "\n";

  await Promise.all([
    fs.writeFile(FLY_TOML_PATH, toml.stringify(prodToml)),
    fs.writeFile(README_PATH, newReadme),
    fs.writeFile(ENV_PATH, newEnv),
    fs.writeFile(PACKAGE_JSON_PATH, newPackageJson),
    fs.copyFile(
      path.join(rootDirectory, "remix.init", "gitignore"),
      path.join(rootDirectory, ".gitignore")
    ),
  ]);

  await setup({ rootDirectory });
}

async function setup({ rootDirectory }) {
  console.log(
    `✅  Sounds good 🥳. Check the README.md for setup instructions.`
  );
}

module.exports = main;
