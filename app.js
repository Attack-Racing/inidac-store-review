<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#10131b">
  <title>イニDAC 店舗レビュー</title>
  <style>
    :root {
      color-scheme: dark;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #10131b;
      color: #f3f5fa;
    }
    * { box-sizing: border-box; }
    body { margin: 0; line-height: 1.6; }
    header {
      position: sticky; top: 0; z-index: 10;
      background: #171c28; border-bottom: 1px solid #30394b;
      padding: 14px 20px;
    }
    nav {
      max-width: 1100px; margin: auto;
      display: flex; align-items: center; justify-content: space-between;
      gap: 12px; flex-wrap: wrap;
    }
    a { color: #8eb8ff; }
    button, input, select, textarea {
      font: inherit; border-radius: 8px; padding: 10px;
      border: 1px solid #3a455a; background: #171c28; color: inherit;
      max-width: 100%;
    }
    button { cursor: pointer; }
    button:hover { filter: brightness(1.15); }
    .button-primary, .primary-mini {
      background: #3478f6; border-color: #3478f6; color: white;
    }
    main { max-width: 1100px; padding: 24px 16px 60px; margin: auto; }
    section { margin: 28px 0; }
    .panel, .store-card, .recent-review {
      background: #171c28; border: 1px solid #30394b;
      border-radius: 14px; padding: 18px; margin-bottom: 14px;
    }
    .filters, .form-row, .store-rating-row, .store-card-actions,
    .detail-links, .review-actions {
      display: flex; flex-wrap: wrap; gap: 10px;
    }
    .filters > *, .form-row > * { flex: 1; min-width: 150px; }
    .store-grid {
      display: grid; grid-template-columns: repeat(auto-fit,minmax(260px,1fr));
      gap: 14px;
    }
    .store-card h3 { margin: 8px 0; }
    .store-location { color: #bac5d8; margin: 10px 0; }
    .rating-chip, .detail-score {
      flex: 1; min-width: 120px; padding: 10px;
      background: #202838; border-radius: 8px;
    }
    .rating-chip small, .detail-score span { display: block; color: #bac5d8; }
    .store-meta { display: flex; justify-content: space-between; gap: 8px; margin: 14px 0; }
    .form-panel { display: grid; gap: 14px; }
    label { display: grid; gap: 6px; }
    input, select, textarea { width: 100%; }
    textarea { min-height: 100px; resize: vertical; }
    .muted, small { color: #bac5d8; }
    .hidden { display: none !important; }
    .modal {
      background: #171c28; color: #f3f5fa;
      border: 1px solid #46536b; border-radius: 14px;
      width: min(560px, calc(100% - 24px)); max-height: 85vh;
      overflow: auto; padding: 22px;
    }
    .modal::backdrop { background: #000b; }
    .modal-close-row { display: flex; justify-content: flex-end; }
    .auth-tabs { display: flex; gap: 8px; margin-bottom: 16px; }
    .auth-tabs button.active { background: #3478f6; }
    #toast {
      position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
      z-index: 100; background: #28354a; border: 1px solid #536580;
      border-radius: 10px; padding: 12px 18px; max-width: 90%;
      opacity: 0; pointer-events: none; transition: opacity .2s;
    }
    #toast.show { opacity: 1; }
    footer { padding: 25px; text-align: center; color: #bac5d8; }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
</head>
<body>
<header>
  <nav>
    <a href="#" id="homeLink"><strong>イニDAC 店舗レビュー</strong></a>
    <button id="authButton" type="button">ログイン / 登録</button>
  </nav>
</header>

<main>
  <section class="panel">
    <h1>頭文字D The Arcade 店舗レビュー</h1>
    <p>ゲームセンターの設置情報やメンテナンス、店舗の評価・コメントを共有しましょう。</p>
  </section>

  <section>
    <h2>店舗を探す</h2>
    <div class="filters">
      <input id="searchInput" type="search" placeholder="店舗名・住所で検索">
      <input id="countryFilter" placeholder="国で絞り込み">
      <input id="regionFilter" placeholder="都道府県・地域で絞り込み">
      <select id="sortFilter">
        <option value="recent">レビュー数順</option>
        <option value="name">店舗名順</option>
        <option value="maintenance">メンテナンス評価順</option>
        <option value="overall">総合評価順</option>
      </select>
    </div>
    <p><span id="resultCount">0 件</span>　/　店舗 <span id="storeCount">0</span> 件　レビュー <span id="reviewCount">0</span> 件</p>
    <div id="emptyState" class="panel hidden">該当する店舗がありません。</div>
    <div id="storeGrid" class="store-grid"></div>
  </section>

  <section>
    <h2>店舗を登録</h2>
    <div class="panel">
      <p id="storeFormNote" class="muted">店舗を登録するにはログインしてください。</p>
      <form id="storeForm" class="form-panel">
        <label>店舗名
          <input name="name" required maxlength="150" placeholder="例：店舗名">
        </label>
        <div class="form-row">
          <label>国
            <input id="storeCountry" name="country" required placeholder="例：日本 / Malaysia">
          </label>
          <label id="regionFieldLabel">都道府県・地域
            <input id="storeRegion" name="region" placeholder="日本の場合：千葉県">
          </label>
        </div>
        <label>住所
          <input name="address" required placeholder="住所または所在地">
        </label>
        <label>Google Maps URL（任意）
          <input name="mapsUrl" type="url" placeholder="https://maps.google.com/...">
        </label>
        <label>頭文字Dの設置台数（任意）
          <input name="cabinetCount" type="number" min="1" max="999">
        </label>
        <label>店舗について（任意）
          <textarea name="description" maxlength="1500"></textarea>
        </label>
        <button class="button-primary" type="submit">店舗を登録</button>
      </form>
    </div>
  </section>

  <section id="review">
    <h2>レビューを投稿</h2>
    <div class="panel">
      <p id="reviewFormNote" class="muted">レビューを投稿するにはログインしてください。</p>
      <form id="reviewForm" class="form-panel">
        <label>店舗
          <select id="reviewStoreSelect" name="storeId" required>
            <option value="">店舗を選択</option>
          </select>
        </label>
        <div class="form-row">
          <label>メンテナンス評価
            <select name="maintenance" required>
              <option value="4">4 - 良い</option>
              <option value="3">3 - 普通</option>
              <option value="2">2 - 少し悪い</option>
              <option value="1">1 - 悪い</option>
            </select>
          </label>
          <label>店舗総合評価
            <select name="overall" required>
              <option value="4">4 - 良い</option>
              <option value="3">3 - 普通</option>
              <option value="2">2 - 少し悪い</option>
              <option value="1">1 - 悪い</option>
            </select>
          </label>
        </div>
        <div class="form-row">
          <label>店内ランク（任意）
            <select name="driverRank">
              <option value="">未評価</option>
              <option value="5">5</option><option value="4">4</option>
              <option value="3">3</option><option value="2">2</option>
              <option value="1">1</option>
            </select>
          </label>
          <label>通信状況（任意）
            <select name="connection">
              <option value="">未評価</option>
              <option value="5">5</option><option value="4">4</option>
              <option value="3">3</option><option value="2">2</option>
              <option value="1">1</option>
            </select>
          </label>
        </div>
        <label>訪問日
          <input id="visitedAt" name="visitedAt" type="date">
        </label>
        <label>コメント（5〜1500文字）
          <textarea name="comment" required minlength="5" maxlength="1500"></textarea>
        </label>
        <label><span><input name="honest" type="checkbox" required style="width:auto"> 実際に訪問した経験に基づくレビューです。</span></label>
        <button class="button-primary" type="submit">レビューを投稿</button>
      </form>
    </div>
  </section>

  <section>
    <h2>新着レビュー</h2>
    <div id="recentReviews"></div>
  </section>
</main>

<footer>イニDAC 店舗レビュー</footer>
<div id="toast" role="status" aria-live="polite"></div>

<dialog id="authDialog" class="modal">
  <form method="dialog" class="modal-close-row">
    <button type="submit" aria-label="閉じる">閉じる ×</button>
  </form>
  <h2 id="authTitle">ログイン</h2>
  <p id="authNote" class="muted">メールアドレスとパスワードを入力してください。</p>
  <div class="auth-tabs">
    <button type="button" data-mode="login" class="active">ログイン</button>
    <button type="button" data-mode="signup">新規登録</button>
  </div>
  <form id="authForm" class="form-panel">
    <label>メールアドレス
      <input name="email" type="email" autocomplete="email" required>
    </label>
    <label>パスワード
      <input name="password" type="password" autocomplete="current-password" minlength="8" required>
    </label>
    <button id="authSubmit" class="button-primary" type="submit">ログイン</button>
  </form>
</dialog>

<!-- app.js はこの1か所だけで読み込みます -->
<script src="app.js"></script>
</body>
</html>
