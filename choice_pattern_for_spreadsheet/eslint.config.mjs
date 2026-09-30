// ESLint の設定(文末のセミコロンだけを確認する)
export default [
  {
    files: ["main.js"],
    languageOptions: {
      ecmaVersion: "latest",
      // Apps Script はモジュールではなく、通常のスクリプトとして実行される
      sourceType: "script",
    },
    rules: {
      // 文末には必ずセミコロンを付ける
      semi: ["error", "always"],
    },
  },
];
