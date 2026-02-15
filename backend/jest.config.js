module.exports = {
  preset: "ts-jest/presets/js-with-ts",
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: ".",
  testMatch: [
    "<rootDir>/test/**/*.spec.ts",
    "<rootDir>/test/**/*.test.ts",
    "<rootDir>/src/**/*.spec.ts",
    "<rootDir>/src/**/*.test.ts",
  ],
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  extensionsToTreatAsEsm: [".ts"],
  transformIgnorePatterns: ["node_modules/(?!(uuid)/)"],
  coverageDirectory: "./coverage",
  testEnvironment: "node",
};
