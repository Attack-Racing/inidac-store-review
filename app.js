/* イニDAC 店舗レビュー — front-end prototype.
   For public multi-user use, configure Supabase in CONFIG below and run supabase/schema.sql.
*/
const CONFIG = {
  supabaseUrl: "https://eujaamtodxwnugvrxrql.supabase.co",
  supabaseAnonKey: "sb_publishable_Ao3TirjTJ1W991HpxG5Lmg_sZfycu1" // public key only; never use a service_role key
};
const ADMIN_EMAILS = ["grgt1462@gmail.com"];
const $ = (selector, root=document) => root.querySelector(selector);
const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
const STORAGE_KEY = "inidac-review-data-v1";
const PROFILE_KEY = "inidac-review-profile-v1";
const COUNTRIES = [
  {name:"日本", regions:["北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県","茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県","新潟県","富山県","石川県","福井県","山梨県","長野県","岐阜県","静岡県","愛知県","三重県","滋賀県","京都府","大阪府","兵庫県","奈良県","和歌山県","鳥取県","島根県","岡山県","広島県","山口県","徳島県","香川県","愛媛県","高知県","福岡県","佐賀県","長崎県","熊本県","大分県","宮崎県","鹿児島県","沖縄県"]},
  {name:"マレーシア", regions:["Johor","Kedah","Kelantan","Kuala Lumpur","Labuan","Melaka","Negeri Sembilan","Pahang","Penang","Perak","Perlis","Putrajaya","Sabah","Sarawak","Selangor","Terengganu"]},
  {name:"台湾", regions:["台北市","新北市","桃園市","台中市","台南市","高雄市","その他"]},
  {name:"香港", regions:["香港島","九龍","新界","その他"]},
  {name:"韓国", regions:["ソウル","釜山","仁川","大邱","その他"]},
  {name:"シンガポール", regions:["Central","East","North","North-East","West"]},
  {name:"その他", regions:["その他"]}
];
const demoStores = [
  {id:"demo-1",name:"サンプル・レーシングアーケード",country:"日本",region:"千葉県",address:"千葉県千葉市",mapsUrl:"",cabinetCount:4,description:"これは表示イメージ用のサンプル店舗です。実在店舗の情報ではありません。",createdAt:"2026-10-01T10:00:00.000Z",demo:true},
  {id:"demo-2",name:"Sample Arcade KL",country:"マレーシア",region:"Kuala Lumpur",address:"Kuala Lumpur, Malaysia",mapsUrl:"",cabinetCount:2,description:"Sample data for layout preview. Not a real listing.",createdAt:"2026-10-02T10:00:00.000Z",demo:true}
];
const demoReviews = [
  {id:"demo-r1",storeId:"demo-1",maintenance:4,overall:3,driverRank:4,connection:null,comment:"【サンプルレビュー】ハンドルやペダルの状態などを、ここに実際の体験として記入します。",visitedAt:"2026-10-10",createdAt:"2026-10-10T10:00:00.000Z",author:"サンプルユーザー",demo:true},
  {id:"demo-r2",storeId:"demo-1",maintenance:3,overall:4,driverRank:3,connection:null,comment:"【サンプルレビュー】店舗の雰囲気や待ち時間などの例です。実際の評価ではありません。",visitedAt:"2026-10-12",createdAt:"2026-10-12T10:00:00.000Z",author:"サンプルユーザー",demo:true},
  {id:"demo-r3",storeId:"demo-2",maintenance:3,overall:3,driverRank:4,connection:2,comment:"[Sample review] Example text only. Replace with a real experience before relying on the rating.",visitedAt:"2026-10-11",createdAt:"2026-10-11T10:00:00.000Z",author:"Sample User",demo:true}
];
let supabase = null, currentUser = null, authMode = "login", toastTimer;
let stores = [], reviews = [];
let currentLanguage = localStorage.getItem("inidac-language") === "en" ? "en" : "ja";
function tr(ja,en){return currentLanguage === "en" ? en : ja;}
function displayedComment(r){return currentLanguage === "en" && r.commentEn ? r.commentEn : r.comment;}
function applyLanguage(){
  renderAll();
  document.documentElement.lang=currentLanguage;
  const map={"店舗を探す":"Find Stores","店舗を追加":"Add a Store","編集モード":"Edit Website","編集を保存":"Save Changes","ログイン / 登録":"Login / Sign Up","次に走る店を、":"Find your next arcade,","レビューで見つけよう。":"through player reviews.","筐体の整備状態、店舗の雰囲気、店内ドライバーのレベル。プレイヤーの体験を共有して、遊びに行く店舗選びに役立てよう。":"Share cabinet condition, store atmosphere, and local player skill to help others choose where to play.","店舗を登録する":"Add a Store","登録店舗":"Stores","レビュー":"Reviews","日本・海外対応":"Japan & Worldwide","店舗ごとにレビューを集約し、平均評価を表示します。":"Reviews are grouped by store and average ratings are shown.","店舗名・住所で検索":"Search store name or address","国名で絞り込み":"Filter by country","日本国内のみ入力":"Filter by region","レビューが多い順":"Most reviews","メンテナンス評価順":"Maintenance rating","店舗総合評価順":"Overall rating","店舗名順":"Store name","店舗が見つかりません":"No stores found","検索条件を変えるか、新しい店舗を登録してください。":"Change your search or add a new store.","登録済み店舗がないか確認してから追加してください。":"Check whether the store is already listed before adding it.","店舗情報":"Store Information","場所と基本情報を登録":"Add location and basic information","店舗名":"Store name","国":"Country","都道府県・州・地域":"State / Region","住所":"Address","設置台数":"Cabinet count","店舗メモ":"Store notes","必須":"Required","任意":"Optional","Google Mapsで場所を共有":"Share the location with Google Maps","店舗の重複に注意":"Avoid duplicate listings","レビューは体験ベースで":"Keep reviews experience-based","レビューを投稿する":"Post a Review","店舗を選び、評価とコメントを入力してください。":"Choose a store, then enter ratings and comments.","メンテナンス評価":"Maintenance","店舗総合評価":"Overall Store Rating","店内ランク":"Local Player Skill","通信状況":"Connection Quality","コメント（日本語）":"Comment (Japanese)","訪問日":"Visit Date","最近のレビュー":"Recent Reviews","プレイヤー同士で、もっと良い走行スポットを見つけよう。":"Help fellow players find better places to race.","実際の体験に基づくレビューであり、個人情報や誹謗中傷を含めていません。":"This review reflects my own experience and contains no personal data or abuse.","変更を保存":"Save Changes","レビューを更新しました。":"Review updated.","レビューを投稿しました。":"Review posted.","店舗を登録しました。":"Store added.","Google Mapsで開く ↗":"Open Google Maps ↗","詳細・コメント":"Details & Reviews","この店舗をレビュー":"Review this store","まだレビューはありません。":"No reviews yet.","問題を報告":"Report issue","編集":"Edit","削除":"Delete","運営削除":"Admin delete"};
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
  for(const n of nodes){if(!n.__jaOriginal)n.__jaOriginal=n.nodeValue;const original=n.__jaOriginal.trim();if(!original)continue;const translated=map[original];if(translated)n.nodeValue=n.__jaOriginal.replace(original,currentLanguage==="en"?translated:original);}
  const placeholderMap={"店舗名・住所で検索":"Search store name or address","国名で絞り込み":"Filter by country","日本国内のみ入力":"Filter by region","例：○○ゲームセンター":"e.g. Arcade name","例：日本 / Malaysia":"e.g. Japan / Malaysia","日本の場合：千葉県":"For Japan: Chiba Prefecture","海外店舗は入力不要":"Not required for overseas stores","Google Mapsで検索できる住所":"Address searchable in Google Maps","https://maps.google.com/...":"https://maps.google.com/...","例：4":"e.g. 4","営業時間、混雑しやすい時間など":"Opening hours, busy times, etc.","体験した内容を日本語で入力":"Describe your experience in Japanese","You may also write your review in English.":"You may also write your review in English."};
  document.querySelectorAll("input[placeholder],textarea[placeholder]").forEach(el=>{if(!el.dataset.originalPlaceholder)el.dataset.originalPlaceholder=el.placeholder;const original=el.dataset.originalPlaceholder;el.placeholder=currentLanguage==="en"?(placeholderMap[original]||original):original;});
  const b=document.getElementById("languageToggle");if(b)b.textContent=currentLanguage==="ja"?"English":"日本語";
}

