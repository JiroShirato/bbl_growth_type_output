import argparse
import sys

from openpyxl import Workbook

import one_pattern_class as one_ptn
import init_values as ini_val
import ext_functions as ext_f
import sub_functions as sub_f


def main(input_file: str = ini_val.INPUT_CSV_FILE_NAME_STR,
         output_file: str = ini_val.OUTPUT_EXCEL_NAME_STR) -> None:
    """各成長期で、練習時に出現する経験値(出現値)のパターンをExcelに出力
    Baseball Life(BBL)における成長型に割り当てられる成長期の経験値パターンから
    各補正が乗った時の出現する経験値を自動で計算するプログラム

    すべての練習に乗る経験値パターン(例：小AP、筋肉養成ギプス)をシートに分けて
    選手のAPや共通能力、また結婚した嫁の能力で変わる部分は同じシートに別々の列で出力を行う

    Args:
        input_file (str): 成長期と練習の無補正時の出現値の幅を記録した入力CSVファイル。
            入力がない時は init_values.py で設定された INPUT_CSV_FILE_NAME_STR を参照
        output_file (str): 各シートに経験値パターンを出力したExcelファイル(拡張子 .xlsx)。
            入力がない時は init_values.py で設定された OUTPUT_EXCEL_NAME_STR を参照

    Raises:
        OSError: 入力ファイルの読み込み、またはExcelの保存に失敗した場合。
        ValueError: 入力CSVが空、数値に変換できない値がある、
            または大練習マイナスの範囲が不正な場合、
            あるいは入力したCSVファイルの列数が足りない場合。
        UnicodeDecodeError: 入力CSVをUTF-8として読み込めない場合。
    """

    # シートの出力先の名前をkeyとして設定する属性を格納する辞書(小AP, YUR, 集中・イマイチ, ギプスの有無, 出力対象)
    attributes_by_condition: dict[str, list[int]] = ext_f.make_attributes_by_condition()

    # CSVから読み出した成長期の経験値パターン名と非AP小練習、非AP大練習、大練習マイナスの数をCSVファイルから取得
    try:
        all_growth_ex_values: list[list[str]] = ext_f.read_csv_file(input_file)
    except OSError as e:
        # ファイルなし、アクセス権限不足など
        raise OSError(f"入力ファイルを読み込めません: {input_file}") from e

    if not all_growth_ex_values:
        raise ValueError(f"入力CSVにデータがありません: {input_file}")

    # 新しいブックを作成(初期シートは削除)
    wb = Workbook()
    wb.remove(wb.active)

    for condition_name, attributes in attributes_by_condition.items():
        # 全ての経験値パターン(出現値と頻度)を格納する辞書(キーは成長期,出現経験値パターン)
        all_patterns: dict[str, dict[str, one_ptn.OnePattern]] = {}

        # 成長期毎に定められた出現値と頻度を計算
        for a_growth_ex_values in all_growth_ex_values:
            growth_name: str = a_growth_ex_values[0]
            all_patterns[growth_name] = sub_f.calc_growth_patterns(a_growth_ex_values, attributes)

        # シートの本来の名前と出力対象の名前
        condition_label, output_type_name = ext_f.separate_condition_label_and_output_type(condition_name)

        # Excelへの出力
        ws = wb.create_sheet(ext_f.make_sheet_name_from_attributes(attributes))
        output_type = attributes[4]
        sub_f.write_sheet(ws, all_patterns, output_type, condition_label, output_type_name)

    wb.save(output_file)
    print(output_file + " を保存しました")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="main関数を実行します")
    parser.add_argument("-i", "--input", help="入力ファイル")
    parser.add_argument("-o", "--output", help="出力ファイル")
    args = parser.parse_args()
    kwargs = {}
    if args.input is not None:
        kwargs["input_file"] = args.input
    if args.output is not None:
        kwargs["output_file"] = args.output
    try:
        main(**kwargs)
    except (OSError, ValueError, UnicodeError) as e:
        print(f"エラー: {e}", file=sys.stderr)
        sys.exit(1)
