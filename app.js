
(function () {
/* イニDAC 店舗レビュー
   Supabase対応 / 日本語・英語 / 店舗・レビュー管理
   コメントは日本語・英語共通で reviews.comment に保存
*/

const CONFIG = {
  supabaseUrl: "https://eujaamtodxwnugvrxrql.supabase.co",
  supabaseAnonKey: "sb_publishable_Ao3TirjTJ1W991HpxG5Lmg_sZfycu1l"
};

const ADMIN_EMAILS = ["grgt1462@gmail.com"];

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const STORAGE_KEY = "inidac-review-data-v1";
const PROFILE_KEY = "inidac-review-profile-v1";

const LOCATIONS = [
  {
    name: "日本",
    regions: [
      "北海道", "青森県", "岩手県", "宮城県", "秋田県",
      "山形県", "福島県", "茨城県", "栃木県", "群馬県",
      "埼玉県", "千葉県", "東京都", "神奈川県", "新潟県",
      "富山県", "石川県", "福井県", "山梨県", "長野県",
      "岐阜県", "静岡県", "愛知県", "三重県", "滋賀県",
      "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県",
      "鳥取県", "島根県", "岡山県", "広島県", "山口県",
      "徳島県", "香川県", "愛媛県", "高知県", "福岡県",
      "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県",
      "鹿児島県", "沖縄県"
    ]
  },
  { name: "Malaysia", regions: ["Malaysia"] },
  { name: "台湾", regions: ["Taiwan"] },
  { name: "香港", regions: ["Hongkong"] },
  { name: "Indonesia", regions: ["Indonesia"] },
  { name: "Myanmar", regions: ["Myanmar"] },
  { name: "シンガポール", regions: ["Singapore"] },
  { name: "Thailand", regions: ["Thailand"] },
  { name: "Vietnam", regions: ["Vietnam"] },
  { name: "Cambodia", regions: ["Cambodia"] },
  { name: "Macau", regions: ["Macau"] },
  { name: "Austrailia", regions: ["Austrailia"] },
  { name: "その他", regions: ["その他"] }
];

const demoStores = [
  {
    id: "demo-1",
    name: "サンプル・レーシングアーケード",
    country: "日本",
    region: "千葉県",
    address: "千葉県千葉市",
    mapsUrl: "",
    cabinetCount: 4,
    description: "これは表示イメージ用のサンプル店舗です。実在店舗の情報ではありません。",
    createdAt: "2026-10-01T10:00:00.000Z",
    demo: true
  },
  {
    id: "demo-2",
    name: "Sample Arcade KL",
    country: "Malaysia",
    region: "Malaysia",
    address: "Kuala Lumpur, Malaysia",
    mapsUrl: "",
    cabinetCount: 2,
    description: "Sample data for layout preview. Not a real listing.",
    createdAt: "2026-10-02T10:00:00.000Z",
    demo: true
  }
];

const demoReviews = [
  {
    id: "demo-r1",
    storeId: "demo-1",
    maintenance: 4,
    overall: 3,
    driverRank: 4,
    connection: null,
    comment: "【サンプルレビュー】ハンドルやペダルの状態などを、ここに実際の体験として記入します。",
    visitedAt: "2026-10-10",
    createdAt: "2026-10-10T10:00:00.000Z",
    author: "サンプルユーザー",
    demo: true
  },
  {
    id: "demo-r2",
    storeId: "demo-1",
    maintenance: 3,
    overall: 4,
    driverRank: 3,
    connection: null,
    comment: "【サンプルレビュー】店舗の雰囲気や待ち時間などの例です。実際の評価ではありません。",
    visitedAt: "2026-10-12",
    createdAt: "2026-10-12T10:00:00.000Z",
    author: "サンプルユーザー",
    demo: true
  },
  {
    id: "demo-r3",
    storeId: "demo-2",
    maintenance: 3,
    overall: 3,
    driverRank: 4,
    connection: 2,
    comment: "[Sample review] Example text only. Replace with a real experience before relying on the rating.",
    visitedAt: "2026-10-11",
    createdAt: "2026-10-11T10:00:00.000Z",
    author: "Sample User",
    demo: true
  }
];

let supabase = null;
let currentUser = null;
let authMode = "login";
let toastTimer = null;
let stores = [];
let reviews = [];

let currentLanguage =
  localStorage.getItem("inidac-language") === "en" ? "en" : "ja";

function tr(ja, en) {
  return currentLanguage === "en" ? en : ja;
}

/* 日本語・英語で同じコメント本文を表示する */
function displayedComment(review) {
  return review.comment || "";
}

function isConfigured() {
  return Boolean(
    CONFIG.supabaseUrl &&
    CONFIG.supabaseAnonKey &&
    window.supabase
  );
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function uid() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : "id-" + Date.now() + "-" + Math.random().toString(16).slice(2);
}

function showToast(message) {
  const element = $("#toast");
  if (!element) {
    console.log(message);
    return;
  }

  element.textContent = message;
  element.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => element.classList.remove("show"), 3500);
}

function readLocal() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));

    if (
      saved &&
      Array.isArray(saved.stores) &&
      Array.isArray(saved.reviews)
    ) {
      return saved;
    }
  } catch (error) {
    console.warn("ローカルデータを読み込めませんでした。", error);
  }

  return {
    stores: [...demoStores],
    reviews: [...demoReviews]
  };
}

function saveLocal() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ stores, reviews }));
}

function average(list, key) {
  const values = list
    .map(item => Number(item[key]))
    .filter(number => Number.isFinite(number) && number >= 1);

  return values.length
    ? values.reduce((total, number) => total + number, 0) / values.length
    : null;
}

function fmtAverage(number) {
  return number === null ? "—" : number.toFixed(1);
}

function countLabel(number) {
  return currentLanguage === "en"
    ? `${number} reviews`
    : `${number}件`;
}

function labelForScore(number) {
  if (number === null || !Number.isFinite(number)) {
    return tr("未評価", "Not rated");
  }
  if (number >= 3.5) return tr("良い", "Good");
  if (number >= 2.5) return tr("普通", "Average");
  if (number >= 1.5) return tr("少し悪い", "Below average");
  return tr("悪い", "Poor");
}

function getStoreReviews(id) {
  return reviews.filter(review => review.storeId === id);
}

function storeScore(store, key) {
  return average(getStoreReviews(store.id), key);
}

function mapUrl(store) {
  if (store.mapsUrl && /^https?:\/\//i.test(store.mapsUrl)) {
    return store.mapsUrl;
  }

  const query = [
    store.name,
    store.address,
    store.region,
    store.country
  ].filter(Boolean).join(" ");

  return "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent(query);
}

