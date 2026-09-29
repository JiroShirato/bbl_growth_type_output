import math
from collections.abc import Iterable


class OnePattern:

    # 出現値(出現する経験値)
    values_list: list[int]

    # 頻度(期待値算出用)
    frequency_list: list[int]

    # 期待値
    expected_value: float | None

    # 集中発生時の加算値
    concentrate_add_values_list: tuple[int, ...] = (3, 4, 5)

    # 積極鍛錬の加算値
    proactive_add_values_list: tuple[int, ...] = (2, 3, 4)

    # 積極鍛錬の減少値
    proactive_sub_values_list: tuple[int, ...] = (-1, -2)

    # 平衡鍛錬の加算値
    equilibrium_add_values_list: tuple[int, ...] = (1, 2, 3)

    def __init__(self, min_val: int | None = None, max_val: int | None = None) -> None:
        """コンストラクタ
        最大値と最小値が引数に入力された時は、
        その連番を出現値リストに格納する。(頻度は1で初期化)
        そうでない時は、出現値リストと頻度リストを空で初期化する。

        Args:
            min_val (int, optional): 最小値。 入力がない時は None
            max_val (int, optional): 最大値。 入力がない時は None
        """
        self.values_list = []
        self.frequency_list = []
        self.expected_value = None
        if (min_val is not None) and (max_val is not None):
            # 最大値と最小値が入力された時は、その連番を出現値リストに格納する。(頻度は1で初期化)
            for i in range(min_val, max_val+1):
                self.values_list.append(i)
                self.frequency_list.append(1)

    def get_values_list(self) -> list[int]:
        """出現値のリストを取得

        Returns:
            list[int]: 出現値のリスト(内部リスト)
        """
        return self.values_list

    def get_expected_value(self) -> float | None:
        """期待値を取得

        Returns:
            float | None: 期待値(存在しないなら None)
        """
        return self.expected_value

    def add_ex_point(self, add_val: int) -> None:
        """各出現値に固定値を加算

        Args:
            add_val (int): 加算する経験値
        """
        self.values_list = [a_val + add_val for a_val in self.values_list]

    def mul_ex_point(self, mul_val: float, is_floor: bool = True) -> None:
        """各出現値に固定値を乗算

        Args:
            mul_val (float): 乗算する値、小数点一桁以内の値を入力すること
            is_floor (bool, optional): 結果を切り捨てるかどうかのフラグ(falseなら切り上げる)。 入力がない時は True

        Raises:
            ValueError: 倍率が有限でない、または小数点以下1桁を超える場合。
        """
        if not math.isfinite(mul_val):
            raise ValueError(f"倍率は有限の数値で指定してください: {mul_val}")

        # 小数点一桁の係数を10倍して四捨五入
        factor: int = round(mul_val * 10)

        if mul_val != factor / 10:
            raise ValueError(f"倍率は小数点以下1桁までで指定してください: {mul_val}")

        if is_floor:
            self.values_list = [a_val * factor // 10 for a_val in self.values_list]
        else:
            self.values_list = [-(-a_val * factor // 10) for a_val in self.values_list]

    def div_ex_point_with_ceil_and_floor(self, div_val: int) -> None:
        """各出現値に固定値を除算(切り捨てと切り上げが半々の確率で出現)

        Args:
            div_val (int): 除算する値
        """
        pairs = list(zip(self.values_list, self.frequency_list))
        self._set_merged_values(
            [(math.floor(v / div_val), f) for v, f in pairs]
            + [(math.ceil(v / div_val), f) for v, f in pairs]
        )

    def _add_ex_point_from_integer_list(self, add_vals: tuple[int, ...]) -> None:
        """経験値を各出現値に加算

        Args:
            add_vals (tuple[int, ...]): 加算する値の組
        """
        self._set_merged_values(
            (v + add, f)
            for add in add_vals
            for v, f in zip(self.values_list, self.frequency_list)
        )

    def add_equilibrium_ex_point(self) -> None:
        """平衡鍛錬向けの経験値加算処理
        """
        self._set_merged_values(
            (v + add if v > 0 else v, f)
            for add in self.equilibrium_add_values_list
            for v, f in zip(self.values_list, self.frequency_list)
        )

    def _set_merged_values(self, value_freq_pairs: Iterable[tuple[int, int]]) -> None:
        """(出現値, 頻度) の組から、同じ出現値の頻度を合計して格納する

        Args:
            value_freq_pairs (Iterable[tuple[int, int]]): 出現値と頻度の組
        """
        merged: dict[int, int] = {}
        for value, freq in value_freq_pairs:
            merged[value] = merged.get(value, 0) + freq

        self.values_list = list(merged.keys())
        self.frequency_list = list(merged.values())

    def add_concentrate_ex_point(self) -> None:
        """集中が発生した時の経験値加算処理
        """
        self._add_ex_point_from_integer_list(self.concentrate_add_values_list)

    def add_proactive_ex_point(self, is_exec: bool) -> None:
        """積極鍛錬向けの経験値加算処理

        Args:
            is_exec (bool): 実行条件に該当するかのフラグ
        """
        if is_exec:
            self._add_ex_point_from_integer_list(
                self.proactive_add_values_list)

    def sub_proactive_ex_point(self, is_exec: bool) -> None:
        """積極鍛錬向けの経験値減少処理

        Args:
            is_exec (bool): 実行条件に該当するかのフラグ
        """
        if is_exec:
            self._add_ex_point_from_integer_list(
                self.proactive_sub_values_list)

    def div_cautious_ex_point(self, is_exec: bool) -> None:
        """慎重鍛錬向けの経験値除算処理

        Args:
            is_exec (bool): 実行条件に該当するかのフラグ
        """
        if is_exec:
            self.div_ex_point_with_ceil_and_floor(2)

    def add_precise_ex_point(self) -> None:
        """精密鍛錬向けの経験値加算処理
        """
        # 精密鍛錬の加算後の出現値をまとめるリスト
        temp_values_list: list[int] = []

        for a_val in self.values_list:
            if a_val > 5:
                # 6以上(経験値が5を超えている)なら+2
                temp_values_list.append(a_val + 2)
            elif a_val > 0:
                # 1以上(経験値が0を超えている)なら+1
                temp_values_list.append(a_val + 1)
            else:
                # それ以外(経験値が0以下)ならそのまま
                temp_values_list.append(a_val)

        # 出現値のリストを更新
        self.values_list = temp_values_list

    def calc_expected_value(self) -> None:
        """期待値を算出
        頻度と出現値のリストから期待値を算出し、expected_valueに格納する。
        """
        if len(self.frequency_list) > 0:
            const_freqs: int = sum(self.frequency_list)
            const_vals_mul_freq: int = 0

            for i, a_val in enumerate(self.values_list):
                const_vals_mul_freq += a_val * self.frequency_list[i]

            self.expected_value = round(const_vals_mul_freq / const_freqs, 2)
        else:
            self.expected_value = None

    def copy(self) -> OnePattern:
        """出現値・頻度・期待値を複製した、新しい経験値パターンのインスタンスを返す

        Returns:
            OnePattern: 複製したインスタンス(リストは別オブジェクト)
        """
        new_pattern = OnePattern()
        new_pattern.values_list = list(self.values_list)
        new_pattern.frequency_list = list(self.frequency_list)
        new_pattern.expected_value = self.expected_value
        return new_pattern

    @classmethod
    def from_strings(cls, min_val_str: str, max_val_str: str) -> OnePattern:
        """経験値パターンの最大値と最小値を入力して、経験値パターンのインスタンスを返す
        最大値と最小値の値が存在する(文字列が1以上)かを判定する。
        少なくとも片方が存在しないなら、内部のリストが空のインスタンスを返す。
        もし、最大値よりも最小値の方が大きいなら、この段階で入れ替える。

        Args:
            min_val_str (str): 最小値。
            max_val_str (str): 最大値。

        Returns:
            OnePattern: 最大値と最小値を記録したインスタンス
        """
        # 数値が存在する(文字列の長さが1以上、つまり空文字ではない)ときは数値に変換、そうでないならNone
        min_val: int | None = int(min_val_str) if len(min_val_str) > 0 else None
        max_val: int | None = int(max_val_str) if len(max_val_str) > 0 else None

        # 最小値のほうが大きい場合は、最大値と入れ替える(数値の存在も確認したうえで)
        if (min_val is not None) and (max_val is not None) and (min_val > max_val):
            min_val, max_val = max_val, min_val

        # インスタンスを作って返す
        return cls(min_val, max_val)
