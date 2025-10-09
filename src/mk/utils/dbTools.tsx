import { capitalize } from "./string";
import t from "./traductor";

export const getDefaultFormState = (fields: any = {}) => {
  let result: any = {};
  Object.keys(fields).map((key) => {
    if (fields[key].actions && fields[key].actions.length > 0) {
      result[key] = fields[key].value || "";
    }
  });
  return result;
};

export const getFields = (campos: any = []) => {
  let result: any = {};
  campos.map((key: any, index: number) => {
    let auxN: number = -1;
    let auxS: string = "";
    let auxA: any = [];

    const field: any = {
      required: false,
      readOnly: false,
      sortable: true,
      actions: ["add", "edit", "view"],
      search: true,
    };

    auxN = key.indexOf("|");
    if (auxN >= 0) {
      auxA = key.split("|");
      key = auxA[0];
      auxA[0] = "";
      auxA.map((item: any) => {
        if (item != "" && item.indexOf("::") > 0) {
          let auxA2: any = item.split("::");
          if (auxA2[0] == "_h_") {
            auxA2[0] = "header";
          }
          try {
            field[auxA2[0]] = JSON.parse(auxA2[1]);
          } catch (e) {
            field[auxA2[0]] = auxA2[1].replace("||", "|");
          }
        } else {
          if (item == "_h_") {
            field["header"] = true;
          } else {
            if (item != "") field["label"] = item;
          }
        }
      });
    }

    auxN = key.indexOf("*");
    if (auxN >= 0) {
      field.required = true;
      key = key.replace("*", "");
    }

    if (key == "id") {
      field.inputType = "hidden";
      field.search = false;
    }
    if (key == "password") {
      field.inputType = "password";
      field.rules = field.rules || "min:6|max:20";
      field.actions = ["add"];
      field.search = false;
    }
    if (key == "rol") {
      field.inputType = "select";
    }
    if (key == "status") {
      field.inputType = "select";
      field.options = field.options || [
        { id: "A", name: t("Active") },
        { id: "X", name: t("Inactive") },
      ];
      field.value = field.value || "A";
      field.badge = true;
    }
    if (key == "email") {
      field.inputType = "email";
      field.rules = field.rules || "email";
    }

    auxN = key.indexOf("_id");
    if (auxN >= 0) {
      field.label = field.label || key.substring(0, auxN);
      field.inputType = "select";
    }

    auxN = key.indexOf("image");
    if (auxN >= 0) {
      field.label = field.label || key.substring(0, auxN);
      field.inputType = "imageUploadEdit";
    }

    auxN = key.indexOf("is_");
    if (auxN == 0) {
      field.label = field.label || key.substring(3) + "?";
      field.inputType = "checkbox";
    }

    auxN = key.indexOf("can_");
    if (auxN == 0) {
      field.label = field.label || key.substring(4) + "?";
      field.inputType = "checkbox";
    }
    auxN = key.indexOf("_at");
    if (auxN >= 0) {
      field.label = field.label || key.substring(0, auxN);
      field.inputType = "date";
    }

    auxN = key.indexOf("date");
    if (auxN >= 0) {
      field.inputType = "date";
    }

    if (["checkbox"].includes(field.inputType)) {
      field.optionValue = field.optionValue || ["Y", "N"];
      field.optionLabel = field.optionLabel || [t("Yes"), t("Not")];
    }
    if (["select", "subSelect"].includes(field.inputType)) {
      field.optionValue = field.optionValue || "id";
      field.optionLabel = field.optionLabel || "name";
    }

    field.id = key;
    field.label = field.label || key;

    field.label = field.label.replace("_", " ");

    field.label = capitalize(field.label);

    if (key == "_[") {
      field.inputType = "flex";
      field.actions = [];
      field.search = false;
      key = "_[" + index;
    }
    if (key == "]_") {
      field.inputType = "flexend";
      field.actions = [];
      field.search = false;
      key = "]_" + index;
    }

    field.inputType = field.inputType || "text";
    result[key] = field;
  });

  result["_actions"] = {};
  result["_row"] = {
    className: "odd:bg-tWhite even:bg-gray-50 hover:bg-gray-200",
  };
  result["_sel"] = false;

  return result;
};
