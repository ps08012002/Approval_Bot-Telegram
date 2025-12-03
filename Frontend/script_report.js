console.log("script_report.js loaded");

window.addEventListener("error", (e) => {
  console.error("Global error listener:", {
    message: e.message,
    filename: e.filename,
    lineno: e.lineno,
    colno: e.colno,
    error: e.error && e.error.stack ? e.error.stack : e.error,
  });
});
window.addEventListener("unhandledrejection", (e) => {
  console.error("Unhandled promise rejection:", e.reason);
});

let currentPage = 1;
let totalPages = 1;

function ready(cb) {
  if (document.readyState !== "loading") return cb();
  document.addEventListener("DOMContentLoaded", cb);
}

ready(() => {
  console.log("DOM ready");
  const tbody = document.getElementById("tbody");
  console.log("tbody element:", tbody);
  console.log("Location:", location.href);
  fetchData(currentPage);
});

async function fetchData(page = 1) {
  try {
    const perPage = 20;
    const url = `http://localhost:3000/getreport?page=${page}&per_page=${perPage}`;
    console.log("Fetching:", url);

    const response = await fetch(url);
    console.log("Fetch response ok?", response.ok, "status:", response.status);

    if (!response.ok) {
      const txt = await response.text();
      console.error("Non-OK response body:", txt);
      return;
    }

    const data = await response.json();
    console.log("Parsed JSON:", data);
    displayData(data);
  } catch (error) {
    console.error("Fetch error (caught):", error);
  }
}

function displayData(data) {
  try {
    console.log("displayData called with:", data);
    const tbody = document.getElementById("tbody");
    if (!tbody) {
      console.error("displayData: tbody not found!");
      return;
    }

    const report = data?.data || [];
    const perPage = 20;
    totalPages = Math.ceil((data?.total || 0) / perPage);
    console.log("totalPages:", totalPages, "items:", report.length);
    tbody.innerHTML = "";

    if (!report || report.length === 0) {
      tbody.innerHTML = `<tr><td colspan="10">Data Report Kosong</td></tr>`;
      return;
    }

    report.forEach((value, index) => {
      console.log("row value:", value);

      const tanggal = value.tanggal ? new Date(Number(value.tanggal) * 1000) : null;
      const tr = document.createElement("tr");

      const noTd = document.createElement("td");
      noTd.textContent = (currentPage - 1) * perPage + index + 1;
      tr.appendChild(noTd);

      const tanggalTd = document.createElement("td");
      tanggalTd.textContent = tanggal ? tanggal.toLocaleDateString("id-ID") : "-";
      tr.appendChild(tanggalTd);

      const namaTd = document.createElement("td");
      namaTd.textContent = value.nama ?? "-";
      tr.appendChild(namaTd);

      const cabangTd = document.createElement("td");
      cabangTd.textContent = value.cabang ?? "-";
      tr.appendChild(cabangTd);

      const barangTd = document.createElement("td");
      barangTd.textContent = value.barang ?? "-";
      tr.appendChild(barangTd);

      const qtyTd = document.createElement("td");
      qtyTd.textContent = value.quantity ?? "-";
      tr.appendChild(qtyTd);

      const statusTd = document.createElement("td");
      statusTd.textContent = value.status ?? "pending";
      tr.appendChild(statusTd);

      const approveTd = document.createElement("td");
      const possible = [value.approveby, value.approve_by, value.approved_by, value.approver, value.approve && value.approve.by, value.approve && value.approve.name];
      const approver = possible.find((v) => v !== undefined && v !== null && String(v).trim() !== "");
      approveTd.textContent = approver ?? "— Belum diset —";
      tr.appendChild(approveTd);

      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("displayData error:", err);
  }
}

window.__dbg = { fetchData, displayData };
