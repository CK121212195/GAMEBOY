// =============================================
// みんなのジェネシス・ブロック - フロントエンド
// =============================================

// ※ ご自身のGASのWebアプリURLをここに設定してください
const GAS_URL = "https://script.google.com/macros/s/AKfycbxBQvh7ZChbWwQtWM2wf2BMt6rMtmbPBx9CGWZAEM2k-NJt8sysFuDoPxWBebIonJ3e/exec";

// 🐣 キャラクターと進化ツリー定義 (全30種から代表的なものをマッピング)
// ※「images」フォルダを作成し、該当の画像ファイル名で設置してください
const CHARACTERS = {
  // 卵
  EGG: { name: "🥚 ジェネシス・ブロック (卵)", img: "images/egg.png" },
  
  // ベビー期 (Total Pt: 1,000 ~ 5,000)
  BABY_BTC: { name: "👶 ビットくん", img: "images/baby_btc.png" },
  BABY_ALT: { name: "👶 アルトちゃん", img: "images/baby_alt.png" },
  BABY_SHIBA: { name: "🐶 シバいぬベビー", img: "images/baby_shiba.png" },
  
  // キッズ期 (Total Pt: 5,000 ~ 20,000)
  KID_SMART: { name: "👦 スマートコントラクト・キッズ", img: "images/kids_smart.png" },
  KID_FOMO: { name: "🍼 フモートット", img: "images/kids_fomo.png" },
  KID_BAG: { name: "🎒 バグホルダー・キッド", img: "images/kids_bag.png" },
  
  // 大人期 (Total Pt: 20,000 ~ 100,000)
  ADULT_HODL: { name: "🐢 HODLer 亀 (ガチホの達人)", img: "images/adult_hodl.png" },
  ADULT_WHALE: { name: "🐳 課金王 クジラ (富豪)", img: "images/adult_whale.png" },
  ADULT_TRADER: { name: "🐰 トレーダー・ウサギ (イケイケ)", img: "images/adult_trader.png" },
  ADULT_DEFI: { name: "🧙‍♂️ DeFi ウィザード (開発者)", img: "images/adult_defi.png" },
  ADULT_RUGPULL: { name: "👿 ラグプル・スキャンプ (詐欺師)", img: "images/adult_rugpull.png" },
  
  // シニア期 (Total Pt: 100,000 ~ )
  SENIOR_MASTER: { name: "摸 オリジナルHODLマスター (伝説)", img: "images/senior_master.png" },
  
  // 墓場 (SELLが過半数を超え続けた悲劇の結末)
  GRAVEYARD: { name: "🪦 ブロックチェーンの海 (ゲームオーバー)", img: "images/graveyard.png" }
};

let paymentChecker = null;

