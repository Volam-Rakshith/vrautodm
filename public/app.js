const $ = (id) => document.getElementById(id);
const KEY = "vr-auto-dm-settings-v1";
let active = false;
function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || "{}");
    if (typeof s.enabled === "boolean") $("ruleEnabled").checked = s.enabled;
    if (typeof s.keyword === "string") $("keyword").value = s.keyword;
    if (typeof s.template === "string") $("template").value = s.template;
  } catch (_) {}
}
function save() {
  localStorage.setItem(KEY, JSON.stringify({
    enabled: $("ruleEnabled").checked,
    keyword: $("keyword").value.trim(),
    template: $("template").value
  }));
  $("saved").textContent = "Saved in this browser";
  setTimeout(() => $("saved").textContent = "", 2600);
}
$("save").addEventListener("click", save);
$("toggle").addEventListener("click", () => {
  active = !active;
  $("statusText").textContent = active ? "ARMED (UI ONLY)" : "PAUSED";
  $("toggle").innerHTML = active ? "Pause automation <span>Ⅱ</span>" : "Enable automation <span>↗</span>";
  $("toggle").style.opacity = active ? ".8" : "1";
  $("saved").textContent = active
    ? "Dashboard state changed. Configure and deploy the webhook server to run automation."
    : "Dashboard paused.";
});
load();
