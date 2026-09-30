# BBL 成長型・経験値ツール

野球系Webゲーム「[Baseball Life(以下、BBL)](https://baseball-life.games/)」の成長型と、練習で得られる経験値に関するツールをまとめたリポジトリです。

本ツールは個人が作成した非公式ツールで、BBLの運営とは関係ありません。

## 収録ツール

| フォルダー | 内容 |
|---|---|
| [all_patterns_for_spreadsheet/](./all_patterns_for_spreadsheet/) | 成長期ごとの経験値の範囲をCSVから読み込み、補正条件別の出現値と期待値をExcelに出力するPythonプログラムと、その結果を条件を選んで表示する一覧表のテンプレート |

必要な環境と使い方は、各フォルダーのREADMEを参照してください。

```sh
git clone https://github.com/JiroShirato/bbl_growth_type_output.git
cd bbl_growth_type_output/all_patterns_for_spreadsheet
```

## ライセンス

ライセンスは各フォルダーの LICENSE を参照してください。[all_patterns_for_spreadsheet/](./all_patterns_for_spreadsheet/) は [MIT License](./all_patterns_for_spreadsheet/LICENSE) で公開しています。
