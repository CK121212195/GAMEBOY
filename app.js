// =============================================
// みんなのジェネシス・ブロック - フロントエンド
// =============================================

// ※ ご自身のGASのWebアプリURLをここに設定してください
const GAS_URL = "https://script.google.com/macros/s/AKfycbxBQvh7ZChbWwQtWM2wf2BMt6rMtmbPBx9CGWZAEM2k-NJt8sysFuDoPxWBebIonJ3e/exec";

// 🐣 【全30種類】ツリー完全同期キャラクター定義
const CHARACTERS = {
  // --- Egg (1) ---
  EGG: { name: "🥚 GENESIS BLOCK EGG (ジェネシス・ブロック)", img: "images/egg.png" },

  // --- Baby (3) ---
  BABY_BTC: { name: "👶 BITCOIN-KUN (ビットくん)", img: "images/baby_btc.png" },
  BABY_ALT: { name: "👶 ALT-CHAN (アルトちゃん)", img: "images/baby_alt.png" },
  BABY_SHIBA: { name: "🐶 SHIBA INU BABY (シバいぬベビー)", img: "images/baby_shiba.png" },

  // --- Kids (6) ---
  KID_SMART: { name: "👦 SMART CONTRACT KID (スマートコントラクト)", img: "images/kids_smart.png" },
  KID_DAO: { name: "👦 DAO CHILD (DAO ガイド)", img: "images/kids_dao.png" },
  KID_LEDGER: { name: "👦 LEDGER PAL (レジャー・バル)", img: "images/kids_ledger.png" },
  KID_NODELING: { name: "👦 NODELING (ノドリング)", img: "images/kids_nodeling.png" },
  KID_BAG: { name: "🎒 BAGHOLDER-KID (バグホルダー)", img: "images/kids_bag.png" },
  KID_FOMO: { name: "🍼 FOMO-TOT (フモートット)", img: "images/kids_fomo.png" },

  // --- Adult (15) ---
  ADULT_HODL_TURTLE: { name: "🐢 HODLER, 亀", img: "images/adult_hodl_turtle.png" },
  ADULT_TRADER_BUNNY: { name: "🐰 TRADER-BUNNY (トラダー, ウサギ)", img: "images/adult_trader_bunny.png" },
  ADULT_MINER_MOLE: { name: "🦫 MINER-MOLE (ミニアー, モグラ)", img: "images/adult_miner_mole.png" },
  ADULT_WHALE: { name: "🐳 WHALE, 王様 (課金クジラ)", img: "images/adult_whale.png" },
  ADULT_DOGE_KNIGHT: { name: "🐕 DOGE-KNIGHT (ドゴジ, 騎士)", img: "images/adult_doge_knight.png" },
  ADULT_SATOSHI_BOT: { name: "🤖 SATOSHI-BOT (ソソシーボット)", img: "images/adult_satoshi_bot.png" },
  ADULT_DEFI_WIZARD: { name: "🧙‍♂️ DEFI-WIZARD (デFi-ウィザード)", img: "images/adult_defi_wizard.png" },
  ADULT_NF_PET: { name: "🦜 NF-PET (NF-ペット)", img: "images/adult_nf_pet.png" },
  ADULT_STAKING_LLAMA: { name: "🦙 STAKING-LLAMA (スタキング-ララマ)", img: "images/adult_staking_llama.png" },
  ADULT_MEMECOIN_CAT: { name: "🐱 MEMECOIN-CAT (メモコイン-カット)", img: "images/adult_memecoin_cat.png" },
  ADULT_RUGPULL_SCAMP: { name: "👿 RUGPULL-SCAMP (リグプルルースケンプ)", img: "images/adult_rugpull_scamp.png" },
  ADULT_STABLECOIN_ROCK: { name: "🪨 STABLECOIN-ROCK (スタブルコーン-ロック)", img: "images/adult_stablecoin_rock.png" },
  ADULT_HARDFORK_TWINS: { name: "👬 HARDFORK-TWINS (ハードフォーク-ツイン)", img: "images/adult_hardfork_twins.png" },
  ADULT_GAS_FEE_CLOUD: { name: "☁️ GAS-FEE-CLOUD (カス-フェー-クロード)", img: "images/adult_gas_fee_cloud.png" },
  ADULT_PUMP_DUMP_IMP: { name: "😈 PUMP-AND-DUMP-IMP (パンプ-アンド-ダンプ-イマプ)", img: "images/adult_pump_dump_imp.png" },

  // --- Senior/Special (4) ---
  SENIOR_DEITY: { name: "😇 BLOCKCHAIN DEITY (チィティ)", img: "images/senior_deity.png" },
  SENIOR_ARCHMAGE: { name: "🧙‍♂️ DEFI ARCHMAGE (デフィアクマジ)", img: "images/senior_archmage.png" },
  SENIOR_WYVERN: { name: "🐉 ETHEREAL WYVERN (エチュアル ワイベーン)", img: "images/senior_wyvern.png" },
  SENIOR_MASTER: { name: "摸 ORIGINAL HODL MASTER (オリジナル HODL マスター)", img: "images/senior_master.png" },

  // --- Graveyard/Ascension (1/お墓) ---
  GRAVEYARD: { name: "🪦 BLOCKCHAIN SEA ASCENSION (ブロックチェーンの海)", img: "images/graveyard.png" }
};