function dateLabel(value) {
  if (!value) return tr("訪問日未登録", "No visit date");

  const date = new Date(value + "T00:00:00");

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(currentLanguage === "en" ? "en-MY" : "ja-JP");
}

/* コメント欄を1つに統一する。
   HTMLに旧commentEn欄が残っていても、画面から取り除く。 */
function removeSeparateEnglishCommentField() {
  document.querySelectorAll(
    '#reviewForm [name="commentEn"], #reviewForm [name="comment_en"]'
  ).forEach(element => {
    const label = element.closest("label");
    if (label) {
      label.remove();
    } else {
      element.remove();
    }
  });
}

/* 国・地域の入力候補 */
function setDatalist(id, values) {
  let list = document.getElementById(id);

  if (!list) {
    list = document.createElement("datalist");
    list.id = id;
    document.body.appendChild(list);
  }

  const uniqueValues = [...new Set(values.filter(Boolean))];

  list.replaceChildren(
    ...uniqueValues.map(value => {
      const option = document.createElement("option");
      option.value = value;
      return option;
    })
  );
}

function populateCountries() {
  const storeCountry = $("#storeCountry");
  const countryFilter = $("#countryFilter");
  const countries = LOCATIONS.map(location => location.name);

  setDatalist("storeCountryOptions", countries);
  setDatalist("countryFilterOptions", countries);

  if (storeCountry) storeCountry.setAttribute("list", "storeCountryOptions");
  if (countryFilter) countryFilter.setAttribute("list", "countryFilterOptions");

  populateRegions();
}

function populateRegions() {
  const storeCountry = $("#storeCountry");
  const countryFilter = $("#countryFilter");
  const storeRegion = $("#storeRegion");
  const regionFilter = $("#regionFilter");

  const storeCountryName = storeCountry?.value.trim() || "";
  const storeLocation = LOCATIONS.find(location => location.name === storeCountryName);
  const storeRegions = storeLocation
    ? storeLocation.regions
    : LOCATIONS.flatMap(location => location.regions);

  setDatalist("storeRegionOptions", storeRegions);
  if (storeRegion) storeRegion.setAttribute("list", "storeRegionOptions");

  const filterCountryName = countryFilter?.value.trim() || "";
  const filterLocation = LOCATIONS.find(location => location.name === filterCountryName);
  const filterRegions = filterLocation
    ? filterLocation.regions
    : LOCATIONS.flatMap(location => location.regions);

  setDatalist("regionFilterOptions", filterRegions);
  if (regionFilter) regionFilter.setAttribute("list", "regionFilterOptions");

  if (
    regionFilter &&
    filterLocation &&
    regionFilter.value &&
    !filterLocation.regions.includes(regionFilter.value)
  ) {
    regionFilter.value = "";
  }
}

/* 店舗・レビューの描画 */
function refreshReviewStoreSelect() {
  const select = $("#reviewStoreSelect");
  if (!select) return;

  const previous = select.value;

  select.innerHTML =
    `<option value="">${escapeHtml(tr("店舗を選択", "Select a store"))}</option>` +
    stores.map(store => `
      <option value="${escapeHtml(store.id)}">
        ${escapeHtml(store.name)}（${escapeHtml(store.country)}${store.region ? "・" + escapeHtml(store.region) : ""}）
      </option>
    `).join("");

  if (stores.some(store => store.id === previous)) select.value = previous;
}

function renderStats() {
  if ($("#storeCount")) $("#storeCount").textContent = stores.length;
  if ($("#reviewCount")) $("#reviewCount").textContent = reviews.length;
}

function renderStores() {
  populateRegions();

  const searchInput = $("#searchInput");
  const countryFilter = $("#countryFilter");
  const regionFilter = $("#regionFilter");
  const sortFilter = $("#sortFilter");
  const storeGrid = $("#storeGrid");

  if (!storeGrid) return;

  const query = (searchInput?.value || "").trim().toLocaleLowerCase();
  const country = countryFilter?.value.trim() || "";
  const region = regionFilter?.value.trim() || "";
  const sort = sortFilter?.value || "reviews";

  let list = stores.filter(store => {
    const matchesCountry = !country || String(store.country || "") === country;
    const matchesRegion = !region || String(store.region || "") === region;

    const searchable = [
      store.name, store.address, store.country, store.region
    ].join(" ").toLocaleLowerCase();

    return matchesCountry && matchesRegion && (!query || searchable.includes(query));
  });

  list.sort((a, b) => {
    if (sort === "name") return a.name.localeCompare(b.name, "ja");
    if (sort === "maintenance") {
      return (storeScore(b, "maintenance") ?? 0) - (storeScore(a, "maintenance") ?? 0);
    }
    if (sort === "overall") {
      return (storeScore(b, "overall") ?? 0) - (storeScore(a, "overall") ?? 0);
    }
    return getStoreReviews(b.id).length - getStoreReviews(a.id).length;
  });

  if ($("#resultCount")) {
    $("#resultCount").textContent = currentLanguage === "en"
      ? `${list.length} results`
      : `${list.length} 件`;
  }

  if ($("#emptyState")) $("#emptyState").classList.toggle("hidden", list.length !== 0);

  storeGrid.innerHTML = list.map(store => {
    const storeReviews = getStoreReviews(store.id);
    const maintenance = storeScore(store, "maintenance");
    const overall = storeScore(store, "overall");

    return `
      <article class="store-card">
        <div class="store-card-top">
          <span class="store-code">ARCADE SPOT / ${escapeHtml(store.country)}</span>
          <span class="store-icon">⌖</span>
        </div>
        <div class="store-card-body">
          <h3>${escapeHtml(store.name)}</h3>
          <div class="store-location">
            <span>⌖</span>
            <span>${escapeHtml(store.country)}${store.region ? "・" + escapeHtml(store.region) : ""}
              <br>${escapeHtml(store.address || "")}</span>
          </div>
          <div class="store-rating-row">
            <div class="rating-chip">
              <small>${escapeHtml(tr("メンテナンス", "Maintenance"))}</small>
              <strong>${fmtAverage(maintenance)}
                <span class="rating-word">${escapeHtml(labelForScore(maintenance))}</span>
              </strong>
            </div>
            <div class="rating-chip">
              <small>${escapeHtml(tr("店舗総合評価", "Overall Store Rating"))}</small>
              <strong>${fmtAverage(overall)}
                <span class="rating-word">${escapeHtml(labelForScore(overall))}</span>
              </strong>
            </div>
          </div>
          <div class="store-meta">
            <span>${currentLanguage === "en" ? countLabel(storeReviews.length) : "レビュー " + countLabel(storeReviews.length)}</span>
            <span>${store.cabinetCount
              ? escapeHtml(tr("設置 ", "Cabinets ")) + escapeHtml(store.cabinetCount) + escapeHtml(tr("台", ""))
              : escapeHtml(tr("台数未登録", "No cabinet count"))}</span>
          </div>

<div class="store-card-actions">
  <button class="mini-button primary-mini" data-details="${escapeHtml(store.id)}">
    ${escapeHtml(tr("詳細・コメント", "Details & Reviews"))}
  </button>
  <a class="mini-button" href="${escapeHtml(mapUrl(store))}" target="_blank" rel="noopener noreferrer">
    ${escapeHtml(tr("Google Mapsで開く ↗", "Open Google Maps ↗"))}
  </a>
  ${isAdmin() ? `
    <button class="mini-button" data-edit-store="${escapeHtml(store.id)}">
      ${escapeHtml(tr("店舗を編集", "Edit Store"))}
    </button>
    <button class="mini-button danger-mini" data-delete-store="${escapeHtml(store.id)}">
      ${escapeHtml(tr("店舗を削除", "Delete Store"))}
    </button>
  ` : ""}
</div>
            <button class="mini-button primary-mini" data-details="${escapeHtml(store.id)}">
              ${escapeHtml(tr("詳細・コメント", "Details & Reviews"))}
            </button>
            <a class="mini-button" href="${escapeHtml(mapUrl(store))}" target="_blank" rel="noopener noreferrer">
              ${escapeHtml(tr("Google Mapsで開く ↗", "Open Google Maps ↗"))}
            </a>
          </div>
        </div>
      </article>
    `;
  }).join("");

  renderStats();
  refreshReviewStoreSelect();
}

