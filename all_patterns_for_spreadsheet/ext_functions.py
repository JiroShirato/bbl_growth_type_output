import csv

import init_values as ini_value


def make_attribute_dict() -> dict[str, list[int]]:
    """属性と表示名の設定を行い、attribute_dictを作成する

    Returns:
        dict[str, list[int]]: 属性と表示名の設定を格納した辞書
    """
    # 条件を属性として格納する辞書
    attribute_dict: dict[str, list[int]] = {}

    for mini_ap in range(len(ini_value.MINI_AP_OPTION_LIST)):
        for yur in range(len(ini_value.YUR_OPTION_LIST)):
            for concentrate in range(len(ini_value.CONCENTRATE_OPTION_LIST)):
                for gips in range(len(ini_value.GIPS_OPTION_LIST)):
                    for output_type in range(len(ini_value.OUTPUT_TYPE_LIST)):
                        # 各属性の条件の名前の取得
                        mini_ap_name: str = ini_value.MINI_AP_OPTION_LIST[mini_ap]
                        yur_name: str = ini_value.YUR_OPTION_LIST[yur]
                        concentrate_name: str = ini_value.CONCENTRATE_OPTION_LIST[concentrate]
                        gips_name: str = ini_value.GIPS_OPTION_LIST[gips]

                        # 最初に小APの名前を設定
                        condition_name: str = mini_ap_name

                        # 次にYURの名前を設定
                        if yur_name != "なし":
                            if condition_name != "なし":
                                condition_name = condition_name + "＋" + yur_name
                            else:
                                condition_name = yur_name

                        # 次に集中の有無を名前に設定
                        if concentrate_name != "なし":
                            if condition_name != "なし":
                                condition_name = condition_name + "＋" + concentrate_name
                            else:
                                condition_name = concentrate_name

                        # 次にギプスの名前を設定
                        if gips_name != "なし":
                            if condition_name != "なし":
                                condition_name = condition_name + "＋" + gips_name
                            else:
                                condition_name = gips_name

                        # 最後に出力内容を名前に追加
                        condition_name = condition_name + "(" + ini_value.OUTPUT_TYPE_LIST[output_type] + ")"

                        # 属性も設定
                        attribute_dict[condition_name] = [
                            mini_ap, yur, concentrate, gips, output_type]

    return attribute_dict


def make_sheet_name_from_attribute_list(attributes: list[int]) -> str:
    """attribute_listからシート名を作成する

    attribute_listの要素は、[小AP, YUR, 集中・イマイチ, ギプスの有無, 出力対象]の順で格納されている。
    attribute_listの要素をもとに、シート名を作成する。
    (例：すべて「なし」(0, 0, 0, 0, 0)なら、左から番号をつなぎ合わせて「00000」を返す。)

    Args:
        attributes (list[int]): 属性のリスト(小AP, YUR, 集中・イマイチ, ギプスの有無, 出力対象)

    Returns:
        str: 作成されたシート名
    """
    # シート名を設定
    sheet_name: str = ""

    for i in attributes:
        sheet_name += str(i)

    return sheet_name


def separate_output_name_and_type(condition_name: str) -> tuple[str, str]:
    """出力対象の名前と出力対象の種類を分離する

    Args:
        condition_name (str): 出力対象の名前と種類が結合された文字列(例："小AP＋YUR＋イマイチ＋ギプス(期待値)")

    Returns:
        tuple[str, str]: 出力対象の名前と種類のタプル(例：("小AP＋YUR＋イマイチ＋ギプス", "期待値"))
    """
    # "("と")"のそれぞれの文字の位置を探す
    name_start_index: int = condition_name.find("(")
    name_end_index: int = condition_name.find(")")

    if name_start_index != -1 and name_end_index != -1:
        # 見つかったら、分離する
        output_name: str = condition_name[:name_start_index]
        output_type: str = condition_name[name_start_index + 1:name_end_index]
        return output_name, output_type
    return condition_name, ""  # "(" または ")" が見つからない場合は、元の文字列を返す