function isConfigured(){return !!(CONFIG.supabaseUrl && CONFIG.supabaseAnonKey && window.supabase);}
function escapeHtml(value=""){return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function uid(){return crypto.randomUUID ? crypto.randomUUID() : "id-"+Date.now()+"-"+Math.random().toString(16).slice(2);}
function showToast(message){const el=$("#toast");el.textContent=message;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2800);}
function readLocal(){try{const saved=JSON.parse(localStorage.getItem(STORAGE_KEY));if(saved && Array.isArray(saved.stores)&&Array.isArray(saved.reviews))return saved;}catch(e){}return {stores:[...demoStores],reviews:[...demoReviews]};}
function saveLocal(){localStorage.setItem(STORAGE_KEY,JSON.stringify({stores,reviews}));}
function average(list,key){const values=list.map(x=>Number(x[key])).filter(n=>Number.isFinite(n)&&n>=1);return values.length?values.reduce((a,b)=>a+b,0)/values.length:null;}
function fmtAverage(n){return n===null?"—":n.toFixed(1);}
function countLabel(n){return `${n}件`;}
function labelForScore(n){if(n===null)return "未評価";if(n>=3.5)return "良い";if(n>=2.5)return "普通";if(n>=1.5)return "少し悪い";return "悪い";}
function getStoreReviews(id){return reviews.filter(r=>r.storeId===id);}
function storeScore(store,key){return average(getStoreReviews(store.id),key);}
function mapUrl(store){if(store.mapsUrl && /^https?:\/\//i.test(store.mapsUrl))return store.mapsUrl;return "https://www.google.com/maps/search/?api=1&query="+encodeURIComponent([store.name,store.address,store.region,store.country].filter(Boolean).join(" "));}
function dateLabel(value){if(!value)return "訪問日未登録";const d=new Date(value+"T00:00:00");return Number.isNaN(d.getTime())?value:d.toLocaleDateString("ja-JP");}
function populateCountries(){
  // Country and region are free-text fields; international listings only need country.
  const countryInput=$("#storeCountry"), regionInput=$("#storeRegion");
  function updateRegionRequirement(){
    const isJapan=countryInput.value.trim().toLowerCase()==="日本" || countryInput.value.trim().toLowerCase()==="japan";
    regionInput.required=isJapan;
    regionInput.disabled=!isJapan;
    regionInput.value=isJapan?regionInput.value:"";
    regionInput.placeholder=isJapan?"日本の場合：千葉県":"海外店舗は入力不要";
    $("#regionFieldLabel").classList.toggle("muted",!isJapan);
  }
  countryInput.addEventListener("input",updateRegionRequirement);
  updateRegionRequirement();
}
function populateRegions(){}
function refreshReviewStoreSelect(){const select=$("#reviewStoreSelect"),previous=select.value;select.innerHTML='<option value="">店舗を選択</option>'+stores.map(s=>`<option value="${escapeHtml(s.id)}">${escapeHtml(s.name)}（${escapeHtml(s.country)}${s.region?`・${escapeHtml(s.region)}`:""}）</option>`).join("");if(stores.some(s=>s.id===previous))select.value=previous;}
function renderStats(){$("#storeCount").textContent=stores.length;$("#reviewCount").textContent=reviews.length;}
function renderStores(){
  const query=$("#searchInput").value.trim().toLocaleLowerCase(),country=$("#countryFilter").value,region=$("#regionFilter").value,sort=$("#sortFilter").value;
  let list=stores.filter(s=>(!country||s.country.toLocaleLowerCase().includes(country.toLocaleLowerCase()))&&(!region||String(s.region||"").toLocaleLowerCase().includes(region.toLocaleLowerCase()))&&(!query||[s.name,s.address,s.country,s.region].join(" ").toLocaleLowerCase().includes(query)));
  list.sort((a,b)=>{if(sort==="name")return a.name.localeCompare(b.name,"ja");if(sort==="maintenance")return (storeScore(b,"maintenance")??0)-(storeScore(a,"maintenance")??0);if(sort==="overall")return (storeScore(b,"overall")??0)-(storeScore(a,"overall")??0);return getStoreReviews(b.id).length-getStoreReviews(a.id).length;});
  $("#resultCount").textContent=`${list.length} 件`;$("#emptyState").classList.toggle("hidden",list.length!==0);
  $("#storeGrid").innerHTML=list.map(s=>{const rs=getStoreReviews(s.id),m=storeScore(s,"maintenance"),o=storeScore(s,"overall");return `<article class="store-card">
    <div class="store-card-top"><span class="store-code">ARCADE SPOT / ${escapeHtml(s.country)}</span><span class="store-icon">⌖</span></div>
    <div class="store-card-body"><h3>${escapeHtml(s.name)}</h3><div class="store-location"><span>⌖</span><span>${escapeHtml(s.country)}${s.region?`・${escapeHtml(s.region)}`:""}<br>${escapeHtml(s.address)}</span></div>
    <div class="store-rating-row"><div class="rating-chip"><small>メンテナンス</small><strong>${fmtAverage(m)} <span class="rating-word">${labelForScore(m)}</span></strong></div><div class="rating-chip"><small>店舗総合評価</small><strong>${fmtAverage(o)} <span class="rating-word">${labelForScore(o)}</span></strong></div></div>
    <div class="store-meta"><span>レビュー ${countLabel(rs.length)}</span><span>${s.cabinetCount?`設置 ${s.cabinetCount}台`:"台数未登録"}</span></div>
    <div class="store-card-actions"><button class="mini-button primary-mini" data-details="${escapeHtml(s.id)}">詳細・コメント</button><a class="mini-button" href="${escapeHtml(mapUrl(s))}" target="_blank" rel="noopener noreferrer">Google Maps ↗</a></div></div></article>`;}).join("");
  renderStats();refreshReviewStoreSelect();
}
function renderRecent(){
  const recent=[...reviews].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,6);
  $("#recentReviews").innerHTML=recent.length?recent.map(r=>{const s=stores.find(x=>x.id===r.storeId);return `<article class="recent-review"><div class="recent-review-head"><h3>${escapeHtml(s?.name||"削除済み店舗")}</h3><time>${escapeHtml(dateLabel(r.visitedAt))}</time></div><div class="review-badges"><span class="review-badge">整備：${labelForScore(Number(r.maintenance))}</span><span class="review-badge">店舗：${labelForScore(Number(r.overall))}</span>${r.driverRank?`<span class="review-badge">店内ランク ${r.driverRank}/5</span>`:""}${r.connection?`<span class="review-badge">通信 ${r.connection}/5</span>`:""}</div><p>${escapeHtml(displayedComment(r))}</p><small class="muted">投稿者：${escapeHtml(r.author||"メンバー")} · ${escapeHtml(new Date(r.createdAt).toLocaleDateString("ja-JP"))}</small><div class="review-actions">${reviewActions(r)}</div></article>`;}).join(""):'<div class="no-reviews">まだレビューはありません。最初のレビューを投稿してください。</div>';
}
function renderAll(){renderStores();renderRecent();}
function getCurrentProfile(){try{return JSON.parse(localStorage.getItem(PROFILE_KEY)||"null");}catch(e){return null;}}
function updateAuthButton(){const btn=$("#authButton");btn.textContent=currentUser?(currentUser.email||currentUser.user_metadata?.nickname||"ログイン中")+" · ログアウト":"ログイン / 登録";window.__inidacIsAdmin=(email)=>!!(supabase && currentUser && ADMIN_EMAILS.includes(String(currentUser.email||"").toLowerCase()) && String(email||"").toLowerCase()===String(currentUser.email||"").toLowerCase());window.__inidacSupabase=supabase;window.__inidacCurrentUser=currentUser;window.dispatchEvent(new Event("inidac-auth-updated"));}
async function loadData(){
  if(isConfigured()){
    supabase=window.supabase.createClient(CONFIG.supabaseUrl,CONFIG.supabaseAnonKey);
    const {data:{session}}=await supabase.auth.getSession();currentUser=session?.user||null;
    supabase.auth.onAuthStateChange((_event,session)=>{currentUser=session?.user||null;updateAuthButton();});
    const [s,r]=await Promise.all([supabase.from("stores").select("*").order("name"),supabase.from("reviews").select("*").order("created_at",{ascending:false})]);
    if(s.error||r.error){console.error(s.error||r.error);showToast("データを読み込めません。Supabaseのテーブル・権限設定を確認してください。");stores=[];reviews=[];}
    else {stores=(s.data||[]).map(fromDbStore);reviews=(r.data||[]).map(fromDbReview);}
    $("#storeFormNote").textContent="オンラインモード：登録ユーザーは店舗を追加できます。";
    $("#reviewFormNote").textContent="オンラインモード：ログインしてレビューを投稿できます。";
    $("#authNote").textContent="Supabase Authでメールアドレスとパスワードを管理します。";
  }else{
    const data=readLocal();stores=data.stores;reviews=data.reviews;currentUser=getCurrentProfile();
    $("#storeFormNote").textContent="デモモード：データはこのブラウザ内だけに保存されます。他の人には共有されません。";
    $("#reviewFormNote").textContent="デモモード：レビューはこのブラウザ内だけに保存されます。他の人には共有されません。";
    $("#authNote").textContent="デモモードの簡易プロフィールです。実際の認証ではありません。";
  }
  updateAuthButton();renderAll();
}
function fromDbStore(s){return {id:s.id,name:s.name,country:s.country,region:s.region,address:s.address,mapsUrl:s.maps_url,cabinetCount:s.cabinet_count,description:s.description,createdAt:s.created_at};}
function fromDbReview(r){return {id:r.id,storeId:r.store_id,maintenance:r.maintenance,overall:r.overall,driverRank:r.driver_rank,connection:r.connection,comment:r.comment,commentEn:r.comment_en||"",visitedAt:r.visited_at,createdAt:r.created_at,author:r.author_name||"メンバー",authorId:r.user_id};}
function isAdmin(){return !!(supabase && currentUser && ADMIN_EMAILS.includes(String(currentUser.email||"").toLowerCase()));}
function canManageReview(r){return !!(currentUser && (r.authorId===currentUser.id || (isAdmin() && supabase)));}
function reviewActions(r){if(!currentUser)return `<button class="mini-button" data-report-review="${escapeHtml(r.id)}">問題を報告</button>`;const own=r.authorId===currentUser.id;return `${own?`<button class="mini-button" data-edit-review="${escapeHtml(r.id)}">編集</button><button class="mini-button danger-mini" data-delete-review="${escapeHtml(r.id)}">削除</button>`:""}${isAdmin()&&!own?`<button class="mini-button danger-mini" data-delete-review="${escapeHtml(r.id)}">運営削除</button>`:""}${!own?`<button class="mini-button" data-report-review="${escapeHtml(r.id)}">問題を報告</button>`:""}`;}
function requireUser(){if(!currentUser){$("#authDialog").showModal();showToast("投稿するにはログイン / 登録してください。");return false;}return true;}
async function addStore(data){
  const duplicate=stores.find(s=>s.name.trim().toLowerCase()===data.name.trim().toLowerCase()&&s.country.trim().toLowerCase()===data.country.trim().toLowerCase()&&String(s.region||"").trim().toLowerCase()===String(data.region||"").trim().toLowerCase());
  if(duplicate){showToast("同じ店舗が登録済みのようです。既存店舗のレビューをご利用ください。");openDetails(duplicate.id);return;}
  const store={id:uid(),...data,createdAt:new Date().toISOString()};
  if(supabase){
    const {data:created,error}=await supabase.from("stores").insert({name:store.name,country:store.country,region:store.region||"",address:store.address,maps_url:store.mapsUrl||null,cabinet_count:store.cabinetCount||null,description:store.description||null,created_by:currentUser.id}).select().single();
    if(error){showToast("店舗を登録できませんでした："+error.message);return;}stores.push(fromDbStore(created));
  }else{stores.push(store);saveLocal();}
  $("#storeForm").reset();renderAll();showToast("店舗を登録しました。");
}
async function addReview(data){
  const duplicate=reviews.find(r=>r.storeId===data.storeId&&r.authorId===currentUser.id&&r.visitedAt===data.visitedAt&&r.comment.trim()===data.comment.trim());
  if(duplicate){showToast("同じ内容のレビューが登録済みです。");return;}
  const review={id:uid(),...data,createdAt:new Date().toISOString(),author:currentUser.email||"メンバー",authorId:currentUser.id};
  if(supabase){
    const payload={store_id:review.storeId,maintenance:review.maintenance,overall:review.overall,driver_rank:review.driverRank,connection:review.connection,comment:review.comment,comment_en:review.commentEn||null,visited_at:review.visitedAt||null,author_name:currentUser.email?.split("@")[0]||"メンバー",user_id:currentUser.id};
    const {data:created,error}=await supabase.from("reviews").insert(payload).select().single();
    if(error){showToast("レビューを投稿できませんでした："+error.message);return;}reviews.unshift(fromDbReview(created));
  }else{reviews.unshift(review);saveLocal();}
  $("#reviewForm").reset();$("#visitedAt").value=new Date().toISOString().slice(0,10);renderAll();showToast("レビューを投稿しました。");
}
async function editReview(id){
  if(!requireUser())return;const r=reviews.find(x=>x.id===id);if(!r||!currentUser||r.authorId!==currentUser.id){showToast("自分の投稿のみ編集できます。");return;}
  const d=document.createElement("dialog");d.className="modal";
  d.innerHTML=`<form method="dialog" class="modal-close-row"><button class="icon-button" aria-label="閉じる">×</button></form><div class="modal-content"><h2>レビューを編集</h2><form id="editReviewForm" class="form-panel"><label>店舗<select name="storeId" required>${stores.map(s=>`<option value="${escapeHtml(s.id)}" ${s.id===r.storeId?"selected":""}>${escapeHtml(s.name)}（${escapeHtml(s.country)}${s.region?`・${escapeHtml(s.region)}`:""}）</option>`).join("")}</select></label><div class="form-row"><label>メンテナンス評価<select name="maintenance">${[4,3,2,1].map(n=>`<option value="${n}" ${Number(r.maintenance)===n?"selected":""}>${n} - ${labelForScore(n)}</option>`).join("")}</select></label><label>店舗総合評価<select name="overall">${[4,3,2,1].map(n=>`<option value="${n}" ${Number(r.overall)===n?"selected":""}>${n} - ${labelForScore(n)}</option>`).join("")}</select></label></div><div class="form-row"><label>店内ランク<select name="driverRank"><option value="">未評価</option>${[5,4,3,2,1].map(n=>`<option value="${n}" ${Number(r.driverRank)===n?"selected":""}>${n}/5</option>`).join("")}</select></label><label>通信状況<select name="connection"><option value="">未評価</option>${[5,4,3,2,1].map(n=>`<option value="${n}" ${Number(r.connection)===n?"selected":""}>${n}/5</option>`).join("")}</select></label></div><label>訪問日<input type="date" name="visitedAt" value="${escapeHtml(r.visitedAt||"")}"></label><label>コメント（日本語）<textarea name="comment" minlength="5" maxlength="1500" required>${escapeHtml(r.comment)}</textarea></label><label>Comment (English)<textarea name="commentEn" maxlength="1500">${escapeHtml(r.commentEn||"")}</textarea></label><button class="button button-primary" type="submit">変更を保存</button></form></div>`;
  document.body.appendChild(d);d.showModal();d.addEventListener("close",()=>d.remove());
  $("#editReviewForm",d).addEventListener("submit",async e=>{e.preventDefault();const fd=new FormData(e.currentTarget);const patch={storeId:String(fd.get("storeId")),maintenance:Number(fd.get("maintenance")),overall:Number(fd.get("overall")),driverRank:fd.get("driverRank")?Number(fd.get("driverRank")):null,connection:fd.get("connection")?Number(fd.get("connection")):null,visitedAt:String(fd.get("visitedAt")||""),comment:String(fd.get("comment")).trim(),commentEn:String(fd.get("commentEn")||"").trim()};if(patch.comment.length<5){showToast("コメントは5文字以上で入力してください。");return;}
    if(supabase){const payload={store_id:patch.storeId,maintenance:patch.maintenance,overall:patch.overall,driver_rank:patch.driverRank,connection:patch.connection,visited_at:patch.visitedAt||null,comment:patch.comment,comment_en:patch.commentEn||null};let q=supabase.from("reviews").update(payload).eq("id",id);if(!isAdmin())q=q.eq("user_id",currentUser.id);const {data,error}=await q.select().single();if(error||!data){showToast("更新できませんでした："+(error?.message||"権限を確認してください"));return;}Object.assign(r,fromDbReview(data));}
    else{Object.assign(r,patch);saveLocal();}
    d.close();renderAll();showToast("レビューを更新しました。");
  });
}
async function deleteReview(id){const r=reviews.find(x=>x.id===id);if(!r||!canManageReview(r)){showToast("自分の投稿のみ削除できます。");return;}if(!confirm(isAdmin()&&r.authorId!==currentUser.id?"運営者として、この投稿を削除しますか？":"このレビューを削除しますか？この操作は取り消せません。"))return;
  if(supabase){let q=supabase.from("reviews").delete().eq("id",id);if(!isAdmin())q=q.eq("user_id",currentUser.id);const {error}=await q;if(error){showToast("削除できませんでした："+error.message);return;}}
  else saveLocal();reviews=reviews.filter(x=>x.id!==id);if(!supabase)saveLocal();renderAll();showToast("レビューを削除しました。");
}
async function reportReview(id){if(!requireUser())return;const r=reviews.find(x=>x.id===id);if(!r)return;const reason=prompt("問題の内容を入力してください（例：誹謗中傷、虚偽情報、個人情報）");if(!reason||!reason.trim())return;if(supabase){const {error}=await supabase.from("review_reports").insert({review_id:id,reporter_id:currentUser.id,reason:reason.trim().slice(0,500)});if(error){showToast("報告できませんでした："+error.message);return;}}else{const reports=JSON.parse(localStorage.getItem("inidac-review-reports-v1")||"[]");reports.push({reviewId:id,reporterId:currentUser.id,reason:reason.trim(),createdAt:new Date().toISOString()});localStorage.setItem("inidac-review-reports-v1",JSON.stringify(reports));}showToast("報告を受け付けました。");}
function openDetails(id){
  const store=stores.find(s=>s.id===id);if(!store)return;
  const rs=getStoreReviews(id).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)),m=storeScore(store,"maintenance"),o=storeScore(store,"overall");
  const dialog=document.createElement("dialog");dialog.className="modal detail-dialog";
  dialog.innerHTML=`<form method="dialog" class="modal-close-row"><button class="icon-button" aria-label="閉じる">×</button></form><div class="detail-content"><p class="eyebrow">STORE DETAIL</p><h2>${escapeHtml(store.name)}</h2><div class="store-location"><span>⌖</span><span>${escapeHtml(store.country)}${store.region?`・${escapeHtml(store.region)}`:""}<br>${escapeHtml(store.address)}</span></div>
  <div class="detail-links"><a class="button button-outline" href="${escapeHtml(mapUrl(store))}" target="_blank" rel="noopener noreferrer">Google Mapsで開く ↗</a><button class="button button-primary" data-review-this="${escapeHtml(store.id)}">この店舗をレビュー</button></div>
  ${store.description?`<p class="sub-info">${escapeHtml(store.description)}</p>`:""}
  <div class="detail-scores"><div class="detail-score"><span>メンテナンス平均</span><strong>${fmtAverage(m)} / 4</strong><small>${labelForScore(m)} · ${rs.length}件</small></div><div class="detail-score"><span>店舗総合平均</span><strong>${fmtAverage(o)} / 4</strong><small>${labelForScore(o)} · ${rs.length}件</small></div></div>
  <p class="sub-info">店内ランク平均：${fmtAverage(average(rs,"driverRank"))} / 5　｜　通信状況平均：${fmtAverage(average(rs,"connection"))} / 5</p>
  <h3>レビュー・コメント (${rs.length})</h3><div class="detail-comments">${rs.length?rs.map(r=>`<article class="detail-comment"><div class="review-badges"><span class="review-badge">整備：${labelForScore(Number(r.maintenance))}</span><span class="review-badge">店舗：${labelForScore(Number(r.overall))}</span>${r.driverRank?`<span class="review-badge">店内ランク ${r.driverRank}/5</span>`:""}${r.connection?`<span class="review-badge">通信 ${r.connection}/5</span>`:""}</div><p>${escapeHtml(displayedComment(r))}</p><small>${escapeHtml(r.author||"メンバー")} · 訪問日 ${escapeHtml(dateLabel(r.visitedAt))}</small><div class="review-actions">${reviewActions(r)}</div></article>`).join(""):'<div class="no-reviews">まだレビューはありません。</div>'}</div></div>`;
  document.body.appendChild(dialog);dialog.showModal();setTimeout(applyLanguage,0);dialog.addEventListener("close",()=>dialog.remove());dialog.addEventListener("click",e=>{if(e.target===dialog)dialog.close();});$("[data-review-this]",dialog).addEventListener("click",()=>{dialog.close();$("#reviewStoreSelect").value=id;$("#review").scrollIntoView({behavior:"smooth"});if(!currentUser)$("#authDialog").showModal();});
}
function setAuthMode(mode){authMode=mode;$$(".auth-tabs button").forEach(b=>b.classList.toggle("active",b.dataset.mode===mode));$("#authTitle").textContent=mode==="login"?"ログイン":"新規登録";$("#authSubmit").textContent=mode==="login"?"ログイン":"アカウントを作成";$("#authForm input[name=password]").autocomplete(mode==="login"?"current-password":"new-password");}
async function handleAuth(e){
  e.preventDefault();const fd=new FormData(e.currentTarget),email=String(fd.get("email")).trim(),password=String(fd.get("password"));
  if(supabase){
    const result=authMode==="login"?await supabase.auth.signInWithPassword({email,password}):await supabase.auth.signUp({email,password});
    if(result.error){showToast(result.error.message);return;}
    currentUser=result.data.user;updateAuthButton();$("#authDialog").close();showToast(authMode==="signup"?"登録しました。確認メールが届く場合があります。":"ログインしました。");return;
  }
  if(authMode==="signup"){if(password.length<8){showToast("パスワードは8文字以上にしてください。");return;}currentUser={id:"local-"+uid(),email};localStorage.setItem(PROFILE_KEY,JSON.stringify(currentUser));}
  else {const profile=getCurrentProfile();if(!profile||profile.email!==email){showToast("デモモードでは先に新規登録してください。");return;}currentUser=profile;}
  updateAuthButton();$("#authDialog").close();showToast(authMode==="signup"?"デモプロフィールを作成しました。":"ログインしました（デモ）。");
}
$("#countryFilter").addEventListener("input",renderStores);
$("#regionFilter").addEventListener("input",renderStores);
$("#searchInput").addEventListener("input",renderStores);
$("#sortFilter").addEventListener("change",renderStores);
$("#storeForm").addEventListener("submit",async e=>{e.preventDefault();if(!requireUser())return;const fd=new FormData(e.currentTarget);const country=String(fd.get("country")).trim();const region=String(fd.get("region")||"").trim();if(!country){showToast("国名を入力してください。");return;}if((country.toLowerCase()==="日本"||country.toLowerCase()==="japan")&&!region){showToast("日本国内の店舗は都道府県を入力してください。");return;}await addStore({name:String(fd.get("name")).trim(),country,region:region,address:String(fd.get("address")).trim(),mapsUrl:String(fd.get("mapsUrl")).trim(),cabinetCount:fd.get("cabinetCount")?Number(fd.get("cabinetCount")):null,description:String(fd.get("description")).trim()});});
$("#reviewForm").addEventListener("submit",async e=>{e.preventDefault();if(!requireUser())return;const fd=new FormData(e.currentTarget);if(!fd.get("honest"))return;await addReview({storeId:String(fd.get("storeId")),maintenance:Number(fd.get("maintenance")),overall:Number(fd.get("overall")),driverRank:fd.get("driverRank")?Number(fd.get("driverRank")):null,connection:fd.get("connection")?Number(fd.get("connection")):null,comment:String(fd.get("comment")).trim(),commentEn:String(fd.get("commentEn")||"").trim(),visitedAt:String(fd.get("visitedAt")||"")});});
$("#authButton").addEventListener("click",async()=>{if(currentUser){if(supabase){await supabase.auth.signOut();}else{localStorage.removeItem(PROFILE_KEY);}currentUser=null;updateAuthButton();showToast("ログアウトしました。");}else{$("#authDialog").showModal();}});
$("#authForm").addEventListener("submit",handleAuth);
$$(".auth-tabs button").forEach(b=>b.addEventListener("click",()=>setAuthMode(b.dataset.mode)));
$("#storeGrid").addEventListener("click",e=>{const b=e.target.closest("[data-details]");if(b)openDetails(b.dataset.details);});
document.addEventListener("click",e=>{const edit=e.target.closest("[data-edit-review]");if(edit){editReview(edit.dataset.editReview);return;}const del=e.target.closest("[data-delete-review]");if(del){deleteReview(del.dataset.deleteReview);return;}const report=e.target.closest("[data-report-review]");if(report){reportReview(report.dataset.reportReview);return;}});
$("#homeLink").addEventListener("click",e=>{e.preventDefault();window.scrollTo({top:0,behavior:"smooth"});});
$("#languageToggle")?.addEventListener("click",()=>{currentLanguage=currentLanguage==="ja"?"en":"ja";localStorage.setItem("inidac-language",currentLanguage);applyLanguage();});
$("#visitedAt").value=new Date().toISOString().slice(0,10);
populateCountries();
loadData().then(()=>applyLanguage());
