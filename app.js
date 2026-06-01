// =============================================
// みんなのジェネシス・ブロック - フロントエンド
// =============================================

const GAS_URL = "https://script.google.com/macros/s/AKfycbxBQvh7ZChbWwQtWM2wf2BMt6rMtmbPBx9CGWZAEM2k-NJt8sysFuDoPxWBeblonJ3e/exec";

const IMAGES = {
  EGG:   "0.png",
  HODL:  "hodl.png",
  FOMO:  "fomo.png",
  BUIDL: "buidl.png",
  SELL:  "sell.png"
};

let paymentChecker = null;

// ─── 起動 ──────────────────────────────────────────
window.onload = () => {
  fetchBlockHeight();
  fetchData();
  setInterval(fetchData, 5000);
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
  const multiplier = sats; // 1 sat = ×1, 100 sats = ×100, etc.
  label.innerHTML = `⚡ <strong>${sats.toLocaleString()} sats</strong> 払って効力<strong>${multiplier}倍</strong>にする (PoW)`;
}

// ─── ブロック高取得 ────────────────────────────────
async function fetchBlockHeight() {
  try {
    const res    = await fetch("https://mempool.space/api/blocks/tip/height");
    const height = await res.text();
    document.getElementById("block-height").innerText = Number(height).toLocaleString();
  } catch (e) {
    console.warn("ブロック高取得エラー:", e);
  }
}

// ─── GASからデータ取得 ─────────────────────────────
async function fetchData() {
  try {
    const res  = await fetch(GAS_URL + "?action=getChat");
    const data = await res.json();

    if (data.error) {
      console.error("GASエラー:", data.details);
      showStatus("GAS接続エラー: " + data.details, "error");
      return;
    }

    updateChatUI(data.chats);
    updateScoreUI(data.votes);
    clearStatus();
  } catch (e) {
    console.error("データ取得エラー:", e);
    showStatus("通信エラー: GASのデプロイ設定を確認してください", "error");
  }
}

