import argparse
import sys

from openpyxl import Workbook
from openpyxl.worksheet.worksheet import Worksheet

import one_pattern_class as opc
import init_values as iv
import ext_functions as ef


def create_base_patterns(a_growth_ex_values_list: list[str]) -> dict[str, opc.OnePattern]:
    """CSVの1行から、補正前の基本パターン（小練習、自主トレ参加、大練習、大練習マイナス）を作成

    Args:
        a_growth_ex_values_list (list[str]): CSVの1行（成長期名と各練習の最小値・最大値）

    Returns:
        dict[str, opc.OnePattern]: パターン名をkeyとした基本パターンの辞書
    """
    patterns_dict: dict[str, opc.OnePattern] = {}

    # 小練習の値の取得
    small_opc: opc.OnePattern = opc.OnePattern.from_strings(
        a_growth_ex_values_list[1], a_growth_ex_values_list[2])
    patterns_dict["small_train_ex"] = small_opc

    # 自主トレ参加の値の取得(小練習の値を使用、小練習の値がない場合はインスタンスだけ作る)
    small_opc_list: list[int] = small_opc.get_values_list()
    if len(small_opc_list) == 0:
        patterns_dict["participate_independent_training_ex"] = opc.OnePattern()
    else:
        independent_opc: opc.OnePattern = opc.OnePattern(
            min(small_opc_list) * 3, max(small_opc_list) * 3)
        patterns_dict["participate_independent_training_ex"] = independent_opc

    # 大練習の値の取得
    large_opc: opc.OnePattern = opc.OnePattern.from_strings(
        a_growth_ex_values_list[3], a_growth_ex_values_list[4])
    patterns_dict["large_train_ex"] = large_opc

    # 大練習のマイナス値の取得
    minus_opc: opc.OnePattern = opc.OnePattern.from_strings(
        a_growth_ex_values_list[6], a_growth_ex_values_list[5])
    patterns_dict["large_minus_ex"] = minus_opc

    return patterns_dict


def add_value_to_train_patterns(patterns_dict: dict[str, opc.OnePattern], add_val: int) -> None:
    """大練習と小練習すべてのパターンに固定値を加算（小AP、YUR向け）

    Args:
        patterns_dict (dict[str, opc.OnePattern]): 1つの成長期のパターンの辞書
        add_val (int): 加算する値
    """
    for one_pattern_name, one_pattern in patterns_dict.items():
        if ef.is_train_pattern(one_pattern_name):
            one_pattern.add_ex_point(add_val)


def add_ap_patterns(patterns_dict: dict[str, opc.OnePattern]) -> None:
    """APによる経験値倍増のパターンを追加(倍率設定から、計算)

    Args:
        patterns_dict (dict[str, opc.OnePattern]): 1つの成長期のパターンの辞書
    """
    # 新たに追加する経験値パターンを格納する辞書
    add_ex_pattern_dict: dict[str, opc.OnePattern] = {}

    for ap_name, mul_val in iv.AP_MULTIPLICATION_FACTOR_DICT.items():
        for one_pattern_name, one_pattern in patterns_dict.items():
            # 大練習と小練習すべてが対象
            if ef.is_train_pattern(one_pattern_name):
                # APの名前の設定
                add_one_pattern_name = ap_name + "_" + one_pattern_name
                # 新しいパターンを作成し、APに設定された乗算値をかける（端数は切り捨て）
                add_ex_pattern_dict[add_one_pattern_name] = one_pattern.copy()
                add_ex_pattern_dict[add_one_pattern_name].mul_ex_point(mul_val)

    patterns_dict.update(add_ex_pattern_dict)