function renderRecent() {
  const container = $("#recentReviews");
  if (!container) return;

  const recent = [...reviews]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 6);

  container.innerHTML = recent.length
    ? recent.map(review => {
        const store = stores.find(item => item.id === review.storeId);
        return `
          <article class="recent-review">
            <div class="recent-review-head">
              <h3>${escapeHtml(store?.name || tr("削除済み店舗", "Deleted store"))}</h3>
              <time>${escapeHtml(dateLabel(review.visitedAt))}</time>
            </div>
            <div class="review-badges">
              <span class="review-badge">${escapeHtml(tr("整備：", "Maintenance: "))}${escapeHtml(labelForScore(Number(review.maintenance)))}</span>
              <span class="review-badge">${escapeHtml(tr("店舗：", "Store: "))}${escapeHtml(labelForScore(Number(review.overall)))}</span>
              ${review.driverRank ? `<span class="review-badge">${escapeHtml(tr("店内ランク ", "Local Skill "))}${review.driverRank}/5</span>` : ""}
              ${review.connection ? `<span class="review-badge">${escapeHtml(tr("通信 ", "Connection "))}${review.connection}/5</span>` : ""}
            </div>
            <p>${escapeHtml(displayedComment(review))}</p>
            <small class="muted">
              ${escapeHtml(tr("投稿者：", "By: "))}${escapeHtml(review.author || "メンバー")}
              · ${escapeHtml(new Date(review.createdAt).toLocaleDateString(currentLanguage === "en" ? "en-MY" : "ja-JP"))}
            </small>
            <div class="review-actions">${reviewActions(review)}</div>
          </article>
        `;
      }).join("")
    : `<div class="no-reviews">${escapeHtml(tr("まだレビューはありません。最初のレビューを投稿してください。", "No reviews yet. Be the first to post a review."))}</div>`;
}

function renderAll() {
  renderStores();
  renderRecent();
}

/* ログイン・ユーザー権限 */
function getCurrentProfile() {
  try {
    return JSON.parse(localStorage.getItem(PROFILE_KEY) || "null");
  } catch (error) {
    return null;
  }
}

function updateAuthButton() {
  const button = $("#authButton");

  if (button) {
    button.textContent = currentUser
      ? (currentUser.email || currentUser.user_metadata?.nickname || tr("ログイン中", "Signed in")) +
        " · " + tr("ログアウト", "Log out")
      : tr("ログイン / 登録", "Login / Sign Up");
  }

  window.__inidacIsAdmin = email => Boolean(
    supabase &&
    currentUser &&
    ADMIN_EMAILS.includes(String(currentUser.email || "").toLowerCase()) &&
    String(email || "").toLowerCase() === String(currentUser.email || "").toLowerCase()
  );

  window.__inidacSupabase = supabase;
  window.__inidacCurrentUser = currentUser;
  window.dispatchEvent(new Event("inidac-auth-updated"));
}

function isAdmin() {
  return Boolean(
    supabase &&
    currentUser &&
    ADMIN_EMAILS.includes(String(currentUser.email || "").toLowerCase())
  );
}

function canManageReview(review) {
  return Boolean(currentUser && (review.authorId === currentUser.id || isAdmin()));
}

function reviewActions(review) {
  if (!currentUser) {
    return `<button class="mini-button" data-report-review="${escapeHtml(review.id)}">${escapeHtml(tr("問題を報告", "Report issue"))}</button>`;
  }

  const own = review.authorId === currentUser.id;

  return `
    ${own ? `
      <button class="mini-button" data-edit-review="${escapeHtml(review.id)}">${escapeHtml(tr("編集", "Edit"))}</button>
      <button class="mini-button danger-mini" data-delete-review="${escapeHtml(review.id)}">${escapeHtml(tr("削除", "Delete"))}</button>
    ` : ""}
    ${isAdmin() && !own ? `<button class="mini-button danger-mini" data-delete-review="${escapeHtml(review.id)}">${escapeHtml(tr("運営削除", "Admin delete"))}</button>` : ""}
    ${!own ? `<button class="mini-button" data-report-review="${escapeHtml(review.id)}">${escapeHtml(tr("問題を報告", "Report issue"))}</button>` : ""}
  `;
}

function requireUser() {
  if (!currentUser) {
    const dialog = $("#authDialog");
    if (dialog) dialog.showModal();
    showToast(tr("投稿するにはログイン / 登録してください。", "Please sign in to post."));
    return false;
  }
  return true;
}

/* Supabaseデータ変換・読み込み */
function fromDbStore(store) {
  return {
    id: store.id,
    name: store.name,
    country: store.country,
    region: store.region,
    address: store.address,
    mapsUrl: store.maps_url,
    cabinetCount: store.cabinet_count,
    description: store.description,
    createdAt: store.created_at
  };
}

function fromDbReview(review) {
  return {
    id: review.id,
    storeId: review.store_id,
    maintenance: review.maintenance,
    overall: review.overall,
    driverRank: review.driver_rank,
    connection: review.connection,
    comment: review.comment || "",
    visitedAt: review.visited_at,
    createdAt: review.created_at,
    author: review.author_name || "メンバー",
    authorId: review.user_id
  };
}

