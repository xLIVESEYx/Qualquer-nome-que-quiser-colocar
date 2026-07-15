/* ============================================
   CONSULTA CEP - Complete JavaScript
   ============================================ */

// --- DOM Elements ---
const cepInput = document.getElementById("cep");
const ruaInput = document.getElementById("rua");
const bairroInput = document.getElementById("bairro");
const cidadeInput = document.getElementById("cidade");
const estadoInput = document.getElementById("estado");
const ibgeInput = document.getElementById("ibge");
const dddInput = document.getElementById("ddd");
const feedback = document.getElementById("Feedback");
const mapaCidade = document.getElementById("mapaCidade");
const searchBtn = document.getElementById("searchBtn");
const loadingEl = document.getElementById("loading");
const addressResult = document.getElementById("addressResult");
const resultCep = document.getElementById("resultCep");
const resultLogradouro = document.getElementById("resultLogradouro");
const resultBairro = document.getElementById("resultBairro");
const resultCidade = document.getElementById("resultCidade");
const resultEstado = document.getElementById("resultEstado");
const resultIbge = document.getElementById("resultIbge");
const resultDdd = document.getElementById("resultDdd");
const historyContainer = document.getElementById("historyContainer");
const savedContainer = document.getElementById("savedContainer");
const historyCount = document.getElementById("historyCount");
const savedCount = document.getElementById("savedCount");
const tabHistory = document.getElementById("tabHistory");
const tabSaved = document.getElementById("tabSaved");
const historySection = document.getElementById("historySection");
const savedSection = document.getElementById("savedSection");
const themeToggle = document.getElementById("themeToggle");

// --- State ---
let currentAddress = null;
let history = JSON.parse(localStorage.getItem("cepHistory") || "[]");
let saved = JSON.parse(localStorage.getItem("cepSaved") || "[]");

// --- CEP Input Mask ---
cepInput.addEventListener("input", function () {
  let value = this.value.replace(/\D/g, "");
  if (value.length > 5) {
    value = value.slice(0, 5) + "-" + value.slice(5, 8);
  }
  this.value = value;
});

// --- Theme ---
function loadTheme() {
  const savedTheme = localStorage.getItem("cepTheme") || "dark";
  document.documentElement.setAttribute("data-theme", savedTheme);
  themeToggle.textContent = savedTheme === "dark" ? "☀️" : "🌙";
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme");
  const newTheme = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", newTheme);
  localStorage.setItem("cepTheme", newTheme);
  themeToggle.textContent = newTheme === "dark" ? "☀️" : "🌙";
  showToast(newTheme === "dark" ? "Modo escuro ativado" : "Modo claro ativado", "info");
}

themeToggle.addEventListener("click", toggleTheme);
loadTheme();

// --- Search CEP ---
searchBtn.addEventListener("click", searchCep);
cepInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    e.preventDefault();
    searchCep();
  }
});

async function searchCep() {
  const cep = cepInput.value.replace(/\D/g, "").trim();

  if (cep.length !== 8) {
    showFeedback("Digite um CEP válido com 8 dígitos.", "error");
    cepInput.focus();
    cepInput.style.borderColor = "var(--error)";
    setTimeout(() => { cepInput.style.borderColor = ""; }, 2000);
    return;
  }

  loadingEl.classList.add("visible");
  addressResult.classList.remove("visible");
  searchBtn.disabled = true;
  searchBtn.textContent = "⏳ Consultando...";
  showFeedback("", "");

  try {
    // --- ViaCEP API ---
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const data = await response.json();

    if (data.erro) {
      showFeedback("CEP não encontrado. Verifique o número e tente novamente.", "error");
      loadingEl.classList.remove("visible");
      searchBtn.disabled = false;
      searchBtn.textContent = "🔍 Consultar";
      return;
    }

    currentAddress = data;

    // --- Fill form fields ---
    ruaInput.value = data.logradouro || "";
    bairroInput.value = data.bairro || "";
    cidadeInput.value = data.localidade || "";
    estadoInput.value = data.uf || "";
    ibgeInput.value = data.ibge || "";
    dddInput.value = data.ddd || "";

    // --- Show result card ---
    resultCep.textContent = data.cep;
    resultLogradouro.textContent = data.logradouro || "—";
    resultBairro.textContent = data.bairro || "—";
    resultCidade.textContent = `${data.localidade || ""}/${data.uf || ""}`;
    resultEstado.textContent = data.uf || "—";
    resultIbge.textContent = data.ibge || "—";
    resultDdd.textContent = data.ddd ? `(${data.ddd})` : "—";
    addressResult.classList.add("visible");

    showFeedback("Endereço encontrado com sucesso! ✅", "success");

    // --- OpenStreetMap ---
    updateMap(data.localidade, data.logradouro, data.uf);

    // --- Add to history ---
    addToHistory(data);

  } catch (error) {
    showFeedback("Erro ao consultar o CEP. Verifique sua conexão.", "error");
    console.error("CEP Error:", error);
  } finally {
    loadingEl.classList.remove("visible");
    searchBtn.disabled = false;
    searchBtn.textContent = "🔍 Consultar";
  }
}

