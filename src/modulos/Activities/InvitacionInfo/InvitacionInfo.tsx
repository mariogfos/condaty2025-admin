import { useState } from "react";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import { getDateStrMes, getDateTimeStrMes } from "@/mk/utils/date";
import { getFullName } from "@/mk/utils/string";

import {
  IconArrowLeft,
  IconArrowRight,
  IconDropdown,
  IconGroupsQr,
  IconSingleQr,
  IconUp,
} from "@/components/layout/icons/IconsBiblioteca";
import styles from "./InvitacionInfo.module.css";
import IconoModal from "@/components/IconoModal/IconoModal";

const InvitacionInfo = ({ open, onClose, data, onIn, onOut }: any) => {
  const [openInfo, setOpenInfo] = useState<Record<string, boolean>>({});
  
  const flipOpenInfo = (id: string | number) => {
    setOpenInfo({ ...openInfo, [id]: !openInfo[id] });
  };

  return (
    <DataModal open={open} onClose={onClose} buttonText="" buttonCancel="">
      <div className={styles.container}>
        <IconoModal
          icon={data?.type === "G" ? <IconGroupsQr /> : <IconSingleQr />}
        />
        
        <div className={styles.title}>
          {data?.type === "I" && "Invitación individual"}
          {data?.type === "G" && "Invitación grupal"}
        </div>
        
        <div className={styles.content}>
          {data?.type === "G" && (
            <>
              <div className={styles.grid}>
                {data?.type === "G" && (
                  <>
                    <div className={styles.label}>Evento:</div>
                    <div className={styles.value}>{data?.title}</div>
                    <div className={styles.label}>Fecha:</div>
                    <div className={styles.value}>
                      {getDateStrMes(data?.date_event)}
                    </div>
                  </>
                )}
                
                {data?.obs && (
                  <>
                    <div className={styles.label}>Detalles:</div>
                    <div className={styles.value}>{data?.obs}</div>
                  </>
                )}
                
                {data?.type !== "G" && (
                  <>
                    {data.access[0] && (
                      <>
                        <div className={styles.label}>Residente:</div>
                        <div className={styles.value}>
                          {getFullName(data?.owner)}
                        </div>
                        
                        {data?.owner.phone && (
                          <>
                            <div className={styles.label}>Teléfono:</div>
                            <div className={styles.value}>{data?.owner.phone}</div>
                          </>
                        )}

                        <div className={styles.label}>Invitado:</div>
                        <div className={styles.value}>
                          {data.access[0]
                            ? getFullName(data.access[0]?.visit)
                            : getFullName(data.visit)}
                        </div>
                        
                        <div className={styles.label}>Carnet:</div>
                        <div className={styles.value}>
                          {data.access[0]
                            ? data?.access[0]?.visit?.ci
                            : data.visit?.ci}
                        </div>
                        
                        {data?.access[0]?.plate && (
                          <>
                            <div className={styles.label}>Placa:</div>
                            <div className={`${styles.value} ${styles.marginBottom}`}>
                              {data?.access[0]?.plate}
                            </div>
                          </>
                        )}
                      </>
                    )}

                    <div className={styles.label}>Fecha de invitación:</div>
                    <div className={styles.value}>
                      {getDateStrMes(data?.date_event)}
                    </div>
                    
                    <div className={styles.label}>Estado:</div>
                    <div className={styles.value}>
                      {data.status === "X" ? "Anulado" : "Expirado"}
                    </div>

                    {!data?.access[0] && (
                      <>
                        {data.status === "X" && (
                          <>
                            <div className={styles.label}>Estado:</div>
                            <div className={styles.errorText}>
                              {data.status === "X" ? "Anulado" : "Expirado"}
                            </div>
                          </>
                        )}
                      </>
                    )}
                    
                    {data?.access[0]?.in_at && (
                      <>
                        <div className={styles.label}>Ingreso:</div>
                        <div className={styles.value}>
                          {getDateTimeStrMes(data?.access[0]?.in_at)}
                        </div>
                      </>
                    )}
                    
                    {data?.access[0]?.out_at && (
                      <>
                        <div className={styles.label}>Salida:</div>
                        <div className={styles.value}>
                          {getDateTimeStrMes(data?.access[0]?.out_at)}
                        </div>

                        <div className={styles.label}>Guardia de entrada:</div>
                        <div className={styles.value}>
                          {getFullName(data?.access[0].guardia)}
                        </div>

                        {data?.access[0]?.out_guard &&
                          data?.access[0]?.guardia?.id !==
                            data?.access[0]?.out_guard?.id && (
                            <>
                              <div className={styles.label}>Guardia de salida:</div>
                              <div className={styles.value}>
                                {getFullName(data?.access[0]?.out_guard)}
                              </div>
                            </>
                          )}
                      </>
                    )}
                    
                    {(data?.access[0]?.obs_in ||
                      data?.access[0]?.obs_out ||
                      data?.access[0]?.obs_confirm) && (
                      <>
                        {data?.access[0]?.obs_in && (
                          <>
                            <div className={styles.label}>Observación de entrada:</div>
                            <div className={styles.value}>
                              {data?.access[0]?.obs_in}
                            </div>
                          </>
                        )}
                        
                        {data?.access[0]?.obs_out && (
                          <>
                            <div className={styles.label}>Observación de salida:</div>
                            <div className={styles.value}>
                              {data?.access[0]?.obs_out}
                            </div>
                          </>
                        )}
                        
                        {data?.access[0]?.obs_confirm && (
                          <>
                            <div className={styles.label}>Confirmación:</div>
                            <div className={styles.value}>
                              {data?.access[0]?.obs_confirm}
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </>
                )}
                
                <div className={styles.label}>Residente:</div>
                <div className={styles.value}>{getFullName(data?.owner)}</div>
                
                <div className={styles.label}>Teléfono:</div>
                <div className={styles.value}>{data?.owner?.phone}</div>
                
                <div className={styles.label}>Invitados:</div>
                <div className={styles.value}>{data.guests.length}</div>
              </div>
              
              {data?.guests?.map((guest: any) => (
                <div key={guest.id} className={styles.guestCard}>
                  <div
                    className={styles.guestHeader}
                    onClick={() => {
                      if (guest.access?.in_at) {
                        flipOpenInfo(guest.id);
                      }
                    }}
                  >
                    <div className={styles.guestInfo}>
                      {getFullName(guest.visit)}
                      {guest.visit?.ci && (
                        <span className={styles.guestCi}>
                          CI: {guest.visit?.ci}
                        </span>
                      )}
                    </div>
                    
                    {guest.access?.in_at ? (
                      <>
                        <div className={styles.attendedText}>Asistió</div>
                        <div>
                          {openInfo[guest.id] ? (
                            <IconUp size={12} />
                          ) : (
                            <IconDropdown size={12} />
                          )}
                        </div>
                      </>
                    ) : (
                      <div className={styles.notAttendedText}>No asistió</div>
                    )}
                  </div>
                  
                  <div
                    className={`${styles.guestDetails} ${
                      openInfo[guest.id] ? styles.guestDetailsOpen : styles.guestDetailsClosed
                    }`}
                  >
                    <div className={styles.guestTimestamps}>
                      <div className={styles.guestTimestamp}>
                        <IconArrowRight size={16} className={styles.entryIcon} />
                        <p className={styles.timestampText}>
                          {getDateTimeStrMes(
                            guest.access?.in_at,
                            data.event_date
                          )}
                        </p>
                      </div>
                      
                      <div className={styles.guestTimestamp}>
                        <IconArrowLeft size={16} className={styles.exitIcon} />
                        <p className={styles.timestampText}>
                          {getDateTimeStrMes(
                            guest.access?.out_at,
                            data.event_date
                          )}
                        </p>
                      </div>
                      
                      {guest.plate && (
                        <>
                          <div className={styles.guestDetailLabel}>Placa:</div>
                          <div className={styles.guestDetailValue}>{guest.plate}</div>
                        </>
                      )}
                    </div>

                    {guest.access?.obs_in && (
                      <>
                        <div className={styles.guestDetailLabel}>Observación Entrada:</div>
                        <div className={styles.guestDetailValue}>
                          {guest.access?.obs_in}
                        </div>
                      </>
                    )}
                    
                    {guest.access?.obs_out && (
                      <>
                        <div className={styles.guestDetailLabel}>Observación Salida:</div>
                        <div className={styles.guestDetailValue}>
                          {guest.access?.obs_out}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
        
        <div className={styles.content}>
          {data?.type === "I" && (
            <>
              <div className={styles.grid}>
                {data?.type === "G" && (
                  <>
                    <div className={styles.label}>Evento:</div>
                    <div className={styles.value}>{data?.title}</div>
                    <div className={styles.label}>Fecha:</div>
                    <div className={styles.value}>
                      {getDateStrMes(data?.date_event)}
                    </div>
                  </>
                )}
                
                {data?.obs && (
                  <>
                    <div className={styles.label}>Detalles:</div>
                    <div className={styles.value}>{data?.obs}</div>
                  </>
                )}
                
                {data?.type !== "G" && (
                  <>
                    {data.access[0] && (
                      <>
                        <div className={styles.label}>Residente:</div>
                        <div className={styles.value}>
                          {getFullName(data?.owner)}
                        </div>
                        
                        {data?.owner.phone && (
                          <>
                            <div className={styles.label}>Teléfono:</div>
                            <div className={styles.value}>{data?.owner.phone}</div>
                          </>
                        )}

                        <div className={styles.label}>Invitado:</div>
                        <div className={styles.value}>
                          {data.access[0]
                            ? getFullName(data.access[0]?.visit)
                            : getFullName(data.visit)}
                        </div>
                        
                        <div className={styles.label}>Carnet:</div>
                        <div className={styles.value}>
                          {data.access[0]
                            ? data?.access[0]?.visit?.ci
                            : data.visit?.ci}
                        </div>
                        
                        {data?.access[0]?.plate && (
                          <>
                            <div className={styles.label}>Placa:</div>
                            <div className={`${styles.value} ${styles.marginBottom}`}>
                              {data?.access[0]?.plate}
                            </div>
                          </>
                        )}
                      </>
                    )}

                    <div className={styles.label}>Fecha de invitación:</div>
                    <div className={styles.value}>
                      {getDateStrMes(data?.date_event)}
                    </div>
                    
                    <div className={styles.label}>Estado:</div>
                    <div className={styles.value}>
                      {data.status === "X" ? "Anulado" : "Expirado"}
                    </div>

                    {!data?.access[0] && (
                      <>
                        {data.status === "X" && (
                          <>
                            <div className={styles.label}>Estado:</div>
                            <div className={styles.errorText}>
                              {data.status === "X" ? "Anulado" : "Expirado"}
                            </div>
                          </>
                        )}
                      </>
                    )}
                    
                    {data?.access[0]?.in_at && (
                      <>
                        <div className={styles.label}>Ingreso:</div>
                        <div className={styles.value}>
                          {getDateTimeStrMes(data?.access[0]?.in_at)}
                        </div>
                      </>
                    )}
                    
                    {data?.access[0]?.out_at && (
                      <>
                        <div className={styles.label}>Salida:</div>
                        <div className={styles.value}>
                          {getDateTimeStrMes(data?.access[0]?.out_at)}
                        </div>

                        <div className={styles.label}>Guardia de entrada:</div>
                        <div className={styles.value}>
                          {getFullName(data?.access[0].guardia)}
                        </div>

                        {data?.access[0]?.out_guard &&
                          data?.access[0]?.guardia?.id !==
                            data?.access[0]?.out_guard?.id && (
                            <>
                              <div className={styles.label}>Guardia de salida:</div>
                              <div className={styles.value}>
                                {getFullName(data?.access[0]?.out_guard)}
                              </div>
                            </>
                          )}
                      </>
                    )}
                    
                    {(data?.access[0]?.obs_in ||
                      data?.access[0]?.obs_out ||
                      data?.access[0]?.obs_confirm) && (
                      <>
                        {data?.access[0]?.obs_in && (
                          <>
                            <div className={styles.label}>Observación de entrada:</div>
                            <div className={styles.value}>
                              {data?.access[0]?.obs_in}
                            </div>
                          </>
                        )}
                        
                        {data?.access[0]?.obs_out && (
                          <>
                            <div className={styles.label}>Observación de salida:</div>
                            <div className={styles.value}>
                              {data?.access[0]?.obs_out}
                            </div>
                          </>
                        )}
                        
                        {data?.access[0]?.obs_confirm && (
                          <>
                            <div className={styles.label}>Confirmación:</div>
                            <div className={styles.value}>
                              {data?.access[0]?.obs_confirm}
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </>
                )}
                
                <div className={styles.label}>Residente:</div>
                <div className={styles.value}>{getFullName(data?.owner)}</div>
                
                <div className={styles.label}>Teléfono:</div>
                <div className={styles.value}>{data?.owner?.phone}</div>
              </div>
            </>
          )}
        </div>
      </div>
    </DataModal>
  );
};

export default InvitacionInfo;