// =============================================
// みんなのジェネシス・ブロック - フロントエンド
// =============================================

// ※ ご自身のGASのWebアプリURLをここに設定してください
const GAS_URL = "https://script.google.com/macros/s/AKfycbxBQvh7ZChbWwQtWM2wf2BMt6rMtmbPBx9CGWZAEM2k-NJt8sysFuDoPxWBebIonJ3e/exec";

// 🐣 キャラクター定義 (画像フォルダに以下のファイル名で保存してください)
const CHARACTERS = {
  EGG: { name: "🥚 ジェネシス・ブロック (卵)", img: "images/egg.png" },
  BABY_BTC: { name: "👶 ビットくん", img: "images/baby_btc.png" },
  BABY_ALT: { name: "👶 アルトちゃん", img: "images/baby_alt.png" },
  BABY_SHIBA: { name: "🐶 シバいぬベビー", img: "images/baby_shiba.png" },
  KID_SMART: { name: "👦 スマートコントラクト・キッズ", img: "images/kids_smart.png" },
  KID_FOMO: { name: "🍼 フモートット", img: "images/kids_fomo.png" },
  KID_BAG: { name: "🎒 バグホルダー・キッド", img: "images/kids_bag.png" },
  ADULT_HODL: { name: "🐢 HODLer 亀 (ガチホの達人)", img: "images/adult_hodl.png" },
  ADULT_WHALE: { name: "🐳 課金王 クジラ (富豪)", img: "images/adult_whale.png" },
  ADULT_TRADER: { name: "🐰 トレーダー・ウサギ (イケイケ)", img: "images/adult_trader.png" },
  ADULT_DEFI: { name: "🧙‍♂️ DeFi ウィザード (開発者)", img: "images/adult_defi.png" },
  ADULT_RUGPULL: { name: "👿 ラグプル・スキャンプ (詐欺師)", img: "images/adult_rugpull.png" },
  SENIOR_MASTER: { name: "摸 オリジナルHODLマスター (伝説)", img: "images/senior_master.png" },
  GRAVEYARD: { name: "🪦 ブロックチェーンの海 (ゲームオーバー)", img: "images/graveyard.png" }
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
      display.textContent = Number(slider.value).toLocaleString() + " sats";
      updateBoostLabel();
    });
  }

  // ⚡ Boost チェック連携
  const boostCheck = document.getElementById("boost-check");
  const satSliderArea = document.getElementById("sat-slider-area");
  if (boostCheck && satSliderArea) {
    boostCheck.addEventListener("change", function() {
      satSliderArea.style.display = this.checked ? "block" : "none";
    });
  }

  // 文字数カウント連携 (③ 掲示板に書き込める文字数の表示)
  const msgInput = document.getElementById("user-msg");
  const charCounter = document.getElementById("char-counter");
  if (msgInput && charCounter) {
    msgInput.addEventListener("input", () => {
      const length = msgInput.value.length;
      charCounter.textContent = `${length} / 500`;
    });
  }
};

function updateBoostLabel() {
  const slider = document.getElementById("sat-amount");
  const label  = document.getElementById("boost-label");
  if (!slider || !label) return;
  const sats = Number(slider.value);
  label.innerHTML = `⚡ <strong>${sats.toLocaleString()} sats</strong> 払って効力を<strong>${sats}倍</strong>にする`;
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
    // ④ 全滅回数をGASから取得、ない場合は0をフォールバック
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

// ─── 🧬 育成・進化判定ロジック & UI更新 (①・④) ───
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

  // ④ 滅亡リスク（SELL比率）の計算と描画
  const sellRatio = totalPts > 0 ? (scores.SELL / totalPts) : 0;
  const sellPercentage = Math.round(sellRatio * 100);
  document.getElementById("sell-ratio-val").innerText = sellPercentage + "%";
  document.getElementById("risk-fill").style.width = sellPercentage + "%";

  let character = CHARACTERS.EGG;
  let nextTarget = 1000;
  let genName = "卵期";
  
  // バッドエンド判定 (5000pt以上かつSELLが全体の60%以上)
  if (sellRatio >= 0.6 && totalPts >= 5000) { 
    character = CHARACTERS.GRAVEYARD; 
    nextTarget = totalPts; // 進行停止
    genName = "🪦 滅亡期 (お墓)";
  } 
  // 卵期 (0 - 999pt)
  else if (totalPts < 1000) { 
    character = CHARACTERS.EGG; 
    nextTarget = 1000; 
    genName = "🥚 卵期";
  } 
  // ベビー期 (1,000 - 4,999pt)
  else if (totalPts < 5000) {
    nextTarget = 5000;
    genName = "👶 ベビー期";
    if (scores.FOMO > scores.HODL && scores.FOMO > scores.BUIDL) character = CHARACTERS.BABY_ALT;
    else if (scores.SELL > scores.HODL) character = CHARACTERS.BABY_SHIBA;
    else character = CHARACTERS.BABY_BTC;
  } 
  // キッズ期 (5,000 - 19,999pt)
  else if (totalPts < 20000) {
    nextTarget = 20000;
    genName = "👦 キッズ期";
    if (scores.FOMO > scores.HODL) character = CHARACTERS.KID_FOMO;
    else if (scores.SELL > scores.BUIDL) character = CHARACTERS.KID_BAG;
    else character = CHARACTERS.KID_SMART;
  } 
  // 大人期 (20,000 - 99,999pt)
  else if (totalPts < 100000) {
    nextTarget = 100000;
    genName = "🧑 大人期";
    if (scores.HODL > 50000) {
      character = CHARACTERS.ADULT_WHALE; // 超レア：クジラ
    } else {
      // 一番ポイントが高い勢力へ進化
      const maxPts = Math.max(scores.HODL, scores.FOMO, scores.BUIDL, scores.SELL);
      if (scores.HODL === maxPts) character = CHARACTERS.ADULT_HODL;
      else if (scores.FOMO === maxPts) character = CHARACTERS.ADULT_TRADER;
      else if (scores.BUIDL === maxPts) character = CHARACTERS.ADULT_DEFI;
      else character = CHARACTERS.ADULT_RUGPULL; // SELLが最多、または同点多数の場合など
    }
  } 
  // 伝説期 (100,000pt -)
  else { 
    character = CHARACTERS.SENIOR_MASTER; 
    nextTarget = totalPts; // カンスト
    genName = "摸 伝説期";
  }

  // 画面に適用
  document.getElementById("character-img").src = character.img;
  document.getElementById("evolution-status").innerText = character.name;
  document.getElementById("current-generation").innerText = "現在: " + genName;
  
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

  status.innerText = "インボイス生成中...";
  if (amtText) amtText.innerText = `お支払い金額: ${sats.toLocaleString()} sats`;
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
    status.innerText = `⚡ ${sats} sats のインボイスです。支払いを完了させてください。`;

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
      document.getElementById("payment-status").innerText = "✅ 支払い確認！効力" + sats + "倍で反映します！";
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

function escHtml(str) {
  if (!str) return "";
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ─── 進化ツリー画像のモーダル表示用 ───
function openTreeModal() {
  document.getElementById("tree-modal").style.display = "flex";
}

function closeTreeModal() {
  document.getElementById("tree-modal").style.display = "none";
}
