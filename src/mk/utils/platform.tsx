export const isIos = () => {
  const userAgent = window.navigator.userAgent.toLowerCase();
  const isSafari =
    navigator.vendor &&
    navigator.vendor.indexOf("Apple") > -1 &&
    navigator.userAgent &&
    navigator.userAgent.indexOf("CriOS") == -1 &&
    navigator.userAgent.indexOf("FxiOS") == -1;
  const isSafari3 =
    /iphone|ipad|ipod/.test(userAgent) || /iP(hone|od|ad)/.test(userAgent);
  // @ts-ignore
  const isSafari2 = window.safari !== undefined;
  return isSafari || isSafari2 || isSafari3;
};

export const isMobile = () => {
  const navegador = navigator.userAgent;
  if (
    navigator.userAgent.match(/Android/i) ||
    navigator.userAgent.match(/webOS/i) ||
    navigator.userAgent.match(/iPhone/i) ||
    navigator.userAgent.match(/iPad/i) ||
    navigator.userAgent.match(/iPod/i) ||
    navigator.userAgent.match(/BlackBerry/i) ||
    navigator.userAgent.match(/Windows Phone/i) ||
    window.innerWidth <= 780
  )
    return true;
  return false;
};

export const isIphone = () => {
  return isMobile() && isIos();
};
