import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";

/**
 * ESLint configuration for NestJS backend applications.
 * Extends base config with backend-specific rules.
 *
 * @type {import("eslint").Linter.Config[]}
 */
export const backendConfig = [
    js.configs.recommended,
    eslintConfigPrettier,
    ...tseslint.configs.recommended,
    {
        rules: {
            "no-unused-vars": "off",
            "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
            // Backend-specific console rules - allow console.log/warn/info for debugging
            "no-console": ["error", { 
                "allow": ["log", "warn", "info", "table", "time", "timeEnd", "group", "groupEnd", "groupCollapsed"],
                "allowWarn": true 
            }],
            // Disallow console.error - use Logger instead
            "no-restricted-properties": [
                "error",
                {
                    "object": "console",
                    "property": "error",
                    "message": "Use Nest Logger instead of console.error"
                }
            ],
            // Disallow explicit 'any' types
            "@typescript-eslint/no-explicit-any": "error",
            "@typescript-eslint/no-unsafe-assignment": "warn",
            "@typescript-eslint/no-unsafe-call": "warn", 
            "@typescript-eslint/no-unsafe-member-access": "warn",
            "@typescript-eslint/no-unsafe-return": "warn",
        },
    },
];
