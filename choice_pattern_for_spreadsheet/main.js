function onEdit(e) {
  add_all_corrections();
}

function add_all_corrections(){
  
  // ex. 関数の指定

  // 配列名と値と出現数、属性を出力する関数
  function get_vals_dict_from_list(set_name, in_values, in_att){
    let out_counts = []; // 出現頻度の
    let out_dict = { 
      "name": set_name, // 出現数名 
      "value": in_values, // 出現結果
      "attribute": in_att // 属性（左から練習項目、小AP、AP、メンタ嫁、鍛錬）
      // 例： in_att = [1, false, false, false, 3]
      // 属性の練習項目は「0:対象外（自主トレなど）, 1:小, 2:大, 3:大マイナス」
      // 属性の鍛錬は「0:なし(精密鍛錬も含む), 1:積極鍛錬, 2:慎重鍛錬, 3:平衡鍛錬」
    };

    // 出現頻度の記録(全て、1を入力)
    for (a_value of in_values){ out_counts.push(1); }

    out_dict["frequency"] = out_counts;

    return out_dict;
  }

  // 経験値加算処理(加算から各配列に追加)
  function add_ex_value_v2(in_values, in_freqs, add_values){
    // 計算結果の格納
    let calculated_values = []
    let out_freqs = []

    // 基本経験値＋加算値の結果の格納
    for(const a_add_value of add_values){
      for(const a_ex_value_point in in_values){
        a_calculated_values = a_add_value + in_values[a_ex_value_point];
        const temp_point = calculated_values.indexOf(a_calculated_values);
        if (temp_point == -1) {
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
  function div_half_ex_value_v2(in_values, in_freq){
    // 半減（切り捨て）
    const floored_values = in_values.map(num => Math.floor(num / 2));
    // 半減（切り上げ）
    const ceiled_values = in_values.map(num => Math.ceil(num / 2));
    // 半減した値を結合（重複許す）
    const concat_values = [...floored_values, ...ceiled_values];
    // 半減した頻度を結合（重複許す）
    const concat_freqs = [...in_freq, ...in_freq];

    // 書値と頻度を格納する
    let out_values = [];
    let out_freq = [];

    for (a_concat_point in concat_values) {
      a_concat_value = concat_values[a_concat_point];
      const temp_point = out_values.indexOf(a_concat_value);
      if (temp_point == -1) {
        out_values.push(a_concat_value);
        out_freq.push(concat_freqs[a_concat_point]);
      } else {
        out_freq[temp_point] = out_freq[temp_point] + concat_freqs[a_concat_point]; 
      }
    }
    return [out_values, out_freq];
  }

  // 集中実行時による経験値の加算    
  function add_concentrate_ex_value_v2(in_values, in_freqs){
    // 集中の出現値
    const concentrate_add_values = [3, 4, 5];
    return add_ex_value_v2(in_values, in_freqs, concentrate_add_values);
  }

  // 精密鍛錬（加算）
  function add_precise_train_values(in_values){
    let out_values = []

    for(const a_ex_value of in_values){
      if(a_ex_value > 5){
        // 6以上（経験値が5を超えている）なら+2
        out_values.push(a_ex_value + 2);
      } else if (a_ex_value > 0){
        // 1以上（経験値が0を超えている）なら+1
        out_values.push(a_ex_value + 1);
      } else {
        // それいがい（経験値が0）ならそのまま
        out_values.push(a_ex_value);
      }
    }

    return out_values;
  }

  // 積極鍛錬（加算）
  function add_proactive_train_values_v2(in_values, in_freqs, large_train_minus_flug){
    if (large_train_minus_flug == true) {
      // 大練習でのマイナスがある時（引数からフラグ取得）
      // 積極鍛錬時の追加経験値
      const proactive_add_values = [2, 3, 4]
      return add_ex_value_v2(in_values, in_freqs,proactive_add_values)
    } else {
      return [in_values, in_freqs]
    }
  }


  // 積極鍛錬（減算）
  function sub_proactive_train_values_v2(in_values, in_freqs, large_train_minus_flug){
    if (large_train_minus_flug == true) {
      // 大練習でのマイナスがある時
      // 積極鍛錬時の削減経験値
      const proactive_sub_values = [-1, -2]
      return add_ex_value_v2(in_values, in_freqs,proactive_sub_values)
    } else {
      return [in_values, in_freqs]
    }
  }

  // 慎重鍛錬（減算）
  function div_cautious_train_value_v2(in_values, in_freqs, large_train_minus_flug){
    if (large_train_minus_flug == true) {
      // 大練習でのマイナスがある時
      // 処理自体はイマイチやる気が出ない…の半減と同じなので、関数呼び出し
      return div_half_ex_value_v2(in_values, in_freqs);
    } else {
      return [in_values, in_freqs]
    }
  }

  // 平衡鍛錬（加算、旧版）
  /*
  function add_equilibrium_train_values_v2(in_values, in_freqs){
    if (Math.max(...in_values) > 0) {
      // 平衡鍛錬時の追加経験値
      const equilibrium_add_values = [1, 2, 3]
      return add_ex_value_v2(in_values, in_freqs, equilibrium_add_values)
    } else {
      return [in_values, in_freqs]
    }
  }
  */

  // 平衡鍛錬（加算）
  function add_equilibrium_train_values_v3(in_values, in_freqs){
    if (Math.max(...in_values) > 0) {
      // 平衡鍛錬時の追加経験値
      const equilibrium_add_values = [1, 2, 3]

      // 計算結果の格納
      let calculated_values = []
      let out_freqs = []

      // 基本経験値＋加算値の結果の格納
      for(const a_add_value of equilibrium_add_values){
        for(const a_ex_value_point in in_values){
          a_in_value =  in_values[a_ex_value_point]
          // 出現地が1以上の時は平衡鍛錬の値を加算
          if(a_in_value > 0){
            a_calculated_values = a_add_value + a_in_value;
          } else {
            a_calculated_values = a_in_value;
          }
          const temp_point = calculated_values.indexOf(a_calculated_values);
          if (temp_point == -1) {
            calculated_values.push(a_calculated_values);
            out_freqs.push(in_freqs[a_ex_value_point]);
          } else {
            out_freqs[temp_point] = out_freqs[temp_point] + in_freqs[a_ex_value_point]; 
          }
        }
      }
      return [calculated_values, out_freqs];
    } else {
      return [in_values, in_freqs]
    }
  }

  // 0. フォームの値の削除、取得、及び各変数の設定
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("フォーム");

  // 値の消去
  const range_a = sheet.getRange("G7:V56");
  range_a.clearContent();
  const range_b = sheet.getRange("E7:E56");
  range_b.clearContent();

  // 出現地のパターンを格納する変数の作成
  let all_pattern_ex = []

  // 小練習の値の取得
  const get_small_train_ex = sheet.getRange('G2:J2').getValues();
  let small_train_ex = get_small_train_ex[0].filter(function(x) {return typeof x === 'number'});
  all_pattern_ex.push(get_vals_dict_from_list("small_train_ex", small_train_ex, [1, false, false, false, 0]));

  // 大練習の値の取得
  const get_large_train_ex = sheet.getRange('G3:J3').getValues();
  let large_train_ex = get_large_train_ex[0].filter(function(x) {return typeof x === 'number'});
  all_pattern_ex.push(get_vals_dict_from_list("large_train_ex", large_train_ex, [2, false, false, false, 0]));

  // 大練習のマイナス値の取得
  const get_large_minus_ex = sheet.getRange('G4:J4').getValues();
  const large_minus_ex = get_large_minus_ex[0].filter(function(x) {return typeof x === 'number'});
  all_pattern_ex.push(get_vals_dict_from_list("large_minus_ex", large_minus_ex, [3, false, false, false, 0]));

  // 小APのフラグの取得
  const which_mini_ap = sheet.getRange('C13').getValue();

  // APの種類の取得
  const which_main_ap = sheet.getRange('C14').getValue();

  // YURによる助っ人の有無の取得
  const yur_flug = sheet.getRange('C15').getValue();

  // メンタ嫁の結婚の有無の取得
  const mental_wife_flug = sheet.getRange('C16').getValue();

  // 集中・イマイチの発生の有無
  const which_concentrate = sheet.getRange('C17').getValue();

  // 鍛錬の種類取得
  const which_train_ability = sheet.getRange('C18').getValue();

  // 筋肉養成ギプスの使用の有無
  const use_cast_flug = sheet.getRange('C19').getValue();

  // 自主トレ参加時の経験値（pit は participate_independent_training の略）
  const min_pit_ex = Math.min(...small_train_ex) * 3
  const max_pit_ex = Math.max(...small_train_ex) * 3
  const participate_independent_training_ex = Array.from({ length: (max_pit_ex - min_pit_ex + 1) }, (_, i) => i + min_pit_ex);
  all_pattern_ex.push(get_vals_dict_from_list("participate_independent_training_ex", participate_independent_training_ex, [0, false, false, false, 0]));

  // 大練習で下がるか、のフラグ
  let large_train_minus_flug = false;

  // 新球大練習の設定を新たに作ったか、のフラグ
  let create_new_ball_flug = false;

  // APの倍率（初期値は、ミートとパワー以外の1.5）  
  let ap_mul = 1.5

  // 筋肉養成ギプスの倍率
  const cast_mul = 1.2

  // 新しいパターンの一時格納用
  let temp_dict_list = []

  // APと小APが同じになったかのフラグ
  let same_ap_and_map_flag = false;

  // 書き込み開始の行数
  let start_line = 7;

  // 1. 小APによる経験値追加処理
  
  if(which_mini_ap !== "なし"){
    
    if(which_mini_ap === "あり（APと同じ）") {
      // APと小APが同じになったフラグをON
      same_ap_and_map_flag = true;
    }

    // 積極鍛錬と精密鍛錬は、小練習と新球大練習は別に補正がかかるので分離する必要あり
    if(which_train_ability == "積極鍛錬" || which_train_ability == "精密鍛錬") {
      for (a_ex of all_pattern_ex){
        let temp_attribute = [...a_ex["attribute"]];
        if(temp_attribute[0] == 1){
          let temp_name = a_ex["name"].replace('small', 'new_ball')
          temp_attribute[0] = 2;
          // 直接パターンを入れる（次の小AP追加の処理の対象にするため）
          all_pattern_ex.push(get_vals_dict_from_list(temp_name, a_ex["value"], temp_attribute));
          break; // 1回きり！
        }
      }

      // 新球大練習を作ったフラグをON
      create_new_ball_flug = true;
    }

    for (a_ex of all_pattern_ex){
      let temp_attribute = [...a_ex["attribute"]];
      if (temp_attribute[0] == 1 || temp_attribute[0] == 2){
        if(temp_attribute[0] == 2 && which_main_ap === "変化" && same_ap_and_map_flag == true){
          // 変化APで小APも変化の場合、変化の大練習は存在しないので除外
          continue;
        } else {
          const temp_name = "map_" + a_ex["name"];
          temp_attribute[1] = true;
          temp_values = a_ex["value"].map(num => num + 2);
          temp_dict_list.push(get_vals_dict_from_list(temp_name, temp_values, temp_attribute));
        }
      }
    }

    // パターンの記録
    for (a_dict of temp_dict_list){
      all_pattern_ex.push(a_dict);
    }

  }

  // 2. APによる経験値倍増処理(倍率設定から、計算)
  if(which_main_ap === "ミート"){
    ap_mul = 1.3
  } else if (which_main_ap === "パワー"){
    ap_mul = 1.4
  }

  temp_dict_list = []

  for (a_ex of all_pattern_ex){
    new_patter_flug = false;
    let temp_attribute = [...a_ex["attribute"]];
    if (temp_attribute[0] == 1 || temp_attribute[0] == 2){
      if(a_ex["name"] == "new_ball_train_ex") {
        // 新球大練習は除外
        continue;
      }
      if(same_ap_and_map_flag == true && temp_attribute[1] == true){
        // APと小APが同じになった時、小APのパターンをAP＋小APのパターンに変更する
        temp_attribute[2] = true;
        a_ex["name"] ="ap_" + a_ex["name"];
        a_ex["attribute"] = temp_attribute;
        a_ex["value"] = a_ex["value"].map(num => Math.floor(num * ap_mul));
      } else if(temp_attribute[0] != 2 || which_main_ap !== "変化"){
        // それ以外は追加
        const temp_name = "ap_" + a_ex["name"]
        temp_attribute[2] = true;
        temp_values = a_ex["value"].map(num => Math.floor(num * ap_mul));
        if(which_mini_ap ==="あり（APとは別）" && temp_attribute[1] == true){
          continue
        } else if(which_mini_ap === "あり（APと同じ）" && temp_attribute[1] != true){
          continue
        }
        temp_dict_list.push(get_vals_dict_from_list(temp_name, temp_values, temp_attribute));
      }
    }
  }
  for (a_dict of temp_dict_list){
    all_pattern_ex.push(a_dict);
  }

  // 3. YURによる経験値追加処理
  if(yur_flug === "あり"){
    for (a_ex of all_pattern_ex){
      if (a_ex["attribute"][0] == 1 || a_ex["attribute"][0] == 2){
        a_ex["value"] = a_ex["value"].map(num => num + 4);
      }
    }
  }

  // 4. メンタリスト能力持ちの嫁追加処理
  if(mental_wife_flug === "あり") {
    temp_dict_list = []

    for (a_ex of all_pattern_ex){
      let temp_attribute = [...a_ex["attribute"]];
      let update_flug = false;
      let change_flug = false;
      // 大練習と小練習を対象
      if (temp_attribute[0] == 1 || temp_attribute[0] == 2){
        if(which_main_ap === "精神" && temp_attribute[2] == true){
          // APが精神なら、APを対象とする
          change_flug = true;
        } else if (which_main_ap !== "精神" && temp_attribute[2] == false){
          // APが精神以外なら、APを対象としない
          update_flug = true;
        }
      }
      if (update_flug == true){
        // 更新対象の項目なら
        let temp_name = "mental_" + a_ex["name"]
        temp_attribute[3] = true;
        temp_values = a_ex["value"].map(num => num * 2);
        temp_dict_list.push(get_vals_dict_from_list(temp_name, temp_values, temp_attribute));
      } else if(change_flug == true) {
        // 既存のAPの記録を上書きする形で、メンタ嫁APに置き換える
        temp_attribute[3] = true;
        a_ex["name"] ="mental_" + a_ex["name"];
        a_ex["attribute"] = temp_attribute;
        a_ex["value"] = a_ex["value"].map(num => num * 2);
      }
    }
    for (a_dict of temp_dict_list){
      all_pattern_ex.push(a_dict);
    }

  }

  // 5.集中、及びイマイチやる気が出ない…による経験値加減処理
  if(which_concentrate === "集中"){

    for (a_ex of all_pattern_ex){
      if (a_ex["attribute"][0] == 1 || a_ex["attribute"][0] == 2){
        const temp_result = add_concentrate_ex_value_v2(a_ex["value"], a_ex["frequency"]);
        a_ex["value"] = temp_result[0];
        a_ex["frequency"] = temp_result[1];
      }
    }
    
  } else if(which_concentrate === "イマイチ"){

    for (a_ex of all_pattern_ex){
      if (a_ex["attribute"][0] == 1 || a_ex["attribute"][0] == 2){
        const temp_result = div_half_ex_value_v2(a_ex["value"], a_ex["frequency"]);
        a_ex["value"] = temp_result[0];
        a_ex["frequency"] = temp_result[1];
      }
    }
  
  }

  // 6. 各鍛錬による補正の結果

  // 大練習で下がるか
  const max_value_minus = Math.max(...large_minus_ex)
  if (max_value_minus < 0) {
    large_train_minus_flug = true;
  }

  // 各鍛錬の補正の結果

  if(which_train_ability === "積極鍛錬"){

    // 積極大練習時の経験値（新球、非AP、AP、マイナス）

    // APが積極鍛錬の対象かの確認（変化、スタミナ、精神は積極鍛錬は乗らない）
    let proactive_ap_flag = true;
    switch (which_main_ap){
      case '変化':
      case 'スタミナ':
      case '精神':
        proactive_ap_flag = false;
        break;
    }

    temp_dict_list = []

    for (a_ex of all_pattern_ex){
      let temp_attribute = [...a_ex["attribute"]];
      let result_flag = false;
      let temp_result = []
      if (temp_attribute[0] == 1 || temp_attribute[0] == 2 || temp_attribute[0] == 3){
        if (temp_attribute[0] == 1 && create_new_ball_flug == false){
           if (temp_attribute[2] == false && temp_attribute[3] == false) {
            // 新球大練習（AP除外、メンタ嫁除外）の時の対応（新球大練習がまだ未作成の場合）
            // 加算値の計算
            temp_result = add_proactive_train_values_v2(a_ex["value"], a_ex["frequency"], large_train_minus_flug);
            result_flag = true;
          }
        } else if (temp_attribute[0] == 2) {
          // APが積極鍛錬の対象、または非APなら加算値の計算を行う
          if (proactive_ap_flag == true || temp_attribute[2] == false){
            // メンタ嫁除外
            if (temp_attribute[3] == false) {
              // 加算値の計算
              temp_result = add_proactive_train_values_v2(a_ex["value"], a_ex["frequency"], large_train_minus_flug);
              result_flag = true;
            }
          }
        } else if(temp_attribute[0] == 3){
          // 減少値の計算
          temp_result = sub_proactive_train_values_v2(a_ex["value"], a_ex["frequency"], large_train_minus_flug);
          result_flag = true
        }
        if (result_flag == true){
          let temp_name = "proactive_" + a_ex["name"]
          if (temp_attribute[0] == 1){
            // 新球大練習なら名前を変更
            temp_name = temp_name.replace('small', 'new_ball')
          }
          temp_attribute[4] = 1;
          if((proactive_ap_flag == true && temp_attribute[2] == true) || 
             a_ex["name"] == "new_ball_train_ex" ||
             a_ex["name"] == "map_new_ball_train_ex" ) {
            // もしAPが積極鍛錬の対象、または新球大練習の場合は唯一なので、値を置き換える
            a_ex["name"] = temp_name;
            a_ex["value"] = temp_result[0]
            a_ex["attribute"] = temp_attribute
            a_ex["frequency"] = temp_result[1]
          } else {
            // それ以外は値を追加
            let out_dict = { 
              "name": temp_name, 
              "value": temp_result[0], 
              "attribute": temp_attribute,
              "frequency": temp_result[1]
            }
            temp_dict_list.push(out_dict);
            if (temp_attribute[0] == 1){
              // 新球大練習の追加の場合、小練習の項目の名前を変えるフラグを建てる
              create_new_ball_flug = true;
            }
          }
        }
      }
    } 
    for (a_dict of temp_dict_list){
      all_pattern_ex.push(a_dict);
    }

  } else if(which_train_ability === "慎重鍛錬"){  
    // 慎重大練習時のマイナス経験値

    for (a_ex of all_pattern_ex){
      let temp_attribute = [...a_ex["attribute"]];
      let temp_result = []
      if (temp_attribute[0] == 3){
        // 減少値の計算
        temp_result = div_cautious_train_value_v2(a_ex["value"], a_ex["frequency"], large_train_minus_flug);
        temp_attribute[4] = 2;
        // 既存の減少の記録を上書きする形で、置き換え
        a_ex["name"] ="cautious_" + a_ex["name"];
        a_ex["attribute"] = temp_attribute;
        a_ex["value"] = temp_result[0];
        a_ex["frequency"] = temp_result[1];
      }   
    }

  } else if(which_train_ability === "精密鍛錬"){

    temp_dict_list = []

    for (a_ex of all_pattern_ex){
      if (a_ex["attribute"][0] == 1){
        // 以下、新球大練習用の退避処理（退避処理がまだなら、ここで対応）、念のためAPは除外
        if(create_new_ball_flug == false && a_ex["attribute"][2] == false) {
          // 以下、新球大練習用の退避処理
          const temp_name = a_ex["name"].replace('small', 'new_ball');
          let temp_attribute = [...a_ex["attribute"]]; // ← スプレッドでコピー（下記の副次的な問題の対策も兼ねる）
          temp_attribute[0] = 2;
          temp_dict_list.push({
            "name": temp_name, 
            "value": [...a_ex["value"]], 
            "attribute": temp_attribute,
            "frequency": [...a_ex["frequency"]]
          });

          // 新球大練習作成フラグをON
          create_new_ball_flug = true;
        }

        // 退避の後、精密鍛錬を適用
        a_ex["value"] = add_precise_train_values(a_ex["value"]);
      }
    }

    for (a_dict of temp_dict_list){
      all_pattern_ex.push(a_dict);
    }

  } else if (which_train_ability === "平衡鍛錬"){

    temp_dict_list = []

    // 全パターンを平衡鍛錬に適用
    for (a_ex of all_pattern_ex){
      let temp_attribute = [...a_ex["attribute"]];
      let temp_result = []
      if (temp_attribute[0] == 1 || temp_attribute[0] == 2){
        temp_result = add_equilibrium_train_values_v3(a_ex["value"], a_ex["frequency"]);
        const temp_name = "equilibrium_" + a_ex["name"]
        temp_attribute[4] = 3;
        temp_dict_list.push({ 
          "name": temp_name, 
          "value": temp_result[0], 
          "attribute": temp_attribute,
          "frequency": temp_result[1]
        });
      }
    }
    for (a_dict of temp_dict_list){
      all_pattern_ex.push(a_dict);
    }
  }

  // 7. 筋肉養成ギプスの適用
  if(use_cast_flug === "あり"){
    for (a_ex of all_pattern_ex){
      if (a_ex["attribute"][0] == 1 || a_ex["attribute"][0] == 2){
        a_ex["value"] = a_ex["value"].map(num => Math.ceil(num * cast_mul));
      }
    }
  }

  // 8. 確率、期待値算出、ソート
  for (a_ex of all_pattern_ex) {
    let val_prob_list = []; // 出現値と確率を格納する配列
    let prob_list = []; // 確率を格納するリスト
    let count_vals_mul_freq = 0; // 出現値と頻度をかけた数をまとめる変数
    let count_freqs = 0; // 頻度をカウントする変数

    // 出現値と頻度を別配列に格納、そして出現値と頻度の積の総和と頻度の総和も記録
    for(a_point in a_ex["value"]){
      val_prob_list.push([a_ex["value"][a_point], a_ex["frequency"][a_point]])
      count_vals_mul_freq = count_vals_mul_freq + a_ex["value"][a_point] * a_ex["frequency"][a_point];
      count_freqs = count_freqs + a_ex["frequency"][a_point];
    }

    // 出現頻度を確率に変換（頻度を頻度の総和で割る）
    for(a_point in val_prob_list){
      val_prob_list[a_point][1] = val_prob_list[a_point][1] / count_freqs;
    }
    
    // 期待値の格納(出現値と頻度の積を総和と頻度の総和で割り、小数点2桁に丸める)
    a_ex["expected_value"] = Math.round(count_vals_mul_freq / count_freqs * 100) / 100;

    // 出現値のソート（ここで頻度と並びがずれるので、出現値と総和を事前に退避する必要がある）
    if(a_ex["attribute"][0] == 3) {
      // 大練習の減少のみ、降順
      a_ex["value"] = a_ex["value"].sort((a,b) => (a > b ? -1 : 1))
    } else {
      // 昇順
      a_ex["value"] = a_ex["value"].sort((a,b) => (a < b ? -1 : 1))
    }

    // 確率を出現値のソートに合わせて配列に格納
    for(a_value of a_ex["value"]){
      for(a_list of val_prob_list){
        if(a_value == a_list[0]){
          let a_prob = Math.round(a_list[1] * 10000) / 100; // 百分率表記に変更、小数点2桁に丸める
          const str_prob = String(a_prob) + "%" // 百分率の数値を文字列にして % を末尾に追加
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
   ["new_ball_train_ex", "新球大練習"],
   ["ap_small_train_ex", "AP小練習"],
   ["mental_small_train_ex", "メンタ精神小練習"],
   ["mental_ap_small_train_ex", "精神APメンタ精神小練習"],
   ["equilibrium_small_train_ex", "平衡小練習"],
   ["equilibrium_ap_small_train_ex", "AP平衡小練習"],
   ["equilibrium_mental_small_train_ex", "メンタ平衡精神小練習"],
   ["equilibrium_mental_ap_small_train_ex", "精神APメンタ平衡精神小練習"],
   ["map_small_train_ex", "小AP小練習、小AP新球大練習"],
   ["map_new_ball_train_ex", "小AP新球大練習"],
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
   ["proactive_new_ball_train_ex", "積極新球大練習"],
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
   ["proactive_map_new_ball_train_ex", "小AP積極新球大練習"],
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
  ]

  // 新球大練習を小練習から分けた時の、種類の表示名の変更
  if (create_new_ball_flug == true){
    for (a_point in output_names){
      let a_list = output_names[a_point];
      if(output_names[a_point][0] == "small_train_ex"){
        output_names[a_point][1] = "小練習";
      } else if(output_names[a_point][0] == "map_small_train_ex") {
        output_names[a_point][1] = "小AP小練習";
      }
    }
  }

  // 条件に合致する内容をスプレッドシートに表示
  for (a_name_list of output_names){
    for (a_ex of all_pattern_ex){
      if (a_name_list[0] == a_ex["name"]){
        sheet.getRange(start_line, 5).setValue(a_name_list[1]);
        sheet.getRange(start_line, 7, 1, a_ex["value"].length).setValues([a_ex["value"]]);
        sheet.getRange(start_line + 1, 7, 1, a_ex["probability"].length).setValues([a_ex["probability"]]);
        sheet.getRange(start_line, 22, 1,).setValue(a_ex["expected_value"]);
        start_line = start_line + 2;
      }
    }
  }

}