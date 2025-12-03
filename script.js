const plank = document.querySelector(".plank");
const pivot = document.querySelector(".pivot");
const clickable = document.querySelector(".seesaw-clickable");
const seeSawCont = document.querySelector(".seesaw-container");
const previewLine = document.querySelector(".preview-line");
const logBox = document.querySelector(".logs");

const button = document.querySelector(".reset-btn");

const ghostLabel = document.getElementById("ghostLabel");
const rightWeight = document.getElementById("rightWeight");
const leftWeight = document.getElementById("leftWeight");
const nextWeight = document.getElementById("nextWeight");
const angleEl = document.getElementById("angle");
const ghost = document.getElementById("ghostObject");

const plankWidth = 400; // Plank Genişliği
const center = plankWidth / 2; // Merkez
const ghostObjectY = 170; // Siluetin y-eksenine göre yüksekliği

let currentNextWeight = 0; // Sonraki objenin ağırlığı (Sonradan değiştirmek için)

// Fonksiyonu  ile silueti oluşturmak için fonksiyon kullandım
clickable.addEventListener("mousemove", function (event) {
  // Ekrandaki konumlarını almak için (getBoundingClientRect) metodu kullandım
  const plankRect = plank.getBoundingClientRect();
  const containerRect = seeSawCont.getBoundingClientRect();

  // Tıklamanın konteynerin sol üst köşesine göre x koordinatını hesapla
  const xPosition = event.clientX - containerRect.left + ghost.offsetWidth / 2;

  // Siluetin biraz önce atadğımız değerde sabit olması için sabitledim
  let yPosition = ghostObjectY;

  // Konumlandırma
  ghost.style.left = xPosition + "px";
  ghost.style.top = yPosition + "px";
  // Görünmez çizginin konumu
  previewLine.style.left = xPosition + "px";

  // Sileuti görünür hale getirme
  if (ghost.style.display === "none" || !ghost.style.display) {
    ghost.style.display = "flex";
    previewLine.style.display = "flex";
  }

  // Next Weight değerini güncelle (henüz random değil, bir kere hesaplanmalı)
  if (currentNextWeight === 0) {
    currentNextWeight = Math.floor(Math.random() * 10) + 1; // 1-10 kg
  }

  // Statlerde ve ghost objenin üzerinde kilosu gözükmesi için
  nextWeight.textContent = `${currentNextWeight} kg`;
  ghostLabel.textContent = `${currentNextWeight} kg`;

  // Siluet boyut ve rengini güncel ağırlığa göre ayarla
  ghost.style.width = `${40 + currentNextWeight * 2}px`;
  ghost.style.height = `${40 + currentNextWeight * 2}px`;
  ghost.style.backgroundColor = `hsl(${currentNextWeight * 30}, 70%, 50%)`;
});

// Konteynerden çıkınca silueti gizlemesi ve yeni ağırlığı sıfırlaması için
clickable.addEventListener("mouseleave", () => {
  ghost.style.display = "none";
  currentNextWeight = 0;
  previewLine.style.display = "none";
  nextWeight.textContent = "0 kg";
});

// Ekrana tıklayınca objenin somut hale gelmesi
clickable.addEventListener("click", function (event) {
  if (currentNextWeight === 0) return; // Hata kontrolü

  // Tahtaya göre konum alma
  const plankRect = plank.getBoundingClientRect();

  // Tıklanan X koordinatını al (konteynerin solundan)
  const xPosition = event.clientX - plankRect.left;
  const yPosition = plank.offsetHeight / 2;
  const weight = currentNextWeight;

  // Objenin somut halini oluşturma
  const newObject = document.createElement("div");
  newObject.classList.add("object", "permanent");

  const weightLabel = document.createElement("span");
  weightLabel.textContent = `${weight} kg`;
  weightLabel.classList.add("weight-label");
  newObject.appendChild(weightLabel);

  // Ağırlık ve Mesafeyi kaydet
  const distance = xPosition - center;
  // Negatif = Sol, Pozitif = Sağ

  newObject.dataset.weight = weight;
  newObject.dataset.distance = distance;

  // Ağırlığına göre rengini ve boyutunu atama
  newObject.style.width = `${40 + weight * 2}px`;
  newObject.style.height = `${40 + weight * 2}px`;
  newObject.style.backgroundColor = `hsl(${weight * 30}, 70%, 50%)`;

  // Konumlandırma
  newObject.style.left = xPosition + "px";
  newObject.style.top = yPosition + "px";

  // Tahtaya yapışması için alt elementi olmasını istedim
  plank.appendChild(newObject);

  // Torku yeniden hesapladım
  recalculateSeesawTilt();

  const side = distance < 0 ? "left" : "right";
  addLogEntry(weight, distance, side);

  // Yeni bir sonraki ağırlığı belirledim
  currentNextWeight = Math.floor(Math.random() * 10) + 1;
  nextWeight.textContent = `${currentNextWeight} kg`;
  ghostLabel.textContent = `${currentNextWeight} kg`;
});

function recalculateSeesawTilt() {
  let leftTorque = 0;
  let rightTorque = 0;
  let totalLeftWeight = 0;
  let totalRightWeight = 0;

  const objects = document.querySelectorAll(".permanent");

  objects.forEach((obj) => {
    const weight = parseFloat(obj.dataset.weight);
    const distance = parseFloat(obj.dataset.distance);
    const torque = Math.abs(weight * distance);

    if (distance < 0) {
      // Sol taraf
      leftTorque += torque;
      totalLeftWeight += weight;
    } else {
      // Sağ taraf
      rightTorque += torque;
      totalRightWeight += weight;
    }
  });
  // Tork farkı = Sağ tork - Sol tork
  const torqueDifference = rightTorque - leftTorque;

  // Eğim açısı hesaplama (Maksimum 30 derece)
  // 100 katsayısı, tork değerlerini (kg*px) anlamlı bir dereceye çevirmek için ayarlanmıştır.
  const angle = Math.max(-30, Math.min(30, torqueDifference / 100));

  // Tahterevalliye eğim verme
  plank.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;

  // Ekranda ağırlıkları ve açıyı güncellemek için
  leftWeight.textContent = totalLeftWeight.toFixed(1) + " kg";
  rightWeight.textContent = totalRightWeight.toFixed(1) + " kg";
  angleEl.textContent = angle.toFixed(1) + "°";
}

button.addEventListener("click", () => {
  // Tüm kalıcı objeleri kaldır
  document.querySelectorAll(".permanent ").forEach((obj) => {
    obj.remove();
  });
  logBox.innerHTML = "";
  // Tahtayı sıfır dereceye getir
  plank.style.transform = "translateX(-50%) translateY(-50%) rotate(0deg)";

  // UI'daki değerleri sıfırla
  leftWeight.textContent = "0.0 kg";
  rightWeight.textContent = "0.0 kg";
  nextWeight.textContent = "0 kg";
  angleEl.textContent = "0.0°";
  currentNextWeight = 0;

  // Silueti gizle
  ghost.style.display = "none";
});

// En alttaki log kısmına bırakılan ağırlığı ve uzaklığını belirlemek için yapılan fonksiyon
function addLogEntry(weight, distance, side) {
  const logEntry = document.createElement("div");
  logEntry.classList.add("log-entry");

  // Mesafeyi pozitif (sağ) veya negatif (sol) olarak gösterdim
  const formattedDistance = Math.abs(distance).toFixed(0);
  const message = `📦 ${weight}kg dropped on ${side} side, ${formattedDistance}px from center`;

  logEntry.textContent = message;

  // Yeni girdiyi log kutusunun en üstüne ekle
  if (logBox.firstChild) {
    logBox.insertBefore(logEntry, logBox.firstChild);
  } else {
    logBox.appendChild(logEntry);
  }
}
