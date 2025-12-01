import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
const app = express();
const port = 3000;
const db = new PrismaClient();

const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
};
app.use(cors(corsOptions));

app.use(express.json());

app.get("/cabang", async (req, res) => {
  // Get cabang
  try {
    const test = await db.tb_cabang.findMany();
    res.send({ data: test });
  } catch (error) {
    res.status(500).send("internal server error");
  }
});

app.post("/cabang", async (req, res) => {
  // Create cabang
  try {
    console.log("req.body", req.body);

    await db.tb_cabang.create({ data: { cabang: req.body.cabang } });
    res.send("sukses insert atasan");
  } catch (error) {
    console.log("error", error);

    res.status(500).send({ "internal server error": error });
  }
});

// create report data
app.post("/report", async (req, res) => {
  try {
    const qty = parseInt(req.body.quantity);

    const createdReport = await db.tb_report.create({
      data: {
        tanggal: Math.floor(Date.now() / 1000),
        nama: req.body.nama,
        barang: req.body.barang,
        quantity: qty,
        cabang: req.body.cabang,
        status: req.body.status,
      },
    });

    res.json({ message: "Report dibuat", report: createdReport });
  } catch (error) {
    console.log("error", error);
    res.status(500).send({ "internal server error": error.message || error });
  }
});

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
if (!BOT_TOKEN || !CHAT_ID) {
  console.error("Missing BOT_TOKEN or CHAT_ID in .env");
  process.exit(1);
}

// tambahkan helper ini di bagian atas file (sebelum route)
function escapeHtmlForTelegram(str) {
  if (str === null || str === undefined) return "";
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ganti atau tambahkan endpoint /sendMessage di index.js
app.post("/sendMessage", async (req, res) => {
  try {
    const { nama, cabang, barang, quantity } = req.body;

    // validasi sederhana
    if (!nama || !cabang || !barang || quantity === undefined || quantity === null) {
      return res.status(400).json({ ok: false, error: "Missing required fields" });
    }

    // buat record di DB terlebih dahulu
    const createdReport = await db.tb_report.create({
      data: {
        tanggal: Math.floor(Date.now() / 1000),
        nama: String(nama),
        barang: String(barang),
        quantity: parseInt(quantity, 10) || 0,
        cabang: String(cabang),
        status: "pending",
      },
    });

    // escape value supaya aman untuk parse_mode=HTML
    const safeNama = escapeHtmlForTelegram(nama);
    const safeCabang = escapeHtmlForTelegram(cabang);
    const safeBarang = escapeHtmlForTelegram(barang);
    const safeQuantity = escapeHtmlForTelegram(String(quantity));

    // pesan utama
    const message = `
<b>🤙🏿 Permintaan Baru Menunggu Persetujuan</b>

<pre>
👤 Name         : ${safeNama}
🏢 Cabang       : ${safeCabang}
🖨️ Nama Barang  : ${safeBarang}
🔢 Quantity     : ${safeQuantity}
</pre>
`;

    // URL approve/reject (gunakan public URL/ngrok jika ingin bisa diklik dari device lain)
    const approveUrl = `http://localhost:3000/report/approve/${createdReport.id}?status=approve`;
    const rejectUrl = `http://localhost:3000/report/approve/${createdReport.id}?status=reject`;

    // kirim ke Telegram dengan inline keyboard (URL buttons)
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: "HTML",
        disable_web_page_preview: true,
        // reply_markup bisa berupa object atau stringified JSON
        // saya stringify untuk kompatibilitas
        reply_markup: JSON.stringify({
          inline_keyboard: [
            [
              { text: "✅ Approve", callback_data: `approve:${createdReport.id}`, url: approveUrl },
              { text: "❌ Reject", callback_data: `reject:${createdReport.id}`, url: rejectUrl },
            ],
          ],
        }),
      }),
    });

    const data = await resp.json();

    if (!data.ok) {
      console.error("Telegram API returned error:", data);
      // meskipun telegram gagal, kita sudah menyimpan report; return error ke client
      return res.status(502).json({ ok: false, error: "Telegram API error", details: data });
    }

    // sukses: kirimkan detail message + createdReport ke client
    return res.json({ ok: true, result: data.result, report: createdReport });
  } catch (err) {
    console.error("sendMessage error:", err);
    return res.status(500).json({ ok: false, error: "Internal server error", details: err.message });
  }
});

// Endpoint Approve / Reject
app.get("/report/approve/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.query;

    if (!["approve", "reject"].includes(status)) {
      return res.status(400).send("Status tidak valid");
    }

    const updatedReport = await db.tb_report.update({
      where: { id: parseInt(id) },
      data: { status: status },
    });

    res.send(`Report ID ${id} berhasil diupdate menjadi ${status}`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal server error");
  }
});

app.get("/getreport", async (req, res) => {
  // Get report data
  try {
    const { page, per_page } = req.query;
    const limit = +(per_page ?? 1);
    const offset = (+(page ?? 1) - 1) * limit;
    const total = await db.tb_report.count();

    const test = await db.tb_report.findMany({
      take: limit,
      skip: offset,
      include: {
        atasan: true,
      },
    });
    res.send({ test, total: total });
  } catch (error) {
    res.status(500).send("internal server error");
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