let paymentChecker = null;

// ─── 起動処理 ───
window.onload = () => {
  fetchBlockHeight();
  fetchData();
  setInterval(fetchData, 5000); // 5秒ごとに最新のチャットを取得
  setInterval(fetchBlockHeight, 60000); // 1分ごとにブロック高を取得

  // スライダー連携
  const slider = document.getElementById("sat-amount");
  const display = document.getElementById("sat-display");
  if (slider && display) {
    slider.addEventListener("input", () => {
      const sats = Number(slider.value);
      display.textContent = sats.toLocaleString() + " sats";
      updateBoostLabel();
      
      // ② つまみ（◯）のサイズを対数スケールでダイナミックに可変
      // 10sats時 = 16px、10000sats時 = 46px
      const size = 16 + (Math.log10(sats) - 1) * 10;
      document.documentElement.style.setProperty('--thumb-size', `${size}px`);
    });
    
    // 初回のつまみサイズ初期設定
    const initialSats = Number(slider.value);
    const initialSize = 16 + (Math.log10(initialSats) - 1) * 10;
    document.documentElement.style.setProperty('--thumb-size', `${initialSize}px`);
  }

  // ⚡ Boost チェック連携
  const boostCheck = document.getElementById("boost-check");
  const satSliderArea = document.getElementById("sat-slider-area");
  if (boostCheck && satSliderArea) {
    boostCheck.addEventListener("change", function() {
      satSliderArea.style.display = this.checked ? "block" : "none";
    });
  }

  // 文字数カウント連携
  const msgInput = document.getElementById("user-msg");
  const charCounter = document.getElementById("char-counter");
  if (msgInput && charCounter) {
    msgInput.addEventListener("input", () => {
      const length = msgInput.value.length;
      charCounter.textContent = `${length} / 500`;
    });
  }
};

// ③ 表現の「育成投資」化
function updateBoostLabel() {
  const slider = document.getElementById("sat-amount");
  const label  = document.getElementById("boost-label");
  if (!slider || !label) return;
  const sats = Number(slider.value);
  label.innerHTML = `⚡ <strong>${sats.toLocaleString()} sats</strong> 投資して育成パワーを<strong>${sats}倍</strong>にする`;
}

