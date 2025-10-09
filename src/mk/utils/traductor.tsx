import lang from "../../config/lang";
const t = (s = "", p1 = "") => {
  let ini = "";
  let end = "";
  if (s.trim() == "") {
    return "";
  }
  if (s[0] == " ") ini = " ";
  if (s[s.length - 1] == " ") end = " ";

  s = s.trim();
  const upper = /^[A-Z0-9 ]+$/;
  const key = s.toLowerCase();

  let l = lang ? lang[key] || s : s;

  let c = ini + l + end;

  if (upper.test(s)) {
    c = ini + l.toUpperCase() + end;
  } else {
    if (upper.test(s[0])) {
      c = ini + l[0].toUpperCase() + l.substring(1) + end;
    }
  }
  // c = ini + c + end;
  if (p1 != "") c = c.replace("{0}", p1);
  return c;
};
export default t;