// --- Map ---
async function updateMap(cidade, logradouro, uf) {
  try {
    const query = `${logradouro ? logradouro + ", " : ""}${cidade}, ${uf}, Brazil`;
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`
    );
    const data = await response.json();

    if (data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lon = parseFloat(data[0].lon);
      const zoom = logradouro ? 0.01 : 0.05;
      mapaCidade.src = `https://www.openstreetmap.org/export/embed.html?bbox=${lon - zoom}%2C${lat - zoom}%2C${lon + zoom}%2C${lat + zoom}&layer=mapnik&marker=${lat}%2C${lon}`;
      mapaCidade.style.display = "block";
    } else {
      mapaCidade.style.display = "none";
    }
  } catch {
    mapaCidade.style.display = "none";
  }
}

// --- Feedback ---
function showFeedback(message, type) {
  feedback.textContent = message;
  feedback.className = type;
}

// --- Toast ---
function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  const icons = { success: "✅", error: "❌", info: "ℹ️" };
  toast.innerHTML = `${icons[type] || "ℹ️"} ${message}`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = "toastOut 0.3s ease forwards";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// --- Copy to Clipboard ---
function copyAddress() {
  if (!currentAddress) return;
  const text = `CEP: ${currentAddress.cep}
Logradouro: ${currentAddress.logradouro || "—"}
Bairro: ${currentAddress.bairro || "—"}
Cidade: ${currentAddress.localidade || "—"}/${currentAddress.uf || "—"}
IBGE: ${currentAddress.ibge || "—"}
DDD: ${currentAddress.ddd ? "(" + currentAddress.ddd + ")" : "—"}`;
  navigator.clipboard.writeText(text).then(() => {
    showToast("Endereço copiado para a área de transferência!", "success");
  }).catch(() => {
    showToast("Não foi possível copiar.", "error");
  });
}

// --- Export ---
function exportAddress(format) {
  if (!currentAddress) return;
  let content = "";
  let filename = `cep_${currentAddress.cep}`;
  let mime = "";

  switch (format) {
    case "json":
      content = JSON.stringify(currentAddress, null, 2);
      filename += ".json";
      mime = "application/json";
      break;
    case "csv":
      content = "CEP,Logradouro,Bairro,Cidade,Estado,IBGE,DDD\n" +
        `"${currentAddress.cep}","${currentAddress.logradouro || ""}","${currentAddress.bairro || ""}","${currentAddress.localidade || ""}","${currentAddress.uf || ""}","${currentAddress.ibge || ""}","${currentAddress.ddd || ""}"`;
      filename += ".csv";
      mime = "text/csv";
      break;
    case "txt":
      content = `=== CONSULTA CEP ===\n\nCEP: ${currentAddress.cep}\nLogradouro: ${currentAddress.logradouro || "—"}\nBairro: ${currentAddress.bairro || "—"}\nCidade: ${currentAddress.localidade || "—"}\nEstado: ${currentAddress.uf || "—"}\nIBGE: ${currentAddress.ibge || "—"}\nDDD: ${currentAddress.ddd ? "(" + currentAddress.ddd + ")" : "—"}\n`;
      filename += ".txt";
      mime = "text/plain";
      break;
  }

  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  showToast(`Arquivo ${filename} exportado com sucesso!`, "success");
}

// --- Open in Maps ---
function openInMaps() {
  if (!currentAddress) return;
  const query = `${currentAddress.logradouro || ""}, ${currentAddress.localidade}, ${currentAddress.uf}, Brazil`;
  window.open(`https://www.openstreetmap.org/search?query=${encodeURIComponent(query)}`, "_blank");
}

// --- Save Address ---
function saveAddress() {
  if (!currentAddress) return;
  const alreadySaved = saved.some(s => s.cep === currentAddress.cep);
  if (alreadySaved) {
    showToast("Este endereço já está salvo!", "info");
    return;
  }
  saved.unshift({ ...currentAddress, savedAt: new Date().toISOString() });
  localStorage.setItem("cepSaved", JSON.stringify(saved));
  renderSaved();
  showToast("Endereço salvo com sucesso! ⭐", "success");
}

function unsaveAddress(cep) {
  saved = saved.filter(s => s.cep !== cep);
  localStorage.setItem("cepSaved", JSON.stringify(saved));
  renderSaved();
  showToast("Endereço removido dos salvos.", "info");
}

