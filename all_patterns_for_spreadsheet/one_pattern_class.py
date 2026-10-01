import math
from collections.abc import Iterable


class OnePattern:

    # 出現値(出現する経験値)
    ex_values: list[int]

    # 頻度(期待値算出用)
    frequencies: list[int]

    # 期待値(経験値がベース)
    expected_ex_value: float | None

    # 集中発生時の加算値
    CONCENTRATE_ADD_EX_VALUES: tuple[int, ...] = (3, 4, 5)

    # 積極鍛錬の加算値
    PROACTIVE_ADD_EX_VALUES: tuple[int, ...] = (2, 3, 4)

    # 積極鍛錬の減少値
    PROACTIVE_SUB_EX_VALUES: tuple[int, ...] = (-1, -2)

    # 平衡鍛錬の加算値
    EQUILIBRIUM_ADD_EX_VALUES: tuple[int, ...] = (1, 2, 3)

    def __init__(self, min_ex_value: int | None = None, max_ex_value: int | None = None) -> None:
        """コンストラクタ
        最大値と最小値が引数に入力された時は、
        その連番を出現値リストに格納する。(頻度は1で初期化)
        そうでない時は、出現値リストと頻度リストを空で初期化する。

        Args:
            min_ex_value (int, optional): 最小値。 入力がない時は None
            max_ex_value (int, optional): 最大値。 入力がない時は None
        """
        self.ex_values = []
        self.frequencies = []
        self.expected_ex_value = None
        if (min_ex_value is not None) and (max_ex_value is not None):
            # 最大値と最小値が入力された時は、その連番を出現値リストに格納する。(頻度は1で初期化)
            for i in range(min_ex_value, max_ex_value+1):
                self.ex_values.append(i)
                self.frequencies.append(1)

    def get_ex_values(self) -> list[int]:
        """出現値のリストを取得

        Returns:
            list[int]: 出現値のリスト(内部リスト)
        """
        return self.ex_values

    def get_expected_ex_value(self) -> float | None:
        """期待値を取得

        Returns:
            float | None: 期待値(存在しないなら None)
        """
        return self.expected_ex_value

    def add_ex_values(self, add_ex_value: int) -> None:
        """各出現値に固定値を加算

        Args:
            add_ex_value (int): 加算する経験値
        """
        self.ex_values = [a_ex_value + add_ex_value for a_ex_value in self.ex_values]

    def mul_ex_values(self, mul_factor: float, is_floor: bool = True) -> None:
        """各出現値に固定値を乗算

        Args:
            mul_factor (float): 乗算する値、小数点一桁以内の値を入力すること
            is_floor (bool, optional): 結果を切り捨てるかどうかのフラグ(falseなら切り上げる)。 入力がない時は True

        Raises:
            ValueError: 倍率が有限でない、または小数点以下1桁を超える場合。
        """
        if not math.isfinite(mul_factor):
            raise ValueError(f"倍率は有限の数値で指定してください: {mul_factor}")

        # 小数点一桁の係数を10倍して四捨五入
        mul_factor_x10: int = round(mul_factor * 10)

        if mul_factor != mul_factor_x10 / 10:
            raise ValueError(f"倍率は小数点以下1桁までで指定してください: {mul_factor}")

        if is_floor:
            self.ex_values = [a_ex_value * mul_factor_x10 // 10 for a_ex_value in self.ex_values]
        else:
            self.ex_values = [-(-a_ex_value * mul_factor_x10 // 10) for a_ex_value in self.ex_values]

    def div_ex_values_with_ceil_and_floor(self, divisor: int) -> None:
        """各出現値に固定値を除算(切り捨てと切り上げが半々の確率で出現)

        Args:
            divisor (int): 除算する値
        """
        pairs = list(zip(self.ex_values, self.frequencies))
        self._set_merged_ex_values_and_frequencies(
            [(math.floor(v / divisor), f) for v, f in pairs]
            + [(math.ceil(v / divisor), f) for v, f in pairs]
        )

    def _add_ex_values_from_tuple(self, add_ex_values: tuple[int, ...]) -> None:
        """経験値を各出現値に加算

        Args:
            add_ex_values (tuple[int, ...]): 加算する値の組
        """
        self._set_merged_ex_values_and_frequencies(
            (v + add, f)
            for add in add_ex_values
            for v, f in zip(self.ex_values, self.frequencies)
        )

    def add_equilibrium_ex_values(self) -> None:
        """平衡鍛錬向けの経験値加算処理
        """
        self._set_merged_ex_values_and_frequencies(
            (v + add if v > 0 else v, f)
            for add in self.EQUILIBRIUM_ADD_EX_VALUES
            for v, f in zip(self.ex_values, self.frequencies)
        )

    def _set_merged_ex_values_and_frequencies(self, value_frequency_pairs: Iterable[tuple[int, int]]) -> None:
        """(出現値, 頻度) の組から、同じ出現値の頻度を合計して格納する

        Args:
            value_frequency_pairs (Iterable[tuple[int, int]]): 出現値と頻度の組
        """
        merged: dict[int, int] = {}
        for value, frequency in value_frequency_pairs:
            merged[value] = merged.get(value, 0) + frequency

        self.ex_values = list(merged.keys())
        self.frequencies = list(merged.values())

    def add_concentrate_ex_values(self) -> None:
        """集中が発生した時の経験値加算処理
        """
        self._add_ex_values_from_tuple(self.CONCENTRATE_ADD_EX_VALUES)

    def add_proactive_ex_values(self, is_exec: bool) -> None:
        """積極鍛錬向けの経験値加算処理

        Args:
            is_exec (bool): 実行条件に該当するかのフラグ
        """
        if is_exec:
            self._add_ex_values_from_tuple(self.PROACTIVE_ADD_EX_VALUES)

    def sub_proactive_ex_values(self, is_exec: bool) -> None:
        """積極鍛錬向けの経験値減少処理

        Args:
            is_exec (bool): 実行条件に該当するかのフラグ
        """
        if is_exec:
            self._add_ex_values_from_tuple(self.PROACTIVE_SUB_EX_VALUES)

    def div_cautious_ex_values(self, is_exec: bool) -> None:
        """慎重鍛錬向けの経験値除算処理

        Args:
            is_exec (bool): 実行条件に該当するかのフラグ
        """
        if is_exec:
            self.div_ex_values_with_ceil_and_floor(2)

    def add_precise_ex_values(self) -> None:
        """精密鍛錬向けの経験値加算処理
        """
        # 精密鍛錬の加算後の出現値をまとめるリスト
        added_ex_values: list[int] = []

        for a_ex_value in self.ex_values:
            if a_ex_value > 5:
                # 6以上(経験値が5を超えている)なら+2
                added_ex_values.append(a_ex_value + 2)
            elif a_ex_value > 0:
                # 1以上(経験値が0を超えている)なら+1
                added_ex_values.append(a_ex_value + 1)
            else:
                # それ以外(経験値が0以下)ならそのまま
                added_ex_values.append(a_ex_value)

        # 出現値のリストを更新
        self.ex_values = added_ex_values

    def calc_expected_ex_value(self) -> None:
        """期待値を算出
        頻度と出現値のリストから期待値を算出し、expected_ex_valueに格納する。
        """
        if len(self.frequencies) > 0:
            sum_frequencies: int = sum(self.frequencies)
            sum_ex_values_mul_frequencies: int = 0

            for i, a_ex_value in enumerate(self.ex_values):
                sum_ex_values_mul_frequencies += a_ex_value * self.frequencies[i]

            self.expected_ex_value = round(sum_ex_values_mul_frequencies / sum_frequencies, 2)
        else:
            self.expected_ex_value = None

    def copy(self) -> OnePattern:
        """出現値・頻度・期待値を複製した、新しい経験値パターンのインスタンスを返す

        Returns:
            OnePattern: 複製したインスタンス(リストは別オブジェクト)
        """
        new_pattern = OnePattern()
        new_pattern.ex_values = list(self.ex_values)
        new_pattern.frequencies = list(self.frequencies)
        new_pattern.expected_ex_value = self.expected_ex_value
        return new_pattern

    @classmethod
    def from_strings(cls, min_ex_value_str: str, max_ex_value_str: str) -> OnePattern:
        """経験値パターンの最大値と最小値を入力して、経験値パターンのインスタンスを返す
        最大値と最小値の値が存在する(文字列が1以上)かを判定する。
        少なくとも片方が存在しないなら、内部のリストが空のインスタンスを返す。
        もし、最大値よりも最小値の方が大きいなら、この段階で入れ替える。

        Args:
            min_ex_value_str (str): 最小値。
            max_ex_value_str (str): 最大値。

        Returns:
            OnePattern: 最大値と最小値を記録したインスタンス
        """
        # 数値が存在する(文字列の長さが1以上、つまり空文字ではない)ときは数値に変換、そうでないならNone
        min_ex_value: int | None = int(min_ex_value_str) if len(min_ex_value_str) > 0 else None
        max_ex_value: int | None = int(max_ex_value_str) if len(max_ex_value_str) > 0 else None

        # 最小値のほうが大きい場合は、最大値と入れ替える(数値の存在も確認したうえで)
        if (min_ex_value is not None) and (max_ex_value is not None) and (min_ex_value > max_ex_value):
            min_ex_value, max_ex_value = max_ex_value, min_ex_value

        # インスタンスを作って返す
        return cls(min_ex_value, max_ex_value)
