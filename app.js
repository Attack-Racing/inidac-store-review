/* イニDAC 店舗レビュー — front-end script */
(function () {
  "use strict";
  const CONFIG = {
    supabaseUrl: "https://eujaamtodxwnugvrxrql.supabase.co",
    supabaseAnonKey: "sb_publishable_Ao3TirjTJ1W991HpxG5Lmg_sZfycu1l"
  };
  const ADMIN_EMAILS = ["grgt1462@gmail.com"];
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const STORAGE_KEY = "inidac-review-data-v1";
  const PROFILE_KEY = "inidac-review-profile-v1";
  let supabase = null, currentUser = null, authMode = "login", toastTimer;
  let stores = [], reviews = [];

  function esc(v = "") {
    return String(v).replace(/[&<>"']/g, c => ({
      "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
    })[c]);
  }
  function toast(msg) {
    const el = $("#toast");
    if (!el) { console.log(msg); return; }
    el.textContent = msg; el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 3500);
  }
  function configured() {
    return !!(window.supabase?.createClient && CONFIG.supabaseUrl && CONFIG.supabaseAnonKey);
  }
  function isAdmin() {
    return !!(supabase && currentUser && ADMIN_EMAILS.includes(String(currentUser.email || "").toLowerCase()));
  }
  function scoreLabel(n) {
    if (n == null || !Number.isFinite(Number(n))) return "未評価";
    n = Number(n);
    return n >= 3.5 ? "良い" : n >= 2.5 ? "普通" : n >= 1.5 ? "少し悪い" : "悪い";
  }
  function avg(list, key) {
    const a = list.map(x => Number(x[key])).filter(n => Number.isFinite(n) && n >= 1);
    return a.length ? a.reduce((x,y) => x+y, 0) / a.length : null;
  }
  function fmt(n) { return n == null ? "—" : n.toFixed(1); }
  function storeReviews(id) { return reviews.filter(r => String(r.storeId) === String(id)); }
  function storeScore(s, key) { return avg(storeReviews(s.id), key); }
  function dateLabel(v) {
    if (!v) return "訪問日未登録";
    const d = new Date(v + "T00:00:00");
    return Number.isNaN(d.getTime()) ? v : d.toLocaleDateString("ja-JP");
  }
  function mapUrl(s) {
    if (s.mapsUrl && /^https?:\/\//i.test(s.mapsUrl)) return s.mapsUrl;
    return "https://www.google.com/maps/search/?api=1&query=" +
      encodeURIComponent([s.name,s.address,s.region,s.country].filter(Boolean).join(" "));
  }
  function fromStore(s) {
    return {id:s.id,name:s.name,country:s.country,region:s.region,address:s.address,
      mapsUrl:s.maps_url,cabinetCount:s.cabinet_count,description:s.description,createdAt:s.created_at};
  }
  function fromReview(r) {
    return {id:r.id,storeId:r.store_id,maintenance:r.maintenance,overall:r.overall,
      driverRank:r.driver_rank,connection:r.connection,comment:r.comment,visitedAt:r.visited_at,
      createdAt:r.created_at,author:r.author_name || "メンバー",authorId:r.user_id};
  }
  function actions(r) {
    if (!currentUser) return "";
    const own = String(r.authorId || "") === String(currentUser.id);
    return (own ? '<button type="button" class="mini-button" data-edit-review="' + esc(r.id) + '">編集</button> ' +
      '<button type="button" class="mini-button danger-mini" data-delete-review="' + esc(r.id) + '">削除</button>' : "") +
      (isAdmin() && !own ? '<button type="button" class="mini-button danger-mini" data-delete-review="' + esc(r.id) + '">運営削除</button>' : "");
  }
  function updateAuth() {
    const b = $("#authButton");
    if (b) b.textContent = currentUser ? (currentUser.email || "ログイン中") + " · ログアウト" : "ログイン / 登録";
    window.__inidacSupabase = supabase;
    window.__inidacCurrentUser = currentUser;
    window.__inidacIsAdmin = () => isAdmin();
    window.dispatchEvent(new Event("inidac-auth-updated"));
  }
  function render() {
    const query = ($("#searchInput")?.value || "").trim().toLowerCase();
    const country = ($("#countryFilter")?.value || "").trim().toLowerCase();
    const region = ($("#regionFilter")?.value || "").trim().toLowerCase();
    const sort = $("#sortFilter")?.value || "";
    let list = stores.filter(s =>
      (!country || String(s.country || "").toLowerCase().includes(country)) &&
      (!region || String(s.region || "").toLowerCase().includes(region)) &&
      (!query || [s.name,s.address,s.country,s.region].join(" ").toLowerCase().includes(query)));
    list.sort((a,b) => sort === "name" ? String(a.name).localeCompare(String(b.name),"ja") :
      sort === "maintenance" ? (storeScore(b,"maintenance") || 0) - (storeScore(a,"maintenance") || 0) :
      sort === "overall" ? (storeScore(b,"overall") || 0) - (storeScore(a,"overall") || 0) :
      storeReviews(b.id).length - storeReviews(a.id).length);
    if ($("#resultCount")) $("#resultCount").textContent = list.length + " 件";
    if ($("#emptyState")) $("#emptyState").classList.toggle("hidden", list.length !== 0);
    if ($("#storeCount")) $("#storeCount").textContent = stores.length;
    if ($("#reviewCount")) $("#reviewCount").textContent = reviews.length;
    if ($("#storeGrid")) $("#storeGrid").innerHTML = list.map(s => {
      const rs = storeReviews(s.id);
      return '<article class="store-card"><div class="store-card-top"><span class="store-code">ARCADE SPOT / ' + esc(s.country) +
        '</span></div><div class="store-card-body"><h3>' + esc(s.name) + '</h3><div class="store-location">' +
        esc(s.country) + (s.region ? "・" + esc(s.region) : "") + '<br>' + esc(s.address) +
        '</div><div class="store-rating-row"><div class="rating-chip"><small>メンテナンス</small><strong>' +
        fmt(avg(rs,"maintenance")) + ' <span class="rating-word">' + scoreLabel(avg(rs,"maintenance")) +
        '</span></strong></div><div class="rating-chip"><small>店舗総合評価</small><strong>' +
        fmt(avg(rs,"overall")) + ' <span class="rating-word">' + scoreLabel(avg(rs,"overall")) +
        '</span></strong></div></div><div class="store-meta"><span>レビュー ' + rs.length +
        '件</span><span>' + (s.cabinetCount ? "設置 " + s.cabinetCount + "台" : "台数未登録") +
        '</span></div><div class="store-card-actions"><button type="button" class="mini-button primary-mini" data-details="' +
        esc(s.id) + '">詳細・コメント</button><a class="mini-button" href="' + esc(mapUrl(s)) +
        '" target="_blank" rel="noopener noreferrer">Google Maps ↗</a></div></div></article>';
    }).join("");
    const sel = $("#reviewStoreSelect");
    if (sel) {
      const old = sel.value;
      sel.innerHTML = '<option value="">店舗を選択</option>' + stores.map(s =>
        '<option value="' + esc(s.id) + '">' + esc(s.name) + "（" + esc(s.country) +
        (s.region ? "・" + esc(s.region) : "") + "）</option>").join("");
      if (stores.some(s => String(s.id) === old)) sel.value = old;
    }
    const recent = [...reviews].sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt)).slice(0,6);
    if ($("#recentReviews")) $("#recentReviews").innerHTML = recent.length ? recent.map(r => {
      const s = stores.find(x => String(x.id) === String(r.storeId));
      return '<article class="recent-review"><div class="recent-review-head"><h3>' + esc(s?.name || "削除済み店舗") +
        '</h3><time>' + esc(dateLabel(r.visitedAt)) + '</time></div><div class="review-badges"><span class="review-badge">整備：' +
        scoreLabel(Number(r.maintenance)) + '</span><span class="review-badge">店舗：' + scoreLabel(Number(r.overall)) +
        '</span></div><p>' + esc(r.comment) + '</p><small class="muted">投稿者：' + esc(r.author || "メンバー") +
        '</small><div class="review-actions">' + actions(r) + '</div></article>';
    }).join("") : '<div class="no-reviews">まだレビューはありません。</div>';
  }
  function requireUser() {
    if (!currentUser) { $("#authDialog")?.showModal(); toast("投稿するにはログイン / 登録してください。"); return false; }
    return true;
  }
  async function loadData() {
    if (configured()) {
      supabase = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey);
      const sess = await supabase.auth.getSession();
      if (sess.error) console.error(sess.error);
      currentUser = sess.data?.session?.user || null;
      supabase.auth.onAuthStateChange((_event, session) => { currentUser = session?.user || null; updateAuth(); render(); });
      const [s,r] = await Promise.all([
        supabase.from("stores").select("*").order("name"),
        supabase.from("reviews").select("*").order("created_at",{ascending:false})
      ]);
      if (s.error || r.error) {
        console.error(s.error || r.error);
        toast("読み込みエラー：" + (s.error?.message || r.error?.message));
        stores=[]; reviews=[];
      } else {
        stores=(s.data || []).map(fromStore);
        reviews=(r.data || []).map(fromReview);
      }
      if ($("#storeFormNote")) $("#storeFormNote").textContent="オンラインモード：ログインして店舗を登録できます。";
      if ($("#reviewFormNote")) $("#reviewFormNote").textContent="オンラインモード：ログインしてレビューを投稿できます。";
    } else {
      const data = (() => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch (_) { return null; } })();
      stores = data?.stores || [];
      reviews = data?.reviews || [];
      try { currentUser = JSON.parse(localStorage.getItem(PROFILE_KEY) || "null"); } catch (_) { currentUser=null; }
      if ($("#storeFormNote")) $("#storeFormNote").textContent="デモモード：データはこのブラウザ内に保存されます。";
      if ($("#reviewFormNote")) $("#reviewFormNote").textContent="デモモード：データはこのブラウザ内に保存されます。";
    }
    updateAuth(); render();
  }
  async function addStore(data) {
    const dup = stores.some(s => s.name.toLowerCase()===data.name.toLowerCase() &&
      s.country.toLowerCase()===data.country.toLowerCase() && String(s.region||"").toLowerCase()===String(data.region||"").toLowerCase());
    if (dup) { toast("同じ店舗が登録済みです。"); return; }
    if (supabase) {
      const {data:created,error}=await supabase.from("stores").insert({
        name:data.name,country:data.country,region:data.region||"",address:data.address,
        maps_url:data.mapsUrl||null,cabinet_count:data.cabinetCount||null,
        description:data.description||null,created_by:currentUser.id
      }).select().single();
      if (error) { toast("店舗登録エラー："+error.message); return; }
      stores.push(fromStore(created));
    } else {
      stores.push({...data,id:"local-"+Date.now(),createdAt:new Date().toISOString()});
      localStorage.setItem(STORAGE_KEY,JSON.stringify({stores,reviews}));
    }
    $("#storeForm")?.reset(); render(); toast("店舗を登録しました。");
  }
  async function addReview(data) {
    if (supabase) {
      const {data:created,error}=await supabase.from("reviews").insert({
        store_id:data.storeId,maintenance:data.maintenance,overall:data.overall,
        driver_rank:data.driverRank,connection:data.connection,comment:data.comment,
        visited_at:data.visitedAt||null,author_name:currentUser.email?.split("@")[0]||"メンバー",
        user_id:currentUser.id
      }).select().single();
      if (error) { toast("レビュー投稿エラー："+error.message); return; }
      reviews.unshift(fromReview(created));
    } else {
      reviews.unshift({...data,id:"local-"+Date.now(),createdAt:new Date().toISOString(),
        author:currentUser.email,authorId:currentUser.id});
      localStorage.setItem(STORAGE_KEY,JSON.stringify({stores,reviews}));
    }
    $("#reviewForm")?.reset();
    if ($("#visitedAt")) $("#visitedAt").value=new Date().toISOString().slice(0,10);
    render(); toast("レビューを投稿しました。");
  }
  async function editReview(id) {
    if (!requireUser()) return;
    const r=reviews.find(x=>String(x.id)===String(id));
    if (!r || (String(r.authorId||"")!==String(currentUser.id) && !isAdmin())) {
      toast("自分の投稿のみ編集できます。"); return;
    }
    const d=document.createElement("dialog"); d.className="modal";
    d.innerHTML='<form method="dialog" class="modal-close-row"><button type="submit">閉じる ×</button></form>' +
      '<div class="modal-content"><h2>レビューを編集</h2><form id="editReviewForm" class="form-panel">' +
      '<label>店舗<select name="storeId" required>' + stores.map(s=>'<option value="'+esc(s.id)+'" '+
      (String(s.id)===String(r.storeId)?"selected":"")+'>'+esc(s.name)+'</option>').join("")+'</select></label>' +
      '<label>メンテナンス評価<select name="maintenance">'+[4,3,2,1].map(n=>'<option value="'+n+'" '+(Number(r.maintenance)===n?"selected":"")+'>'+n+' - '+scoreLabel(n)+'</option>').join("")+'</select></label>' +
      '<label>店舗総合評価<select name="overall">'+[4,3,2,1].map(n=>'<option value="'+n+'" '+(Number(r.overall)===n?"selected":"")+'>'+n+' - '+scoreLabel(n)+'</option>').join("")+'</select></label>' +
      '<label>店内ランク<select name="driverRank"><option value="">未評価</option>'+[5,4,3,2,1].map(n=>'<option value="'+n+'" '+(Number(r.driverRank)===n?"selected":"")+'>'+n+'/5</option>').join("")+'</select></label>' +
      '<label>通信状況<select name="connection"><option value="">未評価</option>'+[5,4,3,2,1].map(n=>'<option value="'+n+'" '+(Number(r.connection)===n?"selected":"")+'>'+n+'/5</option>').join("")+'</select></label>' +
      '<label>訪問日<input type="date" name="visitedAt" value="'+esc(r.visitedAt||'')+'"></label>' +
      '<label>コメント<textarea name="comment" minlength="5" maxlength="1500" required>'+esc(r.comment)+'</textarea></label>' +
      '<button type="submit" class="button button-primary">変更を保存</button></form></div>';
    document.body.appendChild(d); d.showModal(); d.addEventListener("close",()=>d.remove());
    $("#editReviewForm",d).addEventListener("submit",async e=>{
      e.preventDefault(); const fd=new FormData(e.currentTarget);
      const p={storeId:String(fd.get("storeId")),maintenance:Number(fd.get("maintenance")),overall:Number(fd.get("overall")),
        driverRank:fd.get("driverRank")?Number(fd.get("driverRank")):null,
        connection:fd.get("connection")?Number(fd.get("connection")):null,
        visitedAt:String(fd.get("visitedAt")||""),comment:String(fd.get("comment")||"").trim()};
      if(p.comment.length<5){toast("コメントは5文字以上で入力してください。");return;}
      if(supabase){
        let q=supabase.from("reviews").update({store_id:p.storeId,maintenance:p.maintenance,overall:p.overall,
          driver_rank:p.driverRank,connection:p.connection,visited_at:p.visitedAt||null,comment:p.comment}).eq("id",r.id);
        if(!isAdmin()) q=q.eq("user_id",currentUser.id);
        const {data,error}=await q.select().maybeSingle();
        if(error||!data){toast("更新できませんでした："+(error?.message||"Supabaseの更新ポリシーを確認してください。"));return;}
        Object.assign(r,fromReview(data));
      } else {
        Object.assign(r,p); localStorage.setItem(STORAGE_KEY,JSON.stringify({stores,reviews}));
      }
      d.close(); render(); toast("レビューを更新しました。");
    });
  }
  async function deleteReview(id) {
    if (!requireUser()) return;
    const r=reviews.find(x=>String(x.id)===String(id)); if(!r)return;
    const own=String(r.authorId||"")===String(currentUser.id);
    if(!own&&!isAdmin()){toast("自分の投稿のみ削除できます。");return;}
    if(!confirm("このレビューを削除しますか？この操作は取り消せません。"))return;
    if(supabase){
      let q=supabase.from("reviews").delete().eq("id",r.id);
      if(!isAdmin())q=q.eq("user_id",currentUser.id);
      const {data,error}=await q.select("id");
      if(error||!data||!data.length){toast("削除できませんでした："+(error?.message||"Supabaseの削除ポリシーを確認してください。"));return;}
    }
    reviews=reviews.filter(x=>String(x.id)!==String(r.id));
    if(!supabase)localStorage.setItem(STORAGE_KEY,JSON.stringify({stores,reviews}));
    document.querySelectorAll("dialog.modal").forEach(d=>{if(d.open)d.close();});
    render();toast("レビューを削除しました。");
  }
  function openDetails(id) {
    const s=stores.find(x=>String(x.id)===String(id)); if(!s)return;
    const rs=storeReviews(id).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
    const d=document.createElement("dialog"); d.className="modal detail-dialog";
    d.innerHTML='<form method="dialog" class="modal-close-row"><button type="submit">閉じる ×</button></form><div class="detail-content"><h2>'+
      esc(s.name)+'</h2><p>'+esc(s.country)+(s.region?'・'+esc(s.region):'')+'<br>'+esc(s.address)+'</p><p><a target="_blank" rel="noopener noreferrer" href="'+esc(mapUrl(s))+'">Google Mapsで開く ↗</a></p>'+
      (s.description?'<p>'+esc(s.description)+'</p>':'')+'<p>メンテナンス平均：'+fmt(avg(rs,"maintenance"))+'/4</p><p>店舗総合平均：'+fmt(avg(rs,"overall"))+'/4</p><h3>レビュー・コメント ('+rs.length+')</h3>'+
      (rs.length?rs.map(r=>'<article class="detail-comment"><p>整備：'+scoreLabel(Number(r.maintenance))+'　店舗：'+scoreLabel(Number(r.overall))+'</p><p>'+esc(r.comment)+'</p><small>'+esc(r.author||"メンバー")+' · '+esc(dateLabel(r.visitedAt))+'</small><div class="review-actions">'+actions(r)+'</div></article>').join(""):'<p>まだレビューはありません。</p>')+
      '<button type="button" class="button button-primary" data-review-this="'+esc(s.id)+'">この店舗をレビュー</button></div>';
    document.body.appendChild(d); d.showModal(); d.addEventListener("close",()=>d.remove());
    d.addEventListener("click",e=>{if(e.target===d)d.close();});
    $("[data-review-this]",d).addEventListener("click",()=>{d.close();if($("#reviewStoreSelect"))$("#reviewStoreSelect").value=id;$("#review")?.scrollIntoView({behavior:"smooth"});if(!currentUser)$("#authDialog")?.showModal();});
  }
  function setAuthMode(mode) {
    authMode=mode; $$(".auth-tabs button").forEach(b=>b.classList.toggle("active",b.dataset.mode===mode));
    if($("#authTitle"))$("#authTitle").textContent=mode==="login"?"ログイン":"新規登録";
    if($("#authSubmit"))$("#authSubmit").textContent=mode==="login"?"ログイン":"アカウントを作成";
  }
  async function handleAuth(e) {
    e.preventDefault();const fd=new FormData(e.currentTarget),email=String(fd.get("email")||"").trim(),password=String(fd.get("password")||"");
    if(supabase){
      const result=authMode==="login"?await supabase.auth.signInWithPassword({email,password}):await supabase.auth.signUp({email,password});
      if(result.error){toast(result.error.message);return;}
      currentUser=result.data.user;updateAuth();
      if(authMode==="login"||result.data.session)$("#authDialog")?.close();
      toast(authMode==="signup"?"登録しました。確認メールが届く場合があります。":"ログインしました。");return;
    }
    if(authMode==="signup"){
      if(password.length<8){toast("パスワードは8文字以上にしてください。");return;}
      currentUser={id:"local-"+Date.now(),email};localStorage.setItem(PROFILE_KEY,JSON.stringify(currentUser));
    }else{
      let p=null;try{p=JSON.parse(localStorage.getItem(PROFILE_KEY)||"null");}catch(_){}
      if(!p||p.email!==email){toast("デモモードでは先に新規登録してください。");return;}currentUser=p;
    }
    updateAuth();$("#authDialog")?.close();toast("ログインしました。");
  }
  function updateRegionRequirement() {
    const c=$("#storeCountry"),r=$("#storeRegion");if(!c||!r)return;
    const jp=["日本","japan"].includes(c.value.trim().toLowerCase());
    r.required=jp;r.disabled=!jp;if(!jp)r.value="";
    r.placeholder=jp?"日本の場合：千葉県":"海外店舗は入力不要";
    $("#regionFieldLabel")?.classList.toggle("muted",!jp);
  }
  function bindEvents() {
    $("#authButton")?.addEventListener("click",async()=>{
      if(!currentUser){$("#authDialog")?.showModal();return;}
      if(supabase){const {error}=await supabase.auth.signOut();if(error){toast(error.message);return;}}
      else localStorage.removeItem(PROFILE_KEY);
      currentUser=null;updateAuth();render();toast("ログアウトしました。");
    });
    $("#authForm")?.addEventListener("submit",handleAuth);
    $$(".auth-tabs button").forEach(b=>b.addEventListener("click",()=>setAuthMode(b.dataset.mode)));
    ["#countryFilter","#regionFilter","#searchInput"].forEach(s=>$(s)?.addEventListener("input",render));
    $("#sortFilter")?.addEventListener("change",render);
    $("#storeCountry")?.addEventListener("input",updateRegionRequirement);
    $("#storeForm")?.addEventListener("submit",async e=>{
      e.preventDefault();if(!requireUser())return;const fd=new FormData(e.currentTarget);
      const country=String(fd.get("country")||"").trim(),region=String(fd.get("region")||"").trim();
      if(!country){toast("国名を入力してください。");return;}
      if(["日本","japan"].includes(country.toLowerCase())&&!region){toast("日本国内の店舗は都道府県を入力してください。");return;}
      await addStore({name:String(fd.get("name")||"").trim(),country,region,address:String(fd.get("address")||"").trim(),
        mapsUrl:String(fd.get("mapsUrl")||"").trim(),cabinetCount:fd.get("cabinetCount")?Number(fd.get("cabinetCount")):null,
        description:String(fd.get("description")||"").trim()});
    });
    $("#reviewForm")?.addEventListener("submit",async e=>{
      e.preventDefault();if(!requireUser())return;const fd=new FormData(e.currentTarget);
      if(fd.has("honest")&&!fd.get("honest"))return;
      await addReview({storeId:String(fd.get("storeId")||""),maintenance:Number(fd.get("maintenance")),overall:Number(fd.get("overall")),
        driverRank:fd.get("driverRank")?Number(fd.get("driverRank")):null,connection:fd.get("connection")?Number(fd.get("connection")):null,
        comment:String(fd.get("comment")||"").trim(),visitedAt:String(fd.get("visitedAt")||"")});
    });
    $("#storeGrid")?.addEventListener("click",e=>{const b=e.target.closest("[data-details]");if(b)openDetails(b.dataset.details);});
    document.addEventListener("click",e=>{
      const edit=e.target.closest("[data-edit-review]");if(edit){e.preventDefault();editReview(edit.dataset.editReview);return;}
      const del=e.target.closest("[data-delete-review]");if(del){e.preventDefault();deleteReview(del.dataset.deleteReview);return;}
      const report=e.target.closest("[data-report-review]");if(report){e.preventDefault();if(requireUser())toast("問題報告機能は未設定です。");}
    });
    $("#homeLink")?.addEventListener("click",e=>{e.preventDefault();window.scrollTo({top:0,behavior:"smooth"});});
  }
  document.addEventListener("DOMContentLoaded",async()=>{
    try{
      bindEvents();if($("#visitedAt"))$("#visitedAt").value=new Date().toISOString().slice(0,10);
      updateRegionRequirement();await loadData();
    }catch(e){console.error("App initialization error:",e);toast("初期化に失敗しました。Consoleのエラーを確認してください。");}
  });
})();
