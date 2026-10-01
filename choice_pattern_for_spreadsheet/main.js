// @ts-check

// 再計算のきっかけにする入力欄(「フォーム」シートのC列)
const input_sheet_name = "フォーム";
const input_column = 3; // C列
const input_row_ranges = [[7, 10], [13, 19]]; // C7:C10(基本情報)、C13:C19(補正情報)

/**
 * 経験値パターン
 * @typedef {Object} ExPattern
 * @property {string} name パターン名
 * @property {number[]} values 出現値
 * @property {number[]} frequencies 頻度
 * @property {number} [expected_ex_value] 期待値
 * @property {string[]} [probabilities] 確率(百分率の文字列)
 */

/**
 * 入力欄を編集した時に、再計算する
 * @param {GoogleAppsScript.Events.SheetsOnEdit} [e] 編集イベント(エディタから直接実行した場合はなし)
 */
function onEdit(e){
  // エディタから直接実行した場合(e がない場合)は、そのまま再計算する
  if(e && !is_input_cell_edited(e.range)){
    return;
  }
  add_all_corrections();
}

/**
 * 編集された範囲が、入力欄と重なっているかを判定する
 * @param {GoogleAppsScript.Spreadsheet.Range} edited_range 編集された範囲
 * @returns {boolean}
 */
function is_input_cell_edited(edited_range){
  if(edited_range.getSheet().getName() !== input_sheet_name){
    return false;
  }

  // 編集された範囲がC列を含まない場合は対象外
  if(edited_range.getColumn() > input_column || edited_range.getLastColumn() < input_column){
    return false;
  }

  // 編集された行の範囲が、入力欄の行の範囲のどれかと重なっていれば対象
  const first_row = edited_range.getRow();
  const last_row = edited_range.getLastRow();
  return input_row_ranges.some(([top_row, bottom_row]) => first_row <= bottom_row && last_row >= top_row);
}