// --- History ---
function addToHistory(data) {
  history = history.filter(h => h.cep !== data.cep);
  history.unshift({ ...data, searchedAt: new Date().toISOString() });
  if (history.length > 50) history = history.slice(0, 50);
  localStorage.setItem("cepHistory", JSON.stringify(history));
  renderHistory();
}

function clearHistory() {
  if (history.length === 0) return;
  history = [];
  localStorage.setItem("cepHistory", JSON.stringify(history));
  renderHistory();
  showToast("Histórico limpo.", "info");
}

function removeFromHistory(cep) {
  history = history.filter(h => h.cep !== cep);
  localStorage.setItem("cepHistory", JSON.stringify(history));
  renderHistory();
}

function loadFromHistory(cep) {
  cepInput.value = cep.slice(0, 5) + "-" + cep.slice(5);
  searchCep();
}

function loadFromSaved(cep) {
  cepInput.value = cep.slice(0, 5) + "-" + cep.slice(5);
  searchCep();
}

// --- Render History ---
function renderHistory() {
  historyCount.textContent = history.length;

  if (history.length === 0) {
    historyContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <p>Nenhuma consulta ainda.<br>Busque um CEP para começar!</p>
      </div>
    `;
    return;
  }

  historyContainer.innerHTML = history.map(item => {
    const cepFormatted = item.cep.slice(0, 5) + "-" + item.cep.slice(5);
    const addressStr = [item.logradouro, item.bairro, item.localidade].filter(Boolean).join(", ");
    const time = item.searchedAt ? new Date(item.searchedAt).toLocaleString("pt-BR") : "";
    return `
      <div class="history-item" onclick="loadFromHistory('${item.cep}')">
        <div class="info">
          <div class="cep">${cepFormatted}</div>
          <div class="address">${addressStr || "Endereço não informado"}</div>
          <div class="timestamp">${time}</div>
        </div>
        <div class="item-actions">
          <button class="btn btn-icon" onclick="event.stopPropagation(); copyHistoryAddress('${item.cep}')" title="Copiar">📋</button>
          <button class="btn btn-icon btn-danger" onclick="event.stopPropagation(); removeFromHistory('${item.cep}')" title="Remover">✕</button>
        </div>
      </div>
    `;
  }).join("");
}

// --- Render Saved ---
function renderSaved() {
  savedCount.textContent = saved.length;

  if (saved.length === 0) {
    savedContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⭐</div>
        <p>Nenhum endereço salvo.<br>Salve endereços para acessá-los rapidamente!</p>
      </div>
    `;
    return;
  }

  savedContainer.innerHTML = saved.map(item => {
    const cepFormatted = item.cep.slice(0, 5) + "-" + item.cep.slice(5);
    const addressStr = [item.logradouro, item.bairro, item.localidade].filter(Boolean).join(", ");
    const time = item.savedAt ? new Date(item.savedAt).toLocaleString("pt-BR") : "";
    return `
      <div class="saved-item" onclick="loadFromSaved('${item.cep}')">
        <div class="info">
          <div class="cep">${cepFormatted} ⭐</div>
          <div class="address">${addressStr || "Endereço não informado"}</div>
          <div class="timestamp">Salvo em: ${time}</div>
        </div>
        <div class="item-actions">
          <button class="btn btn-icon btn-danger" onclick="event.stopPropagation(); unsaveAddress('${item.cep}')" title="Remover">★</button>
        </div>
      </div>
    `;
  }).join("");
}

// --- Copy from History ---
function copyHistoryAddress(cep) {
  const item = history.find(h => h.cep === cep);
  if (!item) return;
  const text = `CEP: ${item.cep}
Logradouro: ${item.logradouro || "—"}
Bairro: ${item.bairro || "—"}
Cidade: ${item.localidade || "—"}/${item.uf || "—"}`;
  navigator.clipboard.writeText(text).then(() => {
    showToast("Endereço copiado!", "success");
  });
}

// --- Tabs ---
tabHistory.addEventListener("click", () => {
  tabHistory.classList.add("active");
  tabSaved.classList.remove("active");
  historySection.style.display = "block";
  savedSection.style.display = "none";
});

tabSaved.addEventListener("click", () => {
  tabSaved.classList.add("active");
  tabHistory.classList.remove("active");
  savedSection.style.display = "block";
  historySection.style.display = "none";
});

// --- Keyboard Shortcut: Ctrl+K to focus CEP input ---
document.addEventListener("keydown", function (e) {
  if ((e.ctrlKey || e.metaKey) && e.key === "k") {
    e.preventDefault();
    cepInput.focus();
    cepInput.select();
  }
});

// --- Init Render ---
renderHistory();
renderSaved();

// --- Focus CEP input on load ---
cepInput.focus();
