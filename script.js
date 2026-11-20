
const seed = [
  { id: 1, name: "Monthly salary", amount: 65000, type: "income", category: "Salary", date: "2026-11-01", note: "November salary" },
  { id: 2, name: "Rent", amount: 18000, type: "expense", category: "Bills", date: "2026-11-02", note: "Apartment rent" },
  { id: 3, name: "Groceries", amount: 2450, type: "expense", category: "Food", date: "2026-11-04", note: "Weekly groceries" },
  { id: 4, name: "Cab ride", amount: 480, type: "expense", category: "Travel", date: "2026-11-05", note: "Office commute" },
  { id: 5, name: "New sneakers", amount: 3200, type: "expense", category: "Shopping", date: "2026-11-07", note: "Running shoes" },
  { id: 6, name: "Netflix", amount: 649, type: "expense", category: "Entertainment", date: "2026-11-08", note: "Subscription" },
  { id: 7, name: "Gym membership", amount: 1200, type: "expense", category: "Health", date: "2026-11-09", note: "Monthly plan" },
  { id: 8, name: "Freelance design", amount: 8500, type: "income", category: "Other", date: "2026-11-10", note: "Project payment" },
  { id: 9, name: "Cafe brunch", amount: 780, type: "expense", category: "Food", date: "2026-11-12", note: "Sunday brunch" },
  { id: 10, name: "Electricity bill", amount: 1850, type: "expense", category: "Bills", date: "2026-11-13", note: "Power bill" }
];

const budget = 50000;

const $ = (id) => document.getElementById(id);

// Local date helper (avoids UTC date mismatch)
function localISODate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

const today = new Date();
const isoToday = localISODate(today);

// Load transactions safely
let transactions;

try {
  const saved = JSON.parse(
    localStorage.getItem("novaTransactions")
  );

  transactions = Array.isArray(saved) ? saved : seed;
} catch {
  transactions = seed;
}

let chart = null;

// Currency formatter
const fmt = (n) =>
  "₹" + Math.round(n).toLocaleString("en-IN");

// Set today's date in form
$("fDate").value = isoToday;

// Dashboard subtitle
$("todayText").textContent =
  `Here’s your money snapshot for ${today.toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "long",
      year: "numeric"
    }
  )}.`;

// Save transactions
function save() {
  localStorage.setItem(
    "novaTransactions",
    JSON.stringify(transactions)
  );
}

// Get current month's transactions
function monthData() {
  return transactions.filter(
    (t) => t.date?.slice(0, 7) === isoToday.slice(0, 7)
  );
}

// Calculate totals
function totals() {
  const month = monthData();

  const income = month
    .filter((t) => t.type === "income")
    .reduce((a, t) => a + Number(t.amount), 0);

  const expenses = month
    .filter((t) => t.type === "expense")
    .reduce((a, t) => a + Number(t.amount), 0);

  return {
    income,
    expenses,
    balance: income - expenses,
    savings: income - expenses
  };
}

// Render dashboard summary
function renderSummary() {
  const { income, expenses, balance, savings } = totals();

  $("balanceAmount").textContent = fmt(balance);

  $("savingAmount").textContent =
    fmt(Math.max(savings, 0));

  $("savingPct").textContent = income
    ? `${Math.max(
        0,
        Math.round((savings / income) * 100)
      )}% of income`
    : "0% of income";

  const used = Math.min(100, (expenses / budget) * 100);

  $("budgetProgress").style.width = used + "%";

  $("budgetText").textContent =
    `${fmt(expenses)} / ${fmt(budget)}`;

  $("balanceNote").textContent =
    balance >= 0
      ? "You are on track this month"
      : "Watch your spending this month";

  $("dailyAvg").textContent = fmt(
    expenses / Math.max(today.getDate(), 1)
  );

  $("vsMonth").textContent =
    expenses > budget ? "Over budget" : "On budget";
}

// Category icons
const icons = {
  Food: "🍜",
  Travel: "🚕",
  Shopping: "🛍️",
  Bills: "⌂",
  Entertainment: "🎬",
  Health: "♥️",
  Salary: "↗️",
  Other: "✦"
};

// Render category breakdown
function renderCategories() {
  const month = monthData().filter(
    (t) => t.type === "expense"
  );

  const categoryTotals = {};

  month.forEach((t) => {
    categoryTotals[t.category] =
      (categoryTotals[t.category] || 0) +
      Number(t.amount);
  });

  const sorted = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1]);

  const grand = sorted.reduce(
    (a, [, v]) => a + v,
    0
  );

  $("categoryTotal").textContent = fmt(grand);

  $("categoryList").innerHTML =
    sorted
      .slice(0, 5)
      .map(([cat, val]) => {
        const pct = grand
          ? Math.round((val / grand) * 100)
          : 0;

        return `
          <div class="cat-row">
            <div class="cat-icon">
              ${icons[cat] || "✦"}
            </div>

            <div>
              <div class="cat-label">
                ${escapeHtml(cat)}
              </div>

              <div class="cat-meta">
                ${pct}% of spending
              </div>
            </div>

            <div class="cat-value">
              ${fmt(val)}
            </div>

            <div class="cat-bar">
              <span style="width:${pct}%"></span>
            </div>
          </div>
        `;
      })
      .join("") ||
    '<div class="empty">No spending data yet.</div>';
}

