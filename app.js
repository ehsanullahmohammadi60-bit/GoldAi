const $=s=>document.querySelector(s);
let method="hesabpay";
const T={
en:{heroTitle:"Professional Gold Signals",heroText:"Create your account, activate access, and receive XAUUSD signals inside your private dashboard."},
fa:{heroTitle:"سیگنال‌های حرفه‌ای طلا",heroText:"حساب بسازید، دسترسی را فعال کنید و سیگنال‌های XAUUSD را داخل داشبورد خصوصی دریافت کنید."},
ar:{heroTitle:"إشارات احترافية للذهب",heroText:"أنشئ حسابك، فعّل الوصول، واستلم إشارات XAUUSD داخل لوحة التحكم الخاصة بك."}
};
function lang(){return localStorage.goldaiLang||"en"}
function setLang(v){localStorage.goldaiLang=v;document.documentElement.lang=v;document.documentElement.dir=v==="en"?"ltr":"rtl";$("#heroTitle").textContent=T[v].heroTitle;$("#heroText").textContent=T[v].heroText}
$("#lang").value=lang(); $("#lang").onchange=e=>setLang(e.target.value); setLang(lang());

document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));b.classList.add("active");$("#loginForm").classList.toggle("hidden",b.dataset.tab!=="login");$("#registerForm").classList.toggle("hidden",b.dataset.tab!=="register")});
async function api(url,opt={}){const r=await fetch(url,opt);let j={};try{j=await r.json()}catch{}if(!r.ok)throw new Error(j.error||"Request failed");return j}
$("#registerForm").onsubmit=async e=>{e.preventDefault();$("#authMsg").textContent="Creating account...";try{await api("/api/register",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:$("#regName").value,email:$("#regEmail").value,password:$("#regPass").value})});await load();}catch(x){$("#authMsg").textContent=x.message}}
$("#loginForm").onsubmit=async e=>{e.preventDefault();$("#authMsg").textContent="Signing in...";try{await api("/api/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:$("#loginEmail").value,password:$("#loginPass").value})});await load();}catch(x){$("#authMsg").textContent=x.message}}
$("#logout").onclick=async()=>{await api("/api/logout",{method:"POST"});load()};

function showMethod(){document.querySelectorAll(".pay").forEach(x=>x.classList.toggle("active",x.dataset.method===method));$("#payDetails").innerHTML=method==="hesabpay"
?`<b>HesabPay — 240 AFN</b><br>Send the exact activation fee to the official receiving ID:<br><strong>9004134056412319</strong><br><small>Then upload your receipt below. Do not enter a PIN or password.</small>`
:`<b>Binance Pay — 4 USD / USDT</b><br>Send the exact activation fee using Binance Pay to:<br><strong>760897285</strong><br><small>Then upload your receipt below. Never share a seed phrase or private key.</small>`}
document.querySelectorAll(".pay").forEach(b=>b.onclick=()=>{method=b.dataset.method;showMethod()});showMethod();

$("#paymentForm").onsubmit=async e=>{e.preventDefault();$("#payMsg").textContent="Uploading receipt...";const f=new FormData();f.append("method",method);f.append("reference",$("#reference").value);f.append("receipt",$("#receipt").files[0]);try{await api("/api/payments",{method:"POST",body:f});$("#payMsg").textContent="Receipt submitted. Access remains locked until admin approval.";await load()}catch(x){$("#payMsg").textContent=x.message}}
$("#supportBtn").onclick=async()=>{try{await api("/api/support",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:$("#supportText").value})});$("#supportText").value="";$("#supportMsg").textContent="Message sent."}catch(x){$("#supportMsg").textContent=x.message}}
async function load(){const me=await api("/api/me");$("#auth").classList.toggle("hidden",me.loggedIn);$("#dashboard").classList.toggle("hidden",!me.loggedIn);if(!me.loggedIn)return;$("#status").textContent=me.user.approved?"✓ Your access is approved.":"🔒 Your access is locked until your payment receipt is reviewed.";const a=await api("/api/access");$("#payPanel").classList.toggle("hidden",a.approved);$("#signalsPanel").classList.toggle("hidden",!a.approved);if(a.approved){$("#signals").innerHTML=a.signals.length?a.signals.map(s=>`<div class="signal"><b>${escapeHtml(s.title)}</b><br>${escapeHtml(s.body)}<br><small>${new Date(s.createdAt).toLocaleString()}</small></div>`).join(""):"No signals published yet."}}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
load();