def add_mentalist_patterns(patterns_dict: dict[str, opc.OnePattern]) -> None:
    """メンタリスト能力持ちの嫁のパターンを追加

    Args:
        patterns_dict (dict[str, opc.OnePattern]): 1つの成長期のパターンの辞書
    """
    # 新たに追加する経験値パターンを格納する辞書
    add_ex_pattern_dict: dict[str, opc.OnePattern] = {}

    for one_pattern_name, one_pattern in patterns_dict.items():
        if one_pattern_name == "large_train_ex" or one_pattern_name == "small_train_ex":
            # 大練習と小練習が対象なら、メンタリストの名前"mental_"を追加
            add_one_pattern_name = "mental_" + one_pattern_name
        elif one_pattern_name.startswith("other_ap_"):
            # 1.5倍APなら、名前をメンタリスト"mental_"に変更
            add_one_pattern_name = one_pattern_name.replace(
                "other_", "mental_")
        else:
            # 上記のパターン以外は対応しない
            continue
        # 新しいパターンを作成し、乗算値 iv.MENTALIST_WIFE_MUL_FACTOR をかける
        add_ex_pattern_dict[add_one_pattern_name] = one_pattern.copy()
        add_ex_pattern_dict[add_one_pattern_name].mul_ex_point(
            iv.MENTALIST_WIFE_MUL_FACTOR)

    patterns_dict.update(add_ex_pattern_dict)


def apply_concentrate(patterns_dict: dict[str, opc.OnePattern], concentrate_type: int) -> None:
    """集中、及びイマイチやる気が出ない…による経験値加減処理

    Args:
        patterns_dict (dict[str, opc.OnePattern]): 1つの成長期のパターンの辞書
        concentrate_type (int): 0: なし、1: 集中、2: イマイチ
    """
    for one_pattern_name, one_pattern in patterns_dict.items():
        # 大練習と小練習すべてが対象
        if ef.is_train_pattern(one_pattern_name):
            if concentrate_type == 1:
                # 集中の時
                one_pattern.add_concentrate_ex_point()
            elif concentrate_type == 2:
                # イマイチの時（2で割る）
                one_pattern.div_ex_point_with_ceil_and_floor(2)


def has_large_minus(patterns_dict: dict[str, opc.OnePattern], growth_name_str: str) -> bool:
    """大練習で経験値が下がるか（積極鍛錬と慎重鍛錬向け）

    Args:
        patterns_dict (dict[str, opc.OnePattern]): 1つの成長期のパターンの辞書
        growth_name_str (str): 成長期名（エラーメッセージ用）

    Returns:
        bool: 大練習マイナスがあれば True

    Raises:
        ValueError: 大練習マイナスの値が空の場合
    """
    temp_value_list: list[int] = patterns_dict["large_minus_ex"].get_values_list(
    )
    try:
        return max(temp_value_list) < 0
    except ValueError as e:
        raise ValueError(
            f"大練習マイナスの値が不正です: {e}、成長期:{growth_name_str}、値の配列:{temp_value_list}") from e


def make_proactive_patterns(patterns_dict: dict[str, opc.OnePattern], large_minus_flag: bool) -> dict[str, opc.OnePattern]:
    """積極鍛錬のパターンを作成

    Args:
        patterns_dict (dict[str, opc.OnePattern]): 1つの成長期のパターンの辞書
        large_minus_flag (bool): 大練習マイナスがあるか

    Returns:
        dict[str, opc.OnePattern]: 新たに作成したパターンの辞書
    """
    add_ex_pattern_dict: dict[str, opc.OnePattern] = {}

    for one_pattern_name, one_pattern in patterns_dict.items():

        # 加算処理フラグ
        exec_add_flag = True

        if one_pattern_name == "large_train_ex":
            # 大練習の時
            add_one_pattern_name = "proactive_" + one_pattern_name
        elif "_ap_large_" in one_pattern_name and not one_pattern_name.startswith("mental_ap_"):
            # AP大練習（メンタリスト嫁除く）の時
            add_one_pattern_name = "proactive_" + one_pattern_name
        elif one_pattern_name == "small_train_ex":
            # 小練習の値を用いて、積極新球を作成
            add_one_pattern_name = "proactive_new_ball_large_train_ex"
        elif one_pattern_name == "large_minus_ex":
            # 大練習マイナスの時（減算処理を実行）
            add_one_pattern_name = "proactive_" + one_pattern_name
            exec_add_flag = False
        else:
            # 上記のパターン以外は対応しない
            continue

        # 新しいパターンを作成し、加算ないし減算処理を実施
        add_ex_pattern_dict[add_one_pattern_name] = one_pattern.copy()
        if exec_add_flag:
            add_ex_pattern_dict[add_one_pattern_name].add_proactive_ex_point(
                large_minus_flag)
        else:
            add_ex_pattern_dict[add_one_pattern_name].sub_proactive_ex_point(
                large_minus_flag)

    return add_ex_pattern_dict


