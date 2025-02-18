import { IconDownload } from "@/components/layout/icons/IconsBiblioteca";
import Input from "@/mk/components/forms/Input/Input";
import Select from "@/mk/components/forms/Select/Select";
import TextArea from "@/mk/components/forms/TextArea/TextArea";
import { UploadFile } from "@/mk/components/forms/UploadFile/UploadFile";
import UploadFileMultiple from "@/mk/components/forms/UploadFile/UploadFileMultiple";
import { getUrlImages } from "@/mk/utils/string";
import { ActionType } from "@/mk/utils/validate/Rules";
import { memo } from "react";

export type FormFunctionRenderType = {
  item: Record<string, any>;
  key?: string;
  _key?: string;
  user: Record<string, any>;
  onChange: (e: any) => void;
  error?: Record<string, any>;
  extraData?: any;
  action: any;
};

const rigthFile = (data: {
  key: string;
  user?: Record<string, any>;
  item: Record<string, any>;
  field?: Record<string, any>;
  extraData?: any;
}) => {
  if (!data.item.ext) return null;
  return (
    <div style={{ flexShrink: "1" }}>
      <IconDownload
        size={data.field?.size || 40}
        color={data.field?.color || "white"}
        onClick={() => {
          window.open(
            getUrlImages(
              "/" +
                data.field?.prefix +
                "-" +
                data.item.id +
                "." +
                data.item.ext +
                "?" +
                data.item.updated_at
            ),
            "_blank"
          );
        }}
      />
    </div>
  );
};

const LeftRigthElement = memo(
  ({
    children,
    field,
    item,
    error = {},
    user,
    onChange,
    extraData,
    action,
  }: {
    children: any;
    field: any;
    item: any;
    error: any;
    user: any;
    onChange: (e: any) => void;
    extraData?: any;
    action: any;
  }) => {
    if (!field.onLeft && !field.onRigth && !field.onTop && !field.onBottom)
      return children;
    const props: FormFunctionRenderType = {
      item,
      _key: field.key,
      user,
      onChange,
      error,
      extraData,
      action,
    };
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--spM)",
        }}
      >
        {field.onTop?.(props)}
        <div
          style={{
            display: "flex",
            gap: "var(--spM)",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {field.onLeft?.(props)}
          {children}
          {field.onRigth?.(props)}
        </div>
        {field.onBottom?.(props)}
      </div>
    );
  }
);
LeftRigthElement.displayName = "LeftRigthElement";

