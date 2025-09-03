// app.js
"use strict";

// --- Datos de aceites demo ---
const OILS = [
  {brand:"Liqui Moly TopTec 4200", viscosity:"5W-30", specs:["VW 504.00/507.00","ACEA C3","MB 229.51"],document.body.innerHTML += '<a href="https://amzn.to/4p2voh2">Enlace Afiliados Amazón</a>';
},
  {brand:"Castrol Edge 0W-30 LL", viscosity:"0W-30", specs:["BMW LL-04","MB 229.52","ACEA C3"]},
  {brand:"Motul 8100 X-clean", viscosity:"5W-40", specs:["ACEA C3","MB 229.51","BMW LL-04"]},
  {brand:"Total Quartz Ineo ECS", viscosity:"5W-30", specs:["ACEA C2","PSA B71 2290"]},
  {brand:"Mobil 1 ESP x2", viscosity:"0W-20", specs:["ACEA C5","VW 508.00/509.00","Porsche C20"]},
  {brand:"Ravenol DXG", viscosity:"5W-30", specs:["API SP","ILSAC GF-6","dexos1 Gen3"]},
];

// --- Parámetros ---
const CLIMATE_TO_VISC = {
  muy_frio:["0W-20","0W-30","0W-40"],
  templado:["0W-30","5W-30","5W-40"],
  calido:["5W-30","5W-40","10W-40"],
};
const ACEA_RULES = {
  g_no:["ACEA A3/B4","ACEA A5/B5"],
  g_si:["ACEA C2","ACEA C3"],
  d_no:["ACEA B4","ACEA A3/B4"],
  d_si:["ACEA C3","ACEA C4"],
};
const OEM_PRIORITY = [
  "VW 504.00/507.00","VW 508.00/509.00",
  "MB 229.5","MB 229.51","MB 229.52",
  "BMW LL-01","BMW LL-04",
  "Ford WSS-M2C913-C","Ford WSS-M2C913-D","Ford WSS-M2C948-B",
  "GM dexos1","GM dexos1 Gen3","GM dexos2",
  "Renault RN17","PSA B71 2290","Fiat 9.55535-S2",
];

// --- Utils ---
const $ = s => document.querySelector(s);
const el = (t,p={}) => Object.assign(document.createElement(t),p);
const uniq = arr => [...new Set(arr)].sort((a,b)=>a.localeCompare(b));

function findCar(make, model, year){
  return (window.CARS||[]).find(c =>
    c.make.toLowerCase()===make.toLowerCase() &&
    c.model.toLowerCase()===model.toLowerCase() &&
    Number(c.year)===Number(year)
  );
}
function pickViscosity(base, climate){
  const prefs = CLIMATE_TO_VISC[climate] || [];
  if (base && prefs.includes(base)) return base;
  return base || prefs[0] || "5W-30";
}
function pickSpecs(car){
  if (car?.oem?.length){
    return [...car.oem].sort((a,b)=>
      (OEM_PRIORITY.includes(a)?0:1) - (OEM_PRIORITY.includes(b)?0:1) || a.localeCompare(b)
    );
  }
  const key = (car.fuel.startsWith("gas")?"g":"d") + "_" + (car.dpf?"si":"no");
  return ACEA_RULES[key] || ["ACEA C3"];
}
function adjustByUse(visc, uso){
  let out = visc;
  if (uso === "deportivo" && out.endsWith("30")) out = out.replace("30","40");
  if (uso === "urbano" && out.startsWith("5W")) out = "0W-" + out.split("-")[1];
  return out;
}
function parseOEMInput(text){ return text.split(",").map(s=>s.trim()).filter(Boolean); }
function matchOils(viscosity, specs){
  const wanted = new Set(specs);
  return OILS.filter(o => o.viscosity===viscosity && o.specs.some(s=>wanted.has(s)));
}

// --- Autocomplete (datalist) ---
function refreshMakeList(){
  const dl = $("#dl-makes"); dl.innerHTML = "";
  uniq((window.CARS||[]).map(c=>c.make)).forEach(m=> dl.appendChild(el("option",{value:m})));
}
function refreshModelList(){
  const dl = $("#dl-models"); dl.innerHTML = "";
  const make = $("#make").value.trim();
  const models = make
    ? uniq((window.CARS||[]).filter(c=>c.make.toLowerCase()===make.toLowerCase()).map(c=>c.model))
    : uniq((window.CARS||[]).map(c=>c.model));
  models.forEach(m=> dl.appendChild(el("option",{value:m})));
}
function refreshYearList(){
  const dl = $("#dl-years"); dl.innerHTML = "";
  const make = $("#make").value.trim();
  const model = $("#model").value.trim();
  let years = (window.CARS||[]).filter(c=>
      (!make || c.make.toLowerCase()===make.toLowerCase()) &&
      (!model || c.model.toLowerCase()===model.toLowerCase())
    ).map(c=>c.year);
  [...new Set(years)].sort((a,b)=>a-b).forEach(y=> dl.appendChild(el("option",{value:String(y)})));
}
function refreshEngineList(){
  const dl = $("#dl-engines"); dl.innerHTML = "";
  const make = $("#make").value.trim();
  const model = $("#model").value.trim();
  const year = Number($("#year").value);
  const engines = (window.CARS||[]).filter(c=>
      (!make || c.make.toLowerCase()===make.toLowerCase()) &&
      (!model || c.model.toLowerCase()===model.toLowerCase()) &&
      (!year || c.year===year)
    ).map(c=>c.engine).filter(Boolean);
  uniq(engines).forEach(e=> dl.appendChild(el("option",{value:e})));
}
function initAutocomplete(){
  refreshMakeList(); refreshModelList(); refreshYearList(); refreshEngineList();
  ["#make","#model"].forEach(id=> $(id).addEventListener("input", ()=>{
    refreshModelList(); refreshYearList(); refreshEngineList();
  }));
  $("#year").addEventListener("input", ()=>{
    refreshYearList(); refreshEngineList();
  });
}

