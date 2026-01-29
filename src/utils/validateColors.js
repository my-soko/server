// utils/validateColors.js
export const validateColors = (colors) => {
  if (!colors) return []; 

  let arr;
  if (typeof colors === "string") {
    try {
      arr = JSON.parse(colors);
      if (!Array.isArray(arr)) arr = [];
    } catch {
      arr = [];
    }
  } else if (Array.isArray(colors)) {
    arr = colors;
  } else {
    arr = [];
  }

  return arr.map((c) => ({
    name: String(c.name || "").trim().slice(0, 30),
    hex: /^#([0-9A-F]{3}){1,2}$/i.test(c.hex) ? c.hex : "#000000",
    isCustom: Boolean(c.isCustom),
  }));
};
