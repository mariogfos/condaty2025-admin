import { useEffect, useState } from "react";
import { PropsTypeInputBase } from "../ControlLabel";
import { getUrlImages } from "@/mk/utils/string";
import { UploadFileM } from "./UploadFileM";
import styles from "./uploadFile.module.css";

interface PropsType extends PropsTypeInputBase {
  ext: string[];
  setError: Function;
  img?: boolean;
  maxFiles?: number;
  prefix?: string;
  images?: any[];
  item: any;
  editor?: boolean | { width: number; height: number };
  sizePreview?: { width: string; height: string };
  // autoOpen?: boolean;
}

const UploadFileMultiple = ({
  className = "",
  maxFiles = 1,
  images = [{ id: 0 }],
  prefix = "",
  item,
  name,
  onChange,
  editor = false,
  sizePreview = { width: "100px", height: "100px" },
  // autoOpen = true,
  value: initialValue,
  ...props
}: PropsType) => {
  const [imgs, setImgs]: any = useState(images);
  const [value, setValue]: any = useState(initialValue || {});

  useEffect(() => {
    if (imgs[0]?.id != 0 && imgs?.length < maxFiles) {
      setImgs([...imgs, { id: 0 }]);
    }
  }, []);

  useEffect(() => {
    if (imgs?.length < maxFiles && imgs?.length <= Object.keys(value).length) {
      setImgs([...imgs, { id: 0 }]);
    }
  }, [imgs, maxFiles, value]);

  useEffect(() => {
    // Initialize or update images when formState changes
    if (item?.[name] || (item?.images && item?.id)) {
      let currentImages;

      if (item?.images && item?.id) {
        // Handle existing images from edit mode
        currentImages = item.images.map((img: any) => ({
          id: img.id,
          ext: img.ext || "webp",
        }));
      } else {
        // Handle new images being added
        currentImages = Object.values(item[name]).filter(
          (img: any) => img?.file !== "delete"
        );
      }

      const hasEmptySlot = currentImages.length < maxFiles;
      setImgs([...currentImages, ...(hasEmptySlot ? [{ id: 0 }] : [])]);

      if (item?.images && item?.id) {
        // Convert existing images to the expected format
        const existingImagesValue = currentImages.reduce(
          (acc: any, img: any, index: number) => {
            acc[name + index] = { file: "", id: img.id, ext: img.ext };
            return acc;
          },
          {}
        );
        setValue({ ...existingImagesValue, ...item[name] });
      } else {
        setValue(item[name]);
      }
    }
  }, [item, name, maxFiles]);

  const deleteImg = (img: string, del = true) => {
    const indice = img.replace(name, "").split("-")[0];
    const id = img.replace(name, "").split("-")[1] || 0;
    let act = "delete";

    let newE: any = {};
    if (id == 0) {
      act = "";

      const newI: any = [];
      imgs.map((it: any, i: number) => {
        if (i !== parseInt(indice) && (value[name + i] || it.id != 0)) {
          newI.push(imgs[i]);
          if (value[name + i]) newE[name + (newI.length - 1)] = value[name + i];
        }
      });
      newI.push({ id: 0 });
      setValue(newE);
      setImgs(newI);
    } else {
      if (value[name + indice]?.file == "delete") act = "";
      newE = {
        ...value,
        [name + indice]: { file: act, ext: "webp", id },
      };
      setValue(newE);
    }

    onChange && onChange({ target: { name, value: newE } });
  };

  const _onChange = (e: any) => {
    if (
      (e.target.value.file == "" || e.target.value.file == "delete") &&
      imgs.length > 1
    ) {
      deleteImg(e.target.name, false);
      return;
    }

    const indice = e.target.name.replace(name, "").split("-")[0];
    const id = e.target.name.replace(name, "").split("-")[1] || 0;
    const edit = value[name + indice]?.file || id > 0;

    const newE = { ...value, [name + indice]: { ...e.target.value, id } };
    onChange && onChange({ target: { name, value: newE } });
    setValue(newE);

    // Add new empty slot if needed
    if (!edit && imgs.length < maxFiles) {
      // if (imgs.length < maxFiles) {
      setImgs((prev: any) => [...prev, { id: 0 }]);
    }
  };
  return (
    <>
      <div
        className={styles.uploadFileMultiple + " " + styles[className]}
        style={{
          display: "flex",
          flexDirection: "row",
          alignContent: "space-around",
          gap: "var(--sM)",
          width: "100%",
          flexWrap: "wrap",
          border: "1px solid var(--cWhiteV2)",
          backgroundColor: "var(--cWhiteV2)",
          padding: "var(--sM)",
          borderRadius: "var(--bRadius)",
          position: "relative",
        }}
      >
        <label>
          {props.label || "Puede subir hasta " + maxFiles + " imágenes"}
        </label>
        {/* {JSON.stringify(imgs)}----
        {JSON.stringify(Object.keys(value).length)}----
        {images.length}---{maxFiles} */}
        {imgs.map((it: any, i: number) => (
          <div
            key={"img-" + i + it.id}
            style={{
              display: "flex",
              flexDirection: "row",
              gap: "12px",
              alignItems: "center",
              position: "relative",
            }}
          >
            {/* {JSON.stringify(it)}-{"img-" + i + it.id} */}
            <UploadFileM
              {...props}
              className="v2"
              // autoOpen={imgs.length > 1 && !it.id}
              editor={editor}
              sizePreview={sizePreview}
              value={value[name + i]?.file || false}
              name={name + i + "-" + it.id}
              onChange={_onChange}
              label=""
              placeholder="Subir imagen"
              fileName={
                it.id > 0
                  ? getUrlImages(
                      "/" +
                        prefix +
                        "-" +
                        item.id +
                        "-" +
                        it.id +
                        "." +
                        (it.ext || "webp") +
                        "?" +
                        item.updated_at
                    )
                  : null
              }
            />
          </div>
        ))}
      </div>
      {!props.error ? null : (
        <p className={styles.error}>{props.error[name] ?? null}</p>
      )}
    </>
  );
};

export default UploadFileMultiple;
