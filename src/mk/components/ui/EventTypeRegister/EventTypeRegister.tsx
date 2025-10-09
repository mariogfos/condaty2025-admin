// import React, { useState } from "react";
// import styles from "./EventTypeRegister.module.css";
// import {
//   IconAlertCircle,
//   IconArrowRight,
//   IconCancelCircle,
//   IconNewAfilliate,
//   IconRegisterNoID,
//   IconScanner,
// } from "@/components/layout/icons/IconsBiblioteca";
// import NewAffiliate from "@/components/NewAffiliate/NewAffiliate";
// import NoQr from "@/components/NoQr/NoQr";
// import QrReader from "@/components/QrReader/QrReader";
// import DataModal from "../DataModal/DataModal";

// type PropsType = {
//   id: number;
// };

// // Crear un componente reutilizable para cada opción
// const EventTypeOption = ({
//   Icon,
//   color,
//   title,
//   description,
//   onClick,
// }: {
//   Icon: React.FC<{ color: string }>;
//   color: string;
//   title: string;
//   description: string;
//   onClick?: any;
// }) => {
//   return (
//     <div onClick={onClick}>
//       <div>
//         <Icon color={color} />
//         <div>
//           <p>{title}</p>
//           <p>{description}</p>
//         </div>
//       </div>
//       <IconArrowRight color={"var(--cBlackV2)"} />
//     </div>
//   );
// };

// const EventTypeRegister = ({ id }: PropsType) => {
//   const [openNewAffiliate, setOpenNewAffiliate] = useState(false);
//   const [openQrReader, setOpenQrReader] = useState(false);
//   const [openNoQr, setOpenNoQr] = useState(false);
//   const [openMsg, setOpenMsg] = useState(false);
//   const [titleMsg, setTitleMsg] = useState("");
//   const [textoMsg, setTextoMsg] = useState("");
//   const [typeMsg, setTypeMsg] = useState("Q");

//   const closeMsg = () => {
//     setOpenMsg(false);
//   };

//   const onMsg = (title: string, texto: string,tipo:string) => {
//     setTitleMsg(title);
//     setTextoMsg(texto);
//     setTypeMsg(tipo);
//     setOpenMsg(true);
//   };
//   return (
//     <>
//       <div className={styles.eventTypeRegister}>
//         <h1>Tipo de registro</h1>
//         <div>
//           <EventTypeOption
//             Icon={IconScanner}
//             color={"var(--cAccent)"}
//             title="Leer Elekta QR"
//             description="Escanea el Elekta QR"
//             onClick={() => setOpenQrReader(true)}
//           />
//           <EventTypeOption
//             Icon={IconRegisterNoID}
//             color={"var(--cSuccess)"}
//             title="Registro sin Elekta QR"
//             description="Busca al afiliado en Elekta"
//             onClick={() => setOpenNoQr(true)}
//           />
//           <EventTypeOption
//             Icon={IconNewAfilliate}
//             color={"IconNewAfilliate"}
//             title="Nuevo afiliado"
//             description="Crea su cuenta y registra su asistencia"
//             onClick={() => setOpenNewAffiliate(true)}
//           />
//         </div>
//       </div>
//       {openNewAffiliate && (
//         <NewAffiliate
//           open={openNewAffiliate}
//           close={() => setOpenNewAffiliate(false)}
//           eventId={id}
//         />
//       )}
//       {openQrReader && (
//         <QrReader
//           open={openQrReader}
//           close={() => setOpenQrReader(false)}
//           eventId={id}
//           onMsg={onMsg}
//         />
//       )}
//       {openNoQr && (
//         <NoQr idEvent={id} open={openNoQr} onClose={() => setOpenNoQr(false)} />
//       )}
//       {openMsg && (
//         <DataModal
//           open={openMsg}
//           onClose={() => closeMsg()}
       
//           // fullScreen={true}
//           buttonText=""
//           // disabled={false}
//           buttonCancel=""
//         >
//           <div style={{display:'flex',justifyContent:'center',flexDirection:'column',alignItems:'center',fontWeight:'var(--bBold)',gap:8,textAlign:'center'}}>
//           { typeMsg === 'Q' ?<IconCancelCircle color={'var(--cError)'} size={ 80 } /> : <IconAlertCircle color={'var(--cWarning)'} size={ 80 } />  }
//           <div style={{ color:'var(--cWhite)', fontSize:'var(--sXl)'}}>{titleMsg}</div>
//           <div style={{ color:'var(--cBlackV2)',fontWeight:'var(--bRegular)'}}>{textoMsg}</div>
//           </div>
//         </DataModal>
//       )}
//     </>
//   );
// };

// export default EventTypeRegister;
