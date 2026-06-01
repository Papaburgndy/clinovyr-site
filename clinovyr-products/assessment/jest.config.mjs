import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  dir: "./",
});

/** @type {import('jest').Config} */
const config = {
  coverageProvider: "v8",
  collectCoverageFrom: [
    "src/lib/scoring.ts",
    "src/lib/validate-assessment.ts",
    "src/lib/storage.ts",
    "src/lib/**/*.ts",
    "!src/**/*.tsx",
  ],
  testMatch: ["**/__tests__/**/*.test.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};

export default createJestConfig(config);
