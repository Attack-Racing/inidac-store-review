(function() {
   /* イニDAC 店舗レビュー — front-end prototype.
   For public multi-user use, configure Supabase in CONFIG below and run supabase/schema.sql.
*/
const CONFIG = {
  supabaseUrl: "", // eujaamtodxwnugvrxrql.supabase.co
  supabaseAnonKey: "" // sb_publishable_Ao3TirjTJ1W991HpxG5Lmg_sZfycu1l
};
const ADMIN_EMAILS = ["grgt1462@gmail.com"];
const $ = (selector, root=document) => root.querySelector(selector);
const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
const STORAGE_KEY = "inidac-review-data-v1";
const PROFILE_KEY = "inidac-review-profile-v1";
const COUNTRIES = [
  {name:"日本", regions:["北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県","茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県","新潟県","富山県","石川県","福井県","山梨県","長野県","岐阜県","静岡県","愛知県","三重県","滋賀県","京都府","大阪府","兵庫県","奈良県","和歌山県","鳥取県","島根県","岡山県","広島県","山口県","徳島県","香川県","愛媛県","高知県","福岡県","佐賀県","長崎県","熊本県","大分県","宮崎県","鹿児島県","沖縄県"]},
  {name:"Malaysia", regions:["Malaysia"]},
  {name:"台湾", regions:["Taiwan"]},
  {name:"香港", regions:["Hongkong"]},
  {name:"Indonesia", regions:["Indonesia"]},
  {name:"Myanmar", regions:["Myanmar"]},
  {name:"シンガポール", regions:["Singapore"]},
  {name:"Thailand", regions:["Thailand"]},
  {name:"Vietnam", regions:["Vietnam"]},
  {name:"Cambodia", regions:["Cambodia"]},
  {name:"Macau", regions:["Macau"]},
  {name:"Austrailia", regions:["Austrailia"]},
  {name:"その他", regions:["その他"]}
];
const demoStores = [
  {id:"demo-1",name:"サンプル・レーシングアーケード",country:"日本",region:"千葉県",address:"千葉県千葉市",mapsUrl:"",cabinetCount:4,description:"これは表示イメージ用のサンプル店舗です。実在店舗の情報ではありません。",createdAt:"2026-10-01T10:00:00.000Z",demo:true},
  {id:"demo-2",name:"Sample Arcade KL",country:"Malaysia",region:"Malaysia",address:"Kuala Lumpur, Malaysia",mapsUrl:"",cabinetCount:2,description:"Sample data for layout preview. Not a real listing.",createdAt:"2026-10-02T10:00:00.000Z",demo:true}
];
const demoReviews = [
  {id:"demo-r1",storeId:"demo-1",maintenance:4,overall:3,driverRank:4,connection:null,comment:"【サンプルレビュー】ハンドルやペダルの状態などを、ここに実際の体験として記入します。",visitedAt:"2026-10-10",createdAt:"2026-10-10T10:00:00.000Z",author:"サンプルユーザー",demo:true},
  {id:"demo-r2",storeId:"demo-1",maintenance:3,overall:4,driverRank:3,connection:null,comment:"【サンプルレビュー】店舗の雰囲気や待ち時間などの例です。実際の評価ではありません。",visitedAt:"2026-10-12",createdAt:"2026-10-12T10:00:00.000Z",author:"サンプルユーザー",demo:true},
  {id:"demo-r3",storeId:"demo-2",maintenance:3,overall:3,driverRank:4,connection:2,comment:"[Sample review] Example text only. Replace with a real experience before relying on the rating.",visitedAt:"2026-10-11",createdAt:"2026-10-11T10:00:00.000Z",author:"Sample User",demo:true}
];
let supabaseClient = null, currentUser = null, authMode = "login", toastTimer;
let stores = [], reviews = [];
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
function refreshReviewStoreSelect(){const select=$("#reviewStoreSelect"),previous=select.value;select.innerHTML='<option value="">店舗を選択</option>'+stores.map(s=>`<option value="${escapeHtml(s.id)}">${escapeHtml(s.name)}（${escapeHtml(s.country)}・${escapeHtml(s.region)}）</option>`).join("");if(stores.some(s=>s.id===previous))select.value=previous;}
function renderStats(){$("#storeCount").textContent=stores.length;$("#reviewCount").textContent=reviews.length;}
function renderStores(){
  const query=$("#searchInput").value.trim().toLocaleLowerCase(),country=$("#countryFilter").value,region=$("#regionFilter").value,sort=$("#sortFilter").value;
  let list=stores.filter(s=>(!country||s.country.toLocaleLowerCase().includes(country.toLocaleLowerCase()))&&(!region||String(s.region||"").toLocaleLowerCase().includes(region.toLocaleLowerCase()))&&(!query||[s.name,s.address,s.country,s.region].join(" ").toLocaleLowerCase().includes(query)));
  list.sort((a,b)=>{if(sort==="name")return a.name.localeCompare(b.name,"ja");if(sort==="maintenance")return (storeScore(b,"maintenance")??0)-(storeScore(a,"maintenance")??0);if(sort==="overall")return (storeScore(b,"overall")??0)-(storeScore(a,"overall")??0);return getStoreReviews(b.id).length-getStoreReviews(a.id).length;});
  $("#resultCount").textContent=`${list.length} 件`;$("#emptyState").classList.toggle("hidden",list.length!==0);
  $("#storeGrid").innerHTML=list.map(s=>{const rs=getStoreReviews(s.id),m=storeScore(s,"maintenance"),o=storeScore(s,"overall");return `<article class="store-card">
    <div class="store-card-top"><span class="store-code">ARCADE SPOT / ${escapeHtml(s.country)}</span><span class="store-icon">⌖</span></div>
    <div class="store-card-body"><h3>${escapeHtml(s.name)}</h3><div class="store-location"><span>⌖</span><span>${escapeHtml(s.country)}・${escapeHtml(s.region)}<br>${escapeHtml(s.address)}</span></div>
    <div class="store-rating-row"><div class="rating-chip"><small>メンテナンス</small><strong>${fmtAverage(m)} <span class="rating-word">${labelForScore(m)}</span></strong></div><div class="rating-chip"><small>店舗総合評価</small><strong>${fmtAverage(o)} <span class="rating-word">${labelForScore(o)}</span></strong></div></div>
    <div class="store-meta"><span>レビュー ${countLabel(rs.length)}</span><span>${s.cabinetCount?`設置 ${s.cabinetCount}台`:"台数未登録"}</span></div>
    <div class="store-card-actions"><button class="mini-button primary-mini" data-details="${escapeHtml(s.id)}">詳細・コメント</button><a class="mini-button" href="${escapeHtml(mapUrl(s))}" target="_blank" rel="noopener noreferrer">Google Maps ↗</a></div></div></article>`;}).join("");
  renderStats();refreshReviewStoreSelect();
}
function renderRecent(){
  const recent=[...reviews].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,6);
  $("#recentReviews").innerHTML=recent.length?recent.map(r=>{const s=stores.find(x=>x.id===r.storeId);return `<article class="recent-review"><div class="recent-review-head"><h3>${escapeHtml(s?.name||"削除済み店舗")}</h3><time>${escapeHtml(dateLabel(r.visitedAt))}</time></div><div class="review-badges"><span class="review-badge">整備：${labelForScore(Number(r.maintenance))}</span><span class="review-badge">店舗：${labelForScore(Number(r.overall))}</span>${r.driverRank?`<span class="review-badge">店内ランク ${r.driverRank}/5</span>`:""}${r.connection?`<span class="review-badge">通信 ${r.connection}/5</span>`:""}</div><p>${escapeHtml(r.comment)}</p><small class="muted">投稿者：${escapeHtml(r.author||"メンバー")} · ${escapeHtml(new Date(r.createdAt).toLocaleDateString("ja-JP"))}</small></article>`;}).join(""):'<div class="no-reviews">まだレビューはありません。最初のレビューを投稿してください。</div>';
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
function fromDbReview(r){return {id:r.id,storeId:r.store_id,maintenance:r.maintenance,overall:r.overall,driverRank:r.driver_rank,connection:r.connection,comment:r.comment,visitedAt:r.visited_at,createdAt:r.created_at,author:r.author_name||"メンバー"};}
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
    const payload={store_id:review.storeId,maintenance:review.maintenance,overall:review.overall,driver_rank:review.driverRank,connection:review.connection,comment:review.comment,visited_at:review.visitedAt||null,author_name:currentUser.email?.split("@")[0]||"メンバー",user_id:currentUser.id};
    const {data:created,error}=await supabase.from("reviews").insert(payload).select().single();
    if(error){showToast("レビューを投稿できませんでした："+error.message);return;}reviews.unshift(fromDbReview(created));
  }else{reviews.unshift(review);saveLocal();}
  $("#reviewForm").reset();$("#visitedAt").value=new Date().toISOString().slice(0,10);renderAll();showToast("レビューを投稿しました。");
}
function openDetails(id){
  const store=stores.find(s=>s.id===id);if(!store)return;
  const rs=getStoreReviews(id).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)),m=storeScore(store,"maintenance"),o=storeScore(store,"overall");
  const dialog=document.createElement("dialog");dialog.className="modal detail-dialog";
  dialog.innerHTML=`<form method="dialog" class="modal-close-row"><button class="icon-button" aria-label="閉じる">×</button></form><div class="detail-content"><p class="eyebrow">STORE DETAIL</p><h2>${escapeHtml(store.name)}</h2><div class="store-location"><span>⌖</span><span>${escapeHtml(store.country)}・${escapeHtml(store.region)}<br>${escapeHtml(store.address)}</span></div>
  <div class="detail-links"><a class="button button-outline" href="${escapeHtml(mapUrl(store))}" target="_blank" rel="noopener noreferrer">Google Mapsで開く ↗</a><button class="button button-primary" data-review-this="${escapeHtml(store.id)}">この店舗をレビュー</button></div>
  ${store.description?`<p class="sub-info">${escapeHtml(store.description)}</p>`:""}
  <div class="detail-scores"><div class="detail-score"><span>メンテナンス平均</span><strong>${fmtAverage(m)} / 4</strong><small>${labelForScore(m)} · ${rs.length}件</small></div><div class="detail-score"><span>店舗総合平均</span><strong>${fmtAverage(o)} / 4</strong><small>${labelForScore(o)} · ${rs.length}件</small></div></div>
  <p class="sub-info">店内ランク平均：${fmtAverage(average(rs,"driverRank"))} / 5　｜　通信状況平均：${fmtAverage(average(rs,"connection"))} / 5</p>
  <h3>レビュー・コメント (${rs.length})</h3><div class="detail-comments">${rs.length?rs.map(r=>`<article class="detail-comment"><div class="review-badges"><span class="review-badge">整備：${labelForScore(Number(r.maintenance))}</span><span class="review-badge">店舗：${labelForScore(Number(r.overall))}</span>${r.driverRank?`<span class="review-badge">店内ランク ${r.driverRank}/5</span>`:""}${r.connection?`<span class="review-badge">通信 ${r.connection}/5</span>`:""}</div><p>${escapeHtml(r.comment)}</p><small>${escapeHtml(r.author||"メンバー")} · 訪問日 ${escapeHtml(dateLabel(r.visitedAt))}</small></article>`).join(""):'<div class="no-reviews">まだレビューはありません。</div>'}</div></div>`;
  document.body.appendChild(dialog);dialog.showModal();dialog.addEventListener("close",()=>dialog.remove());dialog.addEventListener("click",e=>{if(e.target===dialog)dialog.close();});$("[data-review-this]",dialog).addEventListener("click",()=>{dialog.close();$("#reviewStoreSelect").value=id;$("#review").scrollIntoView({behavior:"smooth"});if(!currentUser)$("#authDialog").showModal();});
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
$("#reviewForm").addEventListener("submit",async e=>{e.preventDefault();if(!requireUser())return;const fd=new FormData(e.currentTarget);if(!fd.get("honest"))return;await addReview({storeId:String(fd.get("storeId")),maintenance:Number(fd.get("maintenance")),overall:Number(fd.get("overall")),driverRank:fd.get("driverRank")?Number(fd.get("driverRank")):null,connection:fd.get("connection")?Number(fd.get("connection")):null,comment:String(fd.get("comment")).trim(),visitedAt:String(fd.get("visitedAt")||"")});});
$("#authButton").addEventListener("click",async()=>{if(currentUser){if(supabase){await supabase.auth.signOut();}else{localStorage.removeItem(PROFILE_KEY);}currentUser=null;updateAuthButton();showToast("ログアウトしました。");}else{$("#authDialog").showModal();}});
$("#authForm").addEventListener("submit",handleAuth);
$$(".auth-tabs button").forEach(b=>b.addEventListener("click",()=>setAuthMode(b.dataset.mode)));
$("#storeGrid").addEventListener("click",e=>{const b=e.target.closest("[data-details]");if(b)openDetails(b.dataset.details);});
$("#homeLink").addEventListener("click",e=>{e.preventDefault();window.scrollTo({top:0,behavior:"smooth"});});
$("#visitedAt").value=new Date().toISOString().slice(0,10);
populateCountries();
loadData();
})();