// --- Render tablas ---
function renderDB(){
  const table = $("#dbTable"); table.innerHTML = "";
  const head = el("tr");
  ["Marca","Modelo","Año","Motor","Combustible","DPF/GPF","OEM","Base"].forEach(h=> head.appendChild(el("th",{textContent:h})));
  table.appendChild(head);
  (window.CARS||[]).forEach(c=>{
    const tr = el("tr");
    tr.appendChild(el("td",{textContent:c.make}));
    tr.appendChild(el("td",{textContent:c.model}));
    tr.appendChild(el("td",{textContent:c.year}));
    tr.appendChild(el("td",{textContent:c.engine||"-"}));
    tr.appendChild(el("td",{textContent:c.fuel}));
    tr.appendChild(el("td",{textContent:c.dpf?"Sí":"No"}));
    tr.appendChild(el("td",{textContent:(c.oem||[]).join("; ")||"-"}));
    tr.appendChild(el("td",{textContent:c.baseVisc||"-"}));
    table.appendChild(tr);
  });
}
function renderOils(){
  const table = $("#oilTable"); table.innerHTML = "";
  const head = el("tr");
  ["Producto","Viscosidad","Especificaciones"].forEach(h=> head.appendChild(el("th",{textContent:h})));
  table.appendChild(head);
  OILS.forEach(o=>{
    const tr = el("tr");
    tr.appendChild(el("td",{textContent:o.brand}));
    tr.appendChild(el("td",{textContent:o.viscosity}));
    tr.appendChild(el("td",{textContent:o.specs.join(", ")}));
    table.appendChild(tr);
  });
}

// --- Recomendación ---
function showResult({carLine, viscosity, specs, products, explainHTML}){
  const box = $("#result"); box.hidden = false;
  const chips = $("#chips"); chips.innerHTML = "";
  const chip = (txt)=>chips.appendChild(el("span",{className:"badge",textContent:txt}));
  chip("Viscosidad: "+viscosity);
  specs.forEach(s=> chip(s));
  if (products?.length) chip(`${products.length} aceite(s) coincidentes`);
  $("#carLine").textContent = carLine;
  $("#explain").innerHTML = explainHTML;
}
function recommend(){
  const make = $("#make").value.trim();
  const model = $("#model").value.trim();
  const year = Number($("#year").value);
  const engine = $("#engine").value.trim();
  const fuel = $("#fuel").value;
  const dpfSel = $("#dpf").value;
  const climate = $("#climate").value;
  const uso = $("#uso").value;
  const oemInput = $("#oem").value.trim();

  if (!make || !model || !year){ alert("Rellena marca, modelo y año."); return; }

  let car = findCar(make, model, year);
  const userOEM = oemInput? parseOEMInput(oemInput): null;

  if (!car){
    car = {make, model, year, engine, fuel, dpf: dpfSel==="si"?true: dpfSel==="no"?false: (fuel==="diesel"), oem: userOEM||[], baseVisc:"5W-30"};
  } else {
    if (engine) car.engine = engine;
    if (dpfSel!=="auto") car.dpf = (dpfSel==="si");
    if (userOEM?.length) car.oem = userOEM;
    if (fuel) car.fuel = fuel;
  }

  let viscosity = pickViscosity(car.baseVisc, climate);
  viscosity = adjustByUse(viscosity, uso);
  const specs = pickSpecs(car);
  const products = matchOils(viscosity, specs);
  const carLine = `${car.make} ${car.model} ${car.year}${car.engine?` (${car.engine})`:""}`;

  const explain = [
    `<strong>Reglas aplicadas</strong>`,
    `• Prioridad de homologación OEM si existe.`,
    `• Viscosidad base del modelo → ajustada por clima (<em>${climate}</em>) y uso (<em>${uso}</em>).`,
    `• Si hay DPF/GPF → Low-SAPS (familia ACEA Cx).`,
    products.length ? `• Coincidencias en catálogo: ${products.map(p=>p.brand).join(', ')}.` : `• Sin coincidencias en el catálogo de ejemplo (puedes ampliarlo).`,
    `<br><em>Nota:</em> Confirma siempre en el manual. Si el coche está en garantía, usa la homologación exacta del fabricante.`,
  ];

  showResult({ carLine, viscosity, specs, products, explainHTML: explain.join('<br>') });
}

// --- Arranque seguro (se ejecuta cuando TODO el DOM y scripts defer están cargados) ---
window.addEventListener("DOMContentLoaded", ()=>{
  // listeners
  $("#btnRecommend").addEventListener("click", recommend);
  $("#btnReset").addEventListener("click", ()=>{
    document.querySelectorAll("input,select").forEach(el=>{
      if (el.id==="fuel") { el.value = "gasolina"; return; }
      if (el.id==="climate") { el.value = "templado"; return; }
      if (el.id==="uso") { el.value = "mixto"; return; }
      if (el.id==="dpf") { el.value = "auto"; return; }
      el.value = "";
    });
    $("#result").hidden = true;
    refreshModelList(); refreshYearList(); refreshEngineList();
  });

  // build UI
  initAutocomplete();
  renderDB();
  renderOils();

  // Comprobación útil en consola:
  if (!Array.isArray(window.CARS) || !window.CARS.length) {
    console.warn("CARS está vacío. ¿Se cargó cars_extra.js correctamente?");
  }
});