def make_cautious_patterns(patterns_dict: dict[str, opc.OnePattern], large_minus_flag: bool) -> dict[str, opc.OnePattern]:
    """慎重鍛錬のパターンを作成（大練習マイナスが対象）

    Args:
        patterns_dict (dict[str, opc.OnePattern]): 1つの成長期のパターンの辞書
        large_minus_flag (bool): 大練習マイナスがあるか

    Returns:
        dict[str, opc.OnePattern]: 新たに作成したパターンの辞書
    """
    add_ex_pattern_dict: dict[str, opc.OnePattern] = {}

    for one_pattern_name, one_pattern in patterns_dict.items():
        if one_pattern_name == "large_minus_ex":
            # 新しいパターンを作成し、除算処理を実施
            add_one_pattern_name = "cautious_" + one_pattern_name
            add_ex_pattern_dict[add_one_pattern_name] = one_pattern.copy()
            add_ex_pattern_dict[add_one_pattern_name].div_cautious_ex_point(
                large_minus_flag)

    return add_ex_pattern_dict


def make_precise_patterns(patterns_dict: dict[str, opc.OnePattern]) -> dict[str, opc.OnePattern]:
    """精密鍛錬のパターンを作成（小練習すべてが対象）

    Args:
        patterns_dict (dict[str, opc.OnePattern]): 1つの成長期のパターンの辞書

    Returns:
        dict[str, opc.OnePattern]: 新たに作成したパターンの辞書
    """
    add_ex_pattern_dict: dict[str, opc.OnePattern] = {}

    for one_pattern_name, one_pattern in patterns_dict.items():
        if "small_train" in one_pattern_name:
            # 新しいパターンを作成し、加算処理を実施
            add_one_pattern_name = "precise_" + one_pattern_name
            add_ex_pattern_dict[add_one_pattern_name] = one_pattern.copy()
            add_ex_pattern_dict[add_one_pattern_name].add_precise_ex_point()

    return add_ex_pattern_dict


def make_equilibrium_patterns(patterns_dict: dict[str, opc.OnePattern]) -> dict[str, opc.OnePattern]:
    """平衡鍛錬のパターンを作成（大練習マイナスと自主トレ参加以外が対象）

    Args:
        patterns_dict (dict[str, opc.OnePattern]): 1つの成長期のパターンの辞書

    Returns:
        dict[str, opc.OnePattern]: 新たに作成したパターンの辞書
    """
    add_ex_pattern_dict: dict[str, opc.OnePattern] = {}

    for one_pattern_name, one_pattern in patterns_dict.items():
        if one_pattern_name.endswith("large_minus_ex"):
            # 大練習マイナスは対象外
            continue
        elif one_pattern_name == "participate_independent_training_ex":
            # 合同自主トレ参加も除外
            continue
        # 新しいパターンを作成し、加算処理を実施
        add_one_pattern_name = "equilibrium_" + one_pattern_name
        add_ex_pattern_dict[add_one_pattern_name] = one_pattern.copy()
        add_ex_pattern_dict[add_one_pattern_name].add_equilibrium_ex_point()

    return add_ex_pattern_dict


def add_training_patterns(patterns_dict: dict[str, opc.OnePattern], growth_name_str: str) -> None:
    """各鍛錬（積極・慎重・精密・平衡）のパターンを追加
    各鍛錬は、鍛錬適用前のパターンだけをもとに作成する。

    Args:
        patterns_dict (dict[str, opc.OnePattern]): 1つの成長期のパターンの辞書
        growth_name_str (str): 成長期名（エラーメッセージ用）

    Raises:
        ValueError: 大練習マイナスの値が空の場合
    """
    large_minus_flag: bool = has_large_minus(patterns_dict, growth_name_str)

    # すべての鍛錬のパターンを作成してから、まとめて追加する
    add_ex_pattern_dict: dict[str, opc.OnePattern] = {}
    add_ex_pattern_dict.update(
        make_proactive_patterns(patterns_dict, large_minus_flag))
    add_ex_pattern_dict.update(
        make_cautious_patterns(patterns_dict, large_minus_flag))
    add_ex_pattern_dict.update(make_precise_patterns(patterns_dict))
    add_ex_pattern_dict.update(make_equilibrium_patterns(patterns_dict))

    patterns_dict.update(add_ex_pattern_dict)


