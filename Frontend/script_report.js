let currentPage = 1;
let totalPages = 1;

async function fetchData(page = 1) {
  try {
    const perPage = 20;
    const response = await fetch(`http://localhost:3000/getreport?page=${page}&per_page=${perPage}`);
    const data = await response.json();
    displayData(data);
  } catch (error) {
    console.error("Fetch error:", error);
  }
}

function displayData(data) {
  const tbody = document.getElementById("tbody");
  const report = data.data; // ← PERBAIKAN
  totalPages = Math.ceil(data.total / 20); // ← PERBAIKAN
  tbody.innerHTML = "";

  if (!report || report.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10">Data Report Kosong</td></tr>`;
    return;
  }

  report.forEach((value, index) => {
    const tanggal = new Date(value.tanggal * 1000);

    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${tanggal.toLocaleDateString("id-ID")}</td>
      <td>${value.nama}</td>
      <td>${value.cabang}</td>
      <td>${value.barang}</td>
      <td>${value.quantity}</td>
      <td>${value.status || "pending"}</td>
    `;

    tbody.appendChild(row);
  });
}

function nextPage() {
  if (currentPage < totalPages) {
    currentPage++;
    fetchData(currentPage);
  }
}

function prevPage() {
  if (currentPage > 1) {
    currentPage--;
    fetchData(currentPage);
  }
}

fetchData(currentPage);