def read_csv_file(filepath: str) -> list[list[str]]:
    """CSVファイルを読み込み、内容をリストとして返す

    Args:
        filepath (str): 読み込むCSVファイルのパス

    Returns:
        list[list[str]]: CSVファイルの内容を格納したリスト

    Raises:
        ValueError: 列数が足りない行がある場合
    """
    # CSVファイルの情報を格納するリスト
    data_list: list[list[str]] = []

    with open(filepath, mode='r', encoding='utf-8') as csvfile:
        reader = csv.reader(csvfile)
        for row in reader:
            if len(row) < ini_value.REQUIRED_COLUMN_COUNT:
                raise ValueError(
                    f"{reader.line_num}行目の列数が不足しています"
                    f"(必要: {ini_value.REQUIRED_COLUMN_COUNT}列、実際: {len(row)}列): {row}"
                )
            data_list.append(row)
    return data_list


def sort_and_omit_ex_values_list_to_str(value_list: list[int]) -> str:
    """入力したリストをソートしたうえで、3つ連続する箇所があれば「～」で省略した上で文字列で出力

    Args:
        value_list (list[int]): ソート対象の数値のリスト

    Returns:
        str: ソートないし、省略された文字列
    """
    # ソートされたリスト
    sorted_list: list[int] = sorted(value_list)

    # リストの最大長
    sorted_list_length: int = len(sorted_list)

    # 範囲が連続しているかのフラグ
    is_range_sequence: bool = True

    # 出力文字列
    output_str: str = ""

    # リストに値があれば、最初(最小)の値を出力文字列に入れる
    if sorted_list_length > 0:
        output_str = str(sorted_list[0])
    else:
        output_str = "None"

    # リストの要素数が3つ以上なら、処理を開始する
    if sorted_list_length > 2:
        min_index: int = 0
        max_index: int = 1

        while min_index < sorted_list_length and max_index < sorted_list_length:
            # 隣同士が連続している(差が1)なら、継続
            if (sorted_list[max_index-1] + 1) == sorted_list[max_index]:
                max_index += 1
                # 連続フラグをオンにする
                is_range_sequence = True
            else:
                # 隣同士が連続していない
                if is_range_sequence and min_index + 2 < max_index:
                    # 左の確認ポイントとの差が2つ以上で連続していたのなら、省略文字「～」で括る
                    output_str = output_str + "～" + str(sorted_list[max_index-1])
                else:
                    # それ以外は,で対応する
                    if not output_str.endswith(str(sorted_list[max_index-1])):
                        output_str = output_str + "," + str(sorted_list[max_index-1])
                # 右の確認ポイントの数値を出力文字列に入れる
                if (max_index + 1) < sorted_list_length:
                    output_str = output_str + "," + str(sorted_list[max_index])
                # 連続フラグをオフにする
                is_range_sequence = False
                # 左の確認ポイントを右の確認ポイントに置き換えて、右の確認ポイントを一つ追加する
                min_index = max_index
                max_index = max_index + 1

        # リストの一番右の数値を取得
        last_list_ex_value: int = sorted_list[sorted_list_length-1]

        # 出力文字列が最後の数値の文字列表現で終わっていないとき
        if not output_str.endswith(str(last_list_ex_value)):
            if is_range_sequence and min_index + 2 < max_index:
                # 隣同士が連続している(差が1)なら「～」で省略
                output_str = output_str + "～" + str(last_list_ex_value)
            else:
                # それ以外は,で対応
                output_str = output_str + "," + str(last_list_ex_value)

    # リストの要素数が2つなら、末尾に2つ目の数値を出力文字列に追加する
    elif sorted_list_length == 2:
        output_str = output_str + "," + str(sorted_list[1])

    return output_str


def is_train_pattern(pattern_name: str) -> bool:
    """大練習・小練習のパターンか(自主トレ参加や大練習マイナスは含まない)

    Args:
        pattern_name (str): 判定するパターンの名前

    Returns:
        bool: 判定結果
    """
    return "_train_ex" in pattern_name
