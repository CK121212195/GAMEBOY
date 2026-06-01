// 画像から読み取ったあなたのGASウェブアプリURL
const GAS_URL = "https://script.google.com/macros/s/AKfycbxBQvh7ZChbWwQtWM2wf2BMt6rMtmbPBx9CGWZAEM2k-NJt8sysFuDoPxWBeblonJ3e/exec";

// 🎮【重要】キャラクター画像のファイル名設定
// 提供いただいた画像を同じフォルダに入れて、以下のファイル名を書き換えてください。
// (初期設定として、ダミーの画像URLを入れています)
const IMG_EGG = "https://illustcenter.com/wp-content/uploads/2021/10/epc0082.png"; // 初期卵
const IMG_HODL = "https://illustcenter.com/wp-content/uploads/2021/10/epc0082.png"; // ガチホ（例：亀の画像 "turtle.png" に変更）
const IMG_FOMO = "https://illustcenter.com/wp-content/uploads/2021/10/epc0082.png"; // イケイケ（例：狼の画像 "wolf.png" に変更）
const IMG_BUIDL = "https://illustcenter.com/wp-content/uploads/2021/10/epc0082.png"; // 開発（例：世界樹の画像 "tree.png" に変更）
const IMG_SELL = "https://illustcenter.com/wp-content/uploads/2021/10/epc0082.png"; // 売却（例：ゴーストの画像 "ghost.png" に変更）


let paymentChecker = null;

window.onload = () => {
    fetchData();
    setInterval(fetchData, 5000); // 5秒ごとに更新
};

// GASからデータ取得
async function fetchData() {
    try {
        const res = await fetch(GAS_URL + "?action=getChat", { redirect: "follow" });
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

// 👑 勢力図の更新と「進化（画像の切り替え）」処理
function updateScoreUI(votes) {
    const scoreHODL = votes.HODL || 0;
    const scoreFOMO = votes.FOMO || 0;
    const scoreSELL = votes.SELL || 0;
    const scoreBUIDL = votes.BUIDL || 0;

    document.getElementById("score-HODL").innerText = scoreHODL;
    document.getElementById("score-FOMO").innerText = scoreFOMO;
    document.getElementById("score-SELL").innerText = scoreSELL;
    document.getElementById("score-BUIDL").innerText = scoreBUIDL;
    
    // 一番ポイントが高いコマンドを判定
    const scores = { HODL: scoreHODL, FOMO: scoreFOMO, SELL: scoreSELL, BUIDL: scoreBUIDL };
    let maxCmd = "";
    let maxScore = 0;
    
    for (const [cmd, score] of Object.entries(scores)) {
        if (score > maxScore) {
            maxScore = score;
            maxCmd = cmd;
        }
    }

    // 最多ポイントに応じて画像とステータス名を変更
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

// 送信ボタンの処理
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
        resetInput();
    }
}

async function requestInvoice(name, msg, cmd) {
    document.getElementById("payment-status").innerText = "インボイス生成中...";
    document.getElementById("payment-modal").style.display = "flex";
    
    try {
        const res = await fetch(GAS_URL + "?action=createInvoice&command=" + cmd, { redirect: "follow" });
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
        const res = await fetch(GAS_URL + "?action=checkPayment&hash=" + hash, { redirect: "follow" });
        const data = await res.json();
        
        if (data.paid) {
            clearInterval(paymentChecker);
            document.getElementById("payment-status").innerText = "支払い確認完了！⚡";
            
            await postToGAS(name, msg, cmd, 100);
            
            setTimeout(() => {
                closeModal();
                resetInput();
                fetchData();
            }, 1500);
        }
    } catch (e) {
        console.error(e);
    }
}

async function postToGAS(name, msg, cmd, weight) {
    try {
        await fetch(GAS_URL, {
            method: "POST",
            redirect: "follow",
            body: JSON.stringify({
                action: "postMessage",
                name: name,
                message: msg,
                command: cmd,
                weight: weight
            })
        });
        fetchData(); // 送信完了後に即座に読み込み直す
    } catch (e) {
        console.error("送信エラー", e);
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
