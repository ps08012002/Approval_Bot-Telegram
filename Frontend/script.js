const nama = document.getElementById("nama");
const cabang = document.getElementById("cabang");
const barang = document.getElementById("barang");
const quantity = document.getElementById("quantity");
const approvebyTd = document.createElement("td");

let latestReportData = null;

const dateObj = new Date();

const formatDate = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Jakarta",
}).format(dateObj);

const timeFormat = new Intl.DateTimeFormat("en-GB", {
  hour: "numeric",
  minute: "numeric",
  timeZone: "Asia/Jakarta",
}).format(dateObj);

console.log(formatDate);

nama.addEventListener("change", (e) => console.log("nama:", e.target.value));
barang.addEventListener("change", (e) => console.log("barang:", e.target.value));
quantity.addEventListener("change", (e) => console.log("quantity:", e.target.value));

async function loadcabang() {
  try {
    const res = await fetch("http://localhost:3000/cabang");
    const json = await res.json();
    const hasil = json.data || [];

    cabang.innerHTML = '<option value="">-- Pilih Cabang --</option>';

    hasil.forEach((kode) => {
      const option = document.createElement("option");
      option.value = kode.cabang;
      option.textContent = kode.cabang;
      cabang.appendChild(option);
    });
  } catch (err) {
    console.error("Gagal mengambil kode data cabang:", err);
  }
}

async function onSubmit() {
  const overlay = document.getElementById("overlayLoader");
  if (overlay) overlay.style.display = "flex";

  try {
    if (!nama.value.trim() || !cabang.value.trim() || !barang.value.trim() || !quantity.value.trim()) {
      alert("Data belum terisi semua!");
      return;
    }

    const payload = {
      nama: nama.value,
      cabang: cabang.value,
      barang: barang.value,
      quantity: Number(quantity.value),
      date: formatDate,
      time: timeFormat,
    };

    console.log("Payload:", payload);

    const res = await fetch("http://localhost:3000/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (data.ok) {
      console.log("Pesan terkirim & report dibuat:", data.report);
      alert("Permintaan akan diproses. Cek Telegram untuk notifikasi.");
    } else {
      console.error("Server responded error:", data);
      alert("Gagal: " + (data.error || "Unknown error"));
    }

    latestReportData = data.report || null;
  } catch (error) {
    console.error("Error:", error);
    alert("Terjadi kesalahan: " + error.message);
  } finally {
    if (overlay) overlay.style.display = "none";
  }
}

window.onload = () => {
  const dateUser = document.getElementById("dateUser");
  const timeUser = document.getElementById("timeUser");
  if (dateUser) dateUser.textContent = formatDate;
  if (timeUser) timeUser.textContent = timeFormat;
  loadcabang();
};