def apply_cast(patterns_dict: dict[str, opc.OnePattern]) -> None:
    """筋肉養成ギプスの適用（大練習と小練習全てに iv.CAST_MUL_FACTOR を乗算、端数は切り上げ）

    Args:
        patterns_dict (dict[str, opc.OnePattern]): 1つの成長期のパターンの辞書
    """
    for one_pattern_name, one_pattern in patterns_dict.items():
        if ef.is_train_pattern(one_pattern_name):
            one_pattern.mul_ex_point(iv.CAST_MUL_FACTOR, False)


def calc_growth_patterns(a_growth_ex_values_list: list[str], attribute_list: list[int]) -> dict[str, opc.OnePattern]:
    """1つの成長期について、シートの条件に応じた全ての経験値パターンを計算

    Args:
        a_growth_ex_values_list (list[str]): CSVの1行（成長期名と各練習の最小値・最大値）
        attribute_list (list[int]): シートの条件（小AP, YUR, 集中・イマイチ, ギプスの有無, 出力対象）

    Returns:
        dict[str, opc.OnePattern]: パターン名をkeyとした全てのパターンの辞書

    Raises:
        ValueError: 数値に変換できない値がある、または大練習マイナスの値が空の場合
    """
    mini_ap, yur, concentrate, cast, output_type = attribute_list
    growth_name_str: str = a_growth_ex_values_list[0]

    patterns_dict: dict[str, opc.OnePattern] = create_base_patterns(
        a_growth_ex_values_list)

    # 1. 小APによる経験値追加処理
    if mini_ap == 1:
        add_value_to_train_patterns(patterns_dict, iv.MINI_AP_ADD_VALUE)

    # 2. APによる経験値倍増処理
    add_ap_patterns(patterns_dict)

    # 3. YURによる経験値追加処理
    if yur == 1:
        add_value_to_train_patterns(patterns_dict, iv.YUR_ADD_VALUE)

    # 4. メンタリスト能力持ちの嫁追加処理
    add_mentalist_patterns(patterns_dict)

    # 5. 集中、及びイマイチやる気が出ない…による経験値加減処理
    if concentrate != 0:
        apply_concentrate(patterns_dict, concentrate)

    # 6. 各鍛錬による補正
    add_training_patterns(patterns_dict, growth_name_str)

    # 7. 筋肉養成ギプスの適用
    if cast == 1:
        apply_cast(patterns_dict)

    # 8. 期待値算出（出力対象が期待値の時）
    if output_type == 1:
        for one_pattern in patterns_dict.values():
            one_pattern.calc_expected_value()

    return patterns_dict


def format_values_to_str(values_list: list[int]) -> str:
    """出現値のリストをセルに出力する文字列に変換
    3つ以上連続する数がある場合は、その箇所は「～」で括る

    Args:
        values_list (list[int]): 出現値のリスト

    Returns:
        str: セルに出力する文字列（空配列なら "None"）
    """
    if len(values_list) == 0:
        # 空配列ならNoneを入れる
        return "None"
    if min(values_list) >= 0:
        # 配列が正の値か0のみなら、ソート処理を行う
        return ef.sort_and_omit_value_lists_to_str(values_list)

    # 配列に負の数があるなら、直接処理する（大練習マイナスはこの時点で連続しているため）
    if len(values_list) > 2:
        return str(max(values_list)) + "～" + str(min(values_list))
    if len(values_list) == 2:
        return str(max(values_list)) + "," + str(min(values_list))
    return str(values_list[0])


