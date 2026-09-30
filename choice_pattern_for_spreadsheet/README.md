# BBL 条件別経験値のスプレッドシート表示

野球系Webゲーム「[Baseball Life(以下、BBL)](https://baseball-life.games/)」で、成長期と補正条件を選ぶと、練習で出現する経験値の範囲・確率・期待値をGoogleスプレッドシートに表示するGoogle Apps Script(GAS)です。

成長型と年齢、または成長期を直接選び、小AP・AP・YUR・メンタリスト嫁・集中／イマイチ・鍛錬・筋肉養成ギプスの条件を指定すると、該当する練習の結果だけを一覧で表示します。すべての条件の組み合わせをまとめて出力したい場合は、[all_patterns_for_spreadsheet/](../all_patterns_for_spreadsheet/) を使ってください。

この文書は、BBLの2026年9月29日現在の実装(Ver. 0.4.3.6)を元に説明しています。ゲームの最新仕様との一致を保証するものではありません。

本ツールは個人が作成した非公式ツールで、BBLの運営とは関係ありません。

## 必要な環境

- Googleアカウント(Googleスプレッドシートと Apps Script を使用)
- [Node.js](https://nodejs.org/) 20以上(スクリプトを [clasp](https://github.com/google/clasp) でアップロードする場合)

## セットアップ

### 1. スプレッドシートを作成する

1. [base_spreadsheet.xlsx](./base_spreadsheet.xlsx) をGoogleドライブにアップロードします。
2. アップロードしたファイルを開き、「ファイル」→「Google スプレッドシートとして保存」を選びます。
3. 作成されたスプレッドシートで「拡張機能」→「Apps Script」を開きます。

### 2. スクリプトを登録する

次のどちらかの方法で、[main.js](./main.js) をスプレッドシートのスクリプトとして登録します。

**方法A: 手作業で貼り付ける**

Apps Script のエディタで `コード.gs` の内容をすべて [main.js](./main.js) の内容に置き換え、保存します。

**方法B: clasp でアップロードする**

1. Apps Script のエディタで「プロジェクトの設定」を開き、スクリプトIDをコピーします。
2. このフォルダーで [.clasp.json.sample](./.clasp.json.sample) をコピーして `.clasp.json` を作ります。

   ```sh
   cp .clasp.json.sample .clasp.json          # macOS / Linux
   Copy-Item .clasp.json.sample .clasp.json   # Windows (PowerShell)
   ```

3. `.clasp.json` の `scriptId` を、コピーしたスクリプトIDに書き換えます。`.clasp.json` は各自の環境用のファイルなので、Gitでは管理しません(`.gitignore` で除外しています)。
4. このフォルダーで次のコマンドを実行します。

```sh
npm install      # clasp をインストール
npm run login    # 初回のみ。ブラウザでGoogleアカウントにログイン
npm run status   # アップロードされるファイルを確認(main.js と appsscript.json のみ)
npm run push     # スクリプトをアップロード
```

初めて clasp を使う場合は、[Apps Script の設定画面](https://script.google.com/home/usersettings)で「Google Apps Script API」をオンにしてください。

アップロードの対象は [.claspignore](./.claspignore) で `main.js` と `appsscript.json` に限定しています。

## 使い方

「フォーム」シートのC列で条件を選ぶと、編集のたびにスクリプト(`onEdit`)が実行され、結果がE～V列に表示されます。

| セル | 項目 | 選択肢 |
|---|---|---|
| C7 | 選択 | `成長型`(成長型と年齢から成長期を決める)、`成長期`(成長期を直接選ぶ) |
| C8 | 成長型 | 早熟、鍋底、普通早 など |
| C9 | 年齢 | 18～ |
| C10 | 成長期(選択) | 停滞期00～成長期4 |
| C13 | 小AP | `なし`、`あり（APと同じ）`、`あり（APとは別）` |
| C14 | AP | `ミート`、`パワー`、`変化`、`スタミナ`、`精神`、`それ以外` |
| C15 | YUR | `あり`、`なし` |
| C16 | メンタリスト嫁 | `あり`、`なし` |
| C17 | 集中・イマイチ | `集中`、`イマイチ`、`なし` |
| C18 | 鍛錬 | `積極鍛錬`、`精密鍛錬`、`慎重鍛錬`、`平衡鍛錬`、`なし` |
| C19 | 筋肉養成ギプス | `あり`、`なし` |

計算の対象になった成長期はC21に表示されます。

結果は2行で1組です。

- 1行目: E列に練習の種類、G列から出現する経験値、V列に期待値
- 2行目: 1行目の各経験値が出現する確率

成長期ごとの経験値の範囲は「期PT」シート、成長型と年齢から成長期を決める表は「型PT」シートにあります。ゲームの仕様が変わった場合は、これらのシートを更新してください。

## ファイル構成

| ファイル | 役割 |
|---|---|
| [main.js](./main.js) | 条件に応じて経験値のパターンを計算し、「フォーム」シートに出力するスクリプト |
| [appsscript.json](./appsscript.json) | Apps Script のプロジェクト設定(タイムゾーン、ランタイム) |
| [base_spreadsheet.xlsx](./base_spreadsheet.xlsx) | スプレッドシートのテンプレート(「フォーム」「型PT」「期PT」の3シート) |
| [.clasp.json.sample](./.clasp.json.sample) | clasp の設定のひな形。コピーして `.clasp.json` を作り、アップロード先のスクリプトIDを設定する |
| [.claspignore](./.claspignore) | clasp でアップロードしないファイルの指定 |
| [package.json](./package.json) | clasp のバージョンと、`npm run` で使うコマンドの定義 |

## ライセンス

[MIT License](../LICENSE) で公開しています。
