# ₿ Satoshi Claw — 手描きクリプトUFOキャッチャー

手描き風アイソメトリックの「図（Fig.）」として描かれた、ビットコイン／クリプトのUFOキャッチャーです。
ライブラリ不要。素の HTML / CSS / JavaScript（Canvas 2D）だけで、3D の物理演算と手描き風レンダリングをしています。

公開URL（`main` ブランチを GitHub Pages で公開している場合）: https://ck121212195.github.io/GAMEBOY/

## 🎮 あそびかた
1. **Insert coin**（100 sats）でスタート（Enter キーでも可）
2. **▲▼◀▶** / 矢印キー / WASD でアームを前後左右に動かす（制限時間20秒）。画面をドラッグして狙うこともできます
3. **DROP**（Space / 画面タップ）でアームが降りてつかむ。景品口に落ちたら GET！
4. **Take the prize** で取り出し、**HODL**（棚に飾る）か **Sell**（相場で利確）を選ぶ

## ✨ 要素
- 11種類のクリプトぬいぐるみ（BTC猫、ETHうさぎ、DOGE柴、PEPE、SOL、XRP、ADA、SATS、コールドウォレット、ジェネシスブロック、ラグプル絨毯）
- アームのすべり（持ち上げ中／天井の揺れ／運搬中）。運搬中に落ちても転がって入ることも
- ハズレで溜まる **HODL GAUGE**（7で確定キャッチ）、21プレイごとの **ハルビング**（3プレイ アーム強化）、連続GETボーナス
- ニュースで動く相場ティッカー、HODL shelf（図鑑）、⛏ Proof of Work（クリック採掘で+100 sats）、デイリーボーナス
- 図としての操作：See-through（筐体の中身）、Labels（各部の名称）、手描きの揺らぎ、5色の筐体カラー、Front view / Turntable、ズーム、ドラッグで回転

進行状況はブラウザの localStorage に保存されます。

## 📁 構成
- `index.html` — 画面
- `style.css` — 紙と墨のデザイン
- `game.js` — 投影・手描きレンダリング、3D物理（ポジションベース）、アーム制御、相場、UI

## ⚠️ 注意
ゲーム内の sats は架空のポイントです。実際のお金・暗号資産は使いません／もらえません。ゲーム内ニュースはすべてフィクションです。

## ⚡ Value for Value
楽しかったら、本物の sats でこのプロジェクトをサポートしてください。
- Lightning Address: brashridge65@walletofsatoshi.com