async function loadData() {
  try {
    if (isConfigured()) {
      supabase = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey);

      const sessionResult = await supabase.auth.getSession();
      if (sessionResult.error) console.error("認証状態を取得できませんでした:", sessionResult.error);

      currentUser = sessionResult.data?.session?.user || null;

      supabase.auth.onAuthStateChange((_event, session) => {
        currentUser = session?.user || null;
        updateAuthButton();
        renderAll();
      });

      const [storesResult, reviewsResult] = await Promise.all([
        supabase.from("stores").select("*").order("name"),
        supabase.from("reviews").select("*").order("created_at", { ascending: false })
      ]);

      if (storesResult.error || reviewsResult.error) {
        console.error("Supabase読み込みエラー:", storesResult.error || reviewsResult.error);
        stores = [];
        reviews = [];
        showToast(tr(
          "データを読み込めません。Supabaseのテーブル・権限設定を確認してください。",
          "Could not load data. Check Supabase tables and permissions."
        ));
      } else {
        stores = (storesResult.data || []).map(fromDbStore);
        reviews = (reviewsResult.data || []).map(fromDbReview);
      }

      if ($("#storeFormNote")) {
        $("#storeFormNote").textContent = tr(
          "オンラインモード：登録ユーザーは店舗を追加できます。",
          "Online mode: registered users can add stores."
        );
      }
      if ($("#reviewFormNote")) {
        $("#reviewFormNote").textContent = tr(
          "オンラインモード：ログインしてレビューを投稿できます。",
          "Online mode: sign in to post reviews."
        );
      }
      if ($("#authNote")) {
        $("#authNote").textContent = tr(
          "Supabase Authでメールアドレスとパスワードを管理します。",
          "Email and password are managed by Supabase Auth."
        );
      }
    } else {
      const data = readLocal();
      stores = data.stores;
      reviews = data.reviews;
      currentUser = getCurrentProfile();

      if ($("#storeFormNote")) {
        $("#storeFormNote").textContent = tr(
          "デモモード：データはこのブラウザ内だけに保存されます。他の人には共有されません。",
          "Demo mode: data is saved only in this browser and is not shared."
        );
      }
      if ($("#reviewFormNote")) {
        $("#reviewFormNote").textContent = tr(
          "デモモード：レビューはこのブラウザ内だけに保存されます。他の人には共有されません。",
          "Demo mode: reviews are saved only in this browser and are not shared."
        );
      }
      if ($("#authNote")) {
        $("#authNote").textContent = tr(
          "デモモードの簡易プロフィールです。実際の認証ではありません。",
          "This is a demo profile, not real authentication."
        );
      }
    }
  } catch (error) {
    console.error("データ読み込みエラー:", error);
    showToast(tr("初期化に失敗しました。ページを再読み込みしてください。", "Initialization failed. Please reload the page."));
    stores = [];
    reviews = [];
  }

  populateCountries();
  removeSeparateEnglishCommentField();
  updateAuthButton();
  renderAll();
}

/* 店舗登録 */
async function addStore(data) {
  const duplicate = stores.find(store =>
    store.name.trim().toLowerCase() === data.name.trim().toLowerCase() &&
    store.country.trim().toLowerCase() === data.country.trim().toLowerCase() &&
    String(store.region || "").trim().toLowerCase() === String(data.region || "").trim().toLowerCase()
  );

  if (duplicate) {
    showToast(tr(
      "同じ店舗が登録済みのようです。既存店舗のレビューをご利用ください。",
      "This store may already exist. Please use its existing reviews."
    ));
    openDetails(duplicate.id);
    return;
  }

  const store = { id: uid(), ...data, createdAt: new Date().toISOString() };

  if (supabase) {
    if (!currentUser) {
      showToast(tr("ログインしてください。", "Please sign in."));
      return;
    }

    const { data: created, error } = await supabase.from("stores").insert({
      name: store.name,
      country: store.country,
      region: store.region || "",
      address: store.address,
      maps_url: store.mapsUrl || null,
      cabinet_count: store.cabinetCount || null,
      description: store.description || null,
      created_by: currentUser.id
    }).select().single();

    if (error) {
      console.error("店舗登録エラー:", error);
      showToast("店舗を登録できませんでした：" + error.message);
      return;
    }

    stores.push(fromDbStore(created));
  } else {
    stores.push(store);
    saveLocal();
  }

  $("#storeForm")?.reset();
  populateCountries();
  renderAll();
  showToast(tr("店舗を登録しました。", "Store added."));
}

   
/* 店舗編集：管理者専用 */
async function editStore(id) {
  if (!isAdmin()) {
    showToast(tr("管理者のみ編集できます。", "Only administrators can edit stores."));
    return;
  }

  const store = stores.find(item => item.id === id);
  if (!store) return;

  const dialog = document.createElement("dialog");
  dialog.className = "modal";

  dialog.innerHTML = `
    <form method="dialog" class="modal-close-row">
      <button class="icon-button" aria-label="閉じる">×</button>
    </form>
    <div class="modal-content">
      <h2>${escapeHtml(tr("店舗情報を編集", "Edit Store"))}</h2>
      <form id="editStoreForm" class="form-panel">
        <label>${escapeHtml(tr("店舗名", "Store name"))}
          <input name="name" required maxlength="100" value="${escapeHtml(store.name)}">
        </label>
        <label>${escapeHtml(tr("国名", "Country"))}
          <input name="country" id="editStoreCountry" required maxlength="80" value="${escapeHtml(store.country)}">
        </label>
        <label>${escapeHtml(tr("都道府県・地域", "Region"))}
          <input name="region" maxlength="80" value="${escapeHtml(store.region || "")}">
        </label>
        <label>${escapeHtml(tr("住所", "Address"))}
          <input name="address" required maxlength="240" value="${escapeHtml(store.address || "")}">
        </label>
        <label>Google Maps URL
          <input name="mapsUrl" type="url" value="${escapeHtml(store.mapsUrl || "")}">
        </label>
        <label>${escapeHtml(tr("設置台数", "Cabinet count"))}
          <input name="cabinetCount" type="number" min="1" max="100" value="${store.cabinetCount || ""}">
        </label>
        <label>${escapeHtml(tr("店舗メモ", "Store notes"))}
          <textarea name="description" rows="3" maxlength="500">${escapeHtml(store.description || "")}</textarea>
        </label>
        <button class="button button-primary button-full" type="submit">
          ${escapeHtml(tr("変更を保存", "Save Changes"))}
        </button>
      </form>
    </div>
  `;

  document.body.appendChild(dialog);
  dialog.showModal();
  dialog.addEventListener("close", () => dialog.remove());

  $("#editStoreForm", dialog).addEventListener("submit", async event => {
    event.preventDefault();

    if (!isAdmin()) {
      showToast(tr("管理者のみ編集できます。", "Only administrators can edit stores."));
      return;
    }

    const formData = new FormData(event.currentTarget);
    const patch = {
      name: String(formData.get("name") || "").trim(),
      country: String(formData.get("country") || "").trim(),
      region: String(formData.get("region") || "").trim(),
      address: String(formData.get("address") || "").trim(),
      mapsUrl: String(formData.get("mapsUrl") || "").trim(),
      cabinetCount: formData.get("cabinetCount")
        ? Number(formData.get("cabinetCount"))
        : null,
      description: String(formData.get("description") || "").trim()
    };

    if (!patch.name || !patch.country || !patch.address) {
      showToast(tr("店舗名・国・住所は必須です。", "Name, country and address are required."));
      return;
    }

    if (patch.country === "日本" && !patch.region) {
      showToast(tr("日本国内の店舗は都道府県が必要です。", "A prefecture is required for stores in Japan."));
      return;
    }

    if (supabase) {
      const { data, error } = await supabase
        .from("stores")
        .update({
          name: patch.name,
          country: patch.country,
          region: patch.region,
          address: patch.address,
          maps_url: patch.mapsUrl || null,
          cabinet_count: patch.cabinetCount,
          description: patch.description || null
        })
        .eq("id", id)
        .select()
        .single();

      if (error || !data) {
        console.error("店舗更新エラー:", error);
        showToast(tr(
          "更新できませんでした。Supabaseの更新権限を確認してください。",
          "Could not update store. Check Supabase update permissions."
        ) + (error ? " " + error.message : ""));
        return;
      }

      Object.assign(store, fromDbStore(data));
    } else {
      Object.assign(store, patch);
      saveLocal();
    }

    dialog.close();
    renderAll();
    showToast(tr("店舗情報を更新しました。", "Store updated."));
  });
}

   
/* レビュー投稿：comment列だけに保存 */
async function addReview(data) {
  if (!requireUser()) return;

  const duplicate = reviews.find(review =>
    review.storeId === data.storeId &&
    review.authorId === currentUser.id &&
    review.visitedAt === data.visitedAt &&
    review.comment.trim() === data.comment.trim()
  );

  if (duplicate) {
    showToast(tr("同じ内容のレビューが登録済みです。", "An identical review already exists."));
    return;
  }

  const review = {
    id: uid(),
    ...data,
    comment: String(data.comment || "").trim(),
    createdAt: new Date().toISOString(),
    author: currentUser.email || "メンバー",
    authorId: currentUser.id
  };

  if (supabase) {
    const payload = {
      store_id: review.storeId,
      maintenance: review.maintenance,
      overall: review.overall,
      driver_rank: review.driverRank,
      connection: review.connection,
      comment: review.comment,
      visited_at: review.visitedAt || null,
      author_name: currentUser.email?.split("@")[0] || "メンバー",
      user_id: currentUser.id
    };

    const { data: created, error } = await supabase
      .from("reviews")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("レビュー投稿エラー:", error);
      showToast("レビューを投稿できませんでした：" + error.message);
      return;
    }

    reviews.unshift(fromDbReview(created));
  } else {
    reviews.unshift(review);
    saveLocal();
  }

  $("#reviewForm")?.reset();

  if ($("#visitedAt")) {
    $("#visitedAt").value = new Date().toISOString().slice(0, 10);
  }

  renderAll();
  showToast(tr("レビューを投稿しました。", "Review posted."));
}