const FormElement = memo(
  ({
    field,
    item,
    i,
    onChange,
    onBlur,
    error,
    setError,
    data,
  }: {
    field: any;
    item: any;
    i?: number;
    onChange: (e: any) => void;
    onBlur?: (e: any) => void;
    error: any;
    setError: Function;
    data: { user: any; action: ActionType; mod: any; extraData: any };
  }) => {
    const _field = {
      ...field,
      ...(field[data?.action] ? field[data?.action] : {}),
    };
    if (_field.onHide?.({ item, user: data?.user, key: _field.key }))
      return null;
    const options =
      data?.mod.extraData && _field.optionsExtra
        ? [
            ...(_field.addOptions || []),
            ...(data?.extraData[_field.optionsExtra] || []),
          ]
        : [...(_field.addOptions || []), ...(_field.options || [])];

    const props = {
      _key: _field.key,
      field: _field,
      item: item,
      error: error,
      user: data?.user,
      onChange: onChange,
      extraData: data?.extraData,
      action: data.action,
    };
    let val = item[_field.key] || "";
    switch (_field.type) {
      case "text":
      case "date":
      case "datetime-local":
      case "number":
        if (_field.type == "date") {
          val = val.split(" ")[0];
          val = val.split("T")[0];
        }
        return (
          <LeftRigthElement
            // key={_field.key}
            // field={_field}
            // item={item}
            // error={error}
            // user={data?.user}
            // onChange={onChange}
            {...props}
          >
            <Input
              type={_field.type}
              name={_field.key}
              value={val}
              onChange={onChange}
              label={_field.label}
              disabled={_field.disabled}
              onBlur={onBlur || _field.onBlur}
              error={error}
              onFocus={_field.onFocus}
              iconLeft={_field.iconLeft}
              iconRight={_field.iconRight}
              placeholder={_field.placeholder}
              className={_field.className}
              style={_field.style}
              readOnly={_field.readOnly}
              required={_field.required}
              maxLength={_field.maxLength}
            />
          </LeftRigthElement>
        );
      case "textArea":
        return (
          <LeftRigthElement {...props}>
            <TextArea
              name={_field.key}
              value={item[_field.key]}
              onChange={onChange}
              label={_field.label}
              disabled={_field.disabled}
              onBlur={onBlur}
              error={error}
              onFocus={_field.onFocus}
              iconLeft={_field.iconLeft}
              iconRight={_field.iconRight}
              placeholder={_field.placeholder}
              className={_field.className}
              style={_field.style}
              readOnly={_field.readOnly}
              required={_field.required}
              lines={_field.lines}
              isLimit={_field.isLimit}
              maxLength={_field.maxLength}
            />
          </LeftRigthElement>
        );
      case "imageUpload":
        return (
          <LeftRigthElement {...props}>
            <UploadFile
              name={_field.key}
              // value={item[_field.key]}
              value={
                item[_field.id || "id"]
                  ? getUrlImages(
                      "/" +
                        _field.prefix +
                        "-" +
                        item[_field.id || "id"] +
                        ".webp?" +
                        item.updated_at
                    )
                  : ""
              }
              onChange={onChange}
              label={_field.label}
              disabled={_field.disabled}
              onBlur={onBlur}
              error={error}
              onFocus={_field.onFocus}
              iconLeft={_field.iconLeft}
              iconRight={_field.iconRight}
              placeholder={_field.placeholder}
              className={_field.className}
              style={_field.style}
              readOnly={_field.readOnly}
              required={_field.required}
              ext={_field.ext || ["jpg", "png", "jpeg"]}
              setError={setError}
              img={true}
              item={item}
              editor={_field.editor}
              sizePreview={_field.sizePreview}
            />
          </LeftRigthElement>
        );
      case "imageUploadMultiple":
        return (
          <LeftRigthElement {...props}>
            <UploadFileMultiple
              name={_field.key}
              value={item[_field.key]}
              onChange={onChange}
              label={_field.label}
              disabled={_field.disabled}
              onBlur={onBlur}
              error={error}
              onFocus={_field.onFocus}
              iconLeft={_field.iconLeft}
              iconRight={_field.iconRight}
              placeholder={_field.placeholder}
              className={_field.className}
              style={_field.style}
              readOnly={_field.readOnly}
              required={_field.required}
              ext={_field.ext || ["jpg", "png", "jpeg"]}
              setError={setError}
              img={true}
              maxFiles={_field.maxFiles}
              prefix={_field.prefix}
              images={item[_field.images]}
              item={item}
              editor={_field.editor}
              sizePreview={_field.sizePreview}
              // autoOpen={data?.action == "add"}
            />
          </LeftRigthElement>
        );
      case "fileUpload":
        return (
          <LeftRigthElement {...props}>
            <UploadFile
              name={_field.key}
              value={item[_field.key]}
              onChange={onChange}
              label={_field.label}
              disabled={_field.disabled}
              onBlur={onBlur}
              error={error}
              onFocus={_field.onFocus}
              iconLeft={_field.iconLeft}
              iconRight={_field.iconRight}
              placeholder={_field.placeholder}
              className={_field.className}
              style={_field.style}
              readOnly={_field.readOnly}
              required={_field.required}
              ext={_field.ext || ["pdf", "doc", "docx", "xls", "xlsx"]}
              setError={setError}
            />
          </LeftRigthElement>
        );
      case "select":
        return (
          <LeftRigthElement {...props}>
            <Select
              name={_field.key}
              value={item[_field.key]}
              onChange={onChange}
              label={_field.label}
              disabled={_field.disabled}
              onBlur={onBlur}
              error={error}
              onFocus={_field.onFocus}
              iconLeft={_field.iconLeft}
              iconRight={_field.iconRight}
              placeholder={_field.placeholder}
              className={_field.className}
              style={_field.style}
              readOnly={_field.readOnly}
              required={_field.required}
              options={options}
              optionLabel={_field.optionLabel}
              optionValue={_field.optionValue}
              multiSelect={_field.multiSelect}
              filter={_field.filter}
            />
          </LeftRigthElement>
        );
      default:
        return (
          <div>
            {_field.label}:{" "}
            {_field.onRender
              ? _field.onRender({
                  value: item[_field.key],
                  key: _field.key,
                  item,
                  i,
                })
              : item[_field.key]}
          </div>
        );
    }
  }
);
FormElement.displayName = "FormElement";
export default FormElement;
