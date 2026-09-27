import argparse
import sys

from openpyxl import Workbook

import one_pattern_class as opc
import init_values as iv
import ext_functions as ef

# 初期値設定

def main(input_file: str = iv.INPUT_CSV_FILE_NAME_STR, output_file: str = iv.OUTPUT_EXCEL_NAME_STR) -> None:
    """各成長期の出現値のパターンをExcelに出力
    Baseball Life(BBL)における成長型に割り当てられる成長期のパターンから
    各補整が乗った時の出現する経験値を自動で計算するプログラム

    すべての練習に乗るパターン（例：小AP、筋肉養成ギプス）をシートに分けて
    選手のAPや共通能力、また結婚した嫁の能力で変わる部分は同じシートに別々の列で出力を行う

    Args:
        input_file (str): 成長期と練習の無補正時の出現値の幅を記録した入力CSVファイル。入力がない時は init_values.py で設定された INPUT_CSV_FILE_NAME_STR を参照
        output_file (str): 各シートにパターンを出力したExcelファイル（拡張子 .xlsx）。 入力がない時は init_values.py で設定された OUTPUT_EXCEL_NAME_STR を参照

    Raises:
        OSError: 入力ファイルの読み込み、またはExcelの保存に失敗した場合。
        ValueError: 入力CSVが空、数値に変換できない値がある、
            または大練習マイナスの範囲が不正な場合。
        UnicodeDecodeError: 入力CSVをUTF-8として読み込めない場合。
    """

    # シートの出力先の名前をkeyとして設定する属性を格納する辞書（小AP, YUR, 集中・イマイチ, ギプスの有無, 出力対象）
    attitude_dict: dict[str, list[int]] = ef.make_attitude_dict()

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

    for pattern_name, attitude_list in attitude_dict.items():

        # 全ての経験値パターン（出現値と頻度）を格納する辞書（引数は成長期,出現パターン）
        all_ex_pattern_dict: dict[str, dict[str, opc.OnePattern]] = {}

        # Excelシートの名前
        excel_sheet_name_str = ef.make_sheet_name_from_attitude_list(attitude_list)

        # シートの本来の名前と出力対象の名前    
        real_sheet_name: str = ""
        output_name: str = ""
        real_sheet_name, output_name = ef.separate_output_name_and_type(pattern_name)

        for a_growth_ex_values_list in all_growth_ex_values_list:

            # 成長期パターン
            growth_name_str = a_growth_ex_values_list[0]

            # 辞書の引数に成長期パターン名を設定
            all_ex_pattern_dict[growth_name_str] = {}

            # 新たに追加する経験値パターンを格納する辞書
            add_ex_pattern_dict: dict[str, opc.OnePattern] = {}

            # 大練習のマイナスがあるかどうかを確認するフラグ
            large_minus_flag: bool = False

            # エクセルの出力先の開始行
            excel_rows_val: int = 1

            # 小練習の値の取得
            min_val = a_growth_ex_values_list[1]
            min_val = int(min_val) if len(min_val) > 0 else None
            max_val = a_growth_ex_values_list[2]
            max_val = int(max_val) if len(max_val) > 0 else None
            all_ex_pattern_dict[growth_name_str]["small_train_ex"] = opc.OnePattern(min_val, max_val)

            # 自主トレ参加の値の取得(小練習の値を使用、小練習の値がない場合はインスタンスだけ作る)
            if min_val is None or max_val is None:
                all_ex_pattern_dict[growth_name_str]["participate_independent_training_ex"] = opc.OnePattern()
            else:
                all_ex_pattern_dict[growth_name_str]["participate_independent_training_ex"] = opc.OnePattern(min_val * 3, max_val * 3)


            # 大練習の値の取得
            min_val = a_growth_ex_values_list[3]
            min_val = int(min_val) if len(min_val) > 0 else None
            max_val = a_growth_ex_values_list[4]
            max_val = int(max_val) if len(max_val) > 0 else None
            all_ex_pattern_dict[growth_name_str]["large_train_ex"] = opc.OnePattern(min_val, max_val)

            # 大練習のマイナス値の取得
            min_val = a_growth_ex_values_list[6]
            min_val = int(min_val) if len(min_val) > 0 else None
            max_val = a_growth_ex_values_list[5]
            max_val = int(max_val) if len(max_val) > 0 else None
            all_ex_pattern_dict[growth_name_str]["large_minus_ex"] = opc.OnePattern(min_val, max_val)

            # 1. 小APによる経験値追加処理

            # 小APありの時
            if attitude_list[0] == 1:
                for one_pattern_name in all_ex_pattern_dict[growth_name_str]:
                    # 大練習と小練習全てに 2 を加算
                    if "large_train" in one_pattern_name or "small_train" in one_pattern_name:
                        all_ex_pattern_dict[growth_name_str][one_pattern_name].add_ex_point(2)

            # 2. APによる経験値倍増処理(倍率設定から、計算)

            for ap_name, mul_val in iv.AP_MULTIPLICATION_FACTOR_DICT.items():
                for one_pattern_name in all_ex_pattern_dict[growth_name_str]:
                    # 大練習と小練習すべてが対象
                    if "large_train" in one_pattern_name or "small_train" in one_pattern_name:
                        # APの名前の設定
                        add_one_pattern_name = ap_name + "_" + one_pattern_name
                        # 新しいパターンを作成、参照元のパターンの出現値と頻度を受け渡し
                        add_ex_pattern_dict[add_one_pattern_name] = opc.OnePattern()
                        add_ex_pattern_dict[add_one_pattern_name].set_all_lists(
                            all_ex_pattern_dict[growth_name_str][one_pattern_name].get_all_lists())
                        # APに設定された乗算値をかける（端数は切り捨て）
                        add_ex_pattern_dict[add_one_pattern_name].mul_ex_point(mul_val)

            for pattern_name, pattern_instance in add_ex_pattern_dict.items():
                # 新しいパターンを追加
                all_ex_pattern_dict[growth_name_str][pattern_name] = pattern_instance
        
            # 3. YURによる経験値追加処理

            # YURありの時
            if attitude_list[1] == 1:
                for one_pattern_name in all_ex_pattern_dict[growth_name_str]:
                    # 全ての大練習と小練習全てに 4 を加算
                    if "large_train" in one_pattern_name or "small_train" in one_pattern_name:
                        all_ex_pattern_dict[growth_name_str][one_pattern_name].add_ex_point(4)

            # 4.  メンタリスト能力持ちの嫁追加処理
            add_ex_pattern_dict = {}

            for one_pattern_name in all_ex_pattern_dict[growth_name_str]:
                if one_pattern_name == "large_train_ex" or one_pattern_name == "small_train_ex":
                    # 大練習と小練習が対象なら、メンタリストの名前"mental_"を追加
                    add_one_pattern_name = "mental_" + one_pattern_name
                elif one_pattern_name.startswith("other_ap_"):
                    # 1.5倍APなら、名前をメンタリスト"mental_"に変更
                    add_one_pattern_name = one_pattern_name.replace("other_", "mental_")
                else:
                    # 上記のパターン以外は対応しない
                    continue
                # 新しいパターンを作成、参照元のパターンの出現値と頻度を受け渡し
                add_ex_pattern_dict[add_one_pattern_name] = opc.OnePattern()
                add_ex_pattern_dict[add_one_pattern_name].set_all_lists(
                    all_ex_pattern_dict[growth_name_str][one_pattern_name].get_all_lists())
                # 乗算値2.0をかける
                add_ex_pattern_dict[add_one_pattern_name].mul_ex_point(2.0)
                
            for pattern_name, pattern_instance in add_ex_pattern_dict.items():
                # 新しいパターンを追加
                all_ex_pattern_dict[growth_name_str][pattern_name] = pattern_instance


            # 5.集中、及びイマイチやる気が出ない…による経験値加減処理
            if attitude_list[2] != 0:
                for one_pattern_name in all_ex_pattern_dict[growth_name_str]:
                    # 大練習と小練習すべてが対象
                    if "large_train" in one_pattern_name or "small_train" in one_pattern_name:
                        if attitude_list[2] == 1:
                            # 集中の時
                            all_ex_pattern_dict[growth_name_str][one_pattern_name].add_concentrate_ex_point()
                        elif attitude_list[2] == 2:
                            # イマイチの時（2で割る）
                            all_ex_pattern_dict[growth_name_str][one_pattern_name].div_ex_point_with_ceil_and_floor(2)

            # 6. 各鍛錬による補正の結果

            # 大練習で下がるか(積極鍛錬と慎重鍛錬向け)
            temp_value_list: list[int] = all_ex_pattern_dict[growth_name_str]["large_minus_ex"].get_values_list()
            try:
                if max(temp_value_list) < 0:
                    large_minus_flag = True
            except ValueError as e:
                print("成長期:" + growth_name_str)
                print("値の配列:" + str(temp_value_list))
                raise ValueError(f"大練習マイナスの値が不正です: {e}")
            
            # A. 積極鍛錬
            add_ex_pattern_dict = {}

            for one_pattern_name in all_ex_pattern_dict[growth_name_str]:

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

                # 新しいパターンを作成、参照元のパターンの出現値と頻度を受け渡し
                add_ex_pattern_dict[add_one_pattern_name] = opc.OnePattern()
                add_ex_pattern_dict[add_one_pattern_name].set_all_lists(
                    all_ex_pattern_dict[growth_name_str][one_pattern_name].get_all_lists())

                # 加算ないし減算処理を実施
                if exec_add_flag:
                    add_ex_pattern_dict[add_one_pattern_name].add_proactive_ex_point(large_minus_flag)
                else:
                    add_ex_pattern_dict[add_one_pattern_name].sub_proactive_ex_point(large_minus_flag)

            # B. 慎重鍛錬
            for one_pattern_name in all_ex_pattern_dict[growth_name_str]:
                if one_pattern_name == "large_minus_ex":
                    # 大練習マイナスの時（除算処理を実行）
                    add_one_pattern_name = "cautious_" + one_pattern_name

                    # 新しいパターンを作成、参照元のパターンの出現値と頻度を受け渡し
                    add_ex_pattern_dict[add_one_pattern_name] = opc.OnePattern()
                    add_ex_pattern_dict[add_one_pattern_name].set_all_lists(
                        all_ex_pattern_dict[growth_name_str][one_pattern_name].get_all_lists())

                    # 除算処理を実施
                    add_ex_pattern_dict[add_one_pattern_name].div_cautious_ex_point(large_minus_flag)

            # C. 精密鍛錬
            for one_pattern_name in all_ex_pattern_dict[growth_name_str]:
                if "small_train" in one_pattern_name:
                    # 小鍛錬すべてが対象
                    add_one_pattern_name = "precise_" + one_pattern_name

                    # 新しいパターンを作成、参照元のパターンの出現値と頻度を受け渡し
                    add_ex_pattern_dict[add_one_pattern_name] = opc.OnePattern()
                    add_ex_pattern_dict[add_one_pattern_name].set_all_lists(
                        all_ex_pattern_dict[growth_name_str][one_pattern_name].get_all_lists())

                    # 加算処理を実施
                    add_ex_pattern_dict[add_one_pattern_name].add_precise_ex_point()

            # D. 平衡鍛錬
            for one_pattern_name in all_ex_pattern_dict[growth_name_str]:
                if one_pattern_name.endswith("large_minus_ex"):
                    # 大練習マイナスは対象外
                    continue
                elif one_pattern_name.startswith("proactive_"):
                    # 積極鍛錬適用済みのパターンは除外
                    continue
                elif one_pattern_name.startswith("cautious_"):
                    # 慎重鍛錬適用済みのパターンは除外
                    continue
                elif one_pattern_name == "participate_independent_training_ex":
                    # 合同自主トレ参加も除外
                    continue
                else:
                    add_one_pattern_name = "equilibrium_" + one_pattern_name

                    # 新しいパターンを作成、参照元のパターンの出現値と頻度を受け渡し
                    add_ex_pattern_dict[add_one_pattern_name] = opc.OnePattern()
                    add_ex_pattern_dict[add_one_pattern_name].set_all_lists(
                        all_ex_pattern_dict[growth_name_str][one_pattern_name].get_all_lists())

                    # 加算処理を実施
                    add_ex_pattern_dict[add_one_pattern_name].add_equilibrium_ex_point()
                
            for pattern_name, pattern_instance in add_ex_pattern_dict.items():
                # 新しく作成した鍛錬系のパターンを追加
                all_ex_pattern_dict[growth_name_str][pattern_name] = pattern_instance

            # 7. 筋肉養成ギプスの適用
            if attitude_list[3] == 1:
                for one_pattern_name in all_ex_pattern_dict[growth_name_str]:
                    # 大練習と小練習全てに 1.2 を乗算（端数、切り上げ）
                    if "large_train" in one_pattern_name or "small_train" in one_pattern_name:
                        all_ex_pattern_dict[growth_name_str][one_pattern_name].mul_ex_point(1.2, False)

            # 8. 期待値算出
            if attitude_list[4] == 1:
                # 出力対象が期待値の時
                for one_pattern_name in all_ex_pattern_dict[growth_name_str]:
                    # 全てのパターンで期待値を算出
                    all_ex_pattern_dict[growth_name_str][one_pattern_name].calc_expected_value()

        # Excelへの出力
        wb.create_sheet(excel_sheet_name_str)
        ws = wb[excel_sheet_name_str]

        for a_pattern_name, pattern_dict in all_ex_pattern_dict.items():
            # エクセルの出力先の開始列
            excel_column_val: int = 1
            for column_list in iv.OUTPUT_COLUMN_NAME_LIST:
                # パターンのインスタンスを短い名前の変数に置き換え
                a_pattern_obj = pattern_dict[column_list[0]]
                # 出力対象
                write_val: str = ""
                if attitude_list[4] == 1:
                    # 出力対象が期待値の時
                    write_val = str(a_pattern_obj.get_expected_value())
                else:
                    # 出力対象が出現値の時は、ソートした後に文字列化
                    # 3つ以上連続する数がある場合は、その箇所は「～」で括る
                    output_list = a_pattern_obj.get_values_list()
                    if len(output_list) == 0:
                        # 空配列ならNoneを入れる
                        write_val = "None"
                    elif min(output_list) >= 0:
                        # 配列が正の値か0のみなら、ソート処理を行う
                        write_val = ef.sort_and_omit_value_lists_to_str(a_pattern_obj.get_values_list())
                    else:
                        # 配列が負の数のみなら、直接処理する（大練習マイナスはこの時点で連続しているため）
                        if len(output_list) > 2:
                            write_val = str(max(output_list)) + "～" + str(min(output_list))
                        elif len(output_list) == 2:
                            write_val = str(max(output_list)) + "," + str(min(output_list))
                        elif len(output_list) == 1:
                            write_val = str(output_list[0]) 
                        else:
                            write_val = "None"

                # エクセルのセルに出力
                ws.cell(row=excel_rows_val, column=excel_column_val, value=write_val)
                # 列を更新
                excel_column_val += 1
            # 行を更新
            excel_rows_val += 1

        # シートの本来の名前（乗っている補正）と、出力内容をそれぞれセルに出力
        ws.cell(row=excel_rows_val, column=1, value=real_sheet_name)
        ws.cell(row=excel_rows_val, column=2, value=output_name)


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
