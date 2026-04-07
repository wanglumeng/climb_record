function pad2(n) {
  return n < 10 ? `0${n}` : `${n}`;
}

function formatLocalDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  return `${y}-${m}-${day}`;
}

function parseYmd(ymd) {
  const [y, m, d] = (ymd || "").split("-").map((x) => parseInt(x, 10));
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function addMonths(date, delta) {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  d.setMonth(d.getMonth() + delta);
  return d;
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function getMonthTitle(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;
}

// weekStartsOn: 0=周日, 1=周一
function getMonthGrid(date, weekStartsOn = 1) {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  const startDow = start.getDay(); // 0..6 周日..周六
  const offset = (startDow - weekStartsOn + 7) % 7;

  const grid = [];
  const cursor = new Date(start);
  cursor.setDate(cursor.getDate() - offset);

  // 固定 6 行 * 7 列（覆盖所有月份）
  for (let i = 0; i < 42; i++) {
    const ymd = formatLocalDate(cursor);
    grid.push({
      ymd,
      day: cursor.getDate(),
      inMonth: cursor >= start && cursor <= end
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return grid;
}

module.exports = {
  formatLocalDate,
  parseYmd,
  addMonths,
  getMonthTitle,
  getMonthGrid
};

