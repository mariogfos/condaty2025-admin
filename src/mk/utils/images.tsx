export const resizeImage = async (
  file: any,
  maxWidth: number = 720,
  maxHeight: number = 1024,
  quality: number = 0.7
) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img: any = new Image();
      img.src = event?.target?.result;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calcular las proporciones
        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;
          if (width > height) {
            width = maxWidth;
            height = maxWidth / aspectRatio;
          } else {
            height = maxHeight;
            width = maxHeight * aspectRatio;
          }
        }

        // Crear un canvas para redimensionar
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx: any = canvas.getContext("2d");

        // Dibujar la imagen redimensionada en el canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Obtener la imagen en formato Base64
        const resizedImage = canvas.toDataURL("image/webp", quality);
        resolve(resizedImage);
      };

      img.onerror = () => reject(new Error("Error al cargar la imagen."));
    };

    reader.onerror = () => reject(new Error("Error al leer el archivo."));
    reader.readAsDataURL(file);
  });
};