// ─── 📢 ① X (Twitter) 140文字に余裕で収まるコンパクト拡散シェア文面 ───
function shareOnTwitter() {
  const charName = document.getElementById("evolution-status").innerText;
  const totalPt = document.getElementById("total-pt").innerText;
  const blockHeight = document.getElementById("block-height").innerText;
  
  // 140文字（日本語）の上限を絶対に超えないよう最適化した短いテキスト (HODL, SATOSHIっちタグ削除済)
  const text = `【みんなのジェネシス・ブロック】\nブロック高: ${blockHeight}\n現在の姿: ${charName} (${totalPt} pt)\nみんなでsats投資して伝説のマスターへ進化させよう！\n`;
  const url = window.location.href;
  const hashtags = "みんなのジェネシス・ブロック,育成sats"; // タグ数を2つに制限して安全設計
  
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}&hashtags=${encodeURIComponent(hashtags)}`;
  window.open(twitterUrl, "_blank");
}

// ─── ブロック高取得 ───
async function fetchBlockHeight() {
  try {
    const res = await fetch("https://mempool.space/api/blocks/tip/height");
    const height = await res.text();
    document.getElementById("block-height").innerText = Number(height).toLocaleString();
  } catch (e) {}
}

// ─── GASからデータ取得 ───
async function fetchData() {
  try {
    const res = await fetch(GAS_URL + "?action=getChat");
    const data = await res.json();
    if (data.error) return;
    
    updateChatUI(data.chats);
    // テスト項目不要のため、直接リアルタイムデータを反映
    updateScoreUI(data.votes, data.deaths || 0);
  } catch (e) {}
}

// ─── 実況板UIの更新 ───
function updateChatUI(chats) {
  const box = document.getElementById("chat-box");
  const wasAtBottom = box.scrollHeight - box.clientHeight <= box.scrollTop + 10;
  
  box.innerHTML = "";
  chats.forEach((chat, index) => {
    const div = document.createElement("div");
    div.className = "chat-post";
    const isBoost = chat.weight >= 10;
    const badgeClass = isBoost ? "cmd-badge boosted" : "cmd-badge";
    const boostText = isBoost ? `⚡×${chat.weight}` : "";
    
    div.innerHTML = `
      <div class="chat-meta">${index + 1} 名前：${escHtml(chat.name)} 投稿日：${chat.time}</div>
      <div class="chat-text">
        <span class="${badgeClass}">${escHtml(chat.command)} ${boostText}</span>
        ${escHtml(chat.message)}
      </div>`;
    box.appendChild(div);
  });
  
  if (wasAtBottom) box.scrollTop = box.scrollHeight;
}

// ─── 🧬 育成・30種完全同期進化判定ロジック ───
function updateScoreUI(votes, deaths = 0) {
  const scores = { HODL: votes.HODL || 0, FOMO: votes.FOMO || 0, BUIDL: votes.BUIDL || 0, SELL: votes.SELL || 0 };
  const totalPts = scores.HODL + scores.FOMO + scores.BUIDL + scores.SELL;
  
  // ① コマンド勢力図（投票件数）とメーターの動的連動
  Object.entries(scores).forEach(([cmd, score]) => {
    const el = document.getElementById("score-" + cmd);
    if (el) el.innerText = score.toLocaleString();

    const bar = document.getElementById("bar-" + cmd);
    if (bar) {
      const percentage = totalPts > 0 ? (score / totalPts) * 100 : 0;
      bar.style.width = percentage + "%";
    }
  });

  // ④ 全滅回数と総獲得ポイントの表示
  document.getElementById("death-count").innerText = deaths.toLocaleString();
  document.getElementById("total-pt").innerText = totalPts.toLocaleString();

  // ④ 滅亡リスク（SELL比率）の計算と表示
  const sellRatio = totalPts > 0 ? (scores.SELL / totalPts) : 0;
  const sellPercentage = Math.round(sellRatio * 100);
  document.getElementById("sell-ratio-val").innerText = sellPercentage + "%";
  document.getElementById("risk-fill").style.width = sellPercentage + "%";

  let character = CHARACTERS.EGG;
  let nextTarget = 1000;
  let genName = "卵期";

  // コマンドの強さ順ソート (1位と2位のコンビを検出)
  const sorted = Object.entries(scores)
    .map(([name, val]) => ({ name, val }))
    .sort((a, b) => b.val - a.val);
  const max1 = sorted[0].name;
  const max2 = sorted[1].name;

  // 建設的エネルギー (HODL + BUIDL) の割合 (High / Avg / Low Care用)
  const constructive = scores.HODL + scores.BUIDL;
  const careRatio = totalPts > 0 ? (constructive / totalPts) : 0;
  
  // ─── 判定マトリクス ───
  
  // 0. バッドエンド（お墓）判定 (5,000pt以上かつSELLが全体の60%以上)
  if (sellRatio >= 0.6 && totalPts >= 5000) { 
    character = CHARACTERS.GRAVEYARD; 
    nextTarget = totalPts; // 進行停止
    genName = "🪦 滅亡期 (お墓)";
  } 
  // 1. 卵期 (0 - 999pt)
  else if (totalPts < 1000) { 
    character = CHARACTERS.EGG; 
    nextTarget = 1000; 
    genName = "🥚 卵期";
  } 
  // 2. ベビー期 (1,000 - 4,999pt)
  else if (totalPts < 5000) {
    nextTarget = 5000;
    genName = "👶 ベビー期";
    if (max1 === "FOMO") {
      character = CHARACTERS.BABY_ALT; // アルトちゃん
    } else if (max1 === "SELL") {
      character = CHARACTERS.BABY_SHIBA; // シバいぬベビー
    } else {
      character = CHARACTERS.BABY_BTC; // ビットくん
    }
  } 
  // 3. キッズ期 (5,000 - 19,999pt) [画像にある全6種類のキッズへ分岐]
  else if (totalPts < 20000) {
    nextTarget = 20000;
    genName = "👦 キッズ期";
    
    if (careRatio >= 0.65) {
      character = CHARACTERS.KID_SMART; // スマートコントラクト
    } else if (careRatio >= 0.4) {
      if (scores.BUIDL > scores.HODL) {
        character = CHARACTERS.KID_DAO; // DAO ガイド
      } else {
        character = CHARACTERS.KID_LEDGER; // レジャー・バル
      }
    } else {
      if (max1 === "HODL") {
        character = CHARACTERS.KID_NODELING; // ノドリング
      } else if (max1 === "SELL") {
        character = CHARACTERS.KID_BAG; // バグホルダー
      } else {
        character = CHARACTERS.KID_FOMO; // フモートット
      }
    }
  } 
  // 4. 大人期 (20,000 - 99,999pt) [画像にある全15種類の大人へ1位2位マトリクスで完璧に分岐]
  else if (totalPts < 100000) {
    nextTarget = 100000;
    genName = "🧑 大人期";
    
    // ★超レア進化：HODL単体が50,000pt以上
    if (scores.HODL >= 50000) {
      character = CHARACTERS.ADULT_WHALE; // WHALE, 王様
    } else {
      // 1位(max1)と2位(max2)の組み合わせで15パターンを網羅
      if (max1 === "HODL") {
        if (max2 === "BUIDL") character = CHARACTERS.ADULT_MINER_MOLE; // モグラ
        else if (max2 === "FOMO") character = CHARACTERS.ADULT_STAKING_LLAMA; // ララマ
        else if (max2 === "SELL") character = CHARACTERS.ADULT_SATOSHI_BOT; // サトシボット
        else character = CHARACTERS.ADULT_HODL_TURTLE; // 亀
      } 
      else if (max1 === "FOMO") {
        if (max2 === "HODL") character = CHARACTERS.ADULT_DOGE_KNIGHT; // ドージ騎士
        else if (max2 === "BUIDL") character = CHARACTERS.ADULT_DEFI_WIZARD; // DeFiウィザード
        else if (max2 === "SELL") character = CHARACTERS.ADULT_MEMECOIN_CAT; // メモコインカット
        else character = CHARACTERS.ADULT_TRADER_BUNNY; // ウサギ
      } 
      else if (max1 === "BUIDL") {
        if (max2 === "HODL") character = CHARACTERS.ADULT_HARDFORK_TWINS; // ハードフォークツイン
        else if (max2 === "FOMO") character = CHARACTERS.ADULT_NF_PET; // NFペット
        else if (max2 === "SELL") character = CHARACTERS.ADULT_GAS_FEE_CLOUD; // カスフェークロード
        else character = CHARACTERS.ADULT_MINER_MOLE;
      } 
      else { // max1 === "SELL"
        if (max2 === "HODL") character = CHARACTERS.ADULT_STABLECOIN_ROCK; // スタブルコーンロック
        else if (max2 === "FOMO") character = CHARACTERS.ADULT_PUMP_DUMP_IMP; // パンプダンプイマプ
        else if (max2 === "BUIDL") character = CHARACTERS.ADULT_RUGPULL_SCAMP; // リグプルルースケンプ
        else character = CHARACTERS.ADULT_RUGPULL_SCAMP;
      }
    }
  } 
  // 5. 伝説期 (100,000pt -) [画像にある全4種類の最終形態へ分岐]
  else { 
    nextTarget = totalPts; // カンスト
    genName = "摸 伝説期";
    
    // シニア期の4分岐
    if ((max1 === "HODL" && max2 === "BUIDL") || (max1 === "BUIDL" && max2 === "HODL")) {
      character = CHARACTERS.SENIOR_DEITY; // チィティ (BLOCKCHAIN DEITY)
    } else if ((max1 === "BUIDL" && max2 === "FOMO") || (max1 === "FOMO" && max2 === "BUIDL")) {
      character = CHARACTERS.SENIOR_ARCHMAGE; // デフィアクマジ (DEFI ARCHMAGE)
    } else if ((max1 === "HODL" && max2 === "FOMO") || (max1 === "FOMO" && max2 === "HODL")) {
      character = CHARACTERS.SENIOR_WYVERN; // エチュアルワイベーン (ETHEREAL WYVERN)
    } else {
      character = CHARACTERS.SENIOR_MASTER; // オリジナル HODL マスター
    }
  }

  // 画面に適用
  document.getElementById("character-img").src = character.img;
  document.getElementById("evolution-status").innerText = character.name;
  document.getElementById("current-generation").innerText = "現在: " + genName;
  
  // モニターバッジ部分のSFネオンテキストの更新
  const badge = document.getElementById("character-badge-text");
  if (badge) {
    if (character === CHARACTERS.GRAVEYARD) {
      badge.innerText = "⚠️ SYSTEM CRITICAL";
      badge.style.color = "#ff5252";
      badge.style.borderColor = "#ff5252";
      badge.style.boxShadow = "0 0 10px rgba(255, 82, 82, 0.3)";
    } else {
      badge.innerText = "TARGET ACQUIRED";
      badge.style.color = "#f7931a";
      badge.style.borderColor = "rgba(247, 147, 26, 0.4)";
      badge.style.boxShadow = "0 0 10px rgba(247, 147, 26, 0.15)";
    }
  }
  
  // プログレスバーの更新
  let progress = 100;
  if (nextTarget > totalPts) { progress = (totalPts / nextTarget) * 100; }
  document.getElementById("evolution-progress").style.width = progress + "%";
  document.getElementById("next-evolution-pt").innerText = nextTarget.toLocaleString();

  // ④ お墓時の復活誘導メッセージ切り替え
  const resTip = document.getElementById("resurrection-tip");
  if (character === CHARACTERS.GRAVEYARD) {
    resTip.innerHTML = `<strong>💀 全滅中！</strong> みんなで「HODL」「FOMO」「BUIDL」を書き込んで（または投げ銭ブーストして）<strong>SELLの比率を60%未満に下げれば、即座に蘇生（現在の世代で復活）</strong>します！`;
    resTip.style.color = "#ff8a80";
  } else {
    resTip.innerHTML = `※ゲームオーバー（お墓）になっても、みんなで「HODL」などを書き込んで<strong>SELLの比率を60%未満に下げればその場で即座に復活</strong>します！`;
    resTip.style.color = "#aaa";
  }
}

// ─── メッセージ送信処理 ───
async function sendMessage() {
  const name = document.getElementById("user-name").value.trim() || "名無しサトシ";
  const msg = document.getElementById("user-msg").value.trim();
  const cmd = document.getElementById("command-select").value;
  const isBoost = document.getElementById("boost-check").checked;
  const sats = isBoost ? Number(document.getElementById("sat-amount").value) : 0;

  if (!msg) return alert("コメントを入力してください");
  document.getElementById("send-btn").disabled = true;

  if (isBoost && sats >= 10) await requestInvoice(name, msg, cmd, sats);
  else await postToGAS(name, msg, cmd, 1);
}

// ─── ⚡ インボイスの生成とスマホアプリ連携 ───
async function requestInvoice(name, msg, cmd, sats) {
  const modal = document.getElementById("payment-modal");
  const status = document.getElementById("payment-status");
  const qrdiv = document.getElementById("qrcode");
  const walletLink = document.getElementById("wallet-link");
  const amtText = document.getElementById("invoice-amount-text");

  status.innerText = "投資用インボイス生成中...";
  if (amtText) amtText.innerText = `今回の育成投資額: ${sats.toLocaleString()} sats`;
  document.getElementById("invoice-text").value = "";
  qrdiv.innerHTML = "";
  walletLink.style.display = "none";
  modal.style.display = "flex";

  try {
    const url = `${GAS_URL}?action=createInvoice&command=${encodeURIComponent(cmd)}&amount=${sats}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.error) throw new Error(data.details || data.code);

    const invoice = data.payment_request;
    document.getElementById("invoice-text").value = invoice;
    new QRCode(qrdiv, { text: invoice, width: 200, height: 200 });
    
    walletLink.href = "lightning:" + invoice;
    walletLink.style.display = "block"; 
    status.innerText = `⚡ ${sats} sats の投資インボイスです。アプリから投資を完了させてください。`;

    paymentChecker = setInterval(() => checkPayment(data.payment_hash, name, msg, cmd, sats), 3000);
  } catch (e) {
    alert("インボイスの生成に失敗しました: " + e.message);
    closeModal();
  }
}