/* レビュー編集：編集画面にもコメント欄は1つだけ */
async function editReview(id) {
  if (!requireUser()) return;

  const review = reviews.find(item => item.id === id);

  if (!review || !currentUser || review.authorId !== currentUser.id) {
    showToast(tr("自分の投稿のみ編集できます。", "You can only edit your own reviews."));
    return;
  }

  const dialog = document.createElement("dialog");
  dialog.className = "modal";

  dialog.innerHTML = `
    <form method="dialog" class="modal-close-row">
      <button class="icon-button" aria-label="閉じる">×</button>
    </form>
    <div class="modal-content">
      <h2>${escapeHtml(tr("レビューを編集", "Edit Review"))}</h2>
      <form id="editReviewForm" class="form-panel">
        <label>
          ${escapeHtml(tr("店舗", "Store"))}
          <select name="storeId" required>
            ${stores.map(store => `
              <option value="${escapeHtml(store.id)}" ${store.id === review.storeId ? "selected" : ""}>
                ${escapeHtml(store.name)}（${escapeHtml(store.country)}${store.region ? "・" + escapeHtml(store.region) : ""}）
              </option>
            `).join("")}
          </select>
        </label>

        <div class="form-row">
          <label>${escapeHtml(tr("メンテナンス評価", "Maintenance"))}
            <select name="maintenance">
              ${[4, 3, 2, 1].map(number => `
                <option value="${number}" ${Number(review.maintenance) === number ? "selected" : ""}>
                  ${number} - ${escapeHtml(labelForScore(number))}
                </option>
              `).join("")}
            </select>
          </label>
          <label>${escapeHtml(tr("店舗総合評価", "Overall Store Rating"))}
            <select name="overall">
              ${[4, 3, 2, 1].map(number => `
                <option value="${number}" ${Number(review.overall) === number ? "selected" : ""}>
                  ${number} - ${escapeHtml(labelForScore(number))}
                </option>
              `).join("")}
            </select>
          </label>
        </div>

        <div class="form-row">
          <label>${escapeHtml(tr("店内ランク", "Local Player Skill"))}
            <select name="driverRank">
              <option value="">${escapeHtml(tr("未評価", "Not rated"))}</option>
              ${[5, 4, 3, 2, 1].map(number => `
                <option value="${number}" ${Number(review.driverRank) === number ? "selected" : ""}>${number}/5</option>
              `).join("")}
            </select>
          </label>
          <label>${escapeHtml(tr("通信状況", "Connection Quality"))}
            <select name="connection">
              <option value="">${escapeHtml(tr("未評価", "Not rated"))}</option>
              ${[5, 4, 3, 2, 1].map(number => `
                <option value="${number}" ${Number(review.connection) === number ? "selected" : ""}>${number}/5</option>
              `).join("")}
            </select>
          </label>
        </div>

        <label>${escapeHtml(tr("訪問日", "Visit Date"))}
          <input type="date" name="visitedAt" value="${escapeHtml(review.visitedAt || "")}">
        </label>

        <label>${escapeHtml(tr("コメント", "Comment"))}
          <textarea name="comment" minlength="5" maxlength="1500" required>${escapeHtml(review.comment || "")}</textarea>
        </label>

        <button class="button button-primary" type="submit">
          ${escapeHtml(tr("変更を保存", "Save Changes"))}
        </button>
      </form>
    </div>
  `;

  document.body.appendChild(dialog);
  dialog.showModal();
  dialog.addEventListener("close", () => dialog.remove());

  $("#editReviewForm", dialog).addEventListener("submit", async event => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const patch = {
      storeId: String(formData.get("storeId")),
      maintenance: Number(formData.get("maintenance")),
      overall: Number(formData.get("overall")),
      driverRank: formData.get("driverRank") ? Number(formData.get("driverRank")) : null,
      connection: formData.get("connection") ? Number(formData.get("connection")) : null,
      visitedAt: String(formData.get("visitedAt") || ""),
      comment: String(formData.get("comment") || "").trim()
    };

    if (patch.comment.length < 5) {
      showToast(tr("コメントは5文字以上で入力してください。", "Comments must be at least 5 characters."));
      return;
    }

    if (supabase) {
      const payload = {
        store_id: patch.storeId,
        maintenance: patch.maintenance,
        overall: patch.overall,
        driver_rank: patch.driverRank,
        connection: patch.connection,
        visited_at: patch.visitedAt || null,
        comment: patch.comment
      };

      const { data, error } = await supabase
        .from("reviews")
        .update(payload)
        .eq("id", id)
        .eq("user_id", currentUser.id)
        .select()
        .single();

      if (error || !data) {
        console.error("レビュー更新エラー:", error);
        showToast("更新できませんでした：" + (error?.message || "権限を確認してください"));
        return;
      }

      Object.assign(review, fromDbReview(data));
    } else {
      Object.assign(review, patch);
      saveLocal();
    }

    dialog.close();
    renderAll();
    showToast(tr("レビューを更新しました。", "Review updated."));
  });
}