function add_all_corrections(){

  // ex1. 固定値の設定
  
  // 小APの追加の値
  const mini_ap_add_ex_value = 2;

  // APの各倍率
  const other_ap_mul_factor = 1.5;
  const power_ap_mul_factor = 1.4;
  const meet_ap_mul_factor = 1.3;

  // YURの追加の値
  const yur_add_ex_value = 4;

  // メンタリスト嫁の能力の倍率
  const mentalist_wife_mul_factor = 2;

  // 集中発生時の出現値
  const concentrate_add_ex_values = [3, 4, 5];

  // 積極鍛錬時の追加経験値
  const proactive_add_ex_values = [2, 3, 4];

  // 積極鍛錬時の削減経験値
  const proactive_sub_ex_values = [-1, -2];

  // 平衡鍛錬時の追加経験値
  const equilibrium_add_ex_values = [1, 2, 3];

  // 筋肉養成ギプスの倍率
  const gips_mul_factor = 1.2;

  // 出力欄の位置と大きさ(E列が種類、G～U列が出現値と確率、V列が期待値。2行で1組)
  const output_first_row = 7;
  const output_row_count = 50; // 7～56行目
  const value_col_count = 15; // G～U列
  
  // ex2. 関数の指定

  /**
   * パターン名と出現値、出現頻度を出力する関数
   * @param {string} pattern_name パターン名
   * @param {number[]} ex_values 出現する経験値(出現値)
   * @returns {ExPattern}
   */
  function create_ex_pattern(pattern_name, ex_values){
    return {
      "name": pattern_name, // パターン名
      "values": ex_values, // 出現結果
      "frequencies": ex_values.map(() => 1), // 出現頻度(全て、1を入力)
    };
  }

  /**
   * パターン名にAPが含まれるか(先頭の "ap_" と、途中の "_ap_" の両方を判定。小APの "map_" は含めない)
   * @param {string} pattern_name パターン名
   * @returns {boolean}
   */
  function has_ap(pattern_name){
    return pattern_name.startsWith("ap_") || pattern_name.includes("_ap_");
  }

  /**
   * 経験値加算処理(加算から各配列に追加)
   * @param {number[]} ex_values 出現値
   * @param {number[]} frequencies 頻度
   * @param {number[]} ex_values_to_add 加算する値
   * @returns {[number[], number[]]} 出現値と頻度
   */
  function add_ex_values(ex_values, frequencies, ex_values_to_add){
    // 計算結果の格納
    /** @type {number[]} */
    let calculated_ex_values = [];
    /** @type {number[]} */
    let calculated_frequencies = [];

    // 基本経験値＋加算値の結果の格納
    for(const a_add_ex_value of ex_values_to_add){
      for(const a_ex_value_index of ex_values.keys()){
        const a_calculated_ex_value = a_add_ex_value + ex_values[a_ex_value_index];
        const found_index = calculated_ex_values.indexOf(a_calculated_ex_value);
        if(found_index === -1){
          calculated_ex_values.push(a_calculated_ex_value);
          calculated_frequencies.push(frequencies[a_ex_value_index]);
        } else {
          calculated_frequencies[found_index] = calculated_frequencies[found_index] + frequencies[a_ex_value_index]; 
        }
      }
    }

    return [calculated_ex_values, calculated_frequencies];
  }

  /**
   * 経験値半減処理（切り捨てと切り上げが半々の確率で出現）
   * @param {number[]} ex_values 出現値
   * @param {number[]} frequencies 頻度
   * @returns {[number[], number[]]} 出現値と頻度
   */
  function div_half_ex_values(ex_values, frequencies){
    // 半減（切り捨て）
    const floored_ex_values = ex_values.map(ex_value => Math.floor(ex_value / 2));
    // 半減（切り上げ）
    const ceiled_ex_values = ex_values.map(ex_value => Math.ceil(ex_value / 2));
    // 半減した値を結合（重複許す）
    const concat_ex_values = [...floored_ex_values, ...ceiled_ex_values];
    // 半減した頻度を結合（重複許す）
    const concat_frequencies = [...frequencies, ...frequencies];

    // 出現値と頻度を格納する
    /** @type {number[]} */
    let calculated_ex_values = [];
    /** @type {number[]} */
    let calculated_frequencies = [];

    for(const a_concat_index of concat_ex_values.keys()){
      const a_concat_ex_value = concat_ex_values[a_concat_index];
      const found_index = calculated_ex_values.indexOf(a_concat_ex_value);
      if(found_index === -1){
        calculated_ex_values.push(a_concat_ex_value);
        calculated_frequencies.push(concat_frequencies[a_concat_index]);
      } else {
        calculated_frequencies[found_index] = calculated_frequencies[found_index] + concat_frequencies[a_concat_index]; 
      }
    }
    return [calculated_ex_values, calculated_frequencies];
  }

  /**
   * 集中実行時による経験値の加算
   * @param {number[]} ex_values 出現値
   * @param {number[]} frequencies 頻度
   * @returns {[number[], number[]]} 出現値と頻度
   */
  function add_concentrate_ex_values(ex_values, frequencies){
    return add_ex_values(ex_values, frequencies, concentrate_add_ex_values);
  }

  /**
   * 精密鍛錬（加算）
   * @param {number[]} ex_values 出現値
   * @returns {number[]} 加算後の出現値
   */
  function add_precise_train_ex_values(ex_values){
    /** @type {number[]} */
    let calculated_ex_values = [];

    for(const a_ex_value of ex_values){
      if(a_ex_value > 5){
        // 6以上（経験値が5を超えている）なら+2
        calculated_ex_values.push(a_ex_value + 2);
      } else if(a_ex_value > 0){
        // 1以上（経験値が0を超えている）なら+1
        calculated_ex_values.push(a_ex_value + 1);
      } else {
        // それ以外（経験値が0）ならそのまま
        calculated_ex_values.push(a_ex_value);
      }
    }

    return calculated_ex_values;
  }

  /**
   * 積極鍛錬（加算）
   * @param {number[]} ex_values 出現値
   * @param {number[]} frequencies 頻度
   * @param {boolean} is_large_train_minus 大練習でのマイナスがあるか
   * @returns {[number[], number[]]} 出現値と頻度
   */
  function add_proactive_train_ex_values(ex_values, frequencies, is_large_train_minus){
    if(is_large_train_minus){
      // 大練習でのマイナスがある時（引数からフラグ取得）
      return add_ex_values(ex_values, frequencies, proactive_add_ex_values);
    } else {
      return [ex_values, frequencies];
    }
  }


  /**
   * 積極鍛錬（減算）
   * @param {number[]} ex_values 出現値
   * @param {number[]} frequencies 頻度
   * @param {boolean} is_large_train_minus 大練習でのマイナスがあるか
   * @returns {[number[], number[]]} 出現値と頻度
   */
  function sub_proactive_train_ex_values(ex_values, frequencies, is_large_train_minus){
    if(is_large_train_minus){
      // 大練習でのマイナスがある時
      return add_ex_values(ex_values, frequencies, proactive_sub_ex_values);
    } else {
      return [ex_values, frequencies];
    }
  }

  /**
   * 慎重鍛錬（減算）
   * @param {number[]} ex_values 出現値
   * @param {number[]} frequencies 頻度
   * @param {boolean} is_large_train_minus 大練習でのマイナスがあるか
   * @returns {[number[], number[]]} 出現値と頻度
   */
  function div_cautious_train_ex_values(ex_values, frequencies, is_large_train_minus){
    if(is_large_train_minus){
      // 大練習でのマイナスがある時
      // 処理自体はイマイチやる気が出ない…の半減と同じなので、関数呼び出し
      return div_half_ex_values(ex_values, frequencies);
    } else {
      return [ex_values, frequencies];
    }
  }

  /**
   * 平衡鍛錬（加算）
   * @param {number[]} ex_values 出現値
   * @param {number[]} frequencies 頻度
   * @returns {[number[], number[]]} 出現値と頻度
   */
  function add_equilibrium_train_ex_values(ex_values, frequencies){
    if(Math.max(...ex_values) > 0){
      // 計算結果の格納
      /** @type {number[]} */
      let calculated_ex_values = [];
      /** @type {number[]} */
      let calculated_frequencies = [];

      // 基本経験値＋加算値の結果の格納
      for(const a_add_ex_value of equilibrium_add_ex_values){
        for(const a_ex_value_index of ex_values.keys()){
          const a_in_ex_value =  ex_values[a_ex_value_index];
          // 出現値が1以上の時は平衡鍛錬の値を加算
          const a_calculated_ex_value = (a_in_ex_value > 0) ? a_add_ex_value + a_in_ex_value : a_in_ex_value;
          const found_index = calculated_ex_values.indexOf(a_calculated_ex_value);
          if(found_index === -1){
            calculated_ex_values.push(a_calculated_ex_value);
            calculated_frequencies.push(frequencies[a_ex_value_index]);
          } else {
            calculated_frequencies[found_index] = calculated_frequencies[found_index] + frequencies[a_ex_value_index]; 
          }
        }
      }
      return [calculated_ex_values, calculated_frequencies];
    } else {
      return [ex_values, frequencies];
    }
  }

  // 0. フォームの値の取得、及び各変数の設定
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(input_sheet_name);
  if(!sheet){
    throw new Error(`「${input_sheet_name}」シートが見つかりません`);
  }

  // 出現値のパターンを格納する変数の作成
  /** @type {ExPattern[]} */
  let all_patterns = [];

  // 非AP小練習の値の取得
  const small_train_ex_from_sheet = sheet.getRange('G2:J2').getValues();
  const small_train_ex_values = small_train_ex_from_sheet[0].filter(function(x){return typeof x === 'number';});
  all_patterns.push(create_ex_pattern("small_train_ex", small_train_ex_values));

  // 非AP大練習の値の取得
  const large_train_ex_from_sheet = sheet.getRange('G3:J3').getValues();
  const large_train_ex_values = large_train_ex_from_sheet[0].filter(function(x){return typeof x === 'number';});
  all_patterns.push(create_ex_pattern("large_train_ex", large_train_ex_values));

  // 大練習のマイナス値の取得
  const large_minus_ex_from_sheet = sheet.getRange('G4:J4').getValues();
  const large_minus_ex_values = large_minus_ex_from_sheet[0].filter(function(x){return typeof x === 'number';});
  all_patterns.push(create_ex_pattern("large_minus_ex", large_minus_ex_values));

  // 小APのフラグの取得
  const which_mini_ap = sheet.getRange('C13').getValue();

  // APの種類の取得
  const which_main_ap = sheet.getRange('C14').getValue();

  // YURによる助っ人の有無の取得
  const yur_option = sheet.getRange('C15').getValue();

  // メンタ嫁の結婚の有無の取得
  const mental_wife_option = sheet.getRange('C16').getValue();

  // 集中・イマイチの発生の有無
  const which_concentrate = sheet.getRange('C17').getValue();

  // 鍛錬の種類取得
  const which_train_ability = sheet.getRange('C18').getValue();

  // 筋肉養成ギプスの使用の有無
  const gips_option = sheet.getRange('C19').getValue();

  // 自主トレ参加時の経験値（pit は participate_independent_training の略）
  const min_pit_ex_value = Math.min(...small_train_ex_values) * 3;
  const max_pit_ex_value = Math.max(...small_train_ex_values) * 3;
  const participate_independent_training_ex_values = Array.from({ length: (max_pit_ex_value - min_pit_ex_value + 1) }, (_, i) => i + min_pit_ex_value);
  all_patterns.push(create_ex_pattern("participate_independent_training_ex", participate_independent_training_ex_values));

  // 大練習で下がるか、のフラグ
  let is_large_train_minus = false;

  // 新球大練習の設定を新たに作ったか、のフラグ
  let is_created_new_ball = false;

  // 新しいパターンの一時格納用（必要に応じて、各処理の最後にall_patternsへ追加）
  /** @type {ExPattern[]} */
  let add_patterns = [];

  // APの初期の倍率（初期値は、ミートとパワー以外の1.5）
  let ap_mul_factor = other_ap_mul_factor;

  // APと小APが同じになったかのフラグ
  let is_mini_ap_same_as_ap = false;

  // 1. 小APによる経験値追加処理
  
  if(which_mini_ap !== "なし"){
    
    if(which_mini_ap === "あり（APと同じ）"){
      // APと小APが同じになったフラグをON
      is_mini_ap_same_as_ap = true;
    }

    // 積極鍛錬と精密鍛錬は、小練習と新球大練習は別に補正がかかるので分離する必要あり
    if(which_train_ability === "積極鍛錬" || which_train_ability === "精密鍛錬"){
      for(const one_pattern of all_patterns){
        if(one_pattern["name"].includes("small_train_ex")){
          let add_one_pattern_name = one_pattern["name"].replace('small', 'new_ball_large');
          // 直接パターンを入れる（次の小AP追加の処理の対象にするため）
          all_patterns.push(create_ex_pattern(add_one_pattern_name, one_pattern["values"]));
          break; // 1回きり！
        }
      }

      // 新球大練習を作ったフラグをON
      is_created_new_ball = true;
    }

    for(const one_pattern of all_patterns){
      // 小練習か大練習が対象
      if(one_pattern["name"].includes("_train_ex")){
        if(one_pattern["name"].includes("large_train") && which_main_ap === "変化" && is_mini_ap_same_as_ap){
          // 変化APで小APも変化の場合、変化の大練習は存在しないので除外
          continue;
        } else {
          const add_one_pattern_name = "map_" + one_pattern["name"];
          const added_ex_values = one_pattern["values"].map(ex_value => ex_value + mini_ap_add_ex_value);
          add_patterns.push(create_ex_pattern(add_one_pattern_name, added_ex_values));
        }
      }
    }

    // パターンの記録
    for(const one_pattern of add_patterns){
      all_patterns.push(one_pattern);
    }

  }

  // 2. APによる経験値倍増処理(倍率設定から、計算)
  if(which_main_ap === "ミート"){
    ap_mul_factor = meet_ap_mul_factor;
  } else if(which_main_ap === "パワー"){
    ap_mul_factor = power_ap_mul_factor;
  }

  add_patterns = [];

  for(let one_pattern of all_patterns){
    // 小練習か大練習が対象
    if(one_pattern["name"].includes("_train_ex")){
      if(one_pattern["name"].includes("new_ball_large_train_ex") && !one_pattern["name"].startsWith("map_")){
        // 新球大練習は除外(小AP新球大練習はそのまま続ける)
        continue;
      }
      if(is_mini_ap_same_as_ap && one_pattern["name"].includes("map_")){
        // APと小APが同じになった時、小APのパターンをAP＋小APのパターンに変更する
        one_pattern["name"] ="ap_" + one_pattern["name"];
        one_pattern["values"] = one_pattern["values"].map(ex_value => Math.floor(ex_value * Math.round(ap_mul_factor * 10) / 10));
      } else if(!one_pattern["name"].includes("large_train") || which_main_ap !== "変化"){
        // それ以外は追加
        const add_one_pattern_name = "ap_" + one_pattern["name"];
        const multiplied_ex_values = one_pattern["values"].map(ex_value => Math.floor(ex_value * Math.round(ap_mul_factor * 10) / 10));
        if(which_mini_ap ==="あり（APとは別）" && one_pattern["name"].includes("map_")){
          continue;
        } else if(which_mini_ap === "あり（APと同じ）" && !one_pattern["name"].includes("map_")){
          continue;
        }
        add_patterns.push(create_ex_pattern(add_one_pattern_name, multiplied_ex_values));
      }
    }
  }
  for(const one_pattern of add_patterns){
    all_patterns.push(one_pattern);
  }

  // 3. YURによる経験値追加処理
  if(yur_option === "あり"){
    for(let one_pattern of all_patterns){
      // 小練習か大練習が対象
      if(one_pattern["name"].includes("_train_ex")){
        one_pattern["values"] = one_pattern["values"].map(ex_value => ex_value + yur_add_ex_value);
      }
    }
  }

  // 4. メンタリスト能力持ちの嫁追加処理
  if(mental_wife_option === "あり"){
    add_patterns = [];
    for(let one_pattern of all_patterns){
      // 新たに追加するか
      let is_added_new_pattern = false;
      // 既存のパターンを上書きするか
      let is_overwriting_current_pattern = false;
      // 大練習と小練習が対象
      if(one_pattern["name"].includes("_train_ex")){
        if(which_main_ap === "精神" && has_ap(one_pattern["name"])){
          // APが精神なら、APを対象とする(上書き処理)
          is_overwriting_current_pattern = true;
        } else if(which_main_ap !== "精神" && !has_ap(one_pattern["name"])){
          // APが精神以外なら、APを対象としない(追加処理)
          is_added_new_pattern = true;
        }
        if(is_added_new_pattern){
          // 更新対象の項目なら
          let add_one_pattern_name = "mental_" + one_pattern["name"];
          const multiplied_ex_values = one_pattern["values"].map(ex_value => ex_value * mentalist_wife_mul_factor);
          add_patterns.push(create_ex_pattern(add_one_pattern_name, multiplied_ex_values));
        } else if(is_overwriting_current_pattern){
          // 既存のAPの記録を上書きする形で、メンタ嫁APに置き換える
          one_pattern["name"] ="mental_" + one_pattern["name"];
          one_pattern["values"] = one_pattern["values"].map(ex_value => ex_value * mentalist_wife_mul_factor);
        }
      }
    }
    for(const one_pattern of add_patterns){
      all_patterns.push(one_pattern);
    }

  }

  // 5.集中、及びイマイチやる気が出ない…による経験値加減処理
  if(which_concentrate === "集中"){

    for(let one_pattern of all_patterns){
      // 小練習か大練習が対象
      if(one_pattern["name"].includes("_train_ex")){
        const added_ex_values_and_frequencies = add_concentrate_ex_values(one_pattern["values"], one_pattern["frequencies"]);
        one_pattern["values"] = added_ex_values_and_frequencies[0];
        one_pattern["frequencies"] = added_ex_values_and_frequencies[1];
      }
    }
    
  } else if(which_concentrate === "イマイチ"){

    for(let one_pattern of all_patterns){
      // 小練習か大練習が対象
      if(one_pattern["name"].includes("_train_ex")){
        const divided_ex_values_and_frequencies = div_half_ex_values(one_pattern["values"], one_pattern["frequencies"]);
        one_pattern["values"] = divided_ex_values_and_frequencies[0];
        one_pattern["frequencies"] = divided_ex_values_and_frequencies[1];
      }
    }
  
  }

  // 6. 各鍛錬による補正の結果

  // 大練習で下がるか
  const max_large_minus_ex_value = Math.max(...large_minus_ex_values);
  if(max_large_minus_ex_value  < 0){
    is_large_train_minus = true;
  }

  // 各鍛錬の補正の結果

  if(which_train_ability === "積極鍛錬"){

    // 積極大練習時の経験値（新球、非AP、AP、マイナス）

    // APが積極鍛錬の対象かの確認（変化、スタミナ、精神は積極鍛錬は乗らない）
    let is_proactive_ap = true;
    switch(which_main_ap){
      case '変化':
      case 'スタミナ':
      case '精神':
        is_proactive_ap = false;
        break;
    }

    add_patterns = [];

    for(let one_pattern of all_patterns){
      let is_proactive_exec = false;
      /** @type {number[][]} */
      let fixed_ex_values_and_frequencies = [];
      if(one_pattern["name"] !== "participate_independent_training_ex"){
        // 新球大練習（念のため、AP除外）の時の対応（小練習の値をもとに作成）
        if(one_pattern["name"].includes("small_train")){
          // 新球大練習がまだ未作成の場合（念のため、AP除外）
          if(!is_created_new_ball && !has_ap(one_pattern["name"])){
            // メンタ嫁除外
            if(!one_pattern["name"].includes("mental_")){
              // 加算値の計算
              fixed_ex_values_and_frequencies = add_proactive_train_ex_values(one_pattern["values"], one_pattern["frequencies"], is_large_train_minus);
              is_proactive_exec = true;
            }
          }
        } else if(one_pattern["name"].includes("large_train")){
          // APが積極鍛錬の対象、または非APなら加算値の計算を行う
          if(is_proactive_ap || !has_ap(one_pattern["name"])){
            // メンタ嫁除外
            if(!one_pattern["name"].includes("mental_")){
              // 加算値の計算
              fixed_ex_values_and_frequencies = add_proactive_train_ex_values(one_pattern["values"], one_pattern["frequencies"], is_large_train_minus);
              is_proactive_exec = true;
            }
          }
        } else if(one_pattern["name"].includes("large_minus")){
          // 減少値の計算
          fixed_ex_values_and_frequencies = sub_proactive_train_ex_values(one_pattern["values"], one_pattern["frequencies"], is_large_train_minus);
          is_proactive_exec = true;
        }
        if(is_proactive_exec){
          let add_one_pattern_name = "proactive_" + one_pattern["name"];
          if(one_pattern["name"].includes("small_train")){
            // 新球大練習なら名前を変更
            add_one_pattern_name = add_one_pattern_name.replace('small', 'new_ball_large');
          }
          if((is_proactive_ap && has_ap(one_pattern["name"])) || one_pattern["name"].includes("new_ball_large_train_ex")){
            // もしAPが積極鍛錬の対象、または新球大練習の場合は唯一なので、値を置き換える
            one_pattern["name"] = add_one_pattern_name;
            one_pattern["values"] = fixed_ex_values_and_frequencies[0];
            one_pattern["frequencies"] = fixed_ex_values_and_frequencies[1];
          } else {
            // それ以外は値を追加
            let new_pattern = { 
              "name": add_one_pattern_name, 
              "values": fixed_ex_values_and_frequencies[0], 
              "frequencies": fixed_ex_values_and_frequencies[1]
            };
            add_patterns.push(new_pattern);
            if(one_pattern["name"].includes("small_train")){
              // 新球大練習の追加の場合、小練習の項目の名前を変えるフラグを建てる
              is_created_new_ball = true;
            }
          }
        }
      }
    } 
    for(const one_pattern of add_patterns){
      all_patterns.push(one_pattern);
    }

  } else if(which_train_ability === "慎重鍛錬"){  
    // 慎重大練習時のマイナス経験値

    for(let one_pattern of all_patterns){
      let divided_ex_values_and_frequencies = [];
      if(one_pattern["name"].includes("large_minus")){
        // 減少値の計算
        divided_ex_values_and_frequencies = div_cautious_train_ex_values(one_pattern["values"], one_pattern["frequencies"], is_large_train_minus);
        // 既存の減少の記録を上書きする形で、置き換え
        one_pattern["name"] ="cautious_" + one_pattern["name"];
        one_pattern["values"] = divided_ex_values_and_frequencies[0];
        one_pattern["frequencies"] = divided_ex_values_and_frequencies[1];
      }   
    }

  } else if(which_train_ability === "精密鍛錬"){

    add_patterns = [];

    for(let one_pattern of all_patterns){
      if(one_pattern["name"].includes("small_train")){
        // 以下、新球大練習用の退避処理（退避処理がまだなら、ここで対応）、念のためAPは除外
        if(!is_created_new_ball && !has_ap(one_pattern["name"])){
          // 以下、新球大練習用の退避処理
          const add_one_pattern_name = one_pattern["name"].replace('small', 'new_ball_large');
          add_patterns.push({
            "name": add_one_pattern_name, 
            "values": [...one_pattern["values"]], 
            "frequencies": [...one_pattern["frequencies"]]
          });

          // 新球大練習作成フラグをON
          is_created_new_ball = true;
        }

        // 退避の後、精密鍛錬を適用
        one_pattern["values"] = add_precise_train_ex_values(one_pattern["values"]);
      }
    }

    for(const one_pattern of add_patterns){
      all_patterns.push(one_pattern);
    }

  } else if(which_train_ability === "平衡鍛錬"){

    add_patterns = [];

    // 全パターンを平衡鍛錬に適用
    for(const one_pattern of all_patterns){
      let added_ex_values_and_frequencies = [];
      // 小練習か大練習が対象
      if(one_pattern["name"].includes("_train_ex")){
        added_ex_values_and_frequencies = add_equilibrium_train_ex_values(one_pattern["values"], one_pattern["frequencies"]);
        const add_one_pattern_name = "equilibrium_" + one_pattern["name"];
        add_patterns.push({ 
          "name": add_one_pattern_name, 
          "values": added_ex_values_and_frequencies[0], 
          "frequencies": added_ex_values_and_frequencies[1]
        });
      }
    }
    for(const one_pattern of add_patterns){
      all_patterns.push(one_pattern);
    }
  }

  // 7. 筋肉養成ギプスの適用
  if(gips_option === "あり"){
    for(let one_pattern of all_patterns){
      // 小練習か大練習が対象
      if(one_pattern["name"].includes("_train_ex")){
        one_pattern["values"] = one_pattern["values"].map(ex_value => Math.ceil(ex_value * Math.round(gips_mul_factor * 10) / 10));
      }
    }
  }

  // 8. 確率、期待値算出、ソート
  for(let one_pattern of all_patterns){
    let ex_value_probability_pairs = []; // 出現値と確率を格納する配列
    let probabilities = []; // 確率を格納するリスト
    let sum_ex_values_mul_frequencies = 0; // 出現値と頻度をかけた数をまとめる変数
    let sum_frequencies = 0; // 頻度をカウントする変数

    // 出現値と頻度を別配列に格納、そして出現値と頻度の積の総和と頻度の総和も記録
    for(const a_index of one_pattern["values"].keys()){
      ex_value_probability_pairs.push([one_pattern["values"][a_index], one_pattern["frequencies"][a_index]]);
      sum_ex_values_mul_frequencies = sum_ex_values_mul_frequencies + one_pattern["values"][a_index] * one_pattern["frequencies"][a_index];
      sum_frequencies = sum_frequencies + one_pattern["frequencies"][a_index];
    }

    // 出現頻度を確率に変換（頻度を頻度の総和で割る）
    for(const a_index of ex_value_probability_pairs.keys()){
      ex_value_probability_pairs[a_index][1] = ex_value_probability_pairs[a_index][1] / sum_frequencies;
    }
    
    // 期待値の格納(出現値と頻度の積を総和と頻度の総和で割り、小数点2桁に丸める)
    one_pattern["expected_ex_value"] = Math.round(sum_ex_values_mul_frequencies / sum_frequencies * 100) / 100;

    // 出現値のソート（ここで頻度と並びがずれるので、出現値と総和を事前に退避する必要がある）
    if(one_pattern["name"].includes("large_minus")){
      // 大練習の減少のみ、降順
      one_pattern["values"] = one_pattern["values"].sort((a,b) => (a > b ? -1 : 1));
    } else {
      // 昇順
      one_pattern["values"] = one_pattern["values"].sort((a,b) => (a < b ? -1 : 1));
    }

    // 確率を出現値のソートに合わせて配列に格納
    for(const a_ex_value of one_pattern["values"]){
      for(const a_pair of ex_value_probability_pairs){
        if(a_ex_value === a_pair[0]){
          const a_probability = Math.round(a_pair[1] * 10000) / 100; // 百分率表記に変更、小数点2桁に丸める
          const str_probability = String(a_probability) + "%"; // 百分率の数値を文字列にして % を末尾に追加
          probabilities.push(str_probability);
          break;
        }
      }
    }
    
    // 確率の格納
    one_pattern["probabilities"] = probabilities;

  }
  
  // 9.スプレッドシートへの出力

  // パターンの種類の名前一覧
  const output_names = [
   ["small_train_ex", "小練習、新球大練習"],
   ["new_ball_large_train_ex", "新球大練習"],
   ["ap_small_train_ex", "AP小練習"],
   ["mental_small_train_ex", "メンタ精神小練習"],
   ["mental_ap_small_train_ex", "精神APメンタ精神小練習"],
   ["equilibrium_small_train_ex", "平衡小練習"],
   ["equilibrium_ap_small_train_ex", "AP平衡小練習"],
   ["equilibrium_mental_small_train_ex", "メンタ平衡精神小練習"],
   ["equilibrium_mental_ap_small_train_ex", "精神APメンタ平衡精神小練習"],
   ["map_small_train_ex", "小AP小練習、小AP新球大練習"],
   ["map_new_ball_large_train_ex", "小AP新球大練習"],
   ["ap_map_small_train_ex", "小AP＋AP小練習"],
   ["mental_map_small_train_ex", "小APメンタ精神小練習"],
   ["mental_ap_map_small_train_ex", "小AP＋精神APメンタ精神小練習"],
   ["equilibrium_map_small_train_ex", "小AP平衡小練習"],
   ["equilibrium_ap_map_small_train_ex", "小AP＋AP平衡小練習"],
   ["equilibrium_mental_map_small_train_ex", "小APメンタ平衡精神小練習"],
   ["equilibrium_mental_ap_map_small_train_ex", "小AP＋精神APメンタ平衡精神小練習"],
   ["large_train_ex", "大練習"],
   ["ap_large_train_ex", "AP大練習"],
   ["mental_large_train_ex", "メンタ精神大練習"],
   ["mental_ap_large_train_ex", "精神APメンタ精神大練習"],
   ["proactive_new_ball_large_train_ex", "積極新球大練習"],
   ["proactive_large_train_ex", "積極大練習"],
   ["proactive_ap_large_train_ex", "AP積極大練習"],
   ["equilibrium_large_train_ex", "平衡大練習"],
   ["equilibrium_ap_large_train_ex", "AP平衡大練習"],
   ["equilibrium_mental_large_train_ex", "メンタ平衡精神大練習"],
   ["equilibrium_mental_ap_large_train_ex", "精神APメンタ平衡精神大練習"],
   ["map_large_train_ex", "小AP大練習"],
   ["ap_map_large_train_ex", "小AP＋AP大練習"],
   ["mental_map_large_train_ex", "小APメンタ精神大練習"],
   ["mental_ap_map_large_train_ex", "小AP＋精神APメンタ精神大練習"],
   ["proactive_map_new_ball_large_train_ex", "小AP積極新球大練習"],
   ["proactive_map_large_train_ex", "小AP積極大練習"],
   ["proactive_ap_map_large_train_ex", "小AP＋AP積極大練習"],
   ["equilibrium_map_large_train_ex", "小AP平衡大練習"],
   ["equilibrium_ap_map_large_train_ex", "小AP＋AP平衡大練習"],
   ["equilibrium_mental_map_large_train_ex", "小APメンタ平衡精神大練習"],
   ["equilibrium_mental_ap_map_large_train_ex", "小AP＋精神APメンタ平衡精神大練習"],
   ["large_minus_ex", "大練習マイナス"],
   ["proactive_large_minus_ex", "積極大練習マイナス"],
   ["cautious_large_minus_ex", "慎重大練習マイナス"],
   ["participate_independent_training_ex", "自主トレ参加"]
  ];

  for(const a_index of output_names.keys()){
    // 新球大練習を小練習から分けた時、種類の表示名の変更
    const a_name_pair = output_names[a_index];
    if(is_created_new_ball){
      if(a_name_pair[0] === "small_train_ex"){
        output_names[a_index][1] = "小練習";
      } else if(a_name_pair[0] === "map_small_train_ex"){
        output_names[a_index][1] = "小AP小練習";
      }
    }
    // 精密鍛錬が有効な時、小練習の表示名の変更
    if(which_train_ability === "精密鍛錬"){
      if(a_name_pair[0].includes("small_train_ex")){
        if(a_name_pair[0].includes("mental_")){
          output_names[a_index][1] = a_name_pair[1].replace("精神小練習", "精密精神小練習");
        } else {
          output_names[a_index][1] = a_name_pair[1].replace("小練習", "精密小練習");
        }
      }
    }
  }

  // 出力欄全体を空欄で埋めた配列を用意する(書き込まなかったセルは空欄になるので、前回の結果の消去も兼ねる)
  const name_rows = Array.from({ length: output_row_count }, () => [""]); // E列
  const value_rows = Array.from({ length: output_row_count }, () => Array(value_col_count + 1).fill("")); // G～V列

  // 条件に合致する内容を配列に書き込む
  let row_index = 0;
  for(const a_name_pair of output_names){
    for(const one_pattern of all_patterns){
      if(a_name_pair[0] === one_pattern["name"] && one_pattern["values"].length > 0){
        if(row_index + 1 >= output_row_count || one_pattern["values"].length > value_col_count){
          throw new Error("結果が出力欄(E7:V56)に収まりません: " + a_name_pair[1]);
        }
        name_rows[row_index][0] = a_name_pair[1];
        one_pattern["values"].forEach((a_ex_value, i) => { value_rows[row_index][i] = a_ex_value; });
        (one_pattern["probabilities"] ?? []).forEach((a_probability, i) => { value_rows[row_index + 1][i] = a_probability; });
        value_rows[row_index][value_col_count] = one_pattern["expected_ex_value"]; // V列
        row_index = row_index + 2;
      }
    }
  }

  // スプレッドシートにまとめて書き込む(F列の「確率」の見出しは変更しない)
  sheet.getRange(output_first_row, 5, output_row_count, 1).setValues(name_rows);
  sheet.getRange(output_first_row, 7, output_row_count, value_col_count + 1).setValues(value_rows);

}