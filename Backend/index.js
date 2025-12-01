// index.js
import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const db = new PrismaClient();

app.use(cors({ origin: "*" }));
app.use(express.json());

// env check
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
if (!BOT_TOKEN || !CHAT_ID) {
  console.error("Missing BOT_TOKEN or CHAT_ID in .env");
  process.exit(1);
}

// Telegram Bot (polling)
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// helper: escape HTML for Telegram
function escapeHtmlForTelegram(str) {
  if (str === null || str === undefined) return "";
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/* ------------------ ROUTES ------------------ */

// GET /cabang
app.get("/cabang", async (req, res) => {
  try {
    const items = await db.tb_cabang.findMany({ orderBy: { id: "asc" } });
    res.json({ data: items });
  } catch (err) {
    console.error("/cabang error:", err);
    res.status(500).send("internal server error");
  }
});

// POST /cabang
app.post("/cabang", async (req, res) => {
  try {
    const { cabang } = req.body;
    if (!cabang) return res.status(400).json({ ok: false, error: "Missing cabang" });
    const created = await db.tb_cabang.create({ data: { cabang: String(cabang) } });
    res.json(created);
  } catch (err) {
    console.error("/cabang POST error:", err);
    res.status(500).json({ ok: false, error: err.message || err });
  }
});

// POST /report -> create report and send Telegram message with callback buttons
app.post("/report", async (req, res) => {
  try {
    const { nama, cabang, barang, quantity, date, time } = req.body;

    if (!nama || !cabang || !barang || quantity === undefined || quantity === null) {
      return res.status(400).json({ ok: false, error: "Missing required fields" });
    }

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

    // send Telegram notification (async)
    await sendApprovalToTelegram(CHAT_ID, {
      id: createdReport.id,
      nama,
      barang,
      quantity,
      cabang,
      date,
      time,
    });

    return res.json({ ok: true, report: createdReport });
  } catch (err) {
    console.error("/report error:", err);
    return res.status(500).json({ ok: false, error: err.message || err });
  }
});

// GET /getreport (robust, safe)
app.get("/getreport", async (req, res) => {
  try {
    // parse dengan aman
    const pageNum = Number(req.query.page) || 1;
    const perPage = Math.max(1, Number(req.query.per_page) || 10);

    // compute skip
    const skip = (pageNum - 1) * perPage;

    // total count
    const total = await db.tb_report.count();

    // query with safe numeric values
    const items = await db.tb_report.findMany({
      take: perPage,
      skip: skip,
      orderBy: { id: "desc" },
    });

    return res.json({ data: items, total });
  } catch (err) {
    console.error("/getreport error:", err);
    return res.status(500).json({ ok: false, error: err.message || err });
  }
});

/* ------------------ Telegram helper & handlers ------------------ */

async function sendApprovalToTelegram(chatId, report) {
  const safeNama = escapeHtmlForTelegram(report.nama);
  const safeBarang = escapeHtmlForTelegram(report.barang);
  const safeCabang = escapeHtmlForTelegram(report.cabang);
  const safeQty = escapeHtmlForTelegram(String(report.quantity));
  const safeDate = report.date ? escapeHtmlForTelegram(String(report.date)) : "";
  const safeTime = report.time ? escapeHtmlForTelegram(String(report.time)) : "";

  const text = `
<b>📦 Permintaan Baru</b>
-----------------------
👤 Nama: <b>${safeNama}</b>
📦 Barang: <b>${safeBarang}</b>
🔢 Qty: <b>${safeQty}</b>
📍 Cabang: <b>${safeCabang}</b>
📅 Tanggal: <b>${safeDate}</b> ${safeTime}
🟡 Status: <b>Pending</b>
  `;

  const approveCb = `approve_${report.id}`;
  const rejectCb = `reject_${report.id}`;

  try {
    await bot.sendMessage(String(chatId), text, {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "✔ Approve", callback_data: approveCb },
            { text: "❌ Reject", callback_data: rejectCb },
          ],
        ],
      },
    });
  } catch (err) {
    console.error("sendApprovalToTelegram failed:", err);
    throw err;
  }
}

// Polling handler for callback_query
bot.on("callback_query", async (callbackQuery) => {
  try {
    const data = callbackQuery.data; // e.g. "approve_5"
    const msg = callbackQuery.message;
    const from = callbackQuery.from;
    if (!data) {
      return bot.answerCallbackQuery(callbackQuery.id, { text: "Invalid action", show_alert: false });
    }

    const [action, idStr] = data.split("_");
    const reportId = Number(idStr);
    if (!["approve", "reject"].includes(action) || Number.isNaN(reportId)) {
      return bot.answerCallbackQuery(callbackQuery.id, { text: "Invalid action", show_alert: true });
    }

    // read report
    const report = await db.tb_report.findUnique({ where: { id: reportId } });
    if (!report) {
      await bot.answerCallbackQuery(callbackQuery.id, { text: "Data tidak ditemukan", show_alert: true });
      return;
    }

    // update status
    const newStatus = action === "approve" ? "approved" : "rejected";
    const newApproveBy = from.username || from.first_name || String(from.id);
    await db.tb_report.update({ where: { id: reportId }, data: { status: newStatus, approveby: newApproveBy } });

    // popup small ack
    await bot.answerCallbackQuery(callbackQuery.id, { text: `Report #${reportId} ${newStatus}`, show_alert: false });

    // edit message text to show status & actor
    const actor = from.username || from.first_name || from.id;
    const newText = (msg.text || "") + `\n\n⚙️ Status: <b>${newStatus.toUpperCase()}</b> by ${escapeHtmlForTelegram(actor)}`;

    try {
      await bot.editMessageText(newText, {
        chat_id: msg.chat.id,
        message_id: msg.message_id,
        parse_mode: "HTML",
      });
    } catch (err) {}

    // remove inline keyboard
    try {
      await bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: msg.chat.id, message_id: msg.message_id });
    } catch (err) {
      console.warn("editMessageReplyMarkup failed (non-fatal):", err?.message || err);
    }
  } catch (err) {
    console.error("callback_query handling error:", err);
  }
});

/* ------------------ start server ------------------ */
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