// Render transactions
function renderTransactions() {
  const q = $("searchInput").value
    .toLowerCase()
    .trim();

  const cat = $("categoryFilter").value;
  const type = $("typeFilter").value;

  const filtered = transactions
    .filter((t) => {
      const searchText =
        `${t.name} ${t.category} ${t.note || ""}`
          .toLowerCase();

      return (
        (!q || searchText.includes(q)) &&
        (cat === "all" || t.category === cat) &&
        (type === "all" || t.type === type)
      );
    })
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) ||
        b.id - a.id
    );

  $("txList").innerHTML = filtered.length
    ? filtered
        .map(
          (t) => `
            <div class="tx">

              <div class="tx-icon">
                ${icons[t.category] || "✦"}
              </div>

              <div>
                <div class="tx-title">
                  ${escapeHtml(t.name)}
                </div>

                <div class="tx-sub">
                  ${escapeHtml(t.category)}
                  ${
                    t.note
                      ? " · " + escapeHtml(t.note)
                      : ""
                  }
                </div>
              </div>

              <div class="tx-date">
                ${new Date(
                  t.date + "T00:00:00"
                ).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short"
                })}
              </div>

              <div class="tx-amount ${
                t.type === "income" ? "income" : ""
              }">
                ${t.type === "income" ? "+" : "-"}${fmt(
                  t.amount
                ).slice(1)}
              </div>

            </div>
          `
        )
        .join("")
    : '<div class="empty">No transactions match your filters.</div>';
}

// Prevent HTML injection
function escapeHtml(s) {
  return String(s).replace(
    /[&<>'"]/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;"
      })[c]
  );
}

// Render cashflow chart
function renderChart() {
  if (typeof Chart === "undefined") {
    console.error("Chart.js is not loaded.");
    return;
  }

  const days = Number($("periodSelect").value);

  const labels = [];
  const income = [];
  const expenses = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();

    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);

    const key = localISODate(d);

    labels.push(
      d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short"
      })
    );

    const day = transactions.filter(
      (t) => t.date === key
    );

    income.push(
      day
        .filter((t) => t.type === "income")
        .reduce((a, t) => a + Number(t.amount), 0)
    );

    expenses.push(
      day
        .filter((t) => t.type === "expense")
        .reduce((a, t) => a + Number(t.amount), 0)
    );
  }

  const ctx = $("cashflowChart").getContext("2d");

  if (chart) {
    chart.destroy();
  }

  const styles = getComputedStyle(document.body);

  chart = new Chart(ctx, {
    type: "line",

    data: {
      labels,

      datasets: [
        {
          label: "Income",
          data: income,

          borderColor: "#16b881",
          backgroundColor: "rgba(22,184,129,.10)",

          fill: true,
          tension: 0.4,

          borderWidth: 2,
          pointRadius: 0
        },

        {
          label: "Expenses",
          data: expenses,

          borderColor: "#6c5ce7",
          backgroundColor: "rgba(108,92,231,.08)",

          fill: true,
          tension: 0.4,

          borderWidth: 2,
          pointRadius: 0
        }
      ]
    },

    options: {
      responsive: true,
      maintainAspectRatio: false,

      interaction: {
        mode: "index",
        intersect: false
      },

      plugins: {
        legend: {
          position: "bottom",

          labels: {
            boxWidth: 9,
            usePointStyle: true,
            color: styles.getPropertyValue("--muted")
          }
        }
      },

      scales: {
        x: {
          grid: {
            display: false
          },

          ticks: {
            color: styles.getPropertyValue("--muted"),
            maxTicksLimit: 7
          }
        },

        y: {
          beginAtZero: true,

          grid: {
            color: styles.getPropertyValue("--line")
          },

          ticks: {
            color: styles.getPropertyValue("--muted"),

            callback: (v) =>
              "₹" + (v >= 1000 ? v / 1000 + "k" : v)
          }
        }
      }
    }
  });
}

// Refresh entire dashboard
function refresh() {
  renderSummary();
  renderCategories();
  renderTransactions();
  renderChart();
}

// Open add transaction modal
$("addBtn").onclick = () => {
  $("modalBackdrop").classList.add("show");
  $("fName").focus();
};

// Close modal
function closeModal() {
  $("modalBackdrop").classList.remove("show");

  $("transactionForm").reset();

  $("fDate").value = isoToday;
}

$("closeModal").onclick = closeModal;
$("cancelBtn").onclick = closeModal;

// Close when clicking outside modal
$("modalBackdrop").addEventListener("click", (e) => {
  if (e.target.id === "modalBackdrop") {
    closeModal();
  }
});

// Add transaction
$("transactionForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const name = $("fName").value.trim();
  const amount = Number($("fAmount").value);
  const date = $("fDate").value;

  if (!name || !Number.isFinite(amount) || amount <= 0 || !date) {
    showToast("Please enter valid transaction details");
    return;
  }

  const obj = {
    id: Date.now(),
    name,
    amount,
    type: $("fType").value,
    category: $("fCategory").value,
    date,
    note: $("fNote").value.trim()
  };

  transactions.push(obj);

  save();
  closeModal();
  refresh();

  showToast("Transaction added successfully");
});

// Search and filters
[
  "searchInput",
  "categoryFilter",
  "typeFilter"
].forEach((id) => {
  $(id).addEventListener("input", renderTransactions);
});

// Chart period
$("periodSelect").addEventListener(
  "change",
  renderChart
);

// Dark/light theme
$("themeBtn").onclick = () => {
  document.body.dataset.theme =
    document.body.dataset.theme === "dark"
      ? "light"
      : "dark";

  localStorage.setItem(
    "novaTheme",
    document.body.dataset.theme
  );

  renderChart();
};

// Load saved theme
document.body.dataset.theme =
  localStorage.getItem("novaTheme") || "light";

// Toast notification
function showToast(message) {
  const t = $("toast");

  t.textContent = message;
  t.classList.add("show");

  setTimeout(() => {
    t.classList.remove("show");
  }, 2200);
}

// Escape key closes modal
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeModal();
  }
});

// Initial render
refresh();
