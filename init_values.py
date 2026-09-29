# 読み込むCSVのファイル名(コマンドで指定しない場合)
INPUT_CSV_FILE_NAME_STR = "import.csv"

# 出力するExcelのファイル名(コマンドで指定しない場合)
OUTPUT_EXCEL_NAME_STR = "output.xlsx"

# 入力CSVの1行あたりの必要な列数
REQUIRED_COLUMN_COUNT = 7

# 小APの有無
MINI_AP_ON_OFF_LIST = ["なし", "小AP"]

# YURの有無
YUR_ON_OFF_LIST = ["なし", "YUR"]

# 集中・イマイチの有無
CONCENTRATE_ON_OFF_LIST = ["なし", "集中", "イマイチ"]

# ギプスの有無
CAST_ON_OFF_LIST = ["なし", "ギプス"]

# 出力対象の値
OUTPUT_TYPE_LIST = ["出現値", "期待値"]

# 小APによる加算値
MINI_AP_ADD_VALUE = 2

# YURによる加算値
YUR_ADD_VALUE = 4

# メンタリスト嫁による乗算値
MENTALIST_WIFE_MUL_FACTOR = 2.0

# ギプスによる乗算値
CAST_MUL_FACTOR = 1.2

# APによる乗算係数のリスト(ミート、パワー、その他)
AP_MULTIPLICATION_FACTOR_DICT = {
    "meet_ap": 1.3,
    "power_ap": 1.4,
    "other_ap": 1.5
}

# 出力先の列名前
OUTPUT_COLUMN_NAME_LIST = [
    "meet_ap_large_train_ex",                # ミートAP大練習
    "power_ap_large_train_ex",               # パワーAP大練習
    "other_ap_large_train_ex",               # 1.5AP大練習
    "mental_ap_large_train_ex",              # 精神APメンタ精神大練習
    "meet_ap_small_train_ex",                # ミートAP小練習
    "power_ap_small_train_ex",               # パワーAP小練習
    "other_ap_small_train_ex",               # 1.5AP小練習
    "mental_ap_small_train_ex",              # 精神APメンタ精神小練習
    "large_train_ex",                        # 大練習
    "mental_large_train_ex",                 # メンタ精神大練習
    "small_train_ex",                        # 小練習、新球大練習
    "mental_small_train_ex",                 # メンタ精神小練習
    "large_minus_ex",                        # 大練習マイナス
    "proactive_meet_ap_large_train_ex",      # ミートAP積極大練習
    "proactive_power_ap_large_train_ex",     # パワーAP積極大練習
    "proactive_other_ap_large_train_ex",     # 1.5AP積極大練習
    "proactive_large_train_ex",              # 積極大練習
    "proactive_new_ball_large_train_ex",     # 積極新球大練習
    "proactive_large_minus_ex",              # 積極大練習マイナス
    "cautious_large_minus_ex",               # 慎重大練習マイナス
    "precise_meet_ap_small_train_ex",        # ミートAP精密小練習
    "precise_power_ap_small_train_ex",       # パワーAP精密小練習
    "precise_other_ap_small_train_ex",       # 1.5AP精密小練習
    "precise_small_train_ex",                # 精密小練習
    "precise_mental_small_train_ex",         # 精密メンタ精神小練習
    "precise_mental_ap_small_train_ex",      # 精神AP精密メンタ精神小練習
    "equilibrium_meet_ap_large_train_ex",    # ミートAP平衡大練習
    "equilibrium_power_ap_large_train_ex",   # パワーAP平衡大練習
    "equilibrium_other_ap_large_train_ex",   # 1.5AP平衡大練習
    "equilibrium_mental_ap_large_train_ex",  # 精神APメンタ平衡精神大練習
    "equilibrium_meet_ap_small_train_ex",    # ミートAP平衡小練習
    "equilibrium_power_ap_small_train_ex",   # パワーAP平衡小練習
    "equilibrium_other_ap_small_train_ex",   # 1.5AP平衡小練習
    "equilibrium_mental_ap_small_train_ex",  # 精神APメンタ平衡精神小練習
    "equilibrium_large_train_ex",            # 平衡大練習
    "equilibrium_mental_large_train_ex",     # メンタ平衡精神大練習
    "equilibrium_small_train_ex",            # 平衡小練習
    "equilibrium_mental_small_train_ex",     # メンタ平衡精神小練習
    "participate_independent_training_ex",   # 自主トレ参加
]
