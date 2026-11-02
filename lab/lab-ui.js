/* Presentation enhancements; functional Python/vision/serial engine remains in lab.js. */
(()=>{
const $=id=>document.getElementById(id);
const status=$("status"),chip=$("runtime-chip"),label=$("runtime-label"),placeholder=$("video-placeholder"),badge=$("video-badge"),code=$("code"),consoleBox=$("console");
if(!status||!chip||!placeholder||!code)return;
const describe=()=>{
  const text=(status.textContent||"").toLowerCase();
  const error=/error|failed|unavailable|blocked/.test(text);
  const active=/live python processing/.test(text);
  const ready=/python ready|camera on|camera active|snapshot|live python processing|program finished|ai detection ready/.test(text);
  chip.classList.toggle("error",error);
  chip.classList.toggle("live",ready||active);
  label.textContent=error?"Runtime needs attention":active?"Vision processing":ready?"Python ready":"Starting runtime…";
};
new MutationObserver(describe).observe(status,{childList:true,subtree:true,characterData:true});describe();
function syncCamera(){
  const on=$("camera")?.textContent?.trim()==="Stop webcam";
  placeholder.classList.toggle("is-hidden",Boolean(on));
  badge.hidden=!on;
}
const camera=$("camera");
if(camera){new MutationObserver(syncCamera).observe(camera,{childList:true,subtree:true,characterData:true});syncCamera();}
const compare=$("compare"),videoGrid=$("video-grid");
if(compare&&videoGrid)compare.addEventListener("change",()=>videoGrid.classList.toggle("compare-on",compare.checked));
$("clear-console")?.addEventListener("click",()=>{consoleBox.textContent="";});
code.addEventListener("keydown",e=>{
  if(e.key==="Tab"){
    e.preventDefault();
    const before=code.selectionStart,after=code.selectionEnd;
    code.setRangeText("    ",before,after,"end");
    code.dispatchEvent(new Event("input",{bubbles:true}));
  }
  if(e.key==="Enter"&&(e.ctrlKey||e.metaKey)){
    e.preventDefault();
    $("run")?.click();
  }
});
const previousInput=code.value;
function updateSaved(){
  $("save-indicator").textContent="Autosaved in this browser";
}
code.addEventListener("input",updateSaved);
if(previousInput)updateSaved();
})();