/* レビュー削除・問題報告 */
async function deleteReview(id) {
  const review = reviews.find(item => item.id === id);

  if (!review || !canManageReview(review)) {
    showToast(tr("自分の投稿のみ削除できます。", "You can only delete your own reviews."));
    return;
  }

  const adminDeleting = isAdmin() && review.authorId !== currentUser.id;

  if (!confirm(adminDeleting
    ? tr("運営者として、この投稿を削除しますか？", "Delete this review as administrator?")
    : tr("このレビューを削除しますか？この操作は取り消せません。", "Delete this review? This cannot be undone.")
  )) return;

  if (supabase) {
    let query = supabase.from("reviews").delete().eq("id", id);
    if (!isAdmin()) query = query.eq("user_id", currentUser.id);

    const { error } = await query;

    if (error) {
      console.error("レビュー削除エラー:", error);
      showToast("削除できませんでした：" + error.message);
      return;
    }
  }

  reviews = reviews.filter(item => item.id !== id);
  if (!supabase) saveLocal();

  renderAll();
  showToast(tr("レビューを削除しました。", "Review deleted."));
}

async function reportReview(id) {
  if (!requireUser()) return;

  const review = reviews.find(item => item.id === id);
  if (!review) return;

  const reason = prompt(tr(
    "問題の内容を入力してください（例：誹謗中傷、虚偽情報、個人情報）",
    "Describe the problem (e.g. abuse, false information, personal information)."
  ));

  if (!reason || !reason.trim()) return;

  if (supabase) {
    const { error } = await supabase.from("review_reports").insert({
      review_id: id,
      reporter_id: currentUser.id,
      reason: reason.trim().slice(0, 500)
    });

    if (error) {
      console.error("報告エラー:", error);
      showToast("報告できませんでした：" + error.message);
      return;
    }
  } else {
    const reports = JSON.parse(localStorage.getItem("inidac-review-reports-v1") || "[]");
    reports.push({
      reviewId: id,
      reporterId: currentUser.id,
      reason: reason.trim(),
      createdAt: new Date().toISOString()
    });
    localStorage.setItem("inidac-review-reports-v1", JSON.stringify(reports));
  }

  showToast(tr("報告を受け付けました。", "Report submitted."));
}