// ─── 起動処理 ───
window.onload = () => {
  fetchBlockHeight();
  fetchData();
  // 5秒ごとに実況板を更新
  setInterval(fetchData, 5000);
  // 1分ごとにブロック高を更新
  setInterval(fetchBlockHeight, 60000);

  // satsスライダーのリアルタイム表示
  const slider = document.getElementById("sat-amount");
  const display = document.getElementById("sat-display");
  if (slider && display) {
    slider.addEventListener("input", () => {
      display.textContent = Number(slider.value).toLocaleString() + " sats";
      updateBoostLabel();
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
  } catch (e) {
    console.warn("ブロック高取得エラー:", e);
  }
}

// ─── GASからデータ取得 ───
async function fetchData() {
  try {
    const res = await fetch(GAS_URL + "?action=getChat");
    const data = await res.json();
    if (data.error) return;
    
    updateChatUI(data.chats);
    updateScoreUI(data.votes);
  } catch (e) {
    console.error("データ取得エラー:", e);
  }
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
  
  // 自動スクロール
  if (wasAtBottom) box.scrollTop = box.scrollHeight;
}

// ─── 🧬 育成・進化判定ロジック ───
function updateScoreUI(votes) {
  const scores = {
    HODL: votes.HODL || 0,
    FOMO: votes.FOMO || 0,
    BUIDL: votes.BUIDL || 0,
    SELL: votes.SELL || 0
  };

  Object.entries(scores).forEach(([cmd, score]) => {
    const el = document.getElementById("score-" + cmd);
    if (el) el.innerText = score.toLocaleString();
  });

  const totalPts = scores.HODL + scores.FOMO + scores.BUIDL + scores.SELL;
  let character = CHARACTERS.EGG;
  let nextTarget = 1000;
  
  // ▼ 進化ツリーの条件分岐 ▼
  const sellRatio = totalPts > 0 ? (scores.SELL / totalPts) : 0;
  
  // SELL(売り)が全体ポイントの60%を超え、かつある程度育っていると「墓場」行き
  if (sellRatio > 0.6 && totalPts > 5000) {
    character = CHARACTERS.GRAVEYARD;
    nextTarget = totalPts; // 進化終了
  } 
  // 卵期 (0 - 999 pt)
  else if (totalPts < 1000) {
    character = CHARACTERS.EGG;
    nextTarget = 1000;
  } 
  // ベビー期 (1,000 - 4,999 pt)
  else if (totalPts < 5000) {
    nextTarget = 5000;
    if (scores.FOMO > scores.HODL && scores.FOMO > scores.BUIDL) character = CHARACTERS.BABY_ALT;
    else if (scores.SELL > scores.HODL) character = CHARACTERS.BABY_SHIBA;
    else character = CHARACTERS.BABY_BTC;
  } 
  // キッズ期 (5,000 - 19,999 pt)
  else if (totalPts < 20000) {
    nextTarget = 20000;
    if (scores.FOMO > scores.HODL) character = CHARACTERS.KID_FOMO;
    else if (scores.SELL > scores.BUIDL) character = CHARACTERS.KID_BAG;
    else character = CHARACTERS.KID_SMART;
  } 
  // 大人期 (20,000 - 99,999 pt)
  else if (totalPts < 100000) {
    nextTarget = 100000;
    if (scores.HODL > 50000) character = CHARACTERS.ADULT_WHALE; // 超絶課金ガチホ
    else if (scores.HODL > Math.max(scores.FOMO, scores.SELL)) character = CHARACTERS.ADULT_HODL;
    else if (scores.FOMO > Math.max(scores.HODL, scores.BUIDL)) character = CHARACTERS.ADULT_TRADER;
    else if (scores.BUIDL > Math.max(scores.FOMO, scores.SELL)) character = CHARACTERS.ADULT_DEFI;
    else character = CHARACTERS.ADULT_RUGPULL; // 中途半端に売りが多いと詐欺師に
  } 
  // シニア・伝説期 (100,000 pt以上)
  else {
    character = CHARACTERS.SENIOR_MASTER;
    nextTarget = totalPts; // カンスト
  }

  // 画面UIに反映
  document.getElementById("character-img").src = character.img;
  document.getElementById("evolution-status").innerText = "現在の状態: " + character.name;
  
  // プログレスバーの計算と反映
  let progress = 100;
  if (nextTarget > totalPts) {
    // 次の進化までの割合をざっくり計算
    progress = (totalPts / nextTarget) * 100;
  }
  document.getElementById("evolution-progress").style.width = progress + "%";
  document.getElementById("next-evolution-pt").innerText = nextTarget.toLocaleString();
}

// ─── メッセージ送信処理 ───
async function sendMessage() {
  const name = document.getElementById("user-name").value.trim() || "名無しサトシ";
  const msg = document.getElementById("user-msg").value.trim();
  const cmd = document.getElementById("command-select").value;
  const isBoost = document.getElementById("boost-check").checked;
  const sats = isBoost ? Number(document.getElementById("sat-amount").value) : 0;

  if (!msg) {
    alert("コメントを入力してください");
    return;
  }

  document.getElementById("send-btn").disabled = true;

  // Boost決済がある場合はインボイス生成へ、なければ通常送信
  if (isBoost && sats >= 10) {
    await requestInvoice(name, msg, cmd, sats);
  } else {
    await postToGAS(name, msg, cmd, 1);
  }
}

// ─── ⚡ インボイスの生成とスマホアプリ連携 ───
async function requestInvoice(name, msg, cmd, sats) {
  const modal = document.getElementById("payment-modal");
  const status = document.getElementById("payment-status");
  const qrdiv = document.getElementById("qrcode");
  const walletLink = document.getElementById("wallet-link");

  status.innerText = "インボイス生成中...";
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
    
    // 🔥 スマホ用の lightning: プロトコルリンクを設定（ウォレットアプリ自動起動用）
    walletLink.href = "lightning:" + invoice;
    walletLink.style.display = "block"; 

    status.innerText = `⚡ ${sats} sats のインボイスです。支払いを完了させてください。`;

    // 3秒に1回、支払い完了をチェック
    paymentChecker = setInterval(() => checkPayment(data.payment_hash, name, msg, cmd, sats), 3000);
  } catch (e) {
    alert("生成失敗: " + e.message);
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
      // 成功を見せてからモーダルを閉じる
      setTimeout(closeModal, 1500);
    }
  } catch (e) {
    // エラー時はスキップ（次回ポーリングで再度確認）
  }
}

// ─── GASへ書き込み ───
async function postToGAS(name, msg, cmd, weight) {
  try {
    const url = `${GAS_URL}?action=postMessage&name=${encodeURIComponent(name)}&message=${encodeURIComponent(msg)}&command=${encodeURIComponent(cmd)}&weight=${weight}`;
    await fetch(url);
    resetInput();
    fetchData(); // 即座に画面を更新
  } catch (e) {
    alert("通信エラーが発生しました。");
    resetInput();
  }
}

// ─── ユーティリティ ───
function resetInput() {
  document.getElementById("user-msg").value = "";
  document.getElementById("boost-check").checked = false;
  document.getElementById("send-btn").disabled = false;
  document.getElementById("sat-slider-area").style.display = "none";
}

function closeModal() {
  document.getElementById("payment-modal").style.display = "none";
  if (paymentChecker) {
    clearInterval(paymentChecker);
    paymentChecker = null;
  }
  document.getElementById("send-btn").disabled = false;
}

function escHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
