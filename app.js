"use strict";
/* PALUWAGAN · Enterprise Elite | PLAN C PROJECT.
   Functional local-first iPhone Safari/PWA prototype.
   No cloud, bank or push service. Data remains in the current browser profile.
*/
(() => {
const KEY="crissalyn_paluwagan_enterprise_elite_v1";
const VERSION=1;
const FREQ={daily:"Daily",weekly:"Weekly",biweekly:"Bi-weekly",monthly:"Monthly",yearly:"Yearly"};
const state={db:null,page:"dashboard",selectedGroup:null,search:"",filter:"all",reportGroup:"all",reportPeriod:"all",modal:null};
const $=id=>document.getElementById(id);
const E=(s)=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const icon=n=>'<svg aria-hidden="true"><use href="#i-'+n+'"/></svg>';
const php=n=>"₱"+Number(n||0).toLocaleString("en-PH",{minimumFractionDigits:2,maximumFractionDigits:2});
const shortPhp=n=>"₱"+Number(n||0).toLocaleString("en-PH",{maximumFractionDigits:0});
const today=()=>{const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");};
const fmt=s=>s?new Date(s+"T12:00:00Z").toLocaleDateString("en-PH",{month:"short",day:"numeric",year:"numeric",timeZone:"UTC"}):"—";
const initials=s=>String(s||"?").trim().split(/\s+/).slice(0,2).map(t=>t[0]||"").join("").toUpperCase();
const id=()=>typeof crypto!=="undefined"&&crypto.randomUUID?crypto.randomUUID():"p-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2);
const dateValid=s=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(new Date(s+"T12:00:00Z").getTime())&&new Date(s+"T12:00:00Z").toISOString().slice(0,10)===s;
const daysDiff=(a,b)=>Math.round((new Date(b+"T12:00:00Z")-new Date(a+"T12:00:00Z"))/86400000);
const addDate=(s,days)=>{const d=new Date(s+"T12:00:00Z");d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10);};
const shiftMonth=(s,n)=>{const d=new Date(s+"T12:00:00Z"),day=d.getUTCDate();d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()+n);const last=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate();d.setUTCDate(Math.min(day,last));return d.toISOString().slice(0,10);};
function cycleDate(g,i){const count=Number(i);if(g.frequency==="daily")return addDate(g.startDate,count);if(g.frequency==="weekly")return addDate(g.startDate,count*7);if(g.frequency==="biweekly")return addDate(g.startDate,count*14);if(g.frequency==="yearly")return shiftMonth(g.startDate,count*12);return shiftMonth(g.startDate,count);}
function seed(){
 const m=[["Sample Member 01","09170000001"],["Sample Member 02","09170000002"],["Sample Member 03","09170000003"],["Sample Member 04","09170000004"],["Sample Member 05","09170000005"]].map(([name,phone])=>({id:id(),name,phone,address:"",notes:"",photo:"",joinedAt:today()}));
 const g={id:id(),name:"Sunrise Savings Circle",amount:1200,frequency:"monthly",startDate:today(),memberIds:m.map(x=>x.id),payoutOrder:m.map(x=>x.id),lateFee:0,status:"active",createdAt:new Date().toISOString(),notes:"Demo group • 5 members, 5 monthly payouts"};
 const payments=[{id:id(),groupId:g.id,memberId:m[0].id,cycle:0,amount:1200,date:today(),method:"Cash",reference:"DEMO-001",notes:"Sample contribution",voided:false,createdAt:new Date().toISOString()},
 {id:id(),groupId:g.id,memberId:m[1].id,cycle:0,amount:1200,date:today(),method:"Cash",reference:"DEMO-002",notes:"Sample contribution",voided:false,createdAt:new Date().toISOString()}];
 return {version:VERSION,settings:{businessName:"CRISSALYN PALUWAGAN",ownerName:"Crissalyn",currency:"PHP"},members:m,groups:[g],payments,payouts:[],activity:[{id:id(),at:new Date().toISOString(),text:"Sample workspace created for preview"}],isDemo:true,createdAt:new Date().toISOString()};
}
function emptyWorkspace(){
 return {version:VERSION,settings:{businessName:"CRISSALYN PALUWAGAN",ownerName:"Crissalyn",currency:"PHP"},
  members:[],groups:[],payments:[],payouts:[],activity:[],isDemo:false,createdAt:new Date().toISOString()};
}
function validDb(db){
 return db&&typeof db==="object"&&db.version===VERSION&&Array.isArray(db.members)&&Array.isArray(db.groups)&&Array.isArray(db.payments)&&Array.isArray(db.payouts)&&Array.isArray(db.activity)&&db.settings&&typeof db.settings.businessName==="string"&&db.members.length<10000&&db.groups.length<2000&&db.payments.length<100000&&db.payouts.length<10000;
}
function load(){
 try{const raw=localStorage.getItem(KEY);if(raw){const doc=JSON.parse(raw);if(validDb(doc)){state.db=doc;return;}}}
 catch(err){console.warn("Could not read local ledger",err);}
 state.db=emptyWorkspace();try{localStorage.setItem(KEY,JSON.stringify(state.db));}catch(err){notify("Browser storage is disabled; changes may not be saved.");}
}
function save(){
 try{localStorage.setItem(KEY,JSON.stringify(state.db));return true;}
 catch(err){notify("Save failed: browser storage may be unavailable or full. Export data before proceeding.");return false;}
}
function editData(mutator,event){
 const before=JSON.stringify(state.db);
 try{mutator(state.db);if(event)state.db.activity.unshift({id:id(),at:new Date().toISOString(),text:event});state.db.activity=state.db.activity.slice(0,2000);if(!save())throw Error("Could not save");render();return true;}
 catch(err){state.db=JSON.parse(before);notify(err.message||"Operation failed");render();return false;}
}
let toastTime;
function notify(message){const el=$("toast");el.textContent=message;el.classList.add("show");clearTimeout(toastTime);toastTime=setTimeout(()=>el.classList.remove("show"),4500);}
function group(id){return state.db.groups.find(x=>x.id===id);}
function member(id){return state.db.members.find(x=>x.id===id);}
function activePayments(){return state.db.payments.filter(p=>!p.voided);}
function groupPayments(gid){return activePayments().filter(p=>p.groupId===gid);}
function paidFor(gid,mid,cycle){return groupPayments(gid).filter(p=>p.memberId===mid&&p.cycle===cycle).reduce((a,p)=>a+p.amount,0);}
function payoutFor(gid,cycle){return state.db.payouts.find(p=>p.groupId===gid&&p.cycle===cycle&&!p.voided);}
function totalCollected(gid){return activePayments().filter(p=>!gid||p.groupId===gid).reduce((a,p)=>a+p.amount,0);}
function totalReleased(gid){return state.db.payouts.filter(p=>!p.voided&&(!gid||p.groupId===gid)).reduce((a,p)=>a+p.amount,0);}
function amountAvailable(gid){return totalCollected(gid)-totalReleased(gid);}
function groupCycle(g){return g.memberIds.length;}
function scheduledPot(g){return g.amount*g.memberIds.length;}
function computeCycle(g,i){
 const due=cycleDate(g,i),target=g.payoutOrder[i]||g.memberIds[i],received=g.memberIds.reduce((a,mid)=>a+paidFor(g.id,mid,i),0);
 const dueSum=scheduledPot(g),payout=payoutFor(g.id,i);
 const unpaid=g.memberIds.filter(mid=>paidFor(g.id,mid,i)<g.amount-0.001).length;
 const upcoming=daysDiff(today(),due),released=!!payout;
 const status=released?"released":upcoming<0?"overdue":upcoming===0?"today":"upcoming";
 return {g,i,due,target,received,dueSum,unpaid,payout,daysLeft:upcoming,status};
}
function groupStatus(g){
 if(g.status==="archived")return "Completed";
 return g.payoutOrder.every((_,i)=>!!payoutFor(g.id,i))?"Completed":"Active";
}
function allCycles(){return state.db.groups.filter(g=>g.status!=="archived").flatMap(g=>g.payoutOrder.map((_,i)=>computeCycle(g,i)));}
function dueAlerts(){
 const events=[];
 for(const c of allCycles()){
  if(c.payout)continue;
  if(c.unpaid>0&&c.daysLeft<0)events.push({type:"overdue",title:c.g.name+": "+c.unpaid+" unpaid",detail:"Cycle "+(c.i+1)+" was due "+fmt(c.due),date:c.due,gid:c.g.id});
  else if(c.daysLeft>=0&&c.daysLeft<=7)events.push({type:"pending",title:c.g.name+" · payout #"+(c.i+1),detail:"Due "+fmt(c.due)+" · "+c.unpaid+" incomplete contribution(s)",date:c.due,gid:c.g.id});
 }
 return events.sort((a,b)=>a.date.localeCompare(b.date)).slice(0,100);
}
function badge(value){const key=String(value).toLowerCase();const klass=key.includes("overdue")?"overdue":key.includes("paid")||key.includes("released")||key.includes("active")?"active":key.includes("completed")?"completed":"pending";return '<span class="tag '+klass+'">'+E(value)+'</span>';}
function avatar(m,variant){const colors=["","purple","green","pink"],i=variant||Math.abs([...String(m?.name||"")].reduce((a,ch)=>a+ch.charCodeAt(0),0))%4;return '<div class="avatar '+colors[i]+'">'+(m?.photo?'<img src="'+E(m.photo)+'" alt="">':E(initials(m?.name)))+'</div>';}
function empty(iconName,title,desc,action){return '<div class="empty-state"><div class="empty-icon">'+icon(iconName)+'</div><h3>'+E(title)+'</h3><p>'+E(desc)+'</p>'+(action||"")+'</div>';}
function hero(title,desc,buttons,eyebrow){return '<div class="section-hero"><div><span class="eyebrow">'+E(eyebrow||"PREMIUM MANAGEMENT")+'</span><h1>'+E(title)+'</h1><p>'+E(desc||"")+'</p></div><div class="actions">'+(buttons||"")+'</div></div>';}
function button(action,label,klass="btn-primary",attrs=""){return '<button type="button" data-action="'+E(action)+'" '+attrs+' class="btn '+klass+'">'+label+'</button>';}
function table(headers,rows){return '<div class="table-scroll"><table><thead><tr>'+headers.map(x=>'<th>'+E(x)+'</th>').join("")+'</tr></thead><tbody>'+rows.join("")+'</tbody></table></div>';}
function metric(iconName,label,value,note,variant=""){return '<div class="metric"><div class="metric-icon '+variant+'">'+icon(iconName)+'</div><div class="metric-label">'+E(label)+'</div><div class="metric-value number">'+E(value)+'</div><div class="metric-note">'+E(note)+'</div></div>';}
function paintDashboard(){
 const db=state.db,active=db.groups.filter(g=>groupStatus(g)==="Active").length,received=totalCollected(),released=totalReleased();
 const alerts=dueAlerts(),upcoming=allCycles().filter(c=>!c.payout&&c.daysLeft>=0).sort((a,b)=>a.daysLeft-b.daysLeft).slice(0,5);
 const recent=activePayments().slice().sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,5);
 const lastSix=Array.from({length:6},(_,i)=>{const d=new Date();d.setMonth(d.getMonth()+i-5);const ym=d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0");return {label:d.toLocaleDateString("en",{month:"short"}),value:activePayments().filter(p=>p.date.startsWith(ym)).reduce((a,p)=>a+p.amount,0)};});
 const max=Math.max(...lastSix.map(x=>x.value),1);
 return '<div class="dashboard-hero"><div class="hero-content"><span class="eyebrow">WELCOME TO YOUR CIRCLE</span><h1>Better together.<br>Stronger with every hulog.</h1><p>Your paluwagan, beautifully organized. Every member, contribution, and payout in one premium workspace.</p><div class="hero-chips"><span class="hero-chip">'+icon("sparkle")+' ENTERPRISE ELITE</span><span class="hero-chip">'+db.groups.length+' savings circles</span></div></div><div class="hero-art"><div class="coin-art">₱</div></div></div>'
 +'<div class="metric-grid">'
 +metric("wallet","Total Contributions",shortPhp(received),"Recorded collections","")
 +metric("users","Total Members",db.members.length,"Registered in this device","green")
 +metric("layers","Active Groups",active,"Ongoing savings circles","purple")
 +metric("calendar","Payouts Released",shortPhp(released),"Recorded outgoing payouts","red")+'</div>'
 +'<div class="grid-2"><div>'
 +'<section class="card"><div class="card-header"><h2>Recent Contributions</h2><button class="link-btn" data-page="payments">View all '+icon("arrow")+'</button></div>'
 +(recent.length?recent.map(p=>{const m=member(p.memberId),g=group(p.groupId);return '<div class="list-row"><div class="row-main">'+avatar(m)+'<div><strong>'+E(m?.name||"Former member")+'</strong><small>'+E(g?.name||"Group")+' · '+fmt(p.date)+'</small></div></div><div class="row-end"><strong class="success-text">+'+php(p.amount)+'</strong><small>'+E(p.method)+'</small></div></div>';}).join(""):empty("wallet","No contributions yet","Record a member's first hulog.",button("payment-new","+ Record hulog")))+
 '</section><section class="card"><div class="card-header"><h2>Collection Trend</h2><span class="hint">Last 6 months</span></div><div class="chart-wrap">'+lastSix.map(x=>'<div class="chart-col"><div class="chart-bar" title="'+E(php(x.value))+'" style="height:'+Math.max(5,Math.round(x.value/max*100))+'%"></div><span class="chart-label">'+E(x.label)+'</span></div>').join("")+'</div><div class="chart-caption">Recorded contributions only, not linked to any bank or payment provider.</div></section></div>'
 +'<div><section class="card"><div class="card-header"><h2>Upcoming Payouts</h2><button class="link-btn" data-page="payouts">Schedule '+icon("arrow")+'</button></div>'
 +(upcoming.length?upcoming.map(c=>'<div class="list-row"><div class="row-main"><div class="avatar">'+icon("calendar")+'</div><div><strong>'+E(member(c.target)?.name||"Recipient")+'</strong><small>'+E(c.g.name)+' · '+fmt(c.due)+'</small></div></div><div class="row-end"><strong>'+shortPhp(c.dueSum)+'</strong><small>'+c.daysLeft+' day(s) away</small></div></div>').join(""):empty("calendar","No upcoming payouts","Create a group to generate a schedule."))+
 '</section><section class="card"><div class="card-header"><h2>Collection Health</h2><span class="tag active">LIVE LEDGER</span></div><div class="metric-row"><span>Available balance</span><strong>'+php(amountAvailable())+'</strong></div><div class="metric-row"><span>Due alerts</span><strong>'+alerts.length+'</strong></div><div class="metric-row"><span>Groups completed</span><strong>'+db.groups.filter(g=>groupStatus(g)==="Completed").length+'</strong></div><div class="progress"><span style="width:'+Math.min(100,Math.round(released/Math.max(received,1)*100))+'%"></span></div><p class="small muted" style="margin:11px 0 0">Payouts recorded vs. collections. This is a manually managed ledger.</p></section></div></div>';
}
function groupTile(g){
 const total=g.memberIds.length,pot=scheduledPot(g),cycles=g.payoutOrder.length,done=g.payoutOrder.filter((_,i)=>!!payoutFor(g.id,i)).length;
 const avatars=g.memberIds.slice(0,4).map(mid=>'<div class="mini-avatar">'+E(initials(member(mid)?.name))+'</div>').join("");
 return '<article class="group-card"><div class="head"><span class="tag '+(groupStatus(g)==="Completed"?"completed":"active")+'">'+E(groupStatus(g))+'</span><span class="kicker">'+E(FREQ[g.frequency])+'</span></div><h3>'+E(g.name)+'</h3><p>'+total+' members · Starts '+fmt(g.startDate)+'</p><span class="kicker">PAYOUT POT PER CYCLE</span><div class="group-amount">'+shortPhp(pot)+'</div><div class="progress"><span style="width:'+Math.round(done/Math.max(cycles,1)*100)+'%"></span></div><div class="foot"><div class="avatar-stack">'+avatars+'</div><button class="link-btn" data-action="group-open" data-id="'+E(g.id)+'">Open group '+icon("arrow")+'</button></div></article>';
}
function paintGroups(){
 const list=state.db.groups.filter(g=>state.filter==="all"||groupStatus(g).toLowerCase()===state.filter).filter(g=>g.name.toLowerCase().includes(state.search.toLowerCase()));
 const selected=state.selectedGroup?group(state.selectedGroup):null;
 if(selected)return paintGroupDetail(selected);
 return hero("Savings Circles","Manage unlimited groups, contribution cycles and payout order.",
 button("group-new",icon("plus")+" Create Group"),"GROUP MANAGEMENT")
 +'<div class="toolbar"><div class="search-box">'+icon("search")+'<input id="search-field" placeholder="Search a group..." value="'+E(state.search)+'" aria-label="Search groups"></div><select id="filter-field"><option value="all">All groups</option><option value="active"'+(state.filter==="active"?" selected":"")+'>Active</option><option value="completed"'+(state.filter==="completed"?" selected":"")+'>Completed</option></select></div>'
 +(list.length?'<div class="group-cards">'+list.map(groupTile).join("")+'</div>':empty("layers","No groups found","Create your first savings circle.",button("group-new","+ Create group")));
}
function paintGroupDetail(g){
 const cycles=g.payoutOrder.map((mid,i)=>computeCycle(g,i));
 const all=groupPayments(g.id);
 const groupTotal=totalCollected(g.id),released=totalReleased(g.id);
 const roster=g.memberIds.map((mid,i)=>{const m=member(mid);return '<div class="list-row"><div class="row-main">'+avatar(m,i%4)+'<div><strong>'+E(m?.name||"Missing member")+'</strong><small>'+E(m?.phone||"No phone")+'</small></div></div><div class="row-end"><strong>'+shortPhp(all.filter(p=>p.memberId===mid).reduce((a,p)=>a+p.amount,0))+'</strong><small>Paid so far</small></div></div>';}).join("");
 return hero(g.name,"Group details, savings progress, roster and payout order.",
 button("groups-back",icon("arrow")+" All Groups","btn-light")+button("payment-new",icon("plus")+" Record Hulog","btn-primary",'data-group="'+E(g.id)+'"'),"SAVINGS CIRCLE")
 +'<div class="detail-head"><div class="avatar">'+icon("layers")+'</div><div><strong>'+E(groupStatus(g))+' · '+E(FREQ[g.frequency])+'</strong><p>'+E(g.notes||"Collect, rotate, and celebrate every payout.")+'</p></div></div>'
 +'<div class="detail-grid" style="margin-bottom:17px">'+
 '<div class="mini-stat"><small>Contribution / person</small><strong>'+shortPhp(g.amount)+'</strong></div>'+
 '<div class="mini-stat"><small>Expected payout / cycle</small><strong>'+shortPhp(scheduledPot(g))+'</strong></div>'+
 '<div class="mini-stat"><small>Available from ledger</small><strong>'+shortPhp(groupTotal-released)+'</strong></div></div>'
 +'<div class="grid-2"><section class="card"><div class="card-header"><h2>Payout Rotation & Collection</h2><span class="hint">'+cycles.filter(c=>c.payout).length+'/'+cycles.length+' released</span></div>'
 +cycles.map(c=>'<div class="cycle-row"><span class="cycle-step">'+(c.i+1)+'</span><div><strong>'+E(member(c.target)?.name||"Recipient")+'</strong><small>'+fmt(c.due)+' · '+shortPhp(c.received)+' / '+shortPhp(c.dueSum)+' collected</small><div class="progress"><span style="width:'+Math.min(100,Math.round(c.received/Math.max(c.dueSum,1)*100))+'%"></span></div></div><div>'+badge(c.payout?"Released":c.unpaid?"Pending":"Fully paid")+'</div></div>').join("")
 +'<div class="actions">'+button("payout-order","Adjust payout order","btn-light",'data-id="'+E(g.id)+'"')+button("group-edit","Edit group","btn-light",'data-id="'+E(g.id)+'"')+'</div></section>'
 +'<section class="card"><div class="card-header"><h2>Members</h2><span class="hint">'+g.memberIds.length+' members</span></div>'+roster+'</section></div>';
}
function paintMembers(){
 const list=state.db.members.filter(m=>[m.name,m.phone,m.address,m.notes].some(x=>String(x).toLowerCase().includes(state.search.toLowerCase())));
 const rows=list.map(m=>'<tr><td><div class="row-main">'+avatar(m)+'<div><strong>'+E(m.name)+'</strong><span class="sub">'+E(m.address||"Member")+'</span></div></div></td><td>'+E(m.phone||"—")+'</td><td>'+state.db.groups.filter(g=>g.memberIds.includes(m.id)).length+'</td><td><strong>'+shortPhp(activePayments().filter(p=>p.memberId===m.id).reduce((a,p)=>a+p.amount,0))+'</strong></td><td><div class="mini-actions">'+button("member-edit",icon("edit")+" Edit","btn-light btn-sm",'data-id="'+E(m.id)+'"')+button("member-delete","Remove","btn-danger btn-sm",'data-id="'+E(m.id)+'"')+'</div></td></tr>');
 return hero("Members","Every saver, every detail. Keep your circle organized.",button("member-new",icon("plus")+" Add Member"),"MEMBER DIRECTORY")
 +'<div class="toolbar"><div class="search-box">'+icon("search")+'<input id="search-field" placeholder="Search member or phone" value="'+E(state.search)+'"></div></div>'
 +'<section class="card"><div class="card-header"><h2>All Members</h2><span class="hint">'+list.length+' records</span></div>'
 +(rows.length?table(["Member","Contact","Groups","Total contributed","Actions"],rows):empty("users","No members yet","Register your first member to create a group.",button("member-new","+ Add member")))+'</section>';
}
function paintPayments(){
 const payments=activePayments().slice().sort((a,b)=>b.date.localeCompare(a.date)||b.createdAt.localeCompare(a.createdAt));
 const filtered=payments.filter(p=>(state.filter==="all"||p.groupId===state.filter)&&[member(p.memberId)?.name,group(p.groupId)?.name,p.reference,p.method].some(x=>String(x||"").toLowerCase().includes(state.search.toLowerCase())));
 const rows=filtered.map(p=>'<tr><td><div class="row-main">'+avatar(member(p.memberId))+'<div><strong>'+E(member(p.memberId)?.name||"Member")+'</strong><span class="sub">'+E(group(p.groupId)?.name||"Removed group")+'</span></div></div></td><td>'+fmt(p.date)+'</td><td>Cycle '+(p.cycle+1)+'</td><td><strong>'+php(p.amount)+'</strong><span class="sub">'+E(p.method)+'</span></td><td>'+E(p.reference||"—")+'</td><td>'+button("payment-receipt",icon("receipt")+" Receipt","btn-light btn-sm",'data-id="'+E(p.id)+'"')+button("payment-void","Void","btn-danger btn-sm",'data-id="'+E(p.id)+'"')+'</td></tr>');
 return hero("Contributions","A beautiful, auditable ledger for every hulog, including partial payments.",
 button("payment-new",icon("plus")+" Record Hulog"),"PAYMENT TRACKING")
 +'<div class="metric-grid">'+metric("wallet","Total Hulog",shortPhp(totalCollected()),"Unvoided contributions")+
 metric("receipt","Transactions",activePayments().length,"Saved receipts","green")+
 metric("calendar","Due alerts",dueAlerts().length,"Upcoming and overdue items","purple")+
 metric("layers","Group count",state.db.groups.length,"Across your circles","red")+'</div>'
 +'<div class="toolbar"><div class="search-box">'+icon("search")+'<input id="search-field" placeholder="Member, group or reference..." value="'+E(state.search)+'"></div><select id="filter-field"><option value="all">All groups</option>'+state.db.groups.map(g=>'<option value="'+E(g.id)+'"'+(state.filter===g.id?" selected":"")+'>'+E(g.name)+'</option>').join("")+'</select></div>'
 +'<section class="card"><div class="card-header"><h2>Contribution History</h2><span class="hint">'+filtered.length+' entries</span></div>'
 +(rows.length?table(["Member / Group","Date","Cycle","Amount / Method","Reference","Actions"],rows):empty("wallet","No contributions found","Use Record Hulog to start your transaction history.",button("payment-new","+ Record Hulog")))+'</section>';
}
function paintPayouts(){
 const cycles=allCycles().filter(c=>state.filter==="all"||state.filter===c.g.id).filter(c=>[c.g.name,member(c.target)?.name].some(x=>String(x||"").toLowerCase().includes(state.search.toLowerCase()))).sort((a,b)=>a.due.localeCompare(b.due));
 const rows=cycles.map(c=>'<tr><td><strong>'+E(c.g.name)+'</strong><span class="sub">'+E(FREQ[c.g.frequency])+'</span></td><td>Round '+(c.i+1)+'<span class="sub">'+fmt(c.due)+'</span></td><td><div class="row-main">'+avatar(member(c.target))+'<strong>'+E(member(c.target)?.name||"Recipient")+'</strong></div></td><td><strong>'+shortPhp(c.dueSum)+'</strong><span class="sub">'+shortPhp(c.received)+' recorded</span></td><td>'+badge(c.payout?"Released":c.daysLeft<0?"Overdue":c.daysLeft===0?"Due today":"Scheduled")+'</td><td>'+(c.payout?button("payout-receipt",icon("receipt")+" Receipt","btn-light btn-sm",'data-id="'+E(c.payout.id)+'"'):button("payout-release",icon("check")+" Release","btn-primary btn-sm",'data-group="'+E(c.g.id)+'" data-cycle="'+c.i+'"'))+'</td></tr>');
 return hero("Payout Schedule","Track turn order, payout due dates and funds released.",button("group-new",icon("plus")+" New Group"),"PAYOUT MANAGEMENT")
 +'<div class="metric-grid">'+metric("calendar","Scheduled Rounds",allCycles().length,"Across all active groups")+
 metric("check","Payouts Released",state.db.payouts.filter(p=>!p.voided).length,"Marked by the organizer","green")+
 metric("wallet","Total Released",shortPhp(totalReleased()),"Manual payout ledger","purple")+
 metric("clock","Overdue Rounds",allCycles().filter(c=>c.daysLeft<0&&!c.payout).length,"Not marked released","red")+'</div>'
 +'<div class="toolbar"><div class="search-box">'+icon("search")+'<input id="search-field" value="'+E(state.search)+'" placeholder="Group or recipient..."></div><select id="filter-field"><option value="all">All groups</option>'+state.db.groups.map(g=>'<option value="'+E(g.id)+'"'+(state.filter===g.id?" selected":"")+'>'+E(g.name)+'</option>').join("")+'</select></div>'
 +'<section class="card"><div class="card-header"><h2>Rotation Schedule</h2><span class="hint">Releases are recorded manually</span></div>'
 +(rows.length?table(["Group","Cycle / Due","Recipient","Expected / Collected","Status","Action"],rows):empty("calendar","No payout rounds found","Create a group to generate a payout rotation."))+'</section>'
 +'<div class="warning-box">Payouts are bookkeeping entries only. This app never sends money or confirms bank transfers. Confirm funds and recipient details outside the app before marking a payout released.</div>';
}
function reportStats(){
 const gr=state.reportGroup,period=state.reportPeriod;
 const allowed=p=>{
  if(gr!=="all"&&p.groupId!==gr)return false;
  if(period==="all")return true;
  if(period==="today")return p.date===today();
  if(period==="month")return p.date.startsWith(today().slice(0,7));
  if(period==="year")return p.date.startsWith(today().slice(0,4));
  return true;
 };
 const payments=activePayments().filter(allowed),payouts=state.db.payouts.filter(p=>!p.voided&&allowed(p));
 const collected=payments.reduce((a,p)=>a+p.amount,0),released=payouts.reduce((a,p)=>a+p.amount,0);
 return {payments,payouts,collected,released,balance:collected-released};
}
function paintReports(){
 const {payments,payouts,collected,released,balance}=reportStats();
 const months=Array.from({length:6},(_,i)=>{const d=new Date();d.setMonth(d.getMonth()+i-5);const ym=d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0");return {label:d.toLocaleDateString("en",{month:"short"}),v:payments.filter(p=>p.date.startsWith(ym)).reduce((a,p)=>a+p.amount,0)};});
 const max=Math.max(1,...months.map(m=>m.v));
 const byMember=[...state.db.members].map(m=>({m,v:payments.filter(p=>p.memberId===m.id).reduce((a,p)=>a+p.amount,0)})).filter(x=>x.v>0).sort((a,b)=>b.v-a.v).slice(0,8);
 return hero("Reports & Insights","Premium business intelligence for collections and payouts.",
 button("report-print",icon("print")+" Print / Save PDF","btn-light")+button("export-payments",icon("download")+" CSV Export","btn-primary"),"ANALYTICS")
 +'<div class="toolbar"><span class="small muted">REPORT FILTERS</span><select id="report-group"><option value="all">All Groups</option>'+state.db.groups.map(g=>'<option value="'+E(g.id)+'"'+(state.reportGroup===g.id?" selected":"")+'>'+E(g.name)+'</option>').join("")+'</select>'
 +'<select id="report-period"><option value="all">All Time</option><option value="today"'+(state.reportPeriod==="today"?" selected":"")+'>Today</option><option value="month"'+(state.reportPeriod==="month"?" selected":"")+'>This Month</option><option value="year"'+(state.reportPeriod==="year"?" selected":"")+'>This Year</option></select></div>'
 +'<div class="metric-grid">'+metric("wallet","Collections",php(collected),payments.length+" contributions")+
 metric("calendar","Payouts",php(released),payouts.length+" releases","purple")+
 metric("chart","Net Ledger Balance",php(balance),"Collections minus payouts","green")+
 metric("receipt","Transactions",payments.length+payouts.length,"For selected filters","red")+'</div>'
 +'<div class="grid-2"><section class="card"><div class="card-header"><h2>Monthly Collection Movement</h2><span class="hint">Based on selected transactions</span></div><div class="chart-wrap">'+months.map(x=>'<div class="chart-col"><div class="chart-bar" title="'+E(php(x.v))+'" style="height:'+Math.max(5,Math.round(x.v/max*100))+'%"></div><span class="chart-label">'+E(x.label)+'</span></div>').join("")+'</div><p class="chart-caption">Chart is computed from actual saved contribution records.</p></section>'
 +'<section class="card"><div class="card-header"><h2>Top Contributors</h2><span class="hint">By recorded hulog</span></div>'+(byMember.length?byMember.map(({m,v})=>'<div class="list-row"><div class="row-main">'+avatar(m)+'<strong>'+E(m.name)+'</strong></div><strong>'+php(v)+'</strong></div>').join(""):empty("users","No contributions yet","There is nothing to chart in this period."))+'</section></div>'
 +'<section class="card report-card"><div class="card-header"><h2>Export Center</h2><span class="hint">Business ledger reports</span></div><div class="actions">'+button("export-payments",icon("download")+" Contributions CSV","btn-light")+
 button("export-payouts",icon("download")+" Payouts CSV","btn-light")+
 button("export-members",icon("download")+" Members CSV","btn-light")+
 button("report-print",icon("print")+" Save as PDF","btn-light")+'</div><p class="small muted" style="margin:14px 0 0">CSV files open in Excel. Save as PDF uses your browser print sheet. Personal data may appear in exported files; store them privately.</p></section>';
}
function paintActivity(){
 const events=state.db.activity;
 return hero("Activity History","A transparent trail of changes to your local ledger.",button("export-json",icon("download")+" Full Backup","btn-light"),"ACTIVITY LOG")
 +'<section class="card"><div class="card-header"><h2>Recent Events</h2><span class="hint">'+events.length+' stored events</span></div>'+
 (events.length?'<div class="timeline">'+events.slice(0,80).map(a=>'<div class="timeline-entry"><strong>'+E(a.text)+'</strong><small>'+new Date(a.at).toLocaleString("en-PH")+'</small></div>').join("")+'</div>':empty("clock","No activity yet","Ledger events appear here."))+'</section>';
}
function paintSettings(){
 const db=state.db;
 return hero("Settings & Backup","Protect your records and personalize the app for your client.",button("export-json",icon("download")+" Download Backup","btn-primary"),"YOUR WORKSPACE")
 +'<div class="grid-2"><section class="card"><div class="card-header"><h2>Business Profile</h2><span class="hint">Editable identity</span></div>'
 +'<div class="setting-line"><div><strong>App / Business Name</strong><small>'+E(db.settings.businessName)+'</small></div>'+button("settings-edit","Edit","btn-light btn-sm")+'</div>'
 +'<div class="setting-line"><div><strong>Owner / Admin</strong><small>'+E(db.settings.ownerName)+'</small></div></div>'
 +'<div class="setting-line"><div><strong>Currency</strong><small>PHP · Philippine Peso</small></div></div>'
 +'<div class="setting-line"><div><strong>Storage mode</strong><small>Local browser storage, offline-capable after initial install</small></div>'+badge("Local only")+'</div>'
 +'<div class="setting-line"><div><strong>Cloud sync, Face ID & push notifications</strong><small>Not available until secure hosted or native iOS production</small></div>'+badge("Planned")+'</div>'
 +'</section><section class="card"><div class="card-header"><h2>Privacy & Data Backup</h2>'+icon("shield")+'</div><p class="small muted">Export your ledger regularly. Clearing Safari website data, changing device, or uninstalling the web app may permanently erase unsaved records.</p>'
 +'<div class="stack">'+button("export-json",icon("download")+" Download Full JSON Backup","btn-primary")+
 '<label class="btn btn-light" style="cursor:pointer">'+icon("download")+' Restore JSON Backup<input hidden id="import-file" type="file" accept=".json,application/json"></label>'+
 button("export-members",icon("download")+" Export Members CSV","btn-light")+
 button("clear-demo","Clear demo data / start fresh","btn-muted")+'</div><div class="warning-box">This is an Enterprise Elite LOCAL preview. PIN lock only, no secure backend login, encrypted cloud database or payment processing. Do not enter sensitive bank credentials or rely on this as your sole financial record.</div></section></div>'
 +'<section class="card"><div class="card-header"><h2>Production Checklist</h2><span class="hint">Premium iOS roadmap</span></div>'
 +['Professional native iOS build, code signing and TestFlight','Secure cloud sync with authenticated multi-user access','Face ID / Passcode with secure keychain storage','APNs push reminders and scheduled background services','Encrypted storage and recoverable cloud backup','Permission-based finance roles and audit retention','Receipt PDF generation with business-approved templates','Full device QA and App Store compliance review'].map(x=>'<div class="setting-line"><div class="record-kind">'+icon("clock")+'<strong>'+E(x)+'</strong></div>'+badge("Not live")+'</div>').join("")+'</section>';
}
function render(){
 const titles={dashboard:"CRISSALYN Paluwagan",groups:"Paluwagan Groups",members:"Member Directory",payments:"Contributions",payouts:"Payout Schedule",reports:"Reports & Analytics",activity:"Activity History",settings:"Settings & Backup"};
 $("page-heading").textContent=titles[state.page]||titles.dashboard;
 $("breadcrumb").textContent="WORKSPACE / "+(titles[state.page]||"DASHBOARD").toUpperCase();
 $("owner-label").textContent=state.db.settings.ownerName;
 $("demo-pill").textContent=state.db.isDemo?"SAMPLE DATA":"LOCAL WORKSPACE";
 $("demo-pill").classList.toggle("live",!state.db.isDemo);
 const alerts=dueAlerts();$("notif-bubble").textContent=alerts.length>99?"99+":String(alerts.length);
 let html="";
 try{switch(state.page){
  case "groups":html=paintGroups();break;case "members":html=paintMembers();break;
  case "payments":html=paintPayments();break;case "payouts":html=paintPayouts();break;
  case "reports":html=paintReports();break;case "activity":html=paintActivity();break;
  case "settings":html=paintSettings();break;default:html=paintDashboard();
 }}catch(err){console.error(err);html=empty("info","Cannot display this page","The record may need inspection. Export a backup from Settings.");}
 $("page-content").innerHTML=html;
 document.querySelectorAll("[data-page]").forEach(x=>x.classList.toggle("active",x.dataset.page===state.page));
}
function go(page){
 if(!["dashboard","groups","members","payments","payouts","reports","activity","settings"].includes(page))return;
 state.page=page;state.search="";state.filter="all";if(page!=="groups")state.selectedGroup=null;
 $("sidebar").classList.remove("open");render();window.scrollTo({top:0,behavior:"instant"});
}
function field(name,label,type="text",value="",opts=""){
 const content=type==="textarea"?'<textarea id="f-'+name+'" name="'+name+'" '+opts+'>'+E(value)+'</textarea>':
 '<input id="f-'+name+'" name="'+name+'" type="'+type+'" value="'+E(value)+'" '+opts+'>';
 return '<div class="field"><label for="f-'+name+'">'+E(label)+'</label>'+content+'</div>';
}
function select(name,label,options,current,opts=""){
 return '<div class="field"><label for="f-'+name+'">'+E(label)+'</label><select id="f-'+name+'" name="'+name+'" '+opts+'>'+options.map(x=>'<option value="'+E(x.value)+'"'+(String(x.value)===String(current)?" selected":"")+'>'+E(x.label)+'</option>').join("")+'</select></div>';
}
function modal(title,fields,handle,saveLabel="Save",eyebrow="ENTERPRISE ELITE"){
 state.modal=handle;$("modal-eyebrow").textContent=eyebrow;$("modal-title").textContent=title;$("modal-fields").innerHTML=fields;
 $("modal-submit").textContent=saveLabel;$("form-modal").showModal();
}
function closeModal(){state.modal=null;$("form-modal").close();}
function asForm(form){return Object.fromEntries(new FormData(form).entries());}
function editMember(existing){
 const m=existing||{name:"",phone:"",address:"",notes:"",photo:""};
 const fields='<div class="form-grid">'+field("name","Full Name *","text",m.name,'required maxlength="100"')+
 field("phone","Phone Number","tel",m.phone,'maxlength="35"')+
 field("address","Address / Location","text",m.address,'maxlength="170"')+
 '<div class="field"><label for="f-photo">Member Photo (optional, max 4 MB)</label><input class="file-field" id="f-photo" name="photo" type="file" accept="image/*"></div>'+
 '<div class="field full">'+field("notes","Notes","textarea",m.notes,'maxlength="400"')+'</div></div>';
 modal(existing?"Edit Member":"Add New Member",fields,async f=>{
  const v=asForm(f),name=String(v.name||"").trim();if(name.length<2)throw Error("Enter a member name.");
  let photo=m.photo||"";
  const file=$("f-photo").files[0];
  if(file){
   if(file.size>4*1024*1024||!file.type.startsWith("image/"))throw Error("Choose an image under 4 MB.");
   photo=await reducePhoto(file);
  }
  const ok=editData(db=>{if(existing){const target=db.members.find(x=>x.id===existing.id);if(!target)throw Error("Member not found");Object.assign(target,{name,phone:String(v.phone||"").trim(),address:String(v.address||"").trim(),notes:String(v.notes||"").trim(),photo});}
   else db.members.push({id:id(),name,phone:String(v.phone||"").trim(),address:String(v.address||"").trim(),notes:String(v.notes||"").trim(),photo,joinedAt:today()});},(existing?"Updated member ":"Added member ")+name);
  return ok;
 },existing?"Save Changes":"Add Member","MEMBER DIRECTORY");
}
function reducePhoto(file){
 return new Promise((resolve,reject)=>{
  const image=new Image(),url=URL.createObjectURL(file);
  image.onload=()=>{try{const c=document.createElement("canvas"),n=160;c.width=n;c.height=n;const ctx=c.getContext("2d"),size=Math.min(image.width,image.height),sx=(image.width-size)/2,sy=(image.height-size)/2;ctx.drawImage(image,sx,sy,size,size,0,0,n,n);const data=c.toDataURL("image/jpeg",.69);URL.revokeObjectURL(url);resolve(data);}catch(err){URL.revokeObjectURL(url);reject(err);}};
  image.onerror=()=>{URL.revokeObjectURL(url);reject(Error("Could not read image."));};image.src=url;
 });
}
function removeMember(m){
 if(state.db.groups.some(g=>g.memberIds.includes(m.id))||state.db.payments.some(p=>p.memberId===m.id)||state.db.payouts.some(p=>p.memberId===m.id)){notify("Member belongs to a group or transaction history. Keep records intact; edit details instead.");return;}
 if(!confirm("Remove "+m.name+" from this device?"))return;
 if(editData(db=>{db.members=db.members.filter(x=>x.id!==m.id);},"Removed unused member "+m.name))notify("Unused member removed.");
}
function editGroup(existing){
 const g=existing||{name:"",amount:"",frequency:"monthly",startDate:today(),lateFee:0,notes:"",status:"active",memberIds:[]};
 const transactions=existing&&(state.db.payments.some(p=>p.groupId===existing.id)||state.db.payouts.some(p=>p.groupId===existing.id));
 const rosters=existing?'<div class="field full"><label>Group Roster</label><div class="summary-strip">Roster '+g.memberIds.length+' members. Group membership stays fixed after creation to protect historical cycles.</div></div>':
 '<div class="field full"><label>Select Group Members * (minimum 2)</label><div class="checkgrid">'+state.db.members.map(m=>'<label class="checkitem"><input name="memberIds" type="checkbox" value="'+E(m.id)+'">'+E(m.name)+'</label>').join("")+'</div><span class="field-help">Payout order is assigned in the selected order. You can change it from Group Details before releasing a payout.</span></div>';
 const fields='<div class="form-grid">'+field("name","Group / Circle Name *","text",g.name,'required maxlength="110"')+
 field("amount","Contribution per member (PHP) *","number",g.amount,'required min="1" step=".01" '+(transactions?"disabled":""))+
 select("frequency","Contribution Cycle",Object.entries(FREQ).map(([value,label])=>({value,label})),g.frequency,transactions?"disabled":"")+
 field("startDate","Start / First Due Date *","date",g.startDate,'required '+(transactions?"disabled":""))+
 field("lateFee","Optional suggested late fee (PHP)","number",g.lateFee||0,'min="0" step=".01"')+
 select("status","Group Status",[{"value":"active","label":"Active"},{"value":"archived","label":"Archived"}],g.status)+
 rosters+'<div class="field full">'+field("notes","Notes / Agreement","textarea",g.notes,'maxlength="400"')+'</div></div>'+
 (transactions?'<div class="warning-box">Amount, start date and frequency are locked after transactions begin to avoid changing historical obligations.</div>':"");
 modal(existing?"Edit Savings Circle":"Create Savings Circle",fields,f=>{
  const data=asForm(f),name=String(data.name||"").trim();
  if(name.length<2)throw Error("Enter a valid group name");
  const amt=Math.round(Number(data.amount)*100)/100,fee=Math.round(Number(data.lateFee||0)*100)/100;
  if(!Number.isFinite(fee)||fee<0||fee>1e7)throw Error("Invalid late fee.");
  if(!existing&&(!Number.isFinite(amt)||amt<=0||amt>1e9||!dateValid(data.startDate)||!FREQ[data.frequency]))throw Error("Check the contribution amount, date and cycle.");
  const ids=existing?g.memberIds:Array.from(f.querySelectorAll('input[name="memberIds"]:checked')).map(x=>x.value);
  if(ids.length<2||new Set(ids).size!==ids.length||ids.some(mid=>!member(mid)))throw Error("Choose at least two different registered members.");
  const ok=editData(db=>{
   if(existing){const target=group(existing.id);target.name=name;target.lateFee=fee;target.notes=String(data.notes||"").trim();target.status=data.status==="archived"?"archived":"active";
    if(!transactions){target.amount=amt;target.frequency=data.frequency;target.startDate=data.startDate;}
   }else{
    const next={id:id(),name,amount:amt,frequency:data.frequency,startDate:data.startDate,memberIds:ids,payoutOrder:[...ids],lateFee:fee,status:"active",createdAt:new Date().toISOString(),notes:String(data.notes||"").trim()};
    db.groups.push(next);state.selectedGroup=next.id;
   }
  },(existing?"Updated group ":"Created group ")+name);
  return ok;
 },existing?"Save Group":"Create Group","PALUWAGAN CIRCLE");
}
function editPayoutOrder(g){
 if(g.payoutOrder.some((_,i)=>payoutFor(g.id,i))){notify("Payout order is locked after any payout has been released. This protects recipients' existing records.");return;}
 const options=g.memberIds.map(mid=>({value:mid,label:member(mid)?.name||"Member"}));
 const fields='<div class="warning-box">Choose a different member for every cycle. This does not change contribution amounts or payment history.</div><div class="stack">'+g.payoutOrder.map((mid,i)=>select("slot_"+i,"Payout Cycle "+(i+1)+" · "+fmt(cycleDate(g,i)),options,mid)).join("")+'</div>';
 modal("Adjust Payout Order",fields,f=>{
  const v=asForm(f),newOrder=g.payoutOrder.map((_,i)=>v["slot_"+i]);
  if(new Set(newOrder).size!==g.payoutOrder.length||newOrder.some(x=>!g.memberIds.includes(x)))throw Error("Every member must appear exactly once in the payout order.");
  return editData(db=>{group(g.id).payoutOrder=newOrder;},"Rearranged payout order for "+g.name);
 },"Save Rotation","PAYOUT ORDER");
}
function paymentModal(groupId){
 if(!state.db.groups.length){notify("Create a group before recording contributions.");go("groups");return;}
 const groups=state.db.groups.filter(g=>g.status!=="archived");
 if(!groups.length){notify("No active groups can receive contributions.");return;}
 let current=groups.find(g=>g.id===groupId)||groups[0];
 const fields='<div class="form-grid">'+select("groupId","Paluwagan Group *",groups.map(g=>({value:g.id,label:g.name})),current.id)+
 '<div class="field" id="payment-member-field"></div><div class="field" id="payment-cycle-field"></div>'+
 field("amount","Amount Received (PHP) *","number",current.amount,'min=".01" step=".01" required')+
 field("date","Payment Date *","date",today(),'required')+
 select("method","Payment Method",[ "Cash","GCash","Maya","Bank Transfer","Other"].map(v=>({value:v,label:v})),"Cash")+
 field("reference","External Reference / Receipt No.","text","",'maxlength="90"')+
 '<div class="field full">'+field("notes","Notes","textarea","",'maxlength="250"')+'</div></div><div class="summary-strip" id="payment-remaining"></div>';
 modal("Record Contribution",fields,f=>{
  const v=asForm(f),g=group(v.groupId);
  if(!g||g.status==="archived"||!g.memberIds.includes(v.memberId))throw Error("Choose a valid active group and member.");
  const cycle=Number(v.cycle),amount=Math.round(Number(v.amount)*100)/100;
  if(!Number.isInteger(cycle)||cycle<0||cycle>=g.payoutOrder.length||!Number.isFinite(amount)||amount<.01||!dateValid(v.date))throw Error("Check the cycle, amount and payment date.");
  const remaining=Math.round((g.amount-paidFor(g.id,v.memberId,cycle))*100)/100;
  if(amount>remaining+.001)throw Error("Payment exceeds the remaining contribution for this cycle ("+php(remaining)+"). For advance payments, choose the next cycle.");
  const ok=editData(db=>db.payments.push({id:id(),groupId:g.id,memberId:v.memberId,cycle,amount,date:v.date,method:v.method,reference:String(v.reference||"").trim(),notes:String(v.notes||"").trim(),voided:false,createdAt:new Date().toISOString()}),"Recorded "+php(amount)+" contribution from "+member(v.memberId).name+" in "+g.name);
  if(ok)notify("Contribution saved locally. No external payment was verified.");
  return ok;
 },"Save Hulog","PAYMENT TRACKING");
 const gsel=$("f-groupId"),memberNode=$("payment-member-field"),cycleNode=$("payment-cycle-field");
 function updateOptions(){
  const g=group(gsel.value);if(!g)return;
  memberNode.innerHTML=select("memberId","Member *",g.memberIds.map(mid=>({value:mid,label:member(mid)?.name||"Member"})),g.memberIds[0]).replace(/^<div class="field">/,"").replace(/<\/div>$/,"");
  cycleNode.innerHTML=select("cycle","Contribution Cycle *",g.payoutOrder.map((_,i)=>({value:i,label:"Cycle "+(i+1)+" • "+fmt(cycleDate(g,i))})),0).replace(/^<div class="field">/,"").replace(/<\/div>$/,"");
  $("f-amount").value=g.amount;
  $("f-memberId").addEventListener("change",updateRemaining);
  $("f-cycle").addEventListener("change",updateRemaining);
  updateRemaining();
 }
 function updateRemaining(){const g=group(gsel.value);if(!g)return;const left=Math.max(0,Math.round((g.amount-paidFor(g.id,$("f-memberId").value,Number($("f-cycle").value)))*100)/100);$("payment-remaining").textContent="Remaining for selected cycle: "+php(left)+". Partial payments supported; do not exceed this amount.";$("f-amount").max=String(left);if(Number($("f-amount").value)>left)$("f-amount").value=left;}
 gsel.addEventListener("change",updateOptions);updateOptions();
}
function voidPayment(p){
 if(!confirm("Void this contribution of "+php(p.amount)+"? It will be excluded from totals but retained in the audit history."))return;
 if(editData(db=>{const t=db.payments.find(x=>x.id===p.id);if(t)t.voided=true;},"Voided contribution "+p.id.slice(0,8)+" for "+member(p.memberId)?.name))notify("Contribution voided. Payout and reports recalculated.");
}
function payoutModal(gid,cycle){
 const g=group(gid);if(!g||!g.payoutOrder[cycle])return notify("Payout cycle unavailable.");
 const info=computeCycle(g,cycle);
 if(info.payout)return notify("This cycle's payout has already been recorded.");
 const fields='<div class="summary-strip"><strong>Recipient:</strong> '+E(member(info.target)?.name)+'<br><strong>Group:</strong> '+E(g.name)+'<br><strong>Due:</strong> '+fmt(info.due)+'<br><strong>Expected pot:</strong> '+php(info.dueSum)+'<br><strong>Cycle collected:</strong> '+php(info.received)+'<br><strong>Available ledger balance:</strong> '+php(amountAvailable(g.id))+'</div>'
 +'<div class="form-grid">'+field("amount","Actual Payout Amount (PHP) *","number",info.dueSum,'min=".01" step=".01" required')+
 field("date","Date Released *","date",today(),'required')+
 select("method","Release Method",["Cash","GCash","Maya","Bank Transfer","Other"].map(x=>({value:x,label:x})),"Cash")+
 field("reference","Payout Confirmation Reference","text","",'maxlength="90"')+
 '<div class="field full">'+field("notes","Notes / Shortfall Explanation","textarea","",'maxlength="300"')+'</div></div>'
 +'<div class="warning-box">This is only a ledger entry. Check the recipient and actual transfer outside the app. The app does not move money.</div>';
 modal("Release Payout • Cycle "+(cycle+1),fields,f=>{
  const v=asForm(f),amount=Math.round(Number(v.amount)*100)/100;
  if(!Number.isFinite(amount)||amount<.01||amount>1e9||!dateValid(v.date))throw Error("Invalid amount or date");
  if(amount>amountAvailable(g.id)+.001&&!confirm("Amount exceeds this group's recorded available funds by "+php(amount-amountAvailable(g.id))+". Record the payout anyway?"))return false;
  if(!confirm("Confirm you actually released "+php(amount)+" to "+member(info.target)?.name+"? This action does NOT transfer funds."))return false;
  const ok=editData(db=>db.payouts.push({id:id(),groupId:gid,memberId:info.target,cycle,amount,date:v.date,method:v.method,reference:String(v.reference||"").trim(),notes:String(v.notes||"").trim(),voided:false,createdAt:new Date().toISOString()}),"Recorded payout "+php(amount)+" to "+member(info.target)?.name+" from "+g.name);
  if(ok)notify("Payout recorded. No money was moved by the app.");
  return ok;
 },"Record Released Payout","PAYOUT MANAGEMENT");
}
function receipt(kind,item){
 const g=group(item.groupId),m=member(item.memberId),isPayment=kind==="payment",title=isPayment?"Contribution Receipt":"Payout Release Receipt";
 const rows=[
 ["Receipt ID",item.id.slice(0,12).toUpperCase()],["Group",g?.name||"—"],[isPayment?"Payer":"Recipient",m?.name||"—"],
 ["Cycle","Round "+(item.cycle+1)],["Transaction Date",fmt(item.date)],["Method",item.method],["Reference",item.reference||"Not recorded"],["Amount",php(item.amount)]
 ];
 const html='<div class="detail-head"><div class="avatar">'+icon("receipt")+'</div><div><strong>'+E(title)+'</strong><p>PALUWAGAN · '+E(state.db.settings.businessName)+'</p></div></div>'+
 rows.map(([a,b])=>'<div class="metric-row"><span>'+E(a)+'</span><strong>'+E(b)+'</strong></div>').join("")+
 '<div class="warning-box">Manually recorded ledger receipt. This is not proof of GCash/Maya/bank settlement. Verify the actual transaction independently.</div>'+
 '<div class="actions">'+button("receipt-print",icon("print")+" Print / Save PDF","btn-light")+'</div>';
 modal(title,html,()=>true,"Close Receipt","RECEIPT PREVIEW");
 const print=document.querySelector('[data-action="receipt-print"]');print?.addEventListener("click",()=>printReceipt(title,rows));
}
function printReceipt(title,rows){
 const html='<!doctype html><html><head><meta charset="utf-8"><title>'+E(title)+'</title><style>body{font:14px Arial,sans-serif;max-width:440px;margin:35px auto;color:#322721}header{border-bottom:3px solid #f58322;padding-bottom:16px;margin-bottom:16px}h1{font-size:24px;color:#ed7c0f}table{width:100%;border-collapse:collapse}td{padding:10px 0;border-bottom:1px solid #eee}td:last-child{text-align:right;font-weight:bold}.note{margin-top:26px;font-size:11px;color:#777;line-height:1.5}</style></head><body><header><h1>CRISSALYN</h1><strong>'+E(state.db.settings.businessName)+'</strong><p>'+E(title)+'</p></header><table>'+rows.map(([a,b])=>'<tr><td>'+E(a)+'</td><td>'+E(b)+'</td></tr>').join("")+'</table><div class="note">Recorded in an offline local ledger. Not independent proof of payment or bank settlement.</div><script>window.addEventListener("load",()=>window.print())<\/script></body></html>';
 const w=window.open("","_blank");if(!w){notify("Allow popups to print the receipt on this device.");return;}
 w.document.open();w.document.write(html);w.document.close();
}
function settingsModal(){
 const cfg=state.db.settings;
 modal("Customize Workspace",'<div class="form-grid">'+field("businessName","Business / App Name","text",cfg.businessName,'required maxlength="70"')+
 field("ownerName","Owner Display Name","text",cfg.ownerName,'required maxlength="70"')+'</div>',f=>{
 const v=asForm(f);if(!String(v.businessName||"").trim()||!String(v.ownerName||"").trim())throw Error("Enter both names.");
 return editData(db=>{db.settings.businessName=String(v.businessName).trim();db.settings.ownerName=String(v.ownerName).trim();},"Updated business profile");
 },"Save Profile","SETTINGS");
}
function alertModal(){
 const list=dueAlerts().slice(0,30);
 modal("Due & Payout Reminders",list.length?'<div class="notice-list">'+list.map(a=>'<div class="notice-row '+(a.type==="overdue"?"danger":"")+'">'+icon(a.type==="overdue"?"clock":"bell")+'<div><strong>'+E(a.title)+'</strong><small>'+E(a.detail)+'</small></div></div>').join("")+'</div>':empty("bell","All caught up","No payouts or contributions due soon."),()=>true,"Close","IN-APP REMINDERS");
}
function csvCell(v){
 let x=String(v??"");if(/^\s*[=+\-@\t\r]/.test(x))x="'"+x;
 return '"'+x.replace(/"/g,'""')+'"';
}
function download(name,body,type){
 const blob=new Blob([body],{type}),url=URL.createObjectURL(blob);
 const a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3500);
 notify("Export created. Save it securely.");
}
function exportJSON(){download("CRISSALYN_ENTERPRISE_ELITE_FULL_BACKUP_"+today()+".json",JSON.stringify({format:"CRISSALYN_ENTERPRISE_ELITE_V1",exportedAt:new Date().toISOString(),data:state.db},null,2),"application/json;charset=utf-8");}
function exportCSV(kind){
 let header=[],rows=[];
 if(kind==="payments"){header=["ID","Date","Group","Member","Cycle","Amount PHP","Method","Reference","Notes","Voided"];rows=state.db.payments.map(p=>[p.id,p.date,group(p.groupId)?.name||"",member(p.memberId)?.name||"",p.cycle+1,p.amount,p.method,p.reference,p.notes,p.voided?"Yes":"No"]);}
 if(kind==="payouts"){header=["ID","Date","Group","Recipient","Cycle","Amount PHP","Method","Reference","Notes","Voided"];rows=state.db.payouts.map(p=>[p.id,p.date,group(p.groupId)?.name||"",member(p.memberId)?.name||"",p.cycle+1,p.amount,p.method,p.reference,p.notes,p.voided?"Yes":"No"]);}
 if(kind==="members"){header=["ID","Name","Phone","Address","Notes","Joined"];rows=state.db.members.map(m=>[m.id,m.name,m.phone,m.address,m.notes,m.joinedAt]);}
 download("CRISSALYN_ENTERPRISE_"+kind.toUpperCase()+"_"+today()+".csv","\ufeff"+[header.map(csvCell).join(","),...rows.map(a=>a.map(csvCell).join(","))].join("\r\n"),"text/csv;charset=utf-8");
}
function convertLegacyPinkBackup(src){
 if(!src||!src.settings||!Array.isArray(src.members)||!Array.isArray(src.deposits)||!Array.isArray(src.payouts))throw Error("Unsupported legacy backup.");
 if(src.members.length<2)throw Error("Legacy backup must have at least two members. Export and keep a separate copy for manual migration.");
 const freq=FREQ[src.settings.frequency]?src.settings.frequency:"monthly";
 const amount=Number(src.settings.contribution);
 if(!Number.isFinite(amount)||amount<=0)throw Error("Legacy contribution amount is missing. Set contribution in the original app and export a new backup.");
 const startDate=dateValid(src.settings.startDate)?src.settings.startDate:today();
 const mids=new Set();
 const members=src.members.map((m,i)=>{
  if(!m||!m.name||String(m.name).trim().length<2)throw Error("Invalid legacy member #"+(i+1));
  const mid=String(m.id||id());if(mids.has(mid))throw Error("Duplicate legacy member ID");mids.add(mid);
  return {id:mid,name:String(m.name),phone:String(m.phone||""),address:"",notes:String(m.note||""),photo:"",joinedAt:startDate};
 });
 const groupId=id(),ids=members.map(m=>m.id);
 const g={id:groupId,name:String(src.settings.name||"Legacy Pink Circle")+" (Imported)",amount,frequency:freq,startDate,memberIds:ids,payoutOrder:[...ids],lateFee:0,status:"active",createdAt:new Date().toISOString(),notes:"Imported from older pink Paluwagan app. Verify contribution cycles and payout details before use."};
 function cycleFor(d){let round=0;for(let i=0;i<ids.length;i++){if(cycleDate(g,i)<=d)round=i;}return round;}
 const payments=src.deposits.map((r,i)=>{
  if(!r||!mids.has(String(r.memberId))||!dateValid(r.date)||!(Number(r.amount)>0))throw Error("Invalid legacy deposit #"+(i+1));
  return {id:id(),groupId,memberId:String(r.memberId),cycle:cycleFor(r.date),amount:Number(r.amount),date:r.date,method:"Other",reference:"LEGACY-"+(i+1),notes:String(r.note||"")+" [Legacy imported; verify cycle]",voided:false,createdAt:new Date().toISOString()};
 });
 const payouts=src.payouts.map((r,i)=>{
  if(!r||!mids.has(String(r.memberId))||!dateValid(r.date)||!(Number(r.amount)>0))throw Error("Invalid legacy payout #"+(i+1));
  return {id:id(),groupId,memberId:String(r.memberId),cycle:ids.indexOf(String(r.memberId)),amount:Number(r.amount),date:r.date,method:"Other",reference:"LEGACY-PAYOUT-"+(i+1),notes:String(r.note||"")+" [Legacy imported; verify]",voided:false,createdAt:new Date().toISOString()};
 });
 return {format:"CRISSALYN_ENTERPRISE_ELITE_V1",data:{version:VERSION,settings:{businessName:"CRISSALYN PALUWAGAN",ownerName:"Crissalyn",currency:"PHP"},members,groups:[g],payments,payouts,activity:[{id:id(),at:new Date().toISOString(),text:"Legacy pink Paluwagan JSON imported; cycles require manual review"}],isDemo:false,createdAt:new Date().toISOString()}};
}
async function importBackup(file){
 if(!file)return;
 if(file.size>8*1024*1024){notify("Backup exceeds 8 MB. Use a smaller verified file.");return;}
 try{
  let doc=JSON.parse(await file.text());
  const legacy=!doc.format&&Array.isArray(doc.members)&&Array.isArray(doc.deposits)&&Array.isArray(doc.payouts);
  if(legacy){
   if(!confirm("Old pink Paluwagan backup detected. We will import contributions and payouts but ESTIMATE their group cycles from recorded dates. You MUST review every converted transaction. Continue?"))return;
   doc=convertLegacyPinkBackup(doc);
  }
  if(doc.format!=="CRISSALYN_ENTERPRISE_ELITE_V1"||!validDb(doc.data))throw Error("Not a supported CRISSALYN backup.");
  for(const m of doc.data.members)if(!m||typeof m.id!=="string"||typeof m.name!=="string")throw Error("Invalid member data.");
  const mids=new Set(doc.data.members.map(m=>m.id));
  if(mids.size!==doc.data.members.length)throw Error("Duplicate member IDs");
  const gids=new Set(doc.data.groups.map(g=>g.id));
  if(gids.size!==doc.data.groups.length)throw Error("Duplicate group IDs");
  for(const g of doc.data.groups)if(!g||!Array.isArray(g.memberIds)||!Array.isArray(g.payoutOrder)||g.memberIds.length!==g.payoutOrder.length||new Set(g.payoutOrder).size!==g.memberIds.length||g.memberIds.some(mid=>!mids.has(mid))||g.payoutOrder.some(mid=>!g.memberIds.includes(mid))||!FREQ[g.frequency]||!dateValid(g.startDate)||!Number.isFinite(g.amount)||g.amount<=0)throw Error("Invalid group or payout order.");
  for(const p of [...doc.data.payments,...doc.data.payouts])if(!p||!gids.has(p.groupId)||!mids.has(p.memberId)||!Number.isFinite(p.amount)||p.amount<=0||!dateValid(p.date)||!Number.isInteger(p.cycle)||p.cycle<0||p.cycle>=stateMaxCycles(doc.data.groups,p.groupId))throw Error("Invalid payment or payout record.");
  if(!confirm("Replace ALL current local paluwagan records with this backup? Download a backup of current records first."))return;
  const old=state.db;state.db=doc.data;
  if(!save()){state.db=old;return;}
  state.selectedGroup=null;go("dashboard");notify("Backup restored successfully.");
 }catch(err){notify("Restore failed: "+err.message);}
 finally{const input=$("import-file");if(input)input.value="";}
}
function stateMaxCycles(groups,gid){return groups.find(g=>g.id===gid)?.payoutOrder.length||0;}
function clearDemo(){
 if(!confirm("Start a completely fresh workspace? This DELETES all current local members, groups, payments and payouts. Export a backup first."))return;
 if(!confirm("FINAL CONFIRMATION: delete all local paluwagan records on this browser?"))return;
 const cfg={...state.db.settings};
 const blank={version:VERSION,settings:cfg,members:[],groups:[],payments:[],payouts:[],activity:[],isDemo:false,createdAt:new Date().toISOString()};
 const previous=state.db;state.db=blank;
 if(!save()){state.db=previous;return;}
 state.selectedGroup=null;go("dashboard");notify("Fresh workspace created. Local data cleared.");
}
const actions={
 "member-new":()=>editMember(),
 "member-edit":btn=>{const m=member(btn.dataset.id);if(m)editMember(m);},
 "member-delete":btn=>{const m=member(btn.dataset.id);if(m)removeMember(m);},
 "group-new":()=>{if(state.db.members.length<2){notify("Register at least two members first.");go("members");return;}editGroup();},
 "group-open":btn=>{state.selectedGroup=btn.dataset.id;go("groups");state.selectedGroup=btn.dataset.id;render();},
 "groups-back":()=>{state.selectedGroup=null;render();},
 "group-edit":btn=>{const g=group(btn.dataset.id);if(g)editGroup(g);},
 "payout-order":btn=>{const g=group(btn.dataset.id);if(g)editPayoutOrder(g);},
 "payment-new":btn=>paymentModal(btn.dataset.group),
 "payment-void":btn=>{const p=state.db.payments.find(x=>x.id===btn.dataset.id&&!x.voided);if(p)voidPayment(p);},
 "payment-receipt":btn=>{const p=state.db.payments.find(x=>x.id===btn.dataset.id);if(p)receipt("payment",p);},
 "payout-release":btn=>payoutModal(btn.dataset.group,Number(btn.dataset.cycle)),
 "payout-receipt":btn=>{const p=state.db.payouts.find(x=>x.id===btn.dataset.id);if(p)receipt("payout",p);},
 "report-print":()=>window.print(),
 "export-json":exportJSON,
 "export-payments":()=>exportCSV("payments"),
 "export-payouts":()=>exportCSV("payouts"),
 "export-members":()=>exportCSV("members"),
 "settings-edit":settingsModal,
 "clear-demo":clearDemo
};
function clickHandler(e){
 const nav=e.target.closest("[data-page]");
 if(nav){go(nav.dataset.page);return;}
 const act=e.target.closest("[data-action]");
 if(act&&actions[act.dataset.action])actions[act.dataset.action](act);
}
function searchHandler(e){
 if(e.target.id!=="search-field")return;
 const pos=e.target.selectionStart??e.target.value.length;
 state.search=e.target.value;render();
 const input=$("search-field");if(input){input.focus();try{input.setSelectionRange(pos,pos);}catch(err){}}
}
function changeHandler(e){
 if(e.target.id==="filter-field"){state.filter=e.target.value;render();}
 if(e.target.id==="report-group"){state.reportGroup=e.target.value;render();}
 if(e.target.id==="report-period"){state.reportPeriod=e.target.value;render();}
 if(e.target.id==="import-file"){importBackup(e.target.files?.[0]);}
}
async function modalSubmit(e){
 e.preventDefault();if(!state.modal)return;
 const btn=$("modal-submit");btn.disabled=true;
 try{const ok=await state.modal(e.target);if(ok!==false){closeModal();}}
 catch(err){notify(err.message||"Please check the form values.");}
 finally{btn.disabled=false;}
}
function init(){
 load();
 document.addEventListener("click",clickHandler);
 $("page-content").addEventListener("input",searchHandler);
 $("page-content").addEventListener("change",changeHandler);
 $("form-modal").addEventListener("submit",modalSubmit);
 $("modal-close").addEventListener("click",closeModal);
 $("modal-cancel").addEventListener("click",closeModal);
 $("menu-toggle").addEventListener("click",()=>$("sidebar").classList.toggle("open"));
 $("alerts-button").addEventListener("click",alertModal);
 $("form-modal").addEventListener("close",()=>{state.modal=null;});
 render();
 if("serviceWorker"in navigator&&location.protocol.startsWith("http")){
  navigator.serviceWorker.register("./sw.js").catch(err=>console.warn("Service worker unavailable:",err));
 }
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
