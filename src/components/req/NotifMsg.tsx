import { logError } from "@/mk/utils/logs";

const lAlert = ["", "Bajo", "Medio", "Alto"];
export const getDataNotif = (data: any, socket: boolean = false) => {
  if (typeof data == "string") {
    try {
      data = JSON.parse(data);
    } catch (error) {
      logError("Error parse data", data);
    }
  }
  // if (!data.info) data.info = data;

  let type = "info";
  let msg: any = "";
  if (data.info?.act == "alerts") {
    type = "warning";
    msg = (
      <>
        {data.title} <br /> {data.name}
      </>
    );
  }
  if (data.info?.act == "newEvent") {
    type = "info";
    msg = "El Residente " + data.info?.name + " ha creado un pago";
  }
  if (data.info?.act == "newVoucher") {
    type = "warning";
    msg = "El Residente " + data.info?.name + " ha subido un comprobante ";
  }

  if (data.info?.act == "newPayment") {
    type = "info";
    msg = "El Residente " + data.info?.name + " ha creado un pago";
  }

  if (msg == "") {
    msg = JSON.stringify(data);
    type = "error";
  }
  return { msg, type };
};
