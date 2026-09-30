// @ts-check

// 再計算のきっかけにする入力欄(「フォーム」シートのC列)
const input_sheet_name = "フォーム";
const input_column = 3; // C列
const input_row_ranges = [[7, 10], [13, 19]]; // C7:C10(基本情報)、C13:C19(補正情報)

function onEdit(e){
  // エディタから直接実行した場合(e がない場合)は、そのまま再計算する
  if(e && !is_input_cell_edited(e.range)){
    return;
  }
  add_all_corrections();
}

// 編集された範囲が、入力欄と重なっているかを判定する
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
  const mini_ap_add_val = 2;

  // APの各倍率
  const ap_mul_other = 1.5;
  const ap_mul_power = 1.4;
  const ap_mul_meet = 1.3;

  // YURの追加の値
  const yur_add_val = 4;

  // メンタリスト嫁の能力の倍率
  const mental_mul = 2;

  // 集中発生時の出現値
  const concentrate_add_values = [3, 4, 5];

  // 積極鍛錬時の追加経験値
  const proactive_add_values = [2, 3, 4];

  // 積極鍛錬時の削減経験値
  const proactive_sub_values = [-1, -2];

  // 平衡鍛錬時の追加経験値
  const equilibrium_add_values = [1, 2, 3];

  // 筋肉養成ギプスの倍率
  const cast_mul = 1.2;

  // 出力欄の位置と大きさ(E列が種類、G～U列が出現値と確率、V列が期待値。2行で1組)
  const output_first_row = 7;
  const output_row_count = 50; // 7～56行目
  const value_col_count = 15; // G～U列
  
  // ex2. 関数の指定

  // 配列名と値と出現数、属性を出力する関数
  function get_vals_dict_from_list(set_name, in_values){
    let out_counts = []; // 出現頻度
    let out_dict = { 
      "name": set_name, // パターン名
      "value": in_values, // 出現結果
    };

    // 出現頻度の記録(全て、1を入力)
    for(const a_value of in_values){ out_counts.push(1); }

    out_dict["frequency"] = out_counts;

    return out_dict;
  }

  // パターン名にAPが含まれるか(先頭の "ap_" と、途中の "_ap_" の両方を判定。小APの "map_" は含めない)
  function has_ap(pattern_name){
    return pattern_name.startsWith("ap_") || pattern_name.includes("_ap_");
  }

  // 経験値加算処理(加算から各配列に追加)
  function add_ex_value(in_values, in_freqs, add_values){
    // 計算結果の格納
    let calculated_values = [];
    let out_freqs = [];

    // 基本経験値＋加算値の結果の格納
    for(const a_add_value of add_values){
      for(const a_ex_value_point in in_values){
        const a_calculated_values = a_add_value + in_values[a_ex_value_point];
        const temp_point = calculated_values.indexOf(a_calculated_values);
        if(temp_point === -1){
          calculated_values.push(a_calculated_values);
          out_freqs.push(in_freqs[a_ex_value_point]);
        } else {
          out_freqs[temp_point] = out_freqs[temp_point] + in_freqs[a_ex_value_point]; 
        }
      }
    }

    return [calculated_values, out_freqs];
  }

  // 経験値半減処理（切り捨てと切り上げが半々の確率で出現）  
  function div_half_ex_value(in_values, in_freq){
    // 半減（切り捨て）
    const floored_values = in_values.map(num => Math.floor(num / 2));
    // 半減（切り上げ）
    const ceiled_values = in_values.map(num => Math.ceil(num / 2));
    // 半減した値を結合（重複許す）
    const concat_values = [...floored_values, ...ceiled_values];
    // 半減した頻度を結合（重複許す）
    const concat_freqs = [...in_freq, ...in_freq];

    // 出現値と頻度を格納する
    let out_values = [];
    let out_freq = [];

    for(const a_concat_point in concat_values){
      const a_concat_value = concat_values[a_concat_point];
      const temp_point = out_values.indexOf(a_concat_value);
      if(temp_point === -1){
        out_values.push(a_concat_value);
        out_freq.push(concat_freqs[a_concat_point]);
      } else {
        out_freq[temp_point] = out_freq[temp_point] + concat_freqs[a_concat_point]; 
      }
    }
    return [out_values, out_freq];
  }

  // 集中実行時による経験値の加算    
  function add_concentrate_ex_value(in_values, in_freqs){
    return add_ex_value(in_values, in_freqs, concentrate_add_values);
  }

  // 精密鍛錬（加算）
  function add_precise_train_values(in_values){
    let out_values = [];

    for(const a_ex_value of in_values){
      if(a_ex_value > 5){
        // 6以上（経験値が5を超えている）なら+2
        out_values.push(a_ex_value + 2);
      } else if(a_ex_value > 0){
        // 1以上（経験値が0を超えている）なら+1
        out_values.push(a_ex_value + 1);
      } else {
        // それ以外（経験値が0）ならそのまま
        out_values.push(a_ex_value);
      }
    }

    return out_values;
  }

  // 積極鍛錬（加算）
  function add_proactive_train_values(in_values, in_freqs, is_large_train_minus){
    if(is_large_train_minus){
      // 大練習でのマイナスがある時（引数からフラグ取得）
      return add_ex_value(in_values, in_freqs, proactive_add_values);
    } else {
      return [in_values, in_freqs];
    }
  }


  // 積極鍛錬（減算）
  function sub_proactive_train_values(in_values, in_freqs, is_large_train_minus){
    if(is_large_train_minus){
      // 大練習でのマイナスがある時
      return add_ex_value(in_values, in_freqs, proactive_sub_values);
    } else {
      return [in_values, in_freqs];
    }
  }

  // 慎重鍛錬（減算）
  function div_cautious_train_value(in_values, in_freqs, is_large_train_minus){
    if(is_large_train_minus){
      // 大練習でのマイナスがある時
      // 処理自体はイマイチやる気が出ない…の半減と同じなので、関数呼び出し
      return div_half_ex_value(in_values, in_freqs);
    } else {
      return [in_values, in_freqs];
    }
  }

  // 平衡鍛錬（加算）
  function add_equilibrium_train_values(in_values, in_freqs){
    if(Math.max(...in_values) > 0){
      // 計算結果の格納
      let calculated_values = [];
      let out_freqs = [];

      // 基本経験値＋加算値の結果の格納
      for(const a_add_value of equilibrium_add_values){
        for(const a_ex_value_point in in_values){
          const a_in_value =  in_values[a_ex_value_point];
          // 出現値が1以上の時は平衡鍛錬の値を加算
          const a_calculated_values = (a_in_value > 0) ? a_add_value + a_in_value : a_in_value;
          const temp_point = calculated_values.indexOf(a_calculated_values);
          if(temp_point === -1){
            calculated_values.push(a_calculated_values);
            out_freqs.push(in_freqs[a_ex_value_point]);
          } else {
            out_freqs[temp_point] = out_freqs[temp_point] + in_freqs[a_ex_value_point]; 
          }
        }
      }
      return [calculated_values, out_freqs];
    } else {
      return [in_values, in_freqs];
    }
  }

  // 0. フォームの値の取得、及び各変数の設定
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(input_sheet_name);

  // 出現値のパターンを格納する変数の作成
  let all_pattern_ex = [];

  // 非AP小練習の値の取得
  const get_small_train_ex = sheet.getRange('G2:J2').getValues();
  let small_train_ex = get_small_train_ex[0].filter(function(x){return typeof x === 'number';});
  all_pattern_ex.push(get_vals_dict_from_list("small_train_ex", small_train_ex));

  // 非AP大練習の値の取得
  const get_large_train_ex = sheet.getRange('G3:J3').getValues();
  let large_train_ex = get_large_train_ex[0].filter(function(x){return typeof x === 'number';});
  all_pattern_ex.push(get_vals_dict_from_list("large_train_ex", large_train_ex));

  // 大練習のマイナス値の取得
  const get_large_minus_ex = sheet.getRange('G4:J4').getValues();
  const large_minus_ex = get_large_minus_ex[0].filter(function(x){return typeof x === 'number';});
  all_pattern_ex.push(get_vals_dict_from_list("large_minus_ex", large_minus_ex));

  // 小APのフラグの取得
  const which_mini_ap = sheet.getRange('C13').getValue();

  // APの種類の取得
  const which_main_ap = sheet.getRange('C14').getValue();

  // YURによる助っ人の有無の取得
  const is_yur_add = sheet.getRange('C15').getValue();

  // メンタ嫁の結婚の有無の取得
  const is_mental_wife_mul = sheet.getRange('C16').getValue();

  // 集中・イマイチの発生の有無
  const which_concentrate = sheet.getRange('C17').getValue();

  // 鍛錬の種類取得
  const which_train_ability = sheet.getRange('C18').getValue();

  // 筋肉養成ギプスの使用の有無
  const is_cast_mul = sheet.getRange('C19').getValue();

  // 自主トレ参加時の経験値（pit は participate_independent_training の略）
  const min_pit_ex = Math.min(...small_train_ex) * 3;
  const max_pit_ex = Math.max(...small_train_ex) * 3;
  const participate_independent_training_ex = Array.from({ length: (max_pit_ex - min_pit_ex + 1) }, (_, i) => i + min_pit_ex);
  all_pattern_ex.push(get_vals_dict_from_list("participate_independent_training_ex", participate_independent_training_ex));

  // 大練習で下がるか、のフラグ
  let is_large_train_minus = false;

  // 新球大練習の設定を新たに作ったか、のフラグ
  let is_created_new_ball = false;

  // 新しいパターンの一時格納用
  let temp_dict_list = [];

  // APの初期の倍率（初期値は、ミートとパワー以外の1.5）
  let ap_mul = ap_mul_other;

  // APと小APが同じになったかのフラグ
  let is_ap_and_map_same = false;

  // 1. 小APによる経験値追加処理
  
  if(which_mini_ap !== "なし"){
    
    if(which_mini_ap === "あり（APと同じ）"){
      // APと小APが同じになったフラグをON
      is_ap_and_map_same = true;
    }

    // 積極鍛錬と精密鍛錬は、小練習と新球大練習は別に補正がかかるので分離する必要あり
    if(which_train_ability === "積極鍛錬" || which_train_ability === "精密鍛錬"){
      for(const a_ex of all_pattern_ex){
        if(a_ex["name"].includes("small_train_ex")){
          let temp_name = a_ex["name"].replace('small', 'new_ball_large');
          // 直接パターンを入れる（次の小AP追加の処理の対象にするため）
          all_pattern_ex.push(get_vals_dict_from_list(temp_name, a_ex["value"]));
          break; // 1回きり！
        }
      }

      // 新球大練習を作ったフラグをON
      is_created_new_ball = true;
    }

    for(const a_ex of all_pattern_ex){
      // 小練習か大練習が対象
      if(a_ex["name"].includes("_train_ex")){
        if(a_ex["name"].includes("large_train") && which_main_ap === "変化" && is_ap_and_map_same){
          // 変化APで小APも変化の場合、変化の大練習は存在しないので除外
          continue;
        } else {
          const temp_name = "map_" + a_ex["name"];
          const temp_values = a_ex["value"].map(num => num + mini_ap_add_val);
          temp_dict_list.push(get_vals_dict_from_list(temp_name, temp_values));
        }
      }
    }

    // パターンの記録
    for(const a_dict of temp_dict_list){
      all_pattern_ex.push(a_dict);
    }

  }

  // 2. APによる経験値倍増処理(倍率設定から、計算)
  if(which_main_ap === "ミート"){
    ap_mul = ap_mul_meet;
  } else if(which_main_ap === "パワー"){
    ap_mul = ap_mul_power;
  }

  temp_dict_list = [];

  for(let a_ex of all_pattern_ex){
    // 小練習か大練習が対象
    if(a_ex["name"].includes("_train_ex")){
      if(a_ex["name"].includes("new_ball_large_train_ex") && !a_ex["name"].startsWith("map_")){
        // 新球大練習は除外(小AP新球大練習はそのまま続ける)
        continue;
      }
      if(is_ap_and_map_same && a_ex["name"].includes("map_")){
        // APと小APが同じになった時、小APのパターンをAP＋小APのパターンに変更する
        a_ex["name"] ="ap_" + a_ex["name"];
        a_ex["value"] = a_ex["value"].map(num => Math.floor(num * Math.round(ap_mul * 10) / 10));
      } else if(!a_ex["name"].includes("large_train") || which_main_ap !== "変化"){
        // それ以外は追加
        const temp_name = "ap_" + a_ex["name"];
        const temp_values = a_ex["value"].map(num => Math.floor(num * Math.round(ap_mul * 10) / 10));
        if(which_mini_ap ==="あり（APとは別）" && a_ex["name"].includes("map_")){
          continue;
        } else if(which_mini_ap === "あり（APと同じ）" && !a_ex["name"].includes("map_")){
          continue;
        }
        temp_dict_list.push(get_vals_dict_from_list(temp_name, temp_values));
      }
    }
  }
  for(const a_dict of temp_dict_list){
    all_pattern_ex.push(a_dict);
  }

  // 3. YURによる経験値追加処理
  if(is_yur_add === "あり"){
    for(let a_ex of all_pattern_ex){
      // 小練習か大練習が対象
      if(a_ex["name"].includes("_train_ex")){
        a_ex["value"] = a_ex["value"].map(num => num + yur_add_val);
      }
    }
  }

  // 4. メンタリスト能力持ちの嫁追加処理
  if(is_mental_wife_mul === "あり"){
    temp_dict_list = [];
    for(let a_ex of all_pattern_ex){
      // 新たに追加するか
      let is_added_new_pattern = false;
      // 既存のパターンを上書きするか
      let is_overwrited_current_pattern = false;
      // 大練習と小練習が対象
      if(a_ex["name"].includes("_train_ex")){
        if(which_main_ap === "精神" && has_ap(a_ex["name"])){
          // APが精神なら、APを対象とする(上書き処理)
          is_overwrited_current_pattern = true;
        } else if(which_main_ap !== "精神" && !has_ap(a_ex["name"])){
          // APが精神以外なら、APを対象としない(追加処理)
          is_added_new_pattern = true;
        }
        if(is_added_new_pattern){
          // 更新対象の項目なら
          let temp_name = "mental_" + a_ex["name"];
          const temp_values = a_ex["value"].map(num => num * mental_mul);
          temp_dict_list.push(get_vals_dict_from_list(temp_name, temp_values));
        } else if(is_overwrited_current_pattern){
          // 既存のAPの記録を上書きする形で、メンタ嫁APに置き換える
          a_ex["name"] ="mental_" + a_ex["name"];
          a_ex["value"] = a_ex["value"].map(num => num * mental_mul);
        }
      }
    }
    for(const a_dict of temp_dict_list){
      all_pattern_ex.push(a_dict);
    }

  }

  // 5.集中、及びイマイチやる気が出ない…による経験値加減処理
  if(which_concentrate === "集中"){

    for(let a_ex of all_pattern_ex){
      // 小練習か大練習が対象
      if(a_ex["name"].includes("_train_ex")){
        const temp_result = add_concentrate_ex_value(a_ex["value"], a_ex["frequency"]);
        a_ex["value"] = temp_result[0];
        a_ex["frequency"] = temp_result[1];
      }
    }
    
  } else if(which_concentrate === "イマイチ"){

    for(let a_ex of all_pattern_ex){
      // 小練習か大練習が対象
      if(a_ex["name"].includes("_train_ex")){
        const temp_result = div_half_ex_value(a_ex["value"], a_ex["frequency"]);
        a_ex["value"] = temp_result[0];
        a_ex["frequency"] = temp_result[1];
      }
    }
  
  }

  // 6. 各鍛錬による補正の結果

  // 大練習で下がるか
  const max_value_minus = Math.max(...large_minus_ex);
  if(max_value_minus < 0){
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

    temp_dict_list = [];

    for(let a_ex of all_pattern_ex){
      let is_proactive_exec = false;
      let temp_result = [];
      if(a_ex["name"] !== "participate_independent_training_ex"){
        // 新球大練習（念のため、AP除外）の時の対応（小練習の値をもとに作成）
        if(a_ex["name"].includes("small_train")){
          // 新球大練習がまだ未作成の場合（念のため、AP除外）
          if(!is_created_new_ball && !has_ap(a_ex["name"])){
            // メンタ嫁除外
            if(!a_ex["name"].includes("mental_")){
              // 加算値の計算
              temp_result = add_proactive_train_values(a_ex["value"], a_ex["frequency"], is_large_train_minus);
              is_proactive_exec = true;
            }
          }
        } else if(a_ex["name"].includes("large_train")){
          // APが積極鍛錬の対象、または非APなら加算値の計算を行う
          if(is_proactive_ap || !has_ap(a_ex["name"])){
            // メンタ嫁除外
            if(!a_ex["name"].includes("mental_")){
              // 加算値の計算
              temp_result = add_proactive_train_values(a_ex["value"], a_ex["frequency"], is_large_train_minus);
              is_proactive_exec = true;
            }
          }
        } else if(a_ex["name"].includes("large_minus")){
          // 減少値の計算
          temp_result = sub_proactive_train_values(a_ex["value"], a_ex["frequency"], is_large_train_minus);
          is_proactive_exec = true;
        }
        if(is_proactive_exec){
          let temp_name = "proactive_" + a_ex["name"];
          if(a_ex["name"].includes("small_train")){
            // 新球大練習なら名前を変更
            temp_name = temp_name.replace('small', 'new_ball_large');
          }
          if((is_proactive_ap && has_ap(a_ex["name"])) || a_ex["name"].includes("new_ball_large_train_ex")){
            // もしAPが積極鍛錬の対象、または新球大練習の場合は唯一なので、値を置き換える
            a_ex["name"] = temp_name;
            a_ex["value"] = temp_result[0];
            a_ex["frequency"] = temp_result[1];
          } else {
            // それ以外は値を追加
            let out_dict = { 
              "name": temp_name, 
              "value": temp_result[0], 
              "frequency": temp_result[1]
            };
            temp_dict_list.push(out_dict);
            if(a_ex["name"].includes("small_train")){
              // 新球大練習の追加の場合、小練習の項目の名前を変えるフラグを建てる
              is_created_new_ball = true;
            }
          }
        }
      }
    } 
    for(const a_dict of temp_dict_list){
      all_pattern_ex.push(a_dict);
    }

  } else if(which_train_ability === "慎重鍛錬"){  
    // 慎重大練習時のマイナス経験値

    for(let a_ex of all_pattern_ex){
      let temp_result = [];
      if(a_ex["name"].includes("large_minus")){
        // 減少値の計算
        temp_result = div_cautious_train_value(a_ex["value"], a_ex["frequency"], is_large_train_minus);
        // 既存の減少の記録を上書きする形で、置き換え
        a_ex["name"] ="cautious_" + a_ex["name"];
        a_ex["value"] = temp_result[0];
        a_ex["frequency"] = temp_result[1];
      }   
    }

  } else if(which_train_ability === "精密鍛錬"){

    temp_dict_list = [];

    for(let a_ex of all_pattern_ex){
      if(a_ex["name"].includes("small_train")){
        // 以下、新球大練習用の退避処理（退避処理がまだなら、ここで対応）、念のためAPは除外
        if(!is_created_new_ball && !has_ap(a_ex["name"])){
          // 以下、新球大練習用の退避処理
          const temp_name = a_ex["name"].replace('small', 'new_ball_large');
          temp_dict_list.push({
            "name": temp_name, 
            "value": [...a_ex["value"]], 
            "frequency": [...a_ex["frequency"]]
          });

          // 新球大練習作成フラグをON
          is_created_new_ball = true;
        }

        // 退避の後、精密鍛錬を適用
        a_ex["value"] = add_precise_train_values(a_ex["value"]);
      }
    }

    for(const a_dict of temp_dict_list){
      all_pattern_ex.push(a_dict);
    }

  } else if(which_train_ability === "平衡鍛錬"){

    temp_dict_list = [];

    // 全パターンを平衡鍛錬に適用
    for(const a_ex of all_pattern_ex){
      let temp_result = [];
      // 小練習か大練習が対象
      if(a_ex["name"].includes("_train_ex")){
        temp_result = add_equilibrium_train_values(a_ex["value"], a_ex["frequency"]);
        const temp_name = "equilibrium_" + a_ex["name"];
        temp_dict_list.push({ 
          "name": temp_name, 
          "value": temp_result[0], 
          "frequency": temp_result[1]
        });
      }
    }
    for(const a_dict of temp_dict_list){
      all_pattern_ex.push(a_dict);
    }
  }

  // 7. 筋肉養成ギプスの適用
  if(is_cast_mul === "あり"){
    for(let a_ex of all_pattern_ex){
      // 小練習か大練習が対象
      if(a_ex["name"].includes("_train_ex")){
        a_ex["value"] = a_ex["value"].map(num => Math.ceil(num * Math.round(cast_mul * 10) / 10));
      }
    }
  }

  // 8. 確率、期待値算出、ソート
  for(let a_ex of all_pattern_ex){
    let val_prob_list = []; // 出現値と確率を格納する配列
    let prob_list = []; // 確率を格納するリスト
    let count_vals_mul_freq = 0; // 出現値と頻度をかけた数をまとめる変数
    let count_freqs = 0; // 頻度をカウントする変数

    // 出現値と頻度を別配列に格納、そして出現値と頻度の積の総和と頻度の総和も記録
    for(const a_point in a_ex["value"]){
      val_prob_list.push([a_ex["value"][a_point], a_ex["frequency"][a_point]]);
      count_vals_mul_freq = count_vals_mul_freq + a_ex["value"][a_point] * a_ex["frequency"][a_point];
      count_freqs = count_freqs + a_ex["frequency"][a_point];
    }

    // 出現頻度を確率に変換（頻度を頻度の総和で割る）
    for(const a_point in val_prob_list){
      val_prob_list[a_point][1] = val_prob_list[a_point][1] / count_freqs;
    }
    
    // 期待値の格納(出現値と頻度の積を総和と頻度の総和で割り、小数点2桁に丸める)
    a_ex["expected_value"] = Math.round(count_vals_mul_freq / count_freqs * 100) / 100;

    // 出現値のソート（ここで頻度と並びがずれるので、出現値と総和を事前に退避する必要がある）
    if(a_ex["name"].includes("large_minus")){
      // 大練習の減少のみ、降順
      a_ex["value"] = a_ex["value"].sort((a,b) => (a > b ? -1 : 1));
    } else {
      // 昇順
      a_ex["value"] = a_ex["value"].sort((a,b) => (a < b ? -1 : 1));
    }

    // 確率を出現値のソートに合わせて配列に格納
    for(const a_value of a_ex["value"]){
      for(const a_list of val_prob_list){
        if(a_value === a_list[0]){
          let a_prob = Math.round(a_list[1] * 10000) / 100; // 百分率表記に変更、小数点2桁に丸める
          const str_prob = String(a_prob) + "%"; // 百分率の数値を文字列にして % を末尾に追加
          prob_list.push(str_prob);
          break;
        }
      }
    }
    
    // 確率の格納
    a_ex["probability"] = prob_list;

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

  // 新球大練習を小練習から分けた時の、種類の表示名の変更
  if(is_created_new_ball){
    for(const a_point in output_names){
      if(output_names[a_point][0] === "small_train_ex"){
        output_names[a_point][1] = "小練習";
      } else if(output_names[a_point][0] === "map_small_train_ex"){
        output_names[a_point][1] = "小AP小練習";
      }
    }
  }

  // 出力欄全体を空欄で埋めた配列を用意する(書き込まなかったセルは空欄になるので、前回の結果の消去も兼ねる)
  const name_rows = Array.from({ length: output_row_count }, () => [""]); // E列
  const value_rows = Array.from({ length: output_row_count }, () => Array(value_col_count + 1).fill("")); // G～V列

  // 条件に合致する内容を配列に書き込む
  let row_index = 0;
  for(const a_name_list of output_names){
    for(const a_ex of all_pattern_ex){
      if(a_name_list[0] === a_ex["name"] && a_ex["value"].length > 0){
        if(row_index + 1 >= output_row_count || a_ex["value"].length > value_col_count){
          throw new Error("結果が出力欄(E7:V56)に収まりません: " + a_name_list[1]);
        }
        name_rows[row_index][0] = a_name_list[1];
        a_ex["value"].forEach((a_value, i) => { value_rows[row_index][i] = a_value; });
        a_ex["probability"].forEach((a_prob, i) => { value_rows[row_index + 1][i] = a_prob; });
        value_rows[row_index][value_col_count] = a_ex["expected_value"]; // V列
        row_index = row_index + 2;
      }
    }
  }

  // スプレッドシートにまとめて書き込む(F列の「確率」の見出しは変更しない)
  sheet.getRange(output_first_row, 5, output_row_count, 1).setValues(name_rows);
  sheet.getRange(output_first_row, 7, output_row_count, value_col_count + 1).setValues(value_rows);

}