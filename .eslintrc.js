/**
 * @type {import('@types/eslint').Linter.BaseConfig}
 */
module.exports = {
  root: true,
  extends: [
    "@remix-run/eslint-config",
    "@remix-run/eslint-config/node",
    "@remix-run/eslint-config/jest-testing-library",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier",
  ],
  plugins: ["@typescript-eslint", "import"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: ["./tsconfig.json"],
  },
  ignorePatterns: [
    "node_modules",
    "coverage",
    "server-build",
    "build",
    "public/build",
    "*.ignored/",
    "*.ignored.*",
    "remix.config.js",
    ".cache",
    ".history",
    "tailwind.config.js",
    ".eslintrc.js",
    "vitest.config.ts",
    "cypress",
    "test",
    "mocks",
    "prisma",
    "remix.init",
  ],
  // we're using vitest which has a very similar API to jest
  // (so the linting plugins work nicely), but it we have to explicitly
  // set the jest version.
  settings: {
    "import/extensions": [".ts", ".tsx"],
    "import/parsers": {
      "@typescript-eslint/parser": [".ts", ".tsx"],
    },
    "import/resolver": {
      typescript: {
        alwaysTryTypes: true,
        project: "./tsconfig.json",
      },
    },
    jest: {
      version: 27,
    },
  },
  rules: {
    "no-console": "warn",
    "arrow-body-style": ["warn", "as-needed"],
    // meh...
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/sort-type-union-intersection-members": "off",
    "react/jsx-filename-extension": "off",
    "@typescript-eslint/no-namespace": "off",
    // I can't figure these out:
    "@typescript-eslint/no-unsafe-call": "off",
    "@typescript-eslint/no-unsafe-assignment": "off",
    "@typescript-eslint/no-unsafe-member-access": "off",
    // enable these again someday:
    "@typescript-eslint/no-unsafe-argument": "off",
    // this one isn't smart enough for our "~/" imports
    "import/order": [
      "error",
      {
        groups: ["builtin", "external", "internal"],
        pathGroups: [
          {
            pattern: "react",
            group: "external",
            position: "before",
          },
        ],
        pathGroupsExcludedImportTypes: ["react"],
        "newlines-between": "always",
        alphabetize: {
          order: "asc",
          caseInsensitive: true,
        },
      },
    ],
    // for CatchBoundaries
    "@typescript-eslint/no-throw-literal": "off",
  },
};