// ─── 支払い確認ポーリング ───
async function checkPayment(hash, name, msg, cmd, sats) {
  try {
    const res = await fetch(`${GAS_URL}?action=checkPayment&hash=${hash}`);
    const data = await res.json();
    
    if (data.paid) {
      clearInterval(paymentChecker);
      document.getElementById("payment-status").innerText = "✅ 投資確認！育成パワー " + sats + " 倍を反映します！";
      await postToGAS(name, msg, cmd, sats);
      setTimeout(closeModal, 1500);
    }
  } catch (e) {}
}

// ─── GASへ書き込み ───
async function postToGAS(name, msg, cmd, weight) {
  try {
    const url = `${GAS_URL}?action=postMessage&name=${encodeURIComponent(name)}&message=${encodeURIComponent(msg)}&command=${encodeURIComponent(cmd)}&weight=${weight}`;
    await fetch(url);
    resetInput();
    fetchData(); 
  } catch (e) {
    alert("通信エラーが発生しました。");
    resetInput();
  }
}

// ─── インボイスのコピー機能 (クリップボードAPI対応) ───
function copyInvoice() {
  const txt = document.getElementById("invoice-text");
  if (!txt || !txt.value) return;
  txt.select();
  txt.setSelectionRange(0, 99999); // モバイル環境用
  navigator.clipboard.writeText(txt.value).then(() => {
    alert("インボイスをコピーしました！");
  }).catch(() => {
    // 古いブラウザ向けのフォールバック処理
    document.execCommand("copy");
    alert("インボイスをコピーしました！");
  });
}

// ─── ユーティリティ ───
function resetInput() {
  document.getElementById("user-msg").value = "";
  document.getElementById("char-counter").textContent = "0 / 500"; // 文字数リセット
  document.getElementById("boost-check").checked = false;
  document.getElementById("send-btn").disabled = false;
  document.getElementById("sat-slider-area").style.display = "none";
}

function closeModal() {
  document.getElementById("payment-modal").style.display = "none";
  if (paymentChecker) { clearInterval(paymentChecker); paymentChecker = null; }
  document.getElementById("send-btn").disabled = false;
}

// 進化ツリー画像のモーダル表示用
function openTreeModal() {
  document.getElementById("tree-modal").style.display = "flex";
}

function closeTreeModal() {
  document.getElementById("tree-modal").style.display = "none";
}

function escHtml(str) {
  if (!str) return "";
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
