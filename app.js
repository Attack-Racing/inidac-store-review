(function() {
   /* イニDAC 店舗レビュー — front-end prototype.
/* イニDAC 店舗レビュー — front-end prototype.
   For public multi-user use, configure Supabase in CONFIG below and run supabase/schema.sql.
*/
const CONFIG = {
  supabaseUrl: "https://eujaamtodxwnugvrxrql.supabase.co",
  supabaseAnonKey: "sb_publishable_Ao3TirjTJ1W991HpxG5Lmg_sZfycu1l" 
  supabaseAnonKey: "sb_publishable_Ao3TirjTJ1W991HpxG5Lmg_sZfycu1l"
};
const ADMIN_EMAILS = ["grgt1462@gmail.com"];
const $ = (selector, root=document) => root.querySelector(selector);
@@ -28,7 +27,7 @@ const COUNTRIES = [
];
const demoStores = [
  {id:"demo-1",name:"サンプル・レーシングアーケード",country:"日本",region:"千葉県",address:"千葉県千葉市",mapsUrl:"",cabinetCount:4,description:"これは表示イメージ用のサンプル店舗です。実在店舗の情報ではありません。",createdAt:"2026-10-01T10:00:00.000Z",demo:true},
  {id:"demo-2",name:"Sample Arcade KL",country:"Malaysia",region:"Malaysia",address:"Kuala Lumpur, Malaysia",mapsUrl:"",cabinetCount:2,description:"Sample data for layout preview. Not a real listing.",createdAt:"2026-10-02T10:00:00.000Z",demo:true}
  {id:"demo-2",name:"Sample Arcade KL",country:"マレーシア",region:"Kuala Lumpur",address:"Kuala Lumpur, Malaysia",mapsUrl:"",cabinetCount:2,description:"Sample data for layout preview. Not a real listing.",createdAt:"2026-10-02T10:00:00.000Z",demo:true}
];
const demoReviews = [
  {id:"demo-r1",storeId:"demo-1",maintenance:4,overall:3,driverRank:4,connection:null,comment:"【サンプルレビュー】ハンドルやペダルの状態などを、ここに実際の体験として記入します。",visitedAt:"2026-10-10",createdAt:"2026-10-10T10:00:00.000Z",author:"サンプルユーザー",demo:true},
@@ -66,7 +65,7 @@ function populateCountries(){
  updateRegionRequirement();
}
function populateRegions(){}
function refreshReviewStoreSelect(){const select=$("#reviewStoreSelect"),previous=select.value;select.innerHTML='<option value="">店舗を選択</option>'+stores.map(s=>`<option value="${escapeHtml(s.id)}">${escapeHtml(s.name)}（${escapeHtml(s.country)}・${escapeHtml(s.region)}）</option>`).join("");if(stores.some(s=>s.id===previous))select.value=previous;}
function refreshReviewStoreSelect(){const select=$("#reviewStoreSelect"),previous=select.value;select.innerHTML='<option value="">店舗を選択</option>'+stores.map(s=>`<option value="${escapeHtml(s.id)}">${escapeHtml(s.name)}（${escapeHtml(s.country)}${s.region?`・${escapeHtml(s.region)}`:""}）</option>`).join("");if(stores.some(s=>s.id===previous))select.value=previous;}
function renderStats(){$("#storeCount").textContent=stores.length;$("#reviewCount").textContent=reviews.length;}
function renderStores(){
  const query=$("#searchInput").value.trim().toLocaleLowerCase(),country=$("#countryFilter").value,region=$("#regionFilter").value,sort=$("#sortFilter").value;
@@ -75,15 +74,15 @@ function renderStores(){
  $("#resultCount").textContent=`${list.length} 件`;$("#emptyState").classList.toggle("hidden",list.length!==0);
  $("#storeGrid").innerHTML=list.map(s=>{const rs=getStoreReviews(s.id),m=storeScore(s,"maintenance"),o=storeScore(s,"overall");return `<article class="store-card">
    <div class="store-card-top"><span class="store-code">ARCADE SPOT / ${escapeHtml(s.country)}</span><span class="store-icon">⌖</span></div>
    <div class="store-card-body"><h3>${escapeHtml(s.name)}</h3><div class="store-location"><span>⌖</span><span>${escapeHtml(s.country)}・${escapeHtml(s.region)}<br>${escapeHtml(s.address)}</span></div>
    <div class="store-card-body"><h3>${escapeHtml(s.name)}</h3><div class="store-location"><span>⌖</span><span>${escapeHtml(s.country)}${s.region?`・${escapeHtml(s.region)}`:""}<br>${escapeHtml(s.address)}</span></div>
    <div class="store-rating-row"><div class="rating-chip"><small>メンテナンス</small><strong>${fmtAverage(m)} <span class="rating-word">${labelForScore(m)}</span></strong></div><div class="rating-chip"><small>店舗総合評価</small><strong>${fmtAverage(o)} <span class="rating-word">${labelForScore(o)}</span></strong></div></div>
    <div class="store-meta"><span>レビュー ${countLabel(rs.length)}</span><span>${s.cabinetCount?`設置 ${s.cabinetCount}台`:"台数未登録"}</span></div>
    <div class="store-card-actions"><button class="mini-button primary-mini" data-details="${escapeHtml(s.id)}">詳細・コメント</button><a class="mini-button" href="${escapeHtml(mapUrl(s))}" target="_blank" rel="noopener noreferrer">Google Maps ↗</a></div></div></article>`;}).join("");
  renderStats();refreshReviewStoreSelect();
}
function renderRecent(){
  const recent=[...reviews].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,6);
  $("#recentReviews").innerHTML=recent.length?recent.map(r=>{const s=stores.find(x=>x.id===r.storeId);return `<article class="recent-review"><div class="recent-review-head"><h3>${escapeHtml(s?.name||"削除済み店舗")}</h3><time>${escapeHtml(dateLabel(r.visitedAt))}</time></div><div class="review-badges"><span class="review-badge">整備：${labelForScore(Number(r.maintenance))}</span><span class="review-badge">店舗：${labelForScore(Number(r.overall))}</span>${r.driverRank?`<span class="review-badge">店内ランク ${r.driverRank}/5</span>`:""}${r.connection?`<span class="review-badge">通信 ${r.connection}/5</span>`:""}</div><p>${escapeHtml(r.comment)}</p><small class="muted">投稿者：${escapeHtml(r.author||"メンバー")} · ${escapeHtml(new Date(r.createdAt).toLocaleDateString("ja-JP"))}</small></article>`;}).join(""):'<div class="no-reviews">まだレビューはありません。最初のレビューを投稿してください。</div>';
  $("#recentReviews").innerHTML=recent.length?recent.map(r=>{const s=stores.find(x=>x.id===r.storeId);return `<article class="recent-review"><div class="recent-review-head"><h3>${escapeHtml(s?.name||"削除済み店舗")}</h3><time>${escapeHtml(dateLabel(r.visitedAt))}</time></div><div class="review-badges"><span class="review-badge">整備：${labelForScore(Number(r.maintenance))}</span><span class="review-badge">店舗：${labelForScore(Number(r.overall))}</span>${r.driverRank?`<span class="review-badge">店内ランク ${r.driverRank}/5</span>`:""}${r.connection?`<span class="review-badge">通信 ${r.connection}/5</span>`:""}</div><p>${escapeHtml(r.comment)}</p><small class="muted">投稿者：${escapeHtml(r.author||"メンバー")} · ${escapeHtml(new Date(r.createdAt).toLocaleDateString("ja-JP"))}</small><div class="review-actions">${reviewActions(r)}</div></article>`;}).join(""):'<div class="no-reviews">まだレビューはありません。最初のレビューを投稿してください。</div>';
}
function renderAll(){renderStores();renderRecent();}
function getCurrentProfile(){try{return JSON.parse(localStorage.getItem(PROFILE_KEY)||"null");}catch(e){return null;}}
@@ -108,7 +107,10 @@ async function loadData(){
  updateAuthButton();renderAll();
}
function fromDbStore(s){return {id:s.id,name:s.name,country:s.country,region:s.region,address:s.address,mapsUrl:s.maps_url,cabinetCount:s.cabinet_count,description:s.description,createdAt:s.created_at};}
function fromDbReview(r){return {id:r.id,storeId:r.store_id,maintenance:r.maintenance,overall:r.overall,driverRank:r.driver_rank,connection:r.connection,comment:r.comment,visitedAt:r.visited_at,createdAt:r.created_at,author:r.author_name||"メンバー"};}
function fromDbReview(r){return {id:r.id,storeId:r.store_id,maintenance:r.maintenance,overall:r.overall,driverRank:r.driver_rank,connection:r.connection,comment:r.comment,visitedAt:r.visited_at,createdAt:r.created_at,author:r.author_name||"メンバー",authorId:r.user_id};}
function isAdmin(){return !!(supabase && currentUser && ADMIN_EMAILS.includes(String(currentUser.email||"").toLowerCase()));}
function canManageReview(r){return !!(currentUser && (r.authorId===currentUser.id || (isAdmin() && supabase)));}
function reviewActions(r){if(!currentUser)return `<button class="mini-button" data-report-review="${escapeHtml(r.id)}">問題を報告</button>`;const own=r.authorId===currentUser.id;return `${own?`<button class="mini-button" data-edit-review="${escapeHtml(r.id)}">編集</button><button class="mini-button danger-mini" data-delete-review="${escapeHtml(r.id)}">削除</button>`:""}${isAdmin()&&!own?`<button class="mini-button danger-mini" data-delete-review="${escapeHtml(r.id)}">運営削除</button>`:""}${!own?`<button class="mini-button" data-report-review="${escapeHtml(r.id)}">問題を報告</button>`:""}`;}
function requireUser(){if(!currentUser){$("#authDialog").showModal();showToast("投稿するにはログイン / 登録してください。");return false;}return true;}
async function addStore(data){
  const duplicate=stores.find(s=>s.name.trim().toLowerCase()===data.name.trim().toLowerCase()&&s.country.trim().toLowerCase()===data.country.trim().toLowerCase()&&String(s.region||"").trim().toLowerCase()===String(data.region||"").trim().toLowerCase());
@@ -131,16 +133,32 @@ async function addReview(data){
  }else{reviews.unshift(review);saveLocal();}
  $("#reviewForm").reset();$("#visitedAt").value=new Date().toISOString().slice(0,10);renderAll();showToast("レビューを投稿しました。");
}
async function editReview(id){
  if(!requireUser())return;const r=reviews.find(x=>x.id===id);if(!r||!currentUser||r.authorId!==currentUser.id){showToast("自分の投稿のみ編集できます。");return;}
  const d=document.createElement("dialog");d.className="modal";
  d.innerHTML=`<form method="dialog" class="modal-close-row"><button class="icon-button" aria-label="閉じる">×</button></form><div class="modal-content"><h2>レビューを編集</h2><form id="editReviewForm" class="form-panel"><label>店舗<select name="storeId" required>${stores.map(s=>`<option value="${escapeHtml(s.id)}" ${s.id===r.storeId?"selected":""}>${escapeHtml(s.name)}（${escapeHtml(s.country)}${s.region?`・${escapeHtml(s.region)}`:""}）</option>`).join("")}</select></label><div class="form-row"><label>メンテナンス評価<select name="maintenance">${[4,3,2,1].map(n=>`<option value="${n}" ${Number(r.maintenance)===n?"selected":""}>${n} - ${labelForScore(n)}</option>`).join("")}</select></label><label>店舗総合評価<select name="overall">${[4,3,2,1].map(n=>`<option value="${n}" ${Number(r.overall)===n?"selected":""}>${n} - ${labelForScore(n)}</option>`).join("")}</select></label></div><div class="form-row"><label>店内ランク<select name="driverRank"><option value="">未評価</option>${[5,4,3,2,1].map(n=>`<option value="${n}" ${Number(r.driverRank)===n?"selected":""}>${n}/5</option>`).join("")}</select></label><label>通信状況<select name="connection"><option value="">未評価</option>${[5,4,3,2,1].map(n=>`<option value="${n}" ${Number(r.connection)===n?"selected":""}>${n}/5</option>`).join("")}</select></label></div><label>訪問日<input type="date" name="visitedAt" value="${escapeHtml(r.visitedAt||"")}"></label><label>コメント<textarea name="comment" minlength="5" maxlength="1500" required>${escapeHtml(r.comment)}</textarea></label><button class="button button-primary" type="submit">変更を保存</button></form></div>`;
  document.body.appendChild(d);d.showModal();d.addEventListener("close",()=>d.remove());
  $("#editReviewForm",d).addEventListener("submit",async e=>{e.preventDefault();const fd=new FormData(e.currentTarget);const patch={storeId:String(fd.get("storeId")),maintenance:Number(fd.get("maintenance")),overall:Number(fd.get("overall")),driverRank:fd.get("driverRank")?Number(fd.get("driverRank")):null,connection:fd.get("connection")?Number(fd.get("connection")):null,visitedAt:String(fd.get("visitedAt")||""),comment:String(fd.get("comment")).trim()};if(patch.comment.length<5){showToast("コメントは5文字以上で入力してください。");return;}
    if(supabase){const payload={store_id:patch.storeId,maintenance:patch.maintenance,overall:patch.overall,driver_rank:patch.driverRank,connection:patch.connection,visited_at:patch.visitedAt||null,comment:patch.comment};let q=supabase.from("reviews").update(payload).eq("id",id);if(!isAdmin())q=q.eq("user_id",currentUser.id);const {data,error}=await q.select().single();if(error||!data){showToast("更新できませんでした："+(error?.message||"権限を確認してください"));return;}Object.assign(r,fromDbReview(data));}
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
  dialog.innerHTML=`<form method="dialog" class="modal-close-row"><button class="icon-button" aria-label="閉じる">×</button></form><div class="detail-content"><p class="eyebrow">STORE DETAIL</p><h2>${escapeHtml(store.name)}</h2><div class="store-location"><span>⌖</span><span>${escapeHtml(store.country)}・${escapeHtml(store.region)}<br>${escapeHtml(store.address)}</span></div>
  dialog.innerHTML=`<form method="dialog" class="modal-close-row"><button class="icon-button" aria-label="閉じる">×</button></form><div class="detail-content"><p class="eyebrow">STORE DETAIL</p><h2>${escapeHtml(store.name)}</h2><div class="store-location"><span>⌖</span><span>${escapeHtml(store.country)}${store.region?`・${escapeHtml(store.region)}`:""}<br>${escapeHtml(store.address)}</span></div>
  <div class="detail-links"><a class="button button-outline" href="${escapeHtml(mapUrl(store))}" target="_blank" rel="noopener noreferrer">Google Mapsで開く ↗</a><button class="button button-primary" data-review-this="${escapeHtml(store.id)}">この店舗をレビュー</button></div>
  ${store.description?`<p class="sub-info">${escapeHtml(store.description)}</p>`:""}
  <div class="detail-scores"><div class="detail-score"><span>メンテナンス平均</span><strong>${fmtAverage(m)} / 4</strong><small>${labelForScore(m)} · ${rs.length}件</small></div><div class="detail-score"><span>店舗総合平均</span><strong>${fmtAverage(o)} / 4</strong><small>${labelForScore(o)} · ${rs.length}件</small></div></div>
  <p class="sub-info">店内ランク平均：${fmtAverage(average(rs,"driverRank"))} / 5　｜　通信状況平均：${fmtAverage(average(rs,"connection"))} / 5</p>
  <h3>レビュー・コメント (${rs.length})</h3><div class="detail-comments">${rs.length?rs.map(r=>`<article class="detail-comment"><div class="review-badges"><span class="review-badge">整備：${labelForScore(Number(r.maintenance))}</span><span class="review-badge">店舗：${labelForScore(Number(r.overall))}</span>${r.driverRank?`<span class="review-badge">店内ランク ${r.driverRank}/5</span>`:""}${r.connection?`<span class="review-badge">通信 ${r.connection}/5</span>`:""}</div><p>${escapeHtml(r.comment)}</p><small>${escapeHtml(r.author||"メンバー")} · 訪問日 ${escapeHtml(dateLabel(r.visitedAt))}</small></article>`).join(""):'<div class="no-reviews">まだレビューはありません。</div>'}</div></div>`;
  <h3>レビュー・コメント (${rs.length})</h3><div class="detail-comments">${rs.length?rs.map(r=>`<article class="detail-comment"><div class="review-badges"><span class="review-badge">整備：${labelForScore(Number(r.maintenance))}</span><span class="review-badge">店舗：${labelForScore(Number(r.overall))}</span>${r.driverRank?`<span class="review-badge">店内ランク ${r.driverRank}/5</span>`:""}${r.connection?`<span class="review-badge">通信 ${r.connection}/5</span>`:""}</div><p>${escapeHtml(r.comment)}</p><small>${escapeHtml(r.author||"メンバー")} · 訪問日 ${escapeHtml(dateLabel(r.visitedAt))}</small><div class="review-actions">${reviewActions(r)}</div></article>`).join(""):'<div class="no-reviews">まだレビューはありません。</div>'}</div></div>`;
  document.body.appendChild(dialog);dialog.showModal();dialog.addEventListener("close",()=>dialog.remove());dialog.addEventListener("click",e=>{if(e.target===dialog)dialog.close();});$("[data-review-this]",dialog).addEventListener("click",()=>{dialog.close();$("#reviewStoreSelect").value=id;$("#review").scrollIntoView({behavior:"smooth"});if(!currentUser)$("#authDialog").showModal();});
}
function setAuthMode(mode){authMode=mode;$$(".auth-tabs button").forEach(b=>b.classList.toggle("active",b.dataset.mode===mode));$("#authTitle").textContent=mode==="login"?"ログイン":"新規登録";$("#authSubmit").textContent=mode==="login"?"ログイン":"アカウントを作成";$("#authForm input[name=password]").autocomplete(mode==="login"?"current-password":"new-password");}
@@ -165,8 +183,8 @@ $("#authButton").addEventListener("click",async()=>{if(currentUser){if(supabase)
$("#authForm").addEventListener("submit",handleAuth);
$$(".auth-tabs button").forEach(b=>b.addEventListener("click",()=>setAuthMode(b.dataset.mode)));
$("#storeGrid").addEventListener("click",e=>{const b=e.target.closest("[data-details]");if(b)openDetails(b.dataset.details);});
document.addEventListener("click",e=>{const edit=e.target.closest("[data-edit-review]");if(edit){editReview(edit.dataset.editReview);return;}const del=e.target.closest("[data-delete-review]");if(del){deleteReview(del.dataset.deleteReview);return;}const report=e.target.closest("[data-report-review]");if(report){reportReview(report.dataset.reportReview);return;}});
$("#homeLink").addEventListener("click",e=>{e.preventDefault();window.scrollTo({top:0,behavior:"smooth"});});
$("#visitedAt").value=new Date().toISOString().slice(0,10);
populateCountries();
loadData();
})();
