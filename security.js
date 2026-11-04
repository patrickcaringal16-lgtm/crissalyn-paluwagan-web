"use strict";
/* Local browser PIN gate. NOT server auth or encryption of client records. */
(() => {
const KEY="crissalyn_elite_pin_config_v1";
const $=id=>document.getElementById(id);
let config=null,failures=0,blockedUntil=0,unlocked=false;
const enc=new TextEncoder();
const bytesToHex=buffer=>Array.from(new Uint8Array(buffer),x=>x.toString(16).padStart(2,"0")).join("");
const toBytes=hex=>new Uint8Array(hex.match(/.{1,2}/g).map(x=>parseInt(x,16)));
async function makeVerifier(pin,saltHex){
 const password=await crypto.subtle.importKey("raw",enc.encode(pin),"PBKDF2",false,["deriveBits"]);
 const bits=await crypto.subtle.deriveBits({name:"PBKDF2",salt:toBytes(saltHex),iterations:210000,hash:"SHA-256"},password,256);
 return bytesToHex(bits);
}
function equalHex(a,b){if(!a||!b||a.length!==b.length)return false;let x=0;for(let i=0;i<a.length;i++)x|=a.charCodeAt(i)^b.charCodeAt(i);return x===0;}
function showError(msg){$("elite-access-error").textContent=msg;}
function renderMode(){
 const setup=!config;
 $("elite-access-title").textContent=setup?"Create your private access PIN":"Welcome back, Crissalyn";
 $("elite-access-sub").textContent=setup?"First launch. Set a 6–12 digit PIN for this browser.":"Enter the admin PIN to open the local collection workspace.";
 $("elite-confirm-wrap").hidden=!setup;
 $("elite-access-submit").textContent=setup?"Set PIN and Open":"Unlock Workspace";
 $("elite-access-pin").value="";$("elite-access-confirm").value="";
 showError("");
}
function showLock(){
 unlocked=false;document.documentElement.classList.add("elite-locked");
 $("elite-access").hidden=false;renderMode();
 $("elite-access-pin").focus();
}
function unlock(){
 unlocked=true;document.documentElement.classList.remove("elite-locked");
 $("elite-access").hidden=true;$("elite-access-pin").value="";$("elite-access-confirm").value="";
}
async function onSubmit(ev){
 ev.preventDefault();
 const pin=$("elite-access-pin").value,confirm=$("elite-access-confirm").value;
 const submit=$("elite-access-submit");
 if(!/^[0-9]{6,12}$/.test(pin))return showError("Use 6 to 12 digits, numbers only.");
 if(!config&&pin!==confirm)return showError("The confirmation PIN does not match.");
 if(Date.now()<blockedUntil)return showError("Too many attempts. Retry in "+Math.ceil((blockedUntil-Date.now())/1000)+" seconds.");
 submit.disabled=true;
 try{
  if(!crypto?.subtle||!crypto.getRandomValues)throw Error("Secure browser crypto is unavailable. Open on localhost or HTTPS.");
  if(!config){
   const salt=bytesToHex(crypto.getRandomValues(new Uint8Array(24)));
   const verifier=await makeVerifier(pin,salt);
   const next={version:1,salt,verifier};
   localStorage.setItem(KEY,JSON.stringify(next));
   config=next;unlock();
  }else{
   const test=await makeVerifier(pin,config.salt);
   if(!equalHex(test,config.verifier)){
    failures++;if(failures>=5){blockedUntil=Date.now()+30000;failures=0;}
    showError("Wrong PIN. Please try again.");$("elite-access-pin").select();return;
   }
   failures=0;unlock();
  }
 }catch(err){showError("PIN setup/unlock failed: "+(err?.message||"Storage unavailable"));}
 finally{submit.disabled=false;}
}
function init(){
 try{
  const raw=localStorage.getItem(KEY);if(raw){
   const item=JSON.parse(raw);
   if(item&&item.version===1&&typeof item.salt==="string"&&typeof item.verifier==="string")config=item;
  }
 }catch(err){console.warn("PIN config could not be read",err);}
 const section=document.createElement("section");section.id="elite-access";section.className="elite-access";
 section.setAttribute("aria-label","CRISSALYN local screen lock");
 section.innerHTML='<div class="elite-access-card"><div class="elite-access-logo">✦</div><p class="elite-access-eyebrow">CRISSALYN • ENTERPRISE ELITE</p><h1 id="elite-access-title"></h1><p id="elite-access-sub" class="elite-access-sub"></p><form id="elite-access-form"><label for="elite-access-pin">Admin PIN</label><input id="elite-access-pin" type="password" inputmode="numeric" pattern="[0-9]{6,12}" maxlength="12" minlength="6" autocomplete="off" required placeholder="6 to 12 digits"><div id="elite-confirm-wrap"><label for="elite-access-confirm">Confirm PIN</label><input id="elite-access-confirm" type="password" inputmode="numeric" pattern="[0-9]{6,12}" maxlength="12" minlength="6" autocomplete="off" placeholder="Repeat PIN"></div><p id="elite-access-error" role="alert" class="elite-access-error"></p><button id="elite-access-submit" type="submit">Open</button></form><p class="elite-access-warning">Local PIN screen lock only. This is not encrypted storage or a secure cloud account. Do not store sensitive bank information.</p></div>';
 document.body.appendChild(section);
 $("elite-access-form").addEventListener("submit",onSubmit);
 $("elite-lock-top")?.addEventListener("click",showLock);
 window.CrissalynLocalLock={lock:showLock,isUnlocked:()=>unlocked};
 showLock();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
