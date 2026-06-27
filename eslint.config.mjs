import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // 자산 생성 도구는 앱 코드가 아니므로 lint 제외 (Node 스크립트)
    "tools/**",
    // 디자인 핸드오프 번들(시안 HTML·support.js)은 참조용 — 앱 코드 아님
    "desing_handoff/**",
  ]),
]);

export default eslintConfig;
