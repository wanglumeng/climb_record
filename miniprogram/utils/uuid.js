function uuidv4() {
  // 非加密用途的 UUID（够用）
  const s = [];
  const hex = "0123456789abcdef";
  for (let i = 0; i < 36; i++) s[i] = hex[Math.floor(Math.random() * 16)];
  s[14] = "4";
  // eslint-disable-next-line no-bitwise
  s[19] = hex[(parseInt(s[19], 16) & 0x3) | 0x8];
  s[8] = s[13] = s[18] = s[23] = "-";
  return s.join("");
}

module.exports = { uuidv4 };

