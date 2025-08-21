"use client";
import { useState } from "react";
import { getFullName } from "@/mk/utils/string";
import styles from "./DashDptos.module.css";
import { useRouter } from "next/navigation";
import { IconArrowDown } from "@/components/layout/icons/IconsBiblioteca";
import Select from "@/mk/components/forms/Select/Select";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import { useAuth } from "@/mk/contexts/AuthProvider";
import useAxios from "@/mk/hooks/useAxios";
import HistoryOwnership from "./HistoryOwnership/HistoryOwnership";
import RenderView from "../Payments/RenderView/RenderView";
import OwnersRenderView from "../Owners/RenderView/RenderView";
import ProfileModal from "@/components/ProfileModal/ProfileModal";
import WidgetBase from "@/components/Widgets/WidgetBase/WidgetBase";
import RenderForm from "../Dptos/RenderForm";
import HeaderBack from "@/mk/components/ui/HeaderBack/HeaderBack";
import UnitInfo from "./UnitInfo/UnitInfo";
import PaymentsTable from "./PaymentsTable/PaymentsTable";
import AccessTable from "./AccessTable/AccessTable";
import ReservationsTable from "./ReservationsTable/ReservationsTable";
import TitleRender from "./TitleRender/TitleRender";
import { setParamsCrud } from "@/mk/utils/utils";
import {
  TableSkeleton,
  WidgetSkeleton,
} from "@/mk/components/ui/Skeleton/Skeleton";

interface DashDptosProps {
  id: string | number;
}

