import csv

import init_values as iv


def make_attribute_dict() -> dict[str, list[int]]:
    """属性と表示名の設定を行い、attribute_dictを作成する

    Returns:
        dict[str, list[int]]: 属性と表示名の設定を格納した辞書
    """
    attribute_dict: dict[str, list[int]] = {}

    for mini_ap in range(len(iv.MINI_AP_ON_OFF_LIST)):
        for yur in range(len(iv.YUR_ON_OFF_LIST)):
            for concentrate in range(len(iv.CONCENTRATE_ON_OFF_LIST)):
                for cast in range(len(iv.CAST_ON_OFF_LIST)):
                    for output_type in range(len(iv.OUTPUT_TYPE_LIST)):
                        # 各名前の取得
                        mini_ap_name_str = iv.MINI_AP_ON_OFF_LIST[mini_ap]
                        yur_name_str = iv.YUR_ON_OFF_LIST[yur]
                        concentrate_name_str = iv.CONCENTRATE_ON_OFF_LIST[concentrate]
                        cast_name_str = iv.CAST_ON_OFF_LIST[cast]

                        # 最初に小APの名前を設定
                        dict_name = mini_ap_name_str

                        # 次にYURの名前を設定
                        if yur_name_str != "なし":
                            if dict_name != "なし":
                                dict_name = dict_name + "＋" + yur_name_str
                            else:
                                dict_name = yur_name_str

                        # 次に集中の有無を名前に設定
                        if concentrate_name_str != "なし":
                            if dict_name != "なし":
                                dict_name = dict_name + "＋" + concentrate_name_str
                            else:
                                dict_name = concentrate_name_str

                        # 次にギプスの名前を設定
                        if cast_name_str != "なし":
                            if dict_name != "なし":
                                dict_name = dict_name + "＋" + cast_name_str
                            else:
                                dict_name = cast_name_str

                        # 最後に出力内容を名前に追加
                        dict_name = dict_name + "（" + iv.OUTPUT_TYPE_LIST[output_type] + "）"

                        # 属性も設定
                        attribute_dict[dict_name] = [mini_ap, yur, concentrate, cast, output_type]

    return attribute_dict

def make_sheet_name_from_attribute_list(attribute_list: list[int]) -> str:
    """attribute_listからシート名を作成する

    attribute_listの要素は、[小AP, YUR, 集中・イマイチ, ギプスの有無, 出力対象]の順で格納されている。
    attribute_listの要素をもとに、シート名を作成する。
    （例：すべて「なし」(0, 0, 0, 0, 0)なら、左から番号をつなぎ合わせて「00000」を返す。）

    Args:
        attribute_list (list[int]): 属性のリスト（小AP, YUR, 集中・イマイチ, ギプスの有無, 出力対象）

    Returns:
        str: 作成されたシート名
    """
    sheet_name_str = ""

    for i in attribute_list:
        sheet_name_str += str(i)

    return sheet_name_str

def separate_output_name_and_type(input_str: str) -> tuple[str, str]:
    """出力対象の名前と出力対象の種類を分離する

    Args:
        input_str (str): 出力対象の名前と種類が結合された文字列（例："小AP＋YUR＋イマイチ＋ギプス（期待値）"）

    Returns:
        tuple[str, str]: 出力対象の名前と種類のタプル（例：("小AP＋YUR＋イマイチ＋ギプス", "期待値")）
    """
    name_start_index = input_str.find("（")
    name_end_index = input_str.find("）")
    if name_start_index != -1 and name_end_index != -1:
        output_name: str = input_str[:name_start_index]
        output_type: str = input_str[name_start_index + 1:name_end_index]
        return output_name, output_type
    return input_str, ""  # "（" または "）" が見つからない場合は、元の文字列を返す

def read_csv_file(file_path: str) -> list[list[str]]:
    """CSVファイルを読み込み、内容をリストとして返す

    Args:
        file_path (str): 読み込むCSVファイルのパス

    Returns:
        list[list[str]]: CSVファイルの内容を格納したリスト

    Raises:
        ValueError: 列数が足りない行がある場合
    """
    data_list: list[list[str]] = []
    with open(file_path, mode='r', encoding='utf-8') as csvfile:
        reader = csv.reader(csvfile)
        for row in reader:
            if len(row) < iv.REQUIRED_COLUMN_COUNT:
                raise ValueError(
                    f"{reader.line_num}行目の列数が不足しています"
                    f"（必要: {iv.REQUIRED_COLUMN_COUNT}列、実際: {len(row)}列）: {row}"
                )
            data_list.append(row)
    return data_list

def sort_and_omit_value_lists_to_str(in_list: list[int]) -> str:
    """入力したリストをソートしたうえで、3つ連続する箇所があれば「～」で省略した上で文字列で出力

    Args:
        in_list (list[int]): ソート対象の数値のリスト

    Returns:
        str: ソートないし、省略された文字列
    """
    # ソートされたリスト
    sorted_list: list[int] = sorted(in_list)

    # リストの最大長
    sorted_list_length: int = len(sorted_list)

    # 範囲が連続しているかのフラグ
    sequence_flag: bool = True

    # 出力文字列
    output_str: str = ""

    # リストに値があれば、最初（最小）の値を出力文字列に入れる
    if sorted_list_length > 0:
        output_str = str(sorted_list[0])
    else:
        output_str = "None"

    # リストの要素数が3つ以上なら、処理を開始する
    if sorted_list_length > 2:
        min_point: int = 0
        max_point: int = 1

        while min_point < sorted_list_length and max_point < sorted_list_length:
            # 隣同士が連続している（差が1）なら、継続

            if (sorted_list[max_point-1] + 1) == sorted_list[max_point]:
                max_point += 1
                # 連続フラグをオンにする
                sequence_flag = True
            else:
                # 隣同士が連続していない
                if sequence_flag and min_point + 2 < max_point:
                    # 左の確認ポイントとの差が2つ以上で連続していたのなら、省略文字「～」で括る
                    output_str = output_str + "～" + str(sorted_list[max_point-1])
                else:
                    # それ以外は,で対応する
                    if not output_str.endswith(str(sorted_list[max_point-1])):
                        output_str = output_str + "," + str(sorted_list[max_point-1])
                # 右の確認ポイントの数値を出力文字列に入れる
                if (max_point + 1) < sorted_list_length:
                    output_str = output_str + "," + str(sorted_list[max_point])
                # 連続フラグをオフにする
                sequence_flag = False
                # 左の確認ポイントを右の確認ポイントに置き換えて、右の確認ポイントを一つ追加する
                min_point = max_point
                max_point = max_point + 1

        # リストの一番右の数値を取得
        last_list_value = sorted_list[sorted_list_length-1]

        # 出力文字列が最後の数値の文字列表現で終わっていないとき
        if not output_str.endswith(str(last_list_value)):
            if sequence_flag and min_point + 2 < max_point:
                # 隣同士が連続している（差が1）なら「～」で省略
                output_str = output_str + "～" + str(last_list_value)
            else:
                # それ以外は,で対応
                output_str = output_str + "," + str(last_list_value)

    # リストの要素数が2つなら、末尾に2つ目の数値を出力文字列に追加する
    elif sorted_list_length == 2:
        output_str = output_str + "," + str(sorted_list[1])

    return output_str

def is_train_pattern(pattern_name: str) -> bool:
    """大練習・小練習のパターンか（自主トレ参加や大練習マイナスは含まない）

    Args:
        pattern_name (str): 判定するパターンの名前

    Returns:
        bool: 判定結果
    """
    return "_train_ex" in pattern_name
