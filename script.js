const API_KEY = "94dafad45847739bc8888197ae872718";

const btn = document.getElementById("btn");
const downloadBtn = document.getElementById("downloadXml");
const result = document.getElementById("result");
const status = document.getElementById("status");

let lastXmlResponse = null; // aquí guardaremos el XML “crudo” recibido

function downloadXmlFile() {
  if (!lastXmlResponse) {
    alert("No hay XML para descargar todavía. Primero consulta el clima.");
    return;
  }

  const blob = new Blob([lastXmlResponse], { type: "application/xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const selected = document.getElementById("city").value || "weather";
  const safeName = selected.replace(/[^a-z0-9-_]+/gi, "_");
  const filename = `openweather_${safeName}.xml`;

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();

  a.remove();
  URL.revokeObjectURL(url);
}

async function getWeather(city) {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&mode=xml&units=metric&lang=es`;

  const response = await fetch(url);

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Error HTTP: ${response.status}${text ? " — " + text.slice(0, 200) : ""}`);
  }

  const xmlText = await response.text();

  // ✅ Guardamos el XML para poder descargarlo luego
  lastXmlResponse = xmlText;

  // ✅ Mostramos el botón “Descargar XML” cuando ya hay XML
  downloadBtn.style.display = "inline-block";

  const xmlDoc = new DOMParser().parseFromString(xmlText, "application/xml");

  // Si el XML no parsea bien, algunos navegadores meten <parsererror>
  if (xmlDoc.getElementsByTagName("parsererror")[0]) {
    throw new Error("El XML recibido no es válido o no se pudo parsear.");
  }

  const cityNode = xmlDoc.getElementsByTagName("city")[0];
  const tempNode = xmlDoc.getElementsByTagName("temperature")[0];
  const humidityNode = xmlDoc.getElementsByTagName("humidity")[0];
  const weatherNode = xmlDoc.getElementsByTagName("weather")[0];
  const windNode = xmlDoc.getElementsByTagName("speed")[0];

  return {
    city: cityNode?.getAttribute("name") ?? "",
    country: cityNode?.getElementsByTagName("country")[0]?.textContent ?? "",
    temp: tempNode?.getAttribute("value") ?? "",
    humidity: humidityNode?.getAttribute("value") ?? "",
    description: weatherNode?.getAttribute("value") ?? "",
    wind: windNode?.getAttribute("value") ?? ""
  };
}

btn.addEventListener("click", async () => {
  const city = document.getElementById("city").value.trim();

  if (!city) {
    status.textContent = "Selecciona una ciudad.";
    return;
  }

  status.textContent = "Consultando clima en XML...";
  result.innerHTML = "";

  // (Opcional) ocultar el botón hasta que llegue una respuesta nueva
  downloadBtn.style.display = "none";
  lastXmlResponse = null;

  try {
    const data = await getWeather(city);

    result.innerHTML = `
      <h3>${data.city}, ${data.country}</h3>
      <p><strong>Temperatura:</strong> ${data.temp} °C</p>
      <p><strong>Clima:</strong> ${data.description}</p>
      <p><strong>Humedad:</strong> ${data.humidity} %</p>
      <p><strong>Viento:</strong> ${data.wind} m/s</p>
    `;

    status.textContent = "Consulta exitosa ✔ (puedes descargar el XML).";
  } catch (error) {
    status.textContent = "Error: " + error.message;
  }
});

// ✅ Listener para descargar el XML
downloadBtn.addEventListener("click", downloadXmlFile);