const DashDptos = ({ id }: DashDptosProps) => {
  const { showToast } = useAuth();
  const router = useRouter();
  const [openTitular, setOpenTitular] = useState(false);
  const [openPerfil, setOpenPerfil] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openComprobante, setOpenComprobante] = useState(false);
  const [formState, setFormState] = useState<any>({ isTitular: "I" });
  const [errorsT, setErrorsT] = useState<any>({});
  const [openTitularHist, setOpenTitularHist] = useState(false);
  const [idPago, setIdPago] = useState<string | null>(null);
  const [idPerfil, setIdPerfil] = useState<string | null>(null);
  const [openDel, setOpenDel] = useState(false);
  const [openDelTitular, setOpenDelTitular] = useState(false);
  const [currentRemovalType, setCurrentRemovalType] = useState<'H' | 'T' | null>(null);
  const [openProfileModal, setOpenProfileModal] = useState(false);
  const [selectedDependentId, setSelectedDependentId] = useState<string | null>(
    null
  );
  const {
    data: dashData,
    reLoad,
    execute,
    loaded,
  } = useAxios("/dptos", "GET", {
    fullType: "DET",
    dpto_id: id,
    extraData: true,
  });

  const datas = dashData?.data || {};

    const [currentChangeType, setCurrentChangeType] = useState<'H' | 'T' | null>(null);

  const handleChangeOwnerClick = (type: 'H' | 'T') => {
    setCurrentChangeType(type);
    setOpenTitular(true);
  };

  const onSave = async () => {
    if (!formState.owner_id || !currentChangeType) {
      setErrorsT({ owner_id: "Este campo es obligatorio" });
      return;
    }

    try {
      const payload = {
        owner_id: formState.owner_id,
        dpto_id: id,
        type: currentChangeType,
        ...(currentChangeType === 'H' ? { is_resident: "N" } : {})
      };

      const { data: response } = await execute(
        "/dptos-change-owner",
        "POST",
        payload,
      );

      if (response?.success) {
        showToast(`${currentChangeType === 'H' ? 'Propietario' : 'Residente'} actualizado`, "success");
        setOpenTitular(false);
        setErrorsT({});
        setCurrentChangeType(null);
        reLoad();
      } else {
        showToast(response?.message || `Error al actualizar ${currentChangeType === 'H' ? 'propietario' : 'residente'}`, "error");
      }
    } catch (error) {
      showToast(`Error al actualizar ${currentChangeType === 'H' ? 'propietario' : 'residente'}`, error);
    }
  };

  const handleOpenDependentProfile = (owner_id: string) => {
    setSelectedDependentId(owner_id);
    setOpenProfileModal(true);
  };
  const onDel = async () => {
    const { data } = await execute("/dptos/" + datas.data.id, "DELETE");
    if (data?.success) {
      showToast("Unidad eliminada", "success");
      router.push("/units");
    } else {
      showToast(data?.message || "Error al eliminar unidad", "error");
    }
  };

  const onTitular = (type: 'H' | 'T') => {
    if (type === 'T' && !datas?.data?.homeowner) {
      showToast(
        "No se puede asignar un residente a esta unidad porque no existe un propietario registrado.",
        "error"
      );
      return;
    }
    setCurrentChangeType(type);
    setOpenTitular(true);
  };

  const handleRemoveTitularClick = (type: 'H' | 'T') => {
    setCurrentRemovalType(type);
    setOpenDelTitular(true);
  };

  const removeTitular = async () => {
    try {
      if (!currentRemovalType) return;

      const isHomeowner = currentRemovalType === 'H';
      const payload = {
        owner_id: isHomeowner ? datas?.data?.homeowner?.id : datas?.tenant?.id,
        dpto_id: datas?.data?.id,
        type: currentRemovalType
      };

      const { data } = await execute("/dptos-release-owner", "POST", payload);

      if (data?.success) {
        showToast(isHomeowner ? "Propietario liberado" : "Inquilino desvinculado", "success");
        reLoad();
        setOpenDelTitular(false);
        setCurrentRemovalType(null);
      } else {
        showToast(data?.message || `Error al ${isHomeowner ? 'liberar propietario' : 'desvincular inquilino'}`, "error");
      }
    } catch (error) {
      console.error('Error:', error);
      showToast("Error al procesar la solicitud", "error");
    }
  };

  return (
    <div className={styles.container}>
      <HeaderBack label="Volver a lista de unidades" onClick={() => router.push('/units')} />
      <section>
        <div className={styles.firtsPanel}>
          {!loaded ? (
            <WidgetSkeleton />
          ) : (
            <UnitInfo
              datas={datas}
              onEdit={() => setOpenEdit(true)}
              onDelete={() => setOpenDel(true)}
              onTitular={onTitular}
              onRemoveTitular={handleRemoveTitularClick}
              onOpenDependentProfile={handleOpenDependentProfile}
              onOpenTitularHist={() => setOpenTitularHist(true)}
            />
          )}

          <WidgetBase
            title={
              <TitleRender
                title="Historial de pagos"
                onClick={() => {
                  setParamsCrud('payments', 'searchBy', datas?.data?.nro);
                  router.push('/payments');
                }}
              />
            }
            subtitle={`Últimos ${datas?.payments?.length || 0} pagos`}
            variant="V1"
            style={{ flex: 1, minWidth: '300px' }}
          >
            <div className={styles.accountContent}>
              {!loaded ? <TableSkeleton /> : <PaymentsTable payments={datas?.payments} />}
            </div>
          </WidgetBase>
        </div>

        <div className={styles.secondPanel}>
          {/* Historial de Accesos - Tabla */}
          <WidgetBase
            subtitle={loaded ? '+' + datas.accessCount + ' accesos nuevos este mes' : 'Cargando...'}
            title={
              <TitleRender
                title="Historial de accesos"
                onClick={() => {
                  setParamsCrud('accesses', 'searchBy', datas?.data?.nro);
                  router.push('/activities');
                }}
              />
            }
            variant="V1"
            style={{ flex: 1, minWidth: '300px' }}
          >
            <div className={styles.accessContent}>
              {!loaded ? <TableSkeleton /> : <AccessTable access={datas?.access} />}
            </div>
          </WidgetBase>

          {/* Historial de Reservas - Tabla */}
          <WidgetBase
            title={
              <TitleRender
                title="Historial de reservas"
                onClick={() => {
                  setParamsCrud('reservations', 'searchBy', datas?.data?.nro);
                  router.push('/reservas');
                }}
              />
            }
            subtitle={
              loaded ? '+' + datas.reservationsCount + ' reservas nuevas este mes' : 'Cargando...'
            }
            variant="V1"
            style={{ flex: 1, minWidth: '300px' }}
          >
            <div className={styles.reservationsContent}>
              {!loaded ? (
                <TableSkeleton />
              ) : (
                <ReservationsTable reservations={datas?.reservations} />
              )}
            </div>
          </WidgetBase>
        </div>

        {/* Modales */}
        <DataModal
          title={`Seleccionar ${currentChangeType === 'H' ? 'propietario' : 'residente'}`}
          open={openTitular}
          onSave={onSave}
          onClose={() => {
            setOpenTitular(false);
            setCurrentChangeType(null);
            setFormState((prev: { owner_id?: string }) => ({ ...prev, owner_id: '' }));
          }}
          buttonText="Guardar"
        >
          <div className={styles.modalContent}>
            <Select
              placeholder={`Selecciona al nuevo ${currentChangeType === 'H' ? 'propietario' : 'residente'}`}
              name="owner_id"
              error={errorsT.owner_id}
              required={true}
              value={formState.owner_id || ''}
              onChange={e => setFormState({ ...formState, owner_id: e.target.value })}
              options={(currentChangeType === 'H' ? dashData?.extraData?.homeowners : dashData?.extraData?.tenants || []).map((owner: any) => ({
                ...owner,
                name: `${getFullName(owner)}`,
              }))}
              optionLabel="name"
              optionValue="id"
              filter={true}
              iconRight={<IconArrowDown />}
            />
          </div>
        </DataModal>
        {/* Modales de Historial */}
        {openTitularHist && (
          <HistoryOwnership
            ownershipData={datas?.tenantHist || []}
            open={openTitularHist}
            close={() => setOpenTitularHist(false)}
          />
        )}

        {openComprobante && idPago && (
          <RenderView
            open={openComprobante}
            onClose={() => {
              setOpenComprobante(false);
              setIdPago(null);
            }}
            extraData={datas}
            payment_id={idPago}
          />
        )}

        {openPerfil && idPerfil && (
          <OwnersRenderView
            open={openPerfil}
            onClose={() => {
              setOpenPerfil(false);
              setIdPerfil(null);
            }}
            item={
              idPerfil === datas?.tenant?.id
                ? datas?.tenant
                : datas?.tenant?.dependientes?.find((dep: any) => dep.owner_id === idPerfil)
                    ?.owner || {}
            }
            reLoad={reLoad}
          />
        )}

        {openEdit && (
          <RenderForm
            open={openEdit}
            onClose={() => setOpenEdit(false)}
            item={datas?.data}
            reLoad={reLoad}
            extraData={dashData?.extraData}
          />
        )}
        {openDel && (
          <DataModal
            title="Eliminar unidad"
            open={openDel}
            onSave={onDel}
            variant={'mini'}
            onClose={() => setOpenDel(false)}
            buttonText="Eliminar"
          >
            <div className={styles.modalContent}>
              <p>
                ¿Estás seguro de que quieres eliminar esta unidad? Esta acción no se puede deshacer.
              </p>
            </div>
          </DataModal>
        )}
        {openDelTitular && (
          <DataModal
            title={currentRemovalType === 'H' ? 'Liberar residencia' : 'Desvincular residente'}
            open={openDelTitular}
            onSave={removeTitular}
            variant={'mini'}
            onClose={() => {
              setOpenDelTitular(false);
              setCurrentRemovalType(null);
            }}
            buttonText={currentRemovalType === 'H' ? 'Liberar' : 'Desvincular'}
          >
            <p>
              {currentRemovalType === 'H'
                ? '¿Estás seguro de liberar la residencia del propietario? Recuerda que al realizar esta acción el usuario seguirá siendo propietario más no residente en la unidad?'
                : '¿Estás seguro que quieres desvincular al inquilino? Recuerda que si realizas esta acción la unidad quedará sin inquilino?'}
            </p>
          </DataModal>
        )}

        {openProfileModal && selectedDependentId && (
          <ProfileModal
            open={openProfileModal}
            onClose={() => {
              setOpenProfileModal(false);
              setSelectedDependentId(null);
            }}
            dataID={selectedDependentId}
            title="Perfil del Dependiente"
            titleBack="Volver a la Unidad"
            type="owner"
            reLoad={reLoad}
          />
        )}
      </section>
    </div>
  );
};

export default DashDptos;
