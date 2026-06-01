// GASのURL
const GAS_URL = "https://script.google.com/macros/s/AKfycbxBQvh7ZChbWwQtWM2wf2BMt6rMtmbPBx9CGWZAEM2k-NJt8sysFuDoPxWBeblonJ3e/exec";

// キャラクター画像
const IMG_EGG = "0.png";
const IMG_HODL = "0.png";
const IMG_FOMO = "0.png";
const IMG_BUIDL = "0.png";
const IMG_SELL = "0.png";

let paymentChecker = null;

// 起動時の処理
window.onload = () => {
    fetchBlockHeight(); // ★追加: ブロック高を取得
    fetchData();
    setInterval(fetchData, 5000);
    setInterval(fetchBlockHeight, 60000); // ★追加: 1分ごとにブロック高を更新
};

// ★追加：リアルタイムのブロック高を取得する関数
async function fetchBlockHeight() {
    try {
        const res = await fetch("https://mempool.space/api/blocks/tip/height");
        const height = await res.text();
        document.getElementById("block-height").innerText = Number(height).toLocaleString();
    } catch (e) {
        console.error("ブロック高取得エラー", e);
    }
}

// データの取得
async function fetchData() {
    try {
        const res = await fetch(GAS_URL + "?action=getChat");
        const data = await res.json();
        
        updateChatUI(data.chats);
        updateScoreUI(data.votes);
    } catch (e) {
        console.error("データ取得エラー", e);
    }
}

function updateChatUI(chats) {
    const box = document.getElementById("chat-box");
    box.innerHTML = "";
    
    chats.forEach((chat, index) => {
        const div = document.createElement("div");
        div.className = "chat-post";
        const isBoost = chat.weight >= 100;
        const badgeClass = isBoost ? "cmd-badge boosted" : "cmd-badge";
        const boostText = isBoost ? "⚡x100" : "";
        
        div.innerHTML = `
            <div class="chat-meta">${index + 1} 名前：${chat.name} 投稿日：${chat.time}</div>
            <div class="chat-text">
                <span class="${badgeClass}">${chat.command} ${boostText}</span> 
                ${chat.message}
            </div>
        `;
        box.appendChild(div);
    });
    box.scrollTop = box.scrollHeight;
}

function updateScoreUI(votes) {
    const scoreHODL = votes.HODL || 0;
    const scoreFOMO = votes.FOMO || 0;
    const scoreSELL = votes.SELL || 0;
    const scoreBUIDL = votes.BUIDL || 0;

    document.getElementById("score-HODL").innerText = scoreHODL;
    document.getElementById("score-FOMO").innerText = scoreFOMO;
    document.getElementById("score-SELL").innerText = scoreSELL;
    document.getElementById("score-BUIDL").innerText = scoreBUIDL;
    
    const scores = { HODL: scoreHODL, FOMO: scoreFOMO, SELL: scoreSELL, BUIDL: scoreBUIDL };
    let maxCmd = "";
    let maxScore = 0;
    
    for (const [cmd, score] of Object.entries(scores)) {
        if (score > maxScore) {
            maxScore = score;
            maxCmd = cmd;
        }
    }

    const imgElement = document.getElementById("character-img");
    const statusText = document.getElementById("evolution-status");

    if (maxScore === 0) {
        imgElement.src = IMG_EGG;
        statusText.innerText = "現在の状態：Genesis Egg (卵)";
    } else if (maxCmd === "HODL") {
        imgElement.src = IMG_HODL;
        statusText.innerText = "現在の状態：Diamond Hands (ガチホ進化)";
    } else if (maxCmd === "FOMO") {
        imgElement.src = IMG_FOMO;
        statusText.innerText = "現在の状態：To The Moon! (イケイケ進化)";
    } else if (maxCmd === "BUIDL") {
        imgElement.src = IMG_BUIDL;
        statusText.innerText = "現在の状態：Web3 Builder (開発者進化)";
    } else if (maxCmd === "SELL") {
        imgElement.src = IMG_SELL;
        statusText.innerText = "現在の状態：Rekt / Paper Hands (暴落・ゴースト)";
    }
}

async function sendMessage() {
    const name = document.getElementById("user-name").value || "名無しサトシ";
    const msg = document.getElementById("user-msg").value;
    const cmd = document.getElementById("command-select").value;
    const isBoost = document.getElementById("boost-check").checked;

    if (!msg) {
        alert("コメントを入力してください");
        return;
    }

    document.getElementById("send-btn").disabled = true;

    if (isBoost) {
        await requestInvoice(name, msg, cmd);
    } else {
        await postToGAS(name, msg, cmd, 1);
    }
}

async function requestInvoice(name, msg, cmd) {
    document.getElementById("payment-status").innerText = "インボイス生成中...";
    document.getElementById("payment-modal").style.display = "flex";
    
    try {
        const res = await fetch(GAS_URL + "?action=createInvoice&command=" + cmd);
        const data = await res.json();
        
        document.getElementById("invoice-text").value = data.payment_request;
        document.getElementById("qrcode").innerHTML = "";
        new QRCode(document.getElementById("qrcode"), data.payment_request);
        
        document.getElementById("payment-status").innerText = "ウォレットで読み取って支払ってください";
        
        paymentChecker = setInterval(() => checkPayment(data.payment_hash, name, msg, cmd), 3000);
        
    } catch (e) {
        alert("インボイス生成に失敗しました");
        closeModal();
    }
}

async function checkPayment(hash, name, msg, cmd) {
    try {
        const res = await fetch(GAS_URL + "?action=checkPayment&hash=" + hash);
        const data = await res.json();
        
        if (data.paid) {
            clearInterval(paymentChecker);
            document.getElementById("payment-status").innerText = "支払い確認完了！⚡";
            
            await postToGAS(name, msg, cmd, 100);
            setTimeout(closeModal, 1500);
        }
    } catch (e) {
        console.error(e);
    }
}

// ★修正：確実にデータが送られる設定（redirect: "follow"）
async function postToGAS(name, msg, cmd, weight) {
    try {
        await fetch(GAS_URL, {
            method: "POST",
            redirect: "follow", 
            headers: {
                "Content-Type": "text/plain;charset=utf-8"
            },
            body: JSON.stringify({
                action: "postMessage",
                name: name,
                message: msg,
                command: cmd,
                weight: weight
            })
        });
        
        setTimeout(() => {
            resetInput();
            fetchData();
        }, 1000);
        
    } catch (e) {
        console.error("送信エラーログ（処理は継続）", e);
        setTimeout(() => {
            resetInput();
            fetchData();
        }, 1000);
    }
}

function resetInput() {
    document.getElementById("user-msg").value = "";
    document.getElementById("boost-check").checked = false;
    document.getElementById("send-btn").disabled = false;
}

function closeModal() {
    document.getElementById("payment-modal").style.display = "none";
    if (paymentChecker) clearInterval(paymentChecker);
    document.getElementById("send-btn").disabled = false;
}
