import { JSX } from "react";

export const initialsName = (name: string) => {
  const names = (name + " ").split(" ");
  return (names[0].charAt(0) + names[1].charAt(0)).toUpperCase().trim();
};
export const capitalize = (s: any) => {
  if (typeof s !== "string") return "";
  s = s.toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
};
export const capitalizeWords = (s: any) => {
  if (typeof s !== "string") return "";
  const words = (s.toLowerCase() + " ").split(" ");
  let result = "";
  words.forEach((word) => {
    result += capitalize(word) + " ";
  });
  return result.trim();
};
export const getUrlImages = (url: string) => {
  const originalString = process.env.NEXT_PUBLIC_API_URL as string;
  const lastIndexOfString = originalString.lastIndexOf("/api");
  if (lastIndexOfString === -1) {
    return originalString + url;
  }
  const replacementString = "/storage";
  const newUrl =
    originalString.substring(0, lastIndexOfString) + replacementString + url;
  return newUrl;
};

export const getFullName = (
  data: {
    name?: string;
    middle_name?: string;
    last_name?: string;
    mother_last_name?: string;
  },
  format: string = "NMLO"
): string => {
  if (!data) {
    return "";
  }
  const { name, middle_name, last_name, mother_last_name } = data;
  let fullName = "";
  if (name && format.indexOf("N") > -1) {
    fullName += name + " ";
  }
  if (name && format.indexOf("n") > -1) {
    fullName += name.slice(0, 1).toUpperCase() + ". ";
  }

  if (middle_name && format.indexOf("M") > -1) {
    fullName += middle_name + " ";
  }
  if (middle_name && format.indexOf("m") > -1) {
    fullName += middle_name.slice(0, 1).toUpperCase() + ". ";
  }

  if (last_name && format.indexOf("L") > -1) {
    fullName += last_name + " ";
  }
  if (last_name && format.indexOf("l") > -1) {
    fullName += last_name.slice(0, 1).toUpperCase() + ". ";
  }

  if (mother_last_name && format.indexOf("O") > -1) {
    fullName += mother_last_name + " ";
  }
  if (mother_last_name && format.indexOf("o") > -1) {
    fullName += mother_last_name.slice(0, 1).toUpperCase() + ". ";
  }
  return fullName.trim();
};

export const displayObjectAsHtml = (obj: Record<string, any>): JSX.Element => {
  return (
    <ul
      className="text-[8px] font-mono font-light"
      style={{ lineHeight: "8px" }}
    >
      {Object.entries(obj).map(([key, value]) => (
        <li key={key}>
          <span className="font-extrabold">{key}: </span>
          {value}
        </li>
      ))}
    </ul>
  );
};
// document.addEventListener("keydown", function (e) {
//   e.preventDefault();
//   if (e.ctrlKey && e.key === "p") {
//     takeScreenshot(function (screenshot) {

//       printPage(screenshot);
//     });
//   }
// });
// export function printPage(screenshot) {
//   var win: any = window.open("", "prueba");
//   win.document.write("<html>");
//   win.document.write("<head></head>");
//   win.document.write("<body>");
//   win.document.write('<img src="' + screenshot + '"/>');
//   win.document.write("</body>");
//   win.document.write("</html>");
//   win.print();
//   win.close();
// }
export function takeScreenshot(cb: any) {
  // html2canvas(document.getElementById('area'), {
  //   useCORS: true,
  //   onrendered: function (canvas) {
  //     var image = canvas.toDataURL();
  //     cb(image);
  //   }
  // });
}
export const PREFIX_COUNTRY = [
  { id: "54", name: "🇦🇷 Argentina", label: "+54 Argentina" }, // Argentina
  { id: "297", name: "🇦🇼 Aruba", label: "+297 Aruba" }, // Aruba
  { id: "591", name: "🇧🇴 Bolivia", label: "+591 Bolivia" }, // Bolivia
  { id: "55", name: "🇧🇷 Brasil", label: "+55 Brasil" }, // Brasil
  // {id: '1', name: '🇧🇸 Bahamas'}, // Bahamas
  // {id: '1', name: '🇧🇧 Barbados'}, // Barbados
  // {id: '1', name: '🇧🇿 Belice'}, // Belice
  // {id: '1', name: '🇧🇲 Bermudas'}, // Bermudas
  // {id: '1', name: '🇨🇦 Canadá'}, // Canadá
  { id: "56", name: "🇨🇱 Chile", label: "+56 Chile" }, // Chile
  { id: "57", name: "🇨🇴 Colombia", label: "+57 Colombia" }, // Colombia
  { id: "506", name: "🇨🇷 Costa Rica", label: "+506 Costa Rica" }, // Costa Rica
  { id: "53", name: "🇨🇺 Cuba", label: "+53 Cuba" }, // Cuba
  // {id: '1', name: '🇩🇲 Dominica'}, // Dominica
  // {id: '1', name: '🇩🇴 República Dominicana'}, // República Dominicana
  { id: "593", name: "🇪🇨 Ecuador", label: "+593 Ecuador" }, // Ecuador
  { id: "503", name: "🇸🇻 El Salvador", label: "+503 El Salvador" }, // El Salvador
  { id: "500", name: "🇫🇰 Islas Malvinas", label: "+500 Islas Malvinas" }, // Islas Malvinas (Falkland Islands)
  // {id: '1', name: '🇬🇩 Granada'}, // Granada
  { id: "502", name: "🇬🇹 Guatemala", label: "+502 Guatemala" }, // Guatemala
  { id: "592", name: "🇬🇾 Guyana", label: "+592 Guyana" }, // Guyana
  { id: "509", name: "🇭🇹 Haití", label: "+509 Haití" }, // Haití
  { id: "504", name: "🇭🇳 Honduras", label: "+504 Honduras" }, // Honduras
  { id: "52", name: "🇲🇽 México", label: "+52 México" }, // México
  // {id: '1', name: '🇯🇲 Jamaica'}, // Jamaica
  // {id: '1', name: '🇰🇳 San Cristóbal y Nieves'}, // San Cristóbal y Nieves
  // {id: '1', name: '🇱🇨 Santa Lucía'}, // Santa Lucía
  // {id: '1', name: '🇻🇨 San Vicente y las Granadinas'}, // San Vicente y las Granadinas
  { id: "505", name: "🇳🇮 Nicaragua", label: "+505 Nicaragua" }, // Nicaragua
  { id: "507", name: "🇵🇦 Panamá", label: "+507 Panamá" }, // Panamá
  { id: "595", name: "🇵🇾 Paraguay", label: "+595 Paraguay" }, // Paraguay
  { id: "51", name: "🇵🇪 Perú", label: "+51 Perú" }, // Perú
  // {id: '1', name: '🇵🇷 Puerto Rico'}, // Puerto Rico
  // {id: '1', name: '🇹🇹 Trinidad y Tobago'}, // Trinidad y Tobago
  { id: "1", name: "🇺🇸 Estados Unidos", label: "+1 Estados Unidos" }, // Estados Unidos
  { id: "598", name: "🇺🇾 Uruguay", label: "+598 Uruguay" }, // Uruguay
  { id: "58", name: "🇻🇪 Venezuela", label: "+58 Venezuela" }, // Venezuela
];