/* 店舗詳細 */
function openDetails(id) {
  const store = stores.find(item => item.id === id);
  if (!store) return;

  const storeReviews = getStoreReviews(id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const maintenance = storeScore(store, "maintenance");
  const overall = storeScore(store, "overall");

  const dialog = document.createElement("dialog");
  dialog.className = "modal detail-dialog";

  dialog.innerHTML = `
    <form method="dialog" class="modal-close-row">
      <button class="icon-button" aria-label="閉じる">×</button>
    </form>
    <div class="detail-content">
      <p class="eyebrow">STORE DETAIL</p>
      <h2>${escapeHtml(store.name)}</h2>
      <div class="store-location">
        <span>⌖</span>
        <span>${escapeHtml(store.country)}${store.region ? "・" + escapeHtml(store.region) : ""}
          <br>${escapeHtml(store.address || "")}</span>
      </div>
      <div class="detail-links">
        <a class="button button-outline" href="${escapeHtml(mapUrl(store))}" target="_blank" rel="noopener noreferrer">
          ${escapeHtml(tr("Google Mapsで開く ↗", "Open Google Maps ↗"))}
        </a>
        <button class="button button-primary" data-review-this="${escapeHtml(store.id)}">
          ${escapeHtml(tr("この店舗をレビュー", "Review this store"))}
        </button>
      </div>

      ${store.description ? `<p class="sub-info">${escapeHtml(store.description)}</p>` : ""}

      <div class="detail-scores">
        <div class="detail-score">
          <span>${escapeHtml(tr("メンテナンス平均", "Average Maintenance"))}</span>
          <strong>${fmtAverage(maintenance)} / 4</strong>
          <small>${escapeHtml(labelForScore(maintenance))} · ${storeReviews.length}${escapeHtml(tr("件", " reviews"))}</small>
        </div>
        <div class="detail-score">
          <span>${escapeHtml(tr("店舗総合平均", "Average Overall Rating"))}</span>
          <strong>${fmtAverage(overall)} / 4</strong>
          <small>${escapeHtml(labelForScore(overall))} · ${storeReviews.length}${escapeHtml(tr("件", " reviews"))}</small>
        </div>
      </div>

      <p class="sub-info">
        ${escapeHtml(tr("店内ランク平均：", "Average Local Player Skill: "))}
        ${fmtAverage(average(storeReviews, "driverRank"))} / 5
        ｜ ${escapeHtml(tr("通信状況平均：", "Average Connection: "))}
        ${fmtAverage(average(storeReviews, "connection"))} / 5
      </p>

      <h3>${escapeHtml(tr("レビュー・コメント", "Reviews & Comments"))} (${storeReviews.length})</h3>
      <div class="detail-comments">
        ${storeReviews.length
          ? storeReviews.map(review => `
            <article class="detail-comment">
              <div class="review-badges">
                <span class="review-badge">${escapeHtml(tr("整備：", "Maintenance: "))}${escapeHtml(labelForScore(Number(review.maintenance)))}</span>
                <span class="review-badge">${escapeHtml(tr("店舗：", "Store: "))}${escapeHtml(labelForScore(Number(review.overall)))}</span>
                ${review.driverRank ? `<span class="review-badge">${escapeHtml(tr("店内ランク ", "Local Skill "))}${review.driverRank}/5</span>` : ""}
                ${review.connection ? `<span class="review-badge">${escapeHtml(tr("通信 ", "Connection "))}${review.connection}/5</span>` : ""}
              </div>
              <p>${escapeHtml(displayedComment(review))}</p>
              <small>${escapeHtml(review.author || "メンバー")} · ${escapeHtml(tr("訪問日 ", "Visited "))}${escapeHtml(dateLabel(review.visitedAt))}</small>
              <div class="review-actions">${reviewActions(review)}</div>
            </article>
          `).join("")
          : `<div class="no-reviews">${escapeHtml(tr("まだレビューはありません。", "No reviews yet."))}</div>`
        }
      </div>
    </div>
  `;

  document.body.appendChild(dialog);
  dialog.showModal();
  dialog.addEventListener("close", () => dialog.remove());
  dialog.addEventListener("click", event => {
    if (event.target === dialog) dialog.close();
  });

  $("[data-review-this]", dialog)?.addEventListener("click", () => {
    dialog.close();
    if ($("#reviewStoreSelect")) $("#reviewStoreSelect").value = id;
    $("#review")?.scrollIntoView({ behavior: "smooth" });
    if (!currentUser) $("#authDialog")?.showModal();
  });
}

/* ログイン・新規登録 */
function setAuthMode(mode) {
  authMode = mode;

  $$(".auth-tabs button").forEach(button => {
    button.classList.toggle("active", button.dataset.mode === mode);
  });

  if ($("#authTitle")) {
    $("#authTitle").textContent = mode === "login" ? tr("ログイン", "Login") : tr("新規登録", "Sign Up");
  }

  if ($("#authSubmit")) {
    $("#authSubmit").textContent = mode === "login" ? tr("ログイン", "Login") : tr("アカウントを作成", "Create Account");
  }

  $("#authForm input[name=password]")?.setAttribute(
    "autocomplete",
    mode === "login" ? "current-password" : "new-password"
  );
}

async function handleAuth(event) {
  event.preventDefault();

  const formData = new FormData(event.currentTarget);
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    showToast(tr("メールアドレスとパスワードを入力してください。", "Enter your email and password."));
    return;
  }

  if (supabase) {
    try {
      const result = authMode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

      if (result.error) {
        console.error("認証エラー:", result.error);
        showToast(result.error.message);
        return;
      }

      currentUser = result.data?.user || null;
      updateAuthButton();

      if (authMode === "signup" && !result.data?.session) {
        showToast(tr(
          "登録を受け付けました。メール確認が必要な場合は受信箱を確認してください。",
          "Registration received. Check your email if confirmation is required."
        ));
        $("#authDialog")?.close();
        return;
      }

      $("#authDialog")?.close();
      renderAll();
      showToast(authMode === "signup" ? tr("登録しました。", "Registration successful.") : tr("ログインしました。", "Logged in."));
    } catch (error) {
      console.error("認証処理エラー:", error);
      showToast(error.message || tr("認証に失敗しました。", "Authentication failed."));
    }
    return;
  }

  if (authMode === "signup") {
    if (password.length < 8) {
      showToast(tr("パスワードは8文字以上にしてください。", "Password must be at least 8 characters."));
      return;
    }

    currentUser = { id: "local-" + uid(), email };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(currentUser));
  } else {
    const profile = getCurrentProfile();
    if (!profile || profile.email !== email) {
      showToast(tr("デモモードでは先に新規登録してください。", "In demo mode, create a profile first."));
      return;
    }
    currentUser = profile;
  }

  updateAuthButton();
  $("#authDialog")?.close();
  renderAll();
  showToast(authMode === "signup" ? tr("デモプロフィールを作成しました。", "Demo profile created.") : tr("ログインしました（デモ）。", "Logged in (demo)."));
}

/* 日本語・英語の切り替え */
function applyLanguage() {
  document.documentElement.lang = currentLanguage;

  const map = {
    "店舗を探す": "Find Stores",
    "すべての国": "All countries",
    "すべての地域": "All regions",
    "国を選択": "Select a country",
    "店舗を追加": "Add a Store",
    "編集モード": "Edit Website",
    "編集を保存": "Save Changes",
    "ログイン / 登録": "Login / Sign Up",
    "次に走る店を、": "Find your next arcade,",
    "レビューで見つけよう。": "through player reviews.",
    "店舗を登録する": "Add a Store",
    "登録店舗": "Stores",
    "レビュー": "Reviews",
    "レビュー・コメント": "Reviews & Comments",
    "メンテナンス": "Maintenance",
    "店舗総合評価": "Overall Store Rating",
    "店内ランク": "Local Player Skill",
    "通信状況": "Connection Quality",
    "台数未登録": "No cabinet count",
    "訪問日未登録": "No visit date",
    "日本・海外対応": "Japan & Worldwide",
    "店舗名・住所で検索": "Search store name or address",
    "国名で絞り込み": "Filter by country",
    "日本国内のみ入力": "Filter by region",
    "レビューが多い順": "Most reviews",
    "メンテナンス評価順": "Maintenance rating",
    "店舗総合評価順": "Overall rating",
    "店舗名順": "Store name",
    "店舗が見つかりません": "No stores found",
    "店舗情報": "Store Information",
    "場所と基本情報を登録": "Add location and basic information",
    "店舗名": "Store name",
    "国": "Country",
    "都道府県・州・地域": "State / Region",
    "住所": "Address",
    "設置台数": "Cabinet count",
    "店舗メモ": "Store notes",
    "必須": "Required",
    "任意": "Optional",
    "Google Mapsで場所を共有": "Share the location with Google Maps",
    "店舗の重複に注意": "Avoid duplicate listings",
    "レビューは体験ベースで": "Keep reviews experience-based",
    "レビューを投稿する": "Post a Review",
    "店舗を選択": "Select a store",
    "コメント（日本語）": "Comment",
    "コメント": "Comment",
    "最近のレビュー": "Recent Reviews",
    "編集": "Edit",
    "削除": "Delete",
    "運営削除": "Admin delete",
    "問題を報告": "Report issue",
    "詳細・コメント": "Details & Reviews",
    "この店舗をレビュー": "Review this store",
    "まだレビューはありません。": "No reviews yet.",
    "Google Mapsで開く ↗": "Open Google Maps ↗",
    "変更を保存": "Save Changes",
    "ログアウトしました。": "Logged out.",
    "ログインしました。": "Logged in.",
    "レビューを更新しました。": "Review updated.",
    "レビューを投稿しました。": "Review posted.",
    "店舗を登録しました。": "Store added."
  };

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes = [];

  while (walker.nextNode()) nodes.push(walker.currentNode);

  for (const node of nodes) {
    if (!node.__jaOriginal) node.__jaOriginal = node.nodeValue;
    const original = node.__jaOriginal.trim();
    if (!original) continue;

    const translated = map[original];
    if (translated) {
      node.nodeValue = node.__jaOriginal.replace(
        original,
        currentLanguage === "en" ? translated : original
      );
    }
  }

  const placeholderMap = {
    "店舗名・住所で検索": "Search store name or address",
    "国名で絞り込み": "Filter by country",
    "日本国内のみ入力": "Filter by region",
    "例：○○ゲームセンター": "e.g. Arcade name",
    "例：日本 / Malaysia": "e.g. Japan / Malaysia",
    "日本の場合：千葉県": "For Japan: Chiba Prefecture",
    "海外店舗は入力不要": "Not required for overseas stores",
    "Google Mapsで検索できる住所": "Address searchable in Google Maps",
    "例：4": "e.g. 4",
    "営業時間、混雑しやすい時間など": "Opening hours, busy times, etc.",
    "体験した内容を日本語で入力": "Write your experience in Japanese or English",
    "You may also write your review in English.": "Write your review in Japanese or English"
  };

  document.querySelectorAll("input[placeholder], textarea[placeholder]").forEach(element => {
    if (!element.dataset.originalPlaceholder) {
      element.dataset.originalPlaceholder = element.placeholder;
    }

    const original = element.dataset.originalPlaceholder;
    element.placeholder = currentLanguage === "en"
      ? (placeholderMap[original] || original)
      : original;
  });

  const languageButton = $("#languageToggle");
  if (languageButton) {
    languageButton.textContent = currentLanguage === "ja" ? "English" : "日本語";
  }

  updateAuthButton();
  renderAll();
}

