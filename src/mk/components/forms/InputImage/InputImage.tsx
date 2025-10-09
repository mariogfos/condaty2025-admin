import React from "react";
import { UploadFile } from "../UploadFile/UploadFile";

const InputImage = (props: any) => {
  return (
    <UploadFile
      name="file"
      //label="Archivo...."
      ext={["jpg", "png"]}
      value={{ file: "", name: "" }}
      onChange={() => {}}
      error={{}}
      setError={() => {}}
      required={true}
      img={true}
      placeholder="Selecciona una imagen"
      // placeholderMsg={props.placeholderMsg}
    />
  );
};

export default InputImage;