// ─── チャット表示更新 ──────────────────────────────
function updateChatUI(chats) {
  const box = document.getElementById("chat-box");
  const wasAtBottom = box.scrollHeight - box.clientHeight <= box.scrollTop + 10;

  box.innerHTML = "";
  chats.forEach((chat, index) => {
    const div      = document.createElement("div");
    div.className  = "chat-post";
    const isBoost  = chat.weight >= 10;
    const badgeClass = isBoost ? "cmd-badge boosted" : "cmd-badge";
    const boostText  = isBoost ? `⚡×${chat.weight}` : "";

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

// ─── スコア・キャラクター更新 ──────────────────────
function updateScoreUI(votes) {
  const scores = {
    HODL:  votes.HODL  || 0,
    FOMO:  votes.FOMO  || 0,
    SELL:  votes.SELL  || 0,
    BUIDL: votes.BUIDL || 0
  };

  Object.entries(scores).forEach(([cmd, score]) => {
    const el = document.getElementById("score-" + cmd);
    if (el) el.innerText = score.toLocaleString();
  });

  // 最大票コマンドを特定
  let maxCmd   = "";
  let maxScore = 0;
  Object.entries(scores).forEach(([cmd, score]) => {
    if (score > maxScore) { maxScore = score; maxCmd = cmd; }
  });

  const imgEl  = document.getElementById("character-img");
  const status = document.getElementById("evolution-status");

  const STATES = {
    "":      { img: IMAGES.EGG,   text: "現在の状態：Genesis Egg 🥚 (卵)" },
    HODL:    { img: IMAGES.HODL,  text: "現在の状態：💎 Diamond Hands (ガチホ進化)" },
    FOMO:    { img: IMAGES.FOMO,  text: "現在の状態：🚀 To The Moon! (イケイケ進化)" },
    BUIDL:   { img: IMAGES.BUIDL, text: "現在の状態：🔧 Web3 Builder (開発者進化)" },
    SELL:    { img: IMAGES.SELL,  text: "現在の状態：📉 Rekt / Paper Hands (暴落ゴースト)" },
  };
  const state = maxScore === 0 ? STATES[""] : (STATES[maxCmd] || STATES[""]);
  if (imgEl)  imgEl.src         = state.img;
  if (status) status.innerText  = state.text;
}

// ─── 書き込みボタン ────────────────────────────────
async function sendMessage() {
  const name    = document.getElementById("user-name").value.trim() || "名無しサトシ";
  const msg     = document.getElementById("user-msg").value.trim();
  const cmd     = document.getElementById("command-select").value;
  const isBoost = document.getElementById("boost-check").checked;
  const sats    = isBoost ? Number(document.getElementById("sat-amount").value) : 0;

  if (!msg) {
    alert("コメントを入力してください");
    return;
  }

  document.getElementById("send-btn").disabled = true;

  if (isBoost && sats >= 10) {
    await requestInvoice(name, msg, cmd, sats);
  } else {
    await postToGAS(name, msg, cmd, 1);
  }
}

// ─── Lightning インボイス発行 ──────────────────────
async function requestInvoice(name, msg, cmd, sats) {
  const modal  = document.getElementById("payment-modal");
  const status = document.getElementById("payment-status");
  const qrdiv  = document.getElementById("qrcode");

  status.innerText = "インボイス生成中...";
  document.getElementById("invoice-text").value = "";
  qrdiv.innerHTML  = "";
  modal.style.display = "flex";

  try {
    const url  = `${GAS_URL}?action=createInvoice&command=${encodeURIComponent(cmd)}&amount=${sats}`;
    const res  = await fetch(url);
    const data = await res.json();

    if (data.error) {
      let msg = "【LNbitsエラー】\n";
      msg += "demo.lnbits.com のウォレットが無効です。\n";
      msg += "新しいウォレットを作成してGASのキーを更新してください。\n\n";
      msg += "詳細: " + (data.details || data.code);
      alert(msg);
      closeModal();
      return;
    }

    const invoice = data.payment_request;
    document.getElementById("invoice-text").value = invoice;
    new QRCode(qrdiv, { text: invoice, width: 200, height: 200 });
    status.innerText = `⚡ ${sats} sats のインボイスです。ウォレットで読み取って支払ってください。`;

    paymentChecker = setInterval(
      () => checkPayment(data.payment_hash, name, msg, cmd, sats),
      3000
    );

  } catch (e) {
    alert("インボイス生成に失敗しました: " + e.message);
    closeModal();
  }
}

// ─── 支払い確認ポーリング ──────────────────────────
async function checkPayment(hash, name, msg, cmd, sats) {
  try {
    const res  = await fetch(`${GAS_URL}?action=checkPayment&hash=${hash}`);
    const data = await res.json();

    if (data.paid) {
      clearInterval(paymentChecker);
      document.getElementById("payment-status").innerText = "✅ 支払い確認！効力" + sats + "倍で反映します！";
      await postToGAS(name, msg, cmd, sats);
      setTimeout(closeModal, 1800);
    }
  } catch (e) {
    console.warn("支払い確認エラー:", e);
  }
}

// ─── GASへ書き込み ─────────────────────────────────
async function postToGAS(name, msg, cmd, weight) {
  try {
    const url = `${GAS_URL}?action=postMessage`
              + `&name=${encodeURIComponent(name)}`
              + `&message=${encodeURIComponent(msg)}`
              + `&command=${encodeURIComponent(cmd)}`
              + `&weight=${weight}`;

    const res  = await fetch(url);
    const data = await res.json();

    if (data.error) {
      alert("書き込みエラー: " + (data.details || data.error));
    } else {
      resetInput();
      fetchData();
    }
  } catch (e) {
    console.error("送信エラー:", e);
    alert("通信エラー。GASのデプロイを確認してください。\n詳細: " + e.message);
    resetInput();
  }
}

// ─── ユーティリティ ────────────────────────────────
function resetInput() {
  document.getElementById("user-msg").value       = "";
  document.getElementById("boost-check").checked  = false;
  document.getElementById("send-btn").disabled    = false;
}

function closeModal() {
  document.getElementById("payment-modal").style.display = "none";
  if (paymentChecker) { clearInterval(paymentChecker); paymentChecker = null; }
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

function showStatus(msg, type) {
  let el = document.getElementById("connection-status");
  if (!el) return;
  el.textContent  = msg;
  el.style.color  = type === "error" ? "#e53935" : "#43a047";
  el.style.display = "block";
}

function clearStatus() {
  const el = document.getElementById("connection-status");
  if (el) el.style.display = "none";
}