/* イベント登録 */
$("#storeCountry")?.addEventListener("input", populateRegions);

$("#countryFilter")?.addEventListener("input", () => {
  populateRegions();
  renderStores();
});

$("#regionFilter")?.addEventListener("input", renderStores);
$("#regionFilter")?.addEventListener("change", renderStores);
$("#sortFilter")?.addEventListener("change", renderStores);

// 検索欄が再生成されても検索できるようにする
document.addEventListener("input", event => {
  if (
    event.target instanceof Element &&
    event.target.matches("#searchInput")
  ) {
    renderStores();
  }
});
/* 店舗登録 */
$("#storeForm")?.addEventListener("submit", async event => {
  event.preventDefault();
  if (!requireUser()) return;

  const formData = new FormData(event.currentTarget);
  const country = String(formData.get("country") || "").trim();
  const region = String(formData.get("region") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const address = String(formData.get("address") || "").trim();

  if (!name || !country || !address) {
    showToast(tr("店舗名・国・住所を入力してください。", "Enter the store name, country, and address."));
    return;
  }

  if (country === "日本" && !region) {
    showToast(tr("日本国内の店舗は都道府県を入力してください。", "Select a prefecture for stores in Japan."));
    return;
  }

  await addStore({
    name,
    country,
    region,
    address,
    mapsUrl: String(formData.get("mapsUrl") || "").trim(),
    cabinetCount: formData.get("cabinetCount") ? Number(formData.get("cabinetCount")) : null,
    description: String(formData.get("description") || "").trim()
  });
});

/* レビュー投稿：コメント欄は1つ。commentEnは参照しない */
$("#reviewForm")?.addEventListener("submit", async event => {
  event.preventDefault();
  if (!requireUser()) return;

  const formData = new FormData(event.currentTarget);

  if (!formData.get("honest")) {
    showToast(tr("確認項目にチェックしてください。", "Please check the confirmation box."));
    return;
  }

  if (!formData.get("storeId") || !formData.get("comment")) {
    showToast(tr("店舗とコメントを入力してください。", "Select a store and enter a comment."));
    return;
  }

  await addReview({
    storeId: String(formData.get("storeId")),
    maintenance: Number(formData.get("maintenance")),
    overall: Number(formData.get("overall")),
    driverRank: formData.get("driverRank") ? Number(formData.get("driverRank")) : null,
    connection: formData.get("connection") ? Number(formData.get("connection")) : null,
    comment: String(formData.get("comment") || "").trim(),
    visitedAt: String(formData.get("visitedAt") || "")
  });
});

/* ログイン・ログアウト */
$("#authButton")?.addEventListener("click", async () => {
  if (currentUser) {
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        showToast(error.message);
        return;
      }
    } else {
      localStorage.removeItem(PROFILE_KEY);
    }

    currentUser = null;
    updateAuthButton();
    renderAll();
    showToast(tr("ログアウトしました。", "Logged out."));
  } else {
    $("#authDialog")?.showModal();
  }
});

$("#authForm")?.addEventListener("submit", handleAuth);

$$(".auth-tabs button").forEach(button => {
  button.addEventListener("click", () => setAuthMode(button.dataset.mode));
});

/* 店舗詳細ボタン */
$("#storeGrid")?.addEventListener("click", event => {
  const button = event.target.closest("[data-details]");
  if (button) openDetails(button.dataset.details);
});

/* レビュー操作 */
document.addEventListener("click", event => {
  const editButton = event.target.closest("[data-edit-review]");
  if (editButton) {
    editReview(editButton.dataset.editReview);
    return;
  }

  const deleteButton = event.target.closest("[data-delete-review]");
  if (deleteButton) {
    deleteReview(deleteButton.dataset.deleteReview);
    return;
  }

  const reportButton = event.target.closest("[data-report-review]");
  if (reportButton) reportReview(reportButton.dataset.reportReview);
});

/* トップへ戻る */
$("#homeLink")?.addEventListener("click", event => {
  event.preventDefault();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

/* 言語切り替え */
$("#languageToggle")?.addEventListener("click", () => {
  currentLanguage = currentLanguage === "ja" ? "en" : "ja";
  localStorage.setItem("inidac-language", currentLanguage);
  applyLanguage();
});

/* 初期化 */
if ($("#visitedAt")) {
  $("#visitedAt").value = new Date().toISOString().slice(0, 10);
}

removeSeparateEnglishCommentField();
populateCountries();
setAuthMode("login");

loadData().then(() => {
  removeSeparateEnglishCommentField();
  applyLanguage();
});

})();
