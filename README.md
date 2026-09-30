# BBL 成長型・経験値ツール

野球系Webゲーム「[Baseball Life(以下、BBL)](https://baseball-life.games/)」の成長型と、練習で得られる経験値に関するツールをまとめたリポジトリです。

本ツールは個人が作成した非公式ツールで、BBLの運営とは関係ありません。

## 収録ツール

| フォルダー | 内容 |
|---|---|
| [all_patterns_for_spreadsheet/](./all_patterns_for_spreadsheet/) | 成長期ごとの経験値の範囲をCSVから読み込み、補正条件別の出現値と期待値をExcelに出力するPythonプログラムと、その結果を条件を選んで表示する一覧表のテンプレート(「[BBL成長型メモ(全条件網羅版)](https://docs.google.com/spreadsheets/d/1KCz-KLeHL3BVnvRpVJjM_SSM43ixvubc5Sr2PBFrrwY/edit?gid=157841273#gid=157841273)」に対応したプログラム) |
| [choice_pattern_for_spreadsheet/](./choice_pattern_for_spreadsheet/) | 年齢と成長型、あるいは成長期を直接選んだ上で無補正の経験値の範囲を指定し、追加の補正情報ごとに出現する経験値の範囲をSpreadSheetに出力するGoogle Application Scriptプログラムと、SpreadSheetの元になるExcelファイルのテンプレート(「[BBL成長型メモ(選択版)](https://docs.google.com/spreadsheets/d/1HXJGQ757maLYa6WEov7EiiYgF4N9-VS2k7nCYRiKnpg/edit?gid=607020028#gid=607020028)」に対応したプログラム)  |

必要な環境と使い方は以下のコマンドでリポジトリをクローンした上で、各フォルダーのREADMEを参照してください。

```sh
git clone https://github.com/JiroShirato/bbl_growth_type_output.git
```

## ライセンス

ライセンスは [MIT License](./LICENSE) で公開しています。
