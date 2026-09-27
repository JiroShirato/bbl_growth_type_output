import math

class OnePattern:

    # 出現値
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
        最大値（max_val）と最小値（min_val）が入力された時は、
        その連番を出現値リストに格納する。（頻度は1で初期化）
        そうでない時は、出現値リストと頻度リストを空で初期化する。

        Args:
            min_val (int, optional): 最小値。 入力がない時は None
            max_val (int, optional): 最大値。 入力がない時は None
        """
        self.values_list = []
        self.frequency_list = []
        self.expected_value = None
        if (min_val is not None) and (max_val is not None):
            # 最大値と最小値が入力された時は、その連番を出現値リストに格納する。（頻度は1で初期化）
            for i in range(min_val, max_val+1):
                self.values_list.append(i)
                self.frequency_list.append(1)

    def get_all_lists(self) -> tuple[list[int], list[int]]: 
        """出現値と頻度のリストを取得

        Returns:
            tuple[list[int], list[int]]: 出現値と頻度のリストのペア（どちらも、内部リスト）
        """
        return self.values_list, self.frequency_list

    def get_values_list(self) -> list[int]:
        """出現値のリストを取得

        Returns:
            list[int]: 出現値のリスト（内部リスト）
        """
        return self.values_list

    def get_frequency_list(self) -> list[int]:
        """頻度のリストを取得

        Returns:
            list[int]: 頻度のリスト（内部リスト）
        """
        return self.frequency_list

    def get_expected_value(self) -> float | None:
        """期待値を取得

        Returns:
            float | None: 期待値（存在しないなら None）
        """
        return self.expected_value

    def set_all_lists(self, in_all_vals: tuple[list[int], list[int]]) -> None:
        """外部入力から、出現値と頻度の全ての値を格納

        Args:
            in_all_vals (tuple[list[int], list[int]]): 入力された出現値と頻度のリスト
        """
        self.values_list = list(in_all_vals[0])
        self.frequency_list = list(in_all_vals[1])

    def set_values_list(self, in_vals: list[int]) -> None:
        """出現値のリストを格納

        Args:
            in_vals (list[int]): 格納する出現値のリスト
        """
        self.values_list = list(in_vals)

    def set_frequency_list(self, in_freq: list[int]) -> None:
        """頻度のリストを格納

        Args:
            in_freq (list[int]): 格納する頻度のリスト
        """
        self.frequency_list = list(in_freq)

    def add_ex_point(self, in_val: int) -> None:
        """各出現値に固定値を加算

        Args:
            in_val (int): 加算する経験値
        """
        self.values_list = [a_val + in_val for a_val in self.values_list]

    def mul_ex_point(self, in_val: float, floor_flag: bool = True) -> None:
        """各出現値に固定値を乗算

        Args:
            in_val (float): 乗算する値、小数点一桁以内の値を入力すること
            floor_flag (bool, optional): 結果を切り捨てるかどうかのフラグ（falseなら切り上げる）。 入力がない時は True

        Raises:
            ValueError: 倍率が有限でない、または小数点以下1桁を超える場合。
        """
        if not math.isfinite(in_val):
            raise ValueError(f"倍率は有限の数値で指定してください: {in_val}")

        factor: int = round(in_val * 10)

        if in_val != factor / 10:
            raise ValueError(f"倍率は小数点以下1桁までで指定してください: {in_val}")

        if floor_flag:
            self.values_list = [a_val * factor // 10 for a_val in self.values_list]
        else:
            self.values_list = [-(-a_val * factor // 10) for a_val in self.values_list]

    def div_ex_point_with_ceil_and_floor(self, in_val: int) -> None:
        """各出現値に固定値を除算（切り捨てと切り上げが半々の確率で出現）

        Args:
            in_val (int): 除算する値
        """
        # 切り捨てと切り上げの値を作成
        floored_values_list: list[int] = [math.floor(a_val / in_val) for a_val in self.values_list]
        ceiled_values_list: list[int] = [math.ceil(a_val / in_val) for a_val in self.values_list]

        # 切り捨てと切り上げの値を結合
        concat_values_list: list[int] = floored_values_list + ceiled_values_list

        # 切り捨てと切り上げの頻度を結合
        concat_freq_list: list[int] = self.frequency_list + self.frequency_list

        # 重複する出現値と頻度をまとめるリスト
        temp_values_list: list[int] = []
        temp_freq_list: list[int] = []

        for i in range(0, len(concat_values_list)):
            # 重複する出現値があるかどうかを確認
            temp_value = concat_values_list[i]
            if temp_value in temp_values_list:
                # 重複する出現値があれば、頻度を加算する
                temp_point = temp_values_list.index(temp_value)
                temp_freq_list[temp_point] += concat_freq_list[i]
            else:
                # 重複する出現値がなければ、出現値と頻度を追加する
                temp_values_list.append(temp_value)
                temp_freq_list.append(concat_freq_list[i])

        # 出現値と頻度のリストを更新
        self.values_list = temp_values_list
        self.frequency_list = temp_freq_list

    def _add_ex_point_from_integer_list(self, add_vals: tuple[int, ...]) -> None:
        """経験値を各出現値に加算

        Args:
            add_vals (tuple[int, ...]): 加算する値のリスト
        """
        # 重複する出現値と頻度をまとめるリスト
        temp_values_list: list[int] = []
        temp_freq_list: list[int] = []

        for a_add_val in add_vals:
            for i in range(0, len(self.values_list)):
                # 重複する出現値があるかどうかを確認
                a_added_value = self.values_list[i] + a_add_val
                if a_added_value in temp_values_list:
                    # 重複する出現値があれば、頻度を加算する
                    temp_point = temp_values_list.index(a_added_value)
                    temp_freq_list[temp_point] += self.frequency_list[i]
                else:
                    # 重複する出現値がなければ、出現値と頻度を追加する
                    temp_values_list.append(a_added_value)
                    temp_freq_list.append(self.frequency_list[i])

        # 出現値と頻度のリストを更新
        self.values_list = temp_values_list
        self.frequency_list = temp_freq_list
        
    def add_concentrate_ex_point(self) -> None:
        """集中が発生した時の経験値加算処理
        """
        self._add_ex_point_from_integer_list(self.concentrate_add_values_list)


    def add_proactive_ex_point(self, exec_flag: bool) -> None:
        """積極鍛錬向けの経験値加算処理

        Args:
            exec_flag (bool): 実行条件に該当するかのフラグ
        """
        if exec_flag:
            self._add_ex_point_from_integer_list(self.proactive_add_values_list)

    def sub_proactive_ex_point(self, exec_flag: bool) -> None:
        """積極鍛錬向けの経験値減少処理

        Args:
            exec_flag (bool): 実行条件に該当するかのフラグ
        """
        if exec_flag:
            self._add_ex_point_from_integer_list(self.proactive_sub_values_list)

    def div_cautious_ex_point(self, exec_flag: bool) -> None:
        """慎重鍛錬向けの経験値除算処理

        Args:
            exec_flag (bool): 実行条件に該当するかのフラグ
        """
        if exec_flag:
            self.div_ex_point_with_ceil_and_floor(2)

    def add_precise_ex_point(self) -> None:
        """精密鍛錬向けの経験値加算処理
        """
        # 精密鍛錬の加算後の出現値をまとめるリスト
        temp_values_list: list[int] = []

        for a_val in self.values_list:
            if a_val > 5:
                # 6以上（経験値が5を超えている）なら+2
                temp_values_list.append(a_val + 2)
            elif a_val > 0:
                # 1以上（経験値が0を超えている）なら+1
                temp_values_list.append(a_val + 1)
            else:
                # それ以外（経験値が0以下）ならそのまま
                temp_values_list.append(a_val)

        # 出現値のリストを更新
        self.values_list = temp_values_list

    def add_equilibrium_ex_point(self) -> None:
        """平衡鍛錬向けの経験値加算処理
        """
        
        # 重複する出現値と頻度をまとめるリスト
        temp_values_list: list[int] = []
        temp_freq_list: list[int] = []

        for a_add_val in self.equilibrium_add_values_list:
            for i in range(0, len(self.values_list)):
                # 重複する出現値があるかどうかを確認
                a_in_value = self.values_list[i]
                if a_in_value > 0:
                    a_added_value = a_in_value + a_add_val 
                else:
                    a_added_value = a_in_value
                if a_added_value in temp_values_list:
                    # 重複する出現値があれば、頻度を加算する
                    temp_point = temp_values_list.index(a_added_value)
                    temp_freq_list[temp_point] += self.frequency_list[i]
                else:
                    # 重複する出現値がなければ、出現値と頻度を追加する
                    temp_values_list.append(a_added_value)
                    temp_freq_list.append(self.frequency_list[i])

        # 出現値と頻度のリストを更新
        self.values_list = temp_values_list
        self.frequency_list = temp_freq_list

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