const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const DATA = path.join(ROOT, "data");
const UPLOADS = path.join(DATA, "receipts");
fs.mkdirSync(UPLOADS, { recursive: true });

const DB = path.join(DATA, "db.json");
const SESSION_SECRET = process.env.SESSION_SECRET || "change-this-session-secret";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "EMg7j72m0tG2Dq7J";

function load() {
  if (!fs.existsSync(DB)) {
    const initial = {
      users: [],
      payments: [],
      signals: [],
      support: []
    };
    fs.writeFileSync(DB, JSON.stringify(initial, null, 2));
    return initial;
  }
  try { return JSON.parse(fs.readFileSync(DB, "utf8")); }
  catch { return {users:[], payments:[], signals:[], support:[]}; }
}
let db = load();
function save(){ fs.writeFileSync(DB, JSON.stringify(db, null, 2)); }
function id(){ return crypto.randomUUID(); }
function hashPassword(pw, salt=crypto.randomBytes(16).toString("hex")){
  const hash=crypto.scryptSync(pw,salt,64).toString("hex");
  return {salt,hash};
}
function checkPassword(pw,obj){
  try { return crypto.timingSafeEqual(Buffer.from(crypto.scryptSync(pw,obj.salt,64).toString("hex")),Buffer.from(obj.hash)); }
  catch { return false; }
}
function token(userId, role){
  const payload=Buffer.from(JSON.stringify({userId,role,exp:Date.now()+1000*60*60*24*7})).toString("base64url");
  const sig=crypto.createHmac("sha256",SESSION_SECRET).update(payload).digest("base64url");
  return payload+"."+sig;
}
function readToken(req){
  const t=(req.headers.cookie||"").split(";").map(x=>x.trim()).find(x=>x.startsWith("goldai_session="));
  return t ? decodeURIComponent(t.split("=")[1]) : null;
}
function session(req){
  const t=readToken(req); if(!t) return null;
  const [p,s]=t.split("."); if(!p||!s) return null;
  const expected=crypto.createHmac("sha256",SESSION_SECRET).update(p).digest("base64url");
  if(s!==expected) return null;
  try { const x=JSON.parse(Buffer.from(p,"base64url").toString()); return x.exp>Date.now()?x:null; } catch{return null;}
}
function requireUser(req,res,next){
  const s=session(req); if(!s || s.role!=="user") return res.status(401).json({error:"LOGIN_REQUIRED"});
  const u=db.users.find(x=>x.id===s.userId); if(!u) return res.status(401).json({error:"LOGIN_REQUIRED"});
  req.user=u; next();
}
function requireAdmin(req,res,next){
  const s=session(req); if(!s || s.role!=="admin") return res.status(401).json({error:"ADMIN_REQUIRED"});
  next();
}
function cookie(res,t){ res.setHeader("Set-Cookie",`goldai_session=${encodeURIComponent(t)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800`); }

app.use(express.json({limit:"1mb"}));
app.use(express.urlencoded({extended:true}));
const upload=multer({dest:UPLOADS,limits:{fileSize:5*1024*1024},fileFilter:(req,file,cb)=>{
  cb(null,/^image\\/(png|jpe?g|webp|gif)$/.test(file.mimetype));
}});

app.use("/receipts", express.static(UPLOADS));
app.use(express.static(path.join(ROOT,"public")));

app.get("/health",(req,res)=>res.json({ok:true}));

app.post("/api/register",(req,res)=>{
  const {name,email,password}=req.body||{};
  if(!name||!email||!password||password.length<6) return res.status(400).json({error:"Enter name, valid email and password (6+ characters)."});
  const e=String(email).trim().toLowerCase();
  if(db.users.some(u=>u.email===e)) return res.status(409).json({error:"An account with this email already exists."});
  const hp=hashPassword(password);
  const u={id:id(),name:String(name).trim().slice(0,80),email:e,password:hp,approved:false,createdAt:new Date().toISOString()};
  db.users.push(u); save(); cookie(res,token(u.id,"user"));
  res.json({ok:true,user:{name:u.name,email:u.email,approved:u.approved}});
});

app.post("/api/login",(req,res)=>{
  const {email,password}=req.body||{};
  const u=db.users.find(x=>x.email===String(email||"").trim().toLowerCase());
  if(!u||!checkPassword(password||"",u.password)) return res.status(401).json({error:"Invalid email or password."});
  cookie(res,token(u.id,"user")); res.json({ok:true,user:{name:u.name,email:u.email,approved:u.approved}});
});

app.post("/api/logout",(req,res)=>{
  res.setHeader("Set-Cookie","goldai_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0"); res.json({ok:true});
});

app.get("/api/me",(req,res)=>{
  const s=session(req); if(!s) return res.json({loggedIn:false});
  if(s.role==="admin") return res.json({loggedIn:true,role:"admin"});
  const u=db.users.find(x=>x.id===s.userId); if(!u) return res.json({loggedIn:false});
  res.json({loggedIn:true,role:"user",user:{name:u.name,email:u.email,approved:u.approved}});
});

app.post("/api/payments",requireUser,upload.single("receipt"),(req,res)=>{
  const method=req.body.method;
  if(!["hesabpay","binance"].includes(method)) return res.status(400).json({error:"Invalid payment method."});
  if(!req.body.reference) return res.status(400).json({error:"Payment reference is required."});
  if(!req.file) return res.status(400).json({error:"Receipt image is required."});
  const old=db.payments.find(p=>p.userId===req.user.id && p.status==="pending");
  if(old) return res.status(409).json({error:"You already have a payment waiting for review."});
  const p={id:id(),userId:req.user.id,method,amount:method==="hesabpay"?"240 AFN":"4 USD / USDT",reference:String(req.body.reference).trim().slice(0,120),receipt:"/receipts/"+path.basename(req.file.path),status:"pending",createdAt:new Date().toISOString()};
  db.payments.push(p); save(); res.json({ok:true});
});

app.get("/api/access",requireUser,(req,res)=>{
  const latest=[...db.payments].filter(p=>p.userId===req.user.id).sort((a,b)=>b.createdAt.localeCompare(a.createdAt))[0];
  const approved=req.user.approved===true;
  const signals=approved ? [...db.signals].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)) : [];
  res.json({approved,paymentStatus:latest?.status||"none",signals});
});

app.post("/api/support",requireUser,(req,res)=>{
  const {message}=req.body||{};
  if(!message||String(message).trim().length<2) return res.status(400).json({error:"Message required."});
  db.support.push({id:id(),userId:req.user.id,message:String(message).trim().slice(0,2000),createdAt:new Date().toISOString()}); save(); res.json({ok:true});
});

app.post("/api/admin/login",(req,res)=>{
  if(String(req.body.password||"")!==ADMIN_PASSWORD) return res.status(401).json({error:"Invalid admin password."});
  cookie(res,token("admin","admin")); res.json({ok:true});
});

app.get("/api/admin/data",requireAdmin,(req,res)=>{
  res.json({
    users:db.users.map(u=>({id:u.id,name:u.name,email:u.email,approved:u.approved,createdAt:u.createdAt})),
    payments:db.payments.map(p=>({...p,userEmail:db.users.find(u=>u.id===p.userId)?.email||"Unknown",userName:db.users.find(u=>u.id===p.userId)?.name||"Unknown"})),
    signals:db.signals,
    support:db.support.map(s=>({...s,userEmail:db.users.find(u=>u.id===s.userId)?.email||"Unknown"}))
  });
});

app.post("/api/admin/payments/:paymentId/approve",requireAdmin,(req,res)=>{
  const p=db.payments.find(x=>x.id===req.params.paymentId); if(!p) return res.status(404).json({error:"Payment not found."});
  p.status="approved"; p.reviewedAt=new Date().toISOString();
  const u=db.users.find(x=>x.id===p.userId); if(u) u.approved=true;
  save(); res.json({ok:true});
});
app.post("/api/admin/payments/:paymentId/reject",requireAdmin,(req,res)=>{
  const p=db.payments.find(x=>x.id===req.params.paymentId); if(!p) return res.status(404).json({error:"Payment not found."});
  p.status="rejected"; p.reviewedAt=new Date().toISOString();
  const u=db.users.find(x=>x.id===p.userId); if(u) u.approved=false;
  save(); res.json({ok:true});
});
app.post("/api/admin/signals",requireAdmin,(req,res)=>{
  const {title,body}=req.body||{};
  if(!body) return res.status(400).json({error:"Signal body required."});
  db.signals.push({id:id(),title:String(title||"XAUUSD Signal").slice(0,120),body:String(body).slice(0,5000),createdAt:new Date().toISOString()});
  save(); res.json({ok:true});
});
app.delete("/api/admin/signals/:id",requireAdmin,(req,res)=>{
  db.signals=db.signals.filter(x=>x.id!==req.params.id); save(); res.json({ok:true});
});

app.get("/admin",(req,res)=>res.sendFile(path.join(ROOT,"public","admin.html")));

app.listen(PORT,()=>console.log(`GoldAI running on port ${PORT}`));
