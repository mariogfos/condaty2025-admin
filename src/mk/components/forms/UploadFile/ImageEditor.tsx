"use client";
import { useState, useCallback, useEffect } from "react";
import Cropper from "react-easy-crop";
import DataModal from "../../ui/DataModal/DataModal";

const ImageEditor = ({
  imageBase64,
  onImageProcessed,
  size = { width: 720, height: 1024 },
}: any) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels]: any = useState(null);
  const [open, setOpen] = useState(false);
  const [mediaSize, setMediaSize] = useState({
    width: 0,
    height: 0,
    naturalWidth: 0,
    naturalHeight: 0,
  });

  // Callback para obtener el área de corte en pixeles
  const onCropComplete = useCallback((_: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Función para procesar la imagen en canvas y reducir tamaño/calidad
  const processImage = async () => {
    const croppedImage = await getCroppedImg(
      imageBase64,
      croppedAreaPixels,
      size,
      0.7
    ); // Ajuste de calidad (0.5)
    onImageProcessed(croppedImage); // Llamada a prop para devolver la imagen procesada
    setOpen(false);
  };

  useEffect(() => {
    if (imageBase64) {
      // const s = ajustarTamañoImagen(size.width, size.height, 600, 400);
      // setZoom(s.factorDeEscala);
      setCrop({ x: 0, y: 0 });
      // setImageSize(s);
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [imageBase64]);

  return (
    <DataModal
      open={open}
      onClose={() => setOpen(false)}
      title="Editar imagen"
      onSave={processImage}
      buttonText="Procesar imagen"
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: 400,
        }}
      >
        <Cropper
          image={imageBase64}
          crop={crop}
          zoom={zoom}
          aspect={size.width / size.height}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          setMediaSize={setMediaSize}
          minZoom={0.1}
          objectFit="contain"
          restrictPosition={false}
        />
      </div>
    </DataModal>
  );
};

// Función para crear el canvas, procesar imagen y reducir tamaño/calidad
async function getCroppedImg(
  imageSrc: string,
  crop: any,
  imageSize: any,
  quality: number = 0.7
) {
  const image = new Image();
  image.src = imageSrc;
  await new Promise((resolve) => (image.onload = resolve));

  const canvas = document.createElement("canvas");
  const ctx: any = canvas.getContext("2d");

  let newWidth = crop.width;
  let newHeight = crop.height;
  const aspectRatio = crop.width / crop.height;
  if (newWidth > imageSize.width) {
    newWidth = imageSize.width;
    newHeight = Math.floor((imageSize.height * newWidth) / imageSize.width);
  }
  if (newHeight > imageSize.height) {
    newHeight = imageSize.height;
    newWidth = Math.floor((imageSize.width * newHeight) / imageSize.height);
  }

  canvas.width = newWidth;
  canvas.height = newHeight;

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    canvas.width,
    canvas.height
  );

  const base64Image = canvas.toDataURL("image/webp", quality);
  // console.log("base64Image: ", base64Image);
  return base64Image;
}

// const ajustarTamañoImagen = (
//   anchoDeseado: number,
//   altoDeseado: number,
//   anchoMaximoVisual: number,
//   altoMaximoVisual: number
// ) => {
//   let factorAncho = anchoMaximoVisual / anchoDeseado;
//   let factorAlto = altoMaximoVisual / altoDeseado;
//   let factorDeEscala = Math.min(factorAncho, factorAlto);

//   return {
//     anchoVisualAjustado: anchoDeseado * factorDeEscala,
//     altoVisualAjustado: altoDeseado * factorDeEscala,
//     anchoOriginal: anchoDeseado,
//     altoOriginal: altoDeseado,
//     factorDeEscala,
//   };
// };

export default ImageEditor;