def write_sheet(ws: Worksheet, all_ex_pattern_dict: dict[str, dict[str, opc.OnePattern]], output_type: int,
                real_sheet_name: str, output_name: str) -> None:
    """全ての成長期のパターンをシートに出力

    Args:
        ws (Worksheet): 出力先のシート
        all_ex_pattern_dict (dict[str, dict[str, opc.OnePattern]]): 成長期名をkeyとした、各成長期のパターンの辞書
        output_type (int): 0: 出現値、1: 期待値
        real_sheet_name (str): シートの本来の名前（乗っている補正）
        output_name (str): 出力内容の名前
    """
    excel_rows_val: int = 1

    for pattern_dict in all_ex_pattern_dict.values():
        for excel_column_val, column_name in enumerate(iv.OUTPUT_COLUMN_NAME_LIST, start=1):
            a_pattern_obj = pattern_dict[column_name]
            if output_type == 1:
                # 出力対象が期待値の時
                write_val = str(a_pattern_obj.get_expected_value())
            else:
                # 出力対象が出現値の時
                write_val = format_values_to_str(
                    a_pattern_obj.get_values_list())
            ws.cell(row=excel_rows_val, column=excel_column_val, value=write_val)
        excel_rows_val += 1

    # シートの本来の名前（乗っている補正）と、出力内容をそれぞれセルに出力
    ws.cell(row=excel_rows_val, column=1, value=real_sheet_name)
    ws.cell(row=excel_rows_val, column=2, value=output_name)


def main(input_file: str = iv.INPUT_CSV_FILE_NAME_STR, output_file: str = iv.OUTPUT_EXCEL_NAME_STR) -> None:
    """各成長期の出現値のパターンをExcelに出力
    Baseball Life(BBL)における成長型に割り当てられる成長期のパターンから
    各補正が乗った時の出現する経験値を自動で計算するプログラム

    すべての練習に乗るパターン（例：小AP、筋肉養成ギプス）をシートに分けて
    選手のAPや共通能力、また結婚した嫁の能力で変わる部分は同じシートに別々の列で出力を行う

    Args:
        input_file (str): 成長期と練習の無補正時の出現値の幅を記録した入力CSVファイル。入力がない時は init_values.py で設定された INPUT_CSV_FILE_NAME_STR を参照
        output_file (str): 各シートにパターンを出力したExcelファイル（拡張子 .xlsx）。 入力がない時は init_values.py で設定された OUTPUT_EXCEL_NAME_STR を参照

    Raises:
        OSError: 入力ファイルの読み込み、またはExcelの保存に失敗した場合。
        ValueError: 入力CSVが空、数値に変換できない値がある、
            または大練習マイナスの範囲が不正な場合、
            あるいは入力したCSVファイルの列数が足りない場合。
        UnicodeDecodeError: 入力CSVをUTF-8として読み込めない場合。
    """

    # シートの出力先の名前をkeyとして設定する属性を格納する辞書（小AP, YUR, 集中・イマイチ, ギプスの有無, 出力対象）
    attribute_dict: dict[str, list[int]] = ef.make_attribute_dict()

    # CSVから読み出した成長期のパターン名と小練習、大練習、大練習マイナスの数
    try:
        all_growth_ex_values_list = ef.read_csv_file(input_file)
    except OSError as e:
        # ファイルなし、アクセス権限不足など
        raise OSError(f"入力ファイルを読み込めません: {input_file}") from e

    if not all_growth_ex_values_list:
        raise ValueError(f"入力CSVにデータがありません: {input_file}")

    # 新しいブックを作成（初期シートは削除）
    wb = Workbook()
    wb.remove(wb.active)

    for condition_name, attribute_list in attribute_dict.items():

        # 全ての経験値パターン（出現値と頻度）を格納する辞書（引数は成長期,出現パターン）
        all_ex_pattern_dict: dict[str, dict[str, opc.OnePattern]] = {}
        for a_growth_ex_values_list in all_growth_ex_values_list:
            growth_name_str = a_growth_ex_values_list[0]
            all_ex_pattern_dict[growth_name_str] = calc_growth_patterns(
                a_growth_ex_values_list, attribute_list)

        # シートの本来の名前と出力対象の名前
        real_sheet_name, output_name = ef.separate_output_name_and_type(
            condition_name)

        # Excelへの出力
        ws = wb.create_sheet(
            ef.make_sheet_name_from_attribute_list(attribute_list))
        write_sheet(ws, all_ex_pattern_dict,
                    attribute_list[4], real_sheet_name, output_name)

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
