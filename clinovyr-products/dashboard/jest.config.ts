import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

const config: Config = {
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.ts"],
  testPathIgnorePatterns: ["/node_modules/", "\\.e2e\\.spec\\.ts$"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  transformIgnorePatterns: [
    "/node_modules/(?!(@react-pdf|yoga-layout|unicode-trie|unicode-properties|fontkit|restructure|brotli|fast-deep-equal|hyphen)/)",
  ],
};

export default createJestConfig(config);
