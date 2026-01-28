let trades = JSON.parse(localStorage.getItem("nas100Trades")) || [];

function renderTrades() {
  const tbody = document.getElementById("tradeBody");
  tbody.innerHTML = "";

  trades.forEach((trade, index) => {
    const row = tbody.insertRow();
    const isWin = trade.pl > 0;
    row.className = isWin ? "win" : "loss";

    row.innerHTML = `
                    <td>${trade.date}</td>
                    <td>${trade.time}</td>
                    <td><strong>${trade.direction}</strong></td>
                    <td>${trade.entry}</td>
                    <td>${trade.stop}</td>
                    <td>${trade.tp1}</td>
                    <td>${trade.tp2}</td>
                    <td>${trade.exit}</td>
                    <td><strong>${trade.pl > 0 ? "+" : ""}${trade.pl}</strong></td>
                    <td>${trade.rr}</td>
                    <td>${trade.rulesFollowed}%</td>
                    <td>${trade.notes}</td>
                    <td class="action-cell">
                        <button class="delete-btn" onclick="deleteTrade(${index})">Delete</button>
                    </td>
                `;
  });

  updateStats();
}

function updateStats() {
  const total = trades.length;
  const wins = trades.filter((t) => t.pl > 0).length;
  const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : 0;
  const totalPL = trades
    .reduce((sum, t) => sum + parseFloat(t.pl), 0)
    .toFixed(1);
  const avgRR =
    total > 0
      ? (trades.reduce((sum, t) => sum + parseFloat(t.rr), 0) / total).toFixed(
          2,
        )
      : 0;
  const avgRules =
    total > 0
      ? (
          trades.reduce((sum, t) => sum + parseFloat(t.rulesFollowed), 0) /
          total
        ).toFixed(0)
      : 0;

  document.getElementById("totalTrades").textContent = total;
  document.getElementById("winRate").textContent = winRate + "%";
  document.getElementById("totalPL").textContent = totalPL;
  document.getElementById("avgRR").textContent = avgRR;
  document.getElementById("rulesFollowed").textContent = avgRules + "%";
}

function addTrade() {
  document.getElementById("tradeModal").style.display = "flex";
  document.getElementById("tradeDate").valueAsDate = new Date();
  const now = new Date();
  document.getElementById("tradeTime").value = now.toTimeString().slice(0, 5);
}

function closeModal() {
  document.getElementById("tradeModal").style.display = "none";
  clearForm();
}

function clearForm() {
  document.getElementById("tradeDate").value = "";
  document.getElementById("tradeTime").value = "";
  document.getElementById("tradeDirection").value = "LONG";
  document.getElementById("entryPrice").value = "";
  document.getElementById("stopLoss").value = "";
  document.getElementById("tp1").value = "";
  document.getElementById("tp2").value = "";
  document.getElementById("exitPrice").value = "";
  document.getElementById("tradeNotes").value = "";
  document
    .querySelectorAll(".rule-check")
    .forEach((cb) => (cb.checked = false));
}

function saveTrade() {
  const entry = parseFloat(document.getElementById("entryPrice").value);
  const stop = parseFloat(document.getElementById("stopLoss").value);
  const exit = parseFloat(document.getElementById("exitPrice").value);
  const direction = document.getElementById("tradeDirection").value;
  const date = document.getElementById("tradeDate").value;
  const time = document.getElementById("tradeTime").value;

  // Validation
  if (!date || !time) {
    alert("Please enter date and time");
    return;
  }

  if (!entry || !stop || !exit) {
    alert("Please fill in Entry Price, Stop Loss, and Exit Price");
    return;
  }

  if (isNaN(entry) || isNaN(stop) || isNaN(exit)) {
    alert("Please enter valid numbers for prices");
    return;
  }

  // Calculate metrics
  const risk = Math.abs(entry - stop);
  const pl = direction === "LONG" ? exit - entry : entry - exit;
  const rr = risk !== 0 ? (pl / risk).toFixed(2) : "0.00";

  const checkedRules = document.querySelectorAll(".rule-check:checked").length;
  const rulesFollowed = ((checkedRules / 6) * 100).toFixed(0);

  const tp1Value = document.getElementById("tp1").value;
  const tp2Value = document.getElementById("tp2").value;

  const trade = {
    date: date,
    time: time,
    direction: direction,
    entry: entry.toFixed(2),
    stop: stop.toFixed(2),
    tp1: tp1Value ? parseFloat(tp1Value).toFixed(2) : "-",
    tp2: tp2Value ? parseFloat(tp2Value).toFixed(2) : "-",
    exit: exit.toFixed(2),
    pl: pl.toFixed(2),
    rr: rr,
    rulesFollowed: rulesFollowed,
    notes: document.getElementById("tradeNotes").value || "-",
  };

  trades.push(trade);
  localStorage.setItem("nas100Trades", JSON.stringify(trades));
  renderTrades();
  closeModal();

  // Show success message
  alert("Trade saved successfully!");
}

function deleteTrade(index) {
  if (confirm("Are you sure you want to delete this trade?")) {
    trades.splice(index, 1);
    localStorage.setItem("nas100Trades", JSON.stringify(trades));
    renderTrades();
  }
}

function clearAllTrades() {
  if (
    confirm(
      "Are you sure you want to delete ALL trades? This cannot be undone.",
    )
  ) {
    trades = [];
    localStorage.removeItem("nas100Trades");
    renderTrades();
  }
}

function exportToCSV() {
  if (trades.length === 0) {
    alert("No trades to export");
    return;
  }

  const headers = [
    "Date",
    "Time",
    "Direction",
    "Entry",
    "Stop",
    "TP1",
    "TP2",
    "Exit",
    "P&L (pts)",
    "R:R",
    "Rules Followed %",
    "Notes",
  ];
  const rows = trades.map((t) => [
    t.date,
    t.time,
    t.direction,
    t.entry,
    t.stop,
    t.tp1,
    t.tp2,
    t.exit,
    t.pl,
    t.rr,
    t.rulesFollowed,
    t.notes,
  ]);

  let csv = headers.join(",") + "\n";
  rows.forEach((row) => {
    csv += row.map((cell) => `"${cell}"`).join(",") + "\n";
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `NAS100_Trades_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
}

// Close modal when clicking outside
window.onclick = function (event) {
  const modal = document.getElementById("tradeModal");
  if (event.target === modal) {
    closeModal();
  }
};

// Initialize
renderTrades();
