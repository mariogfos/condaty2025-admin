'use client';
import { useState } from 'react';
import { getFullName } from '@/mk/utils/string';
import styles from './DashDptos.module.css';
import { useRouter } from 'next/navigation';
import { IconArrowDown } from '@/components/layout/icons/IconsBiblioteca';
import Select from '@/mk/components/forms/Select/Select';
import DataModal from '@/mk/components/ui/DataModal/DataModal';
import { useAuth } from '@/mk/contexts/AuthProvider';
import useAxios from '@/mk/hooks/useAxios';
import HistoryOwnership from './HistoryOwnership/HistoryOwnership';
import RenderView from '../Payments/RenderView/RenderView';
import OwnersRenderView from '../Owners/RenderView/RenderView';
import ProfileModal from '@/components/ProfileModal/ProfileModal';
import WidgetBase from '@/components/Widgets/WidgetBase/WidgetBase';
import RenderForm from '../Dptos/RenderForm';
import HeaderBack from '@/mk/components/ui/HeaderBack/HeaderBack';
import UnitInfo from './UnitInfo/UnitInfo';
import PaymentsTable from './PaymentsTable/PaymentsTable';
import AccessTable from './AccessTable/AccessTable';
import ReservationsTable from './ReservationsTable/ReservationsTable';
import TitleRender from './TitleRender/TitleRender';

interface DashDptosProps {
  id: string | number;
}

const DashDptos = ({ id }: DashDptosProps) => {
  const { showToast, setStore } = useAuth();
  const router = useRouter();
  const [openTitular, setOpenTitular] = useState(false);
  const [openPerfil, setOpenPerfil] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openComprobante, setOpenComprobante] = useState(false);
  const [formState, setFormState] = useState<any>({ isTitular: 'I' });
  const [errorsT, setErrorsT] = useState<any>({});
  const [openTitularHist, setOpenTitularHist] = useState(false);
  const [idPago, setIdPago] = useState<string | null>(null);
  const [idPerfil, setIdPerfil] = useState<string | null>(null);
  const [openDel, setOpenDel] = useState(false);
  const [openDelTitular, setOpenDelTitular] = useState(false);
  const [openProfileModal, setOpenProfileModal] = useState(false);
  const [selectedDependentId, setSelectedDependentId] = useState<string | null>(null);
  const {
    data: dashData,
    reLoad,
    execute,
  } = useAxios('/dptos', 'GET', {
    fullType: 'DET',
    dpto_id: id,
    extraData: true,
  });

  const datas = dashData?.data || {};

  const locationParams = (path: string, key: string, value: string) => {
    setStore({
      [key]: value,
    });
    router.push(path);
  };

  const onSave = async () => {
    if (!formState.owner_id) {
      setErrorsT({ owner_id: 'Este campo es obligatorio' });
      return;
    }

    try {
      const { data: response } = await execute('/dptos-change-titular', 'POST', {
        owner_id: formState.owner_id,
        dpto_id: id,
      });

      if (response?.success) {
        showToast('Titular actualizado', 'success');
        setOpenTitular(false);
        setErrorsT({});
        reLoad();
      } else {
        showToast(response?.message || 'Error al actualizar titular', 'error');
      }
    } catch (error) {
      showToast('Error al actualizar titular', error);
    }
  };

  const handleOpenDependentProfile = (owner_id: string) => {
    setSelectedDependentId(owner_id);
    setOpenProfileModal(true);
  };
  const onDel = async () => {
    const { data } = await execute('/dptos/' + datas.data.id, 'DELETE');
    if (data?.success) {
      showToast('Unidad eliminada', 'success');
      router.push('/units');
    } else {
      showToast(data?.message || 'Error al eliminar unidad', 'error');
    }
  };

  const onTitular = () => {
    if (!datas?.data?.homeowner) {
      showToast(
        'No se puede asignar un titular a esta casa porque no existe un propietario registrado.',
        'error'
      );
      return;
    }
    setOpenTitular(true);
  };

  const removeTitular = async () => {
    const { data } = await execute('/dptos-remove-titular', 'POST', {
      dpto_id: datas?.data?.id,
    });
    if (data?.success) {
      showToast('Titular eliminado', 'success');
      reLoad();
      setOpenDelTitular(false);
    } else {
      showToast(data?.message || 'Error al eliminar titular', 'error');
    }
  };

  return (
    <div className={styles.container}>
      <HeaderBack label="Volver a lista de unidades" onClick={() => router.push('/units')} />
      <section>
        <div className={styles.firtsPanel}>
          <UnitInfo
            datas={datas}
            onEdit={() => setOpenEdit(true)}
            onDelete={() => setOpenDel(true)}
            onTitular={onTitular}
            onRemoveTitular={() => setOpenDelTitular(true)}
            onOpenDependentProfile={handleOpenDependentProfile}
            onOpenTitularHist={() => setOpenTitularHist(true)}
          />

          <WidgetBase
            title={
              <TitleRender
                title="Historial de pagos"
                onClick={() => locationParams('/payments', 'paymentSearchBy', datas?.data?.nro)}
              />
            }
            subtitle={`Últimos ${datas?.payments?.length || 0} pagos`}
            variant="V1"
            style={{ flex: 1, minWidth: '300px' }}
          >
            <div className={styles.accountContent}>
              <PaymentsTable payments={datas?.payments} />
            </div>
          </WidgetBase>
        </div>

        <div className={styles.secondPanel}>
          {/* Historial de Accesos - Tabla */}
          <WidgetBase
            subtitle={'+' + datas.accessCount + ' accesos nuevos este mes'}
            title={
              <TitleRender
                title="Historial de accesos"
                onClick={() => router.push(`/activities?search_by=${datas?.data?.nro}`)}
              />
            }
            variant="V1"
            style={{ flex: 1, minWidth: '300px' }}
          >
            <div className={styles.accessContent}>
              <AccessTable access={datas?.access} titular={datas?.titular} />
            </div>
          </WidgetBase>

          {/* Historial de Reservas - Tabla */}
          <WidgetBase
            title={
              <TitleRender
                title="Historial de reservas"
                onClick={() => router.push(`/reservas?search_by=${datas?.data?.nro}`)}
              />
            }
            subtitle={'+' + datas.reservationsCount + ' reservas nuevas este mes'}
            variant="V1"
            style={{ flex: 1, minWidth: '300px' }}
          >
            <div className={styles.reservationsContent}>
              <ReservationsTable reservations={datas?.reservations} titular={datas?.titular} />
            </div>
          </WidgetBase>
        </div>

        {/* Modales */}
        <DataModal
          title="Cambiar de titular"
          open={openTitular}
          onSave={onSave}
          onClose={() => setOpenTitular(false)}
          buttonText="Guardar"
        >
          <div className={styles.modalContent}>
            <Select
              placeholder="Selecciona al nuevo titular"
              name="owner_id"
              error={errorsT.owner_id}
              required={true}
              value={formState.owner_id || ''}
              onChange={e => setFormState({ ...formState, owner_id: e.target.value })}
              options={(datas?.owners || []).map((owner: any) => ({
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
            ownershipData={datas?.titularHist || []}
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
              idPerfil === datas?.titular?.id
                ? datas?.titular
                : datas?.titular?.dependientes?.find((dep: any) => dep.owner_id === idPerfil)
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
            variant={"mini"}
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
            title="Eliminar titular"
            open={openDelTitular}
            onSave={removeTitular}
            variant={"mini"}
            onClose={() => setOpenDelTitular(false)}
            buttonText="Eliminar"
          >
            <p>¿Estás seguro de que quieres eliminar este titular?</p>
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
