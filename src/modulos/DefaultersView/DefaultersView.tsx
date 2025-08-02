'use client';
import React, { useEffect, useMemo, useState } from 'react';
import styles from './DefaultersView.module.css';

import GraphBase from '@/mk/components/ui/Graphs/GraphBase';
import { getFullName, getUrlImages } from '@/mk/utils/string';
import { formatNumber } from '@/mk/utils/numbers';
import { useAuth } from '@/mk/contexts/AuthProvider';
import {
  IconMultas,
  IconHandcoin,
  IconHousing,
  IconCategories,
} from '../../components/layout/icons/IconsBiblioteca';
import LoadingScreen from '@/mk/components/ui/LoadingScreen/LoadingScreen';
import useCrud from '@/mk/hooks/useCrud/useCrud';
import WidgetDefaulterResume from '@/components/Widgets/WidgetDefaulterResume/WidgetDefaulterResume';
import { Avatar } from '@/mk/components/ui/Avatar/Avatar';
import { WidgetDashCard } from '@/components/Widgets/WidgetsDashboard/WidgetDashCard/WidgetDashCard';
import FormatBsAlign from '@/mk/utils/FormatBsAlign';

const DefaultersView = () => {
  useEffect(() => {});

  const mod = {
    modulo: 'defaulters',
    singular: 'Moroso',
    plural: 'Morosos',
    permiso: '',
    extraData: true,
    export: true,
    hideActions: {
      view: true,
      add: true,
      edit: true,
      del: true,
    },
    filter: true,
    saveMsg: {
      add: 'Moroso creado con éxito',
      edit: 'Moroso actualizado con éxito',
      del: 'Moroso eliminado con éxito',
    },
  };

  const paramsInitial = {
    fullType: 'L',
    page: 1,
    perPage: -1,
  };
  const { setStore, store } = useAuth();
  useEffect(() => {
    setStore({ ...store, title: '' });
  }, []);
  const fields = useMemo(
    () => ({
      dpto: {
        rules: [],
        api: 'ae',
        label: 'Unidad',
        width: '170px',
        list: {
          width: '83px',
        },
      },
      titular: {
        rules: [],
        api: 'ae',
        label: 'Titular',
        list: {
          onRender: (props: any) => {
            const titular = props?.item?.titular?.owner;
            const titularId = titular?.id;

            return (
              <div>
                {titular ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <Avatar
                      hasImage={titular?.has_image}
                      src={
                        titularId
                          ? getUrlImages(
                              '/OWNER' +
                                '-' +
                                titularId +
                                '.webp' +
                                (titular?.updated_at ? '?d=' + titular?.updated_at : '')
                            )
                          : ''
                      }
                      name={getFullName(titular)}
                      w={32}
                      h={32}
                    />
                    {getFullName(titular)}
                  </div>
                ) : (
                  ' Sin titular'
                )}
              </div>
            );
          },
        },
      },
      count: {
        rules: [],
        api: 'ae',
        label: 'Expensas atrasadas',
        width: '115px',
        list: {
          onRender: (props: any) => {
            const s = props?.item?.count > 1 ? 's' : '';
            return props?.item?.count + ' expensa' + s;
          },
        },
      },
      expensa: {
        rules: [],
        api: 'ae',
        label: (
          <span style={{ display: 'block', textAlign: 'right', width: '100%' }}>Monto por expensa</span>
        ),
        list: {
          onRender: (props: any) => <FormatBsAlign value={props?.item?.expensa} alignRight />,
        },
      },
      multa: {
        rules: [],
        api: 'ae',
        label: (
          <span style={{ display: 'block', textAlign: 'right', width: '100%' }}>Multa</span>
        ),
        list: {
          onRender: (props: any) => <FormatBsAlign value={props?.item?.multa} alignRight />,
        },
      },

      total: {
        rules: [],
        api: 'ae',
        label: (
          <span style={{ display: 'block', textAlign: 'right', width: '100%' }}>Total</span>
        ),
        list: {
          onRender: (props: any) => <FormatBsAlign value={props?.item?.expensa + props?.item?.multa} alignRight />,
        },
      },
    }),
    []
  );

  const {
    userCan,
    List,
    onView,
    onEdit,
    onDel,
    reLoad,
    onAdd,
    execute,
    setParams,
    data,
    extraData,
  } = useCrud({
    paramsInitial,
    mod,
    fields,
    // extraButtons,
  });

  // Estado para controlar el número total de defaulters
  const [defaultersLength, setDefaultersLength] = useState(0);

  // Actualizar datos cuando cambia data
  useEffect(() => {
    if (data?.data) {
      setDefaultersLength(data.data.length ?? 0);
    }
  }, [data]);

  // Calcular totales desde los datos individuales ya que extraData viene en 0
  const calculatedTotals = useMemo(() => {
    if (!data?.data || data.data.length === 0) {
      return { porCobrarExpensa: 0, porCobrarMulta: 0 };
    }
    
    const totals = data.data.reduce((acc: any, item: any) => {
      acc.porCobrarExpensa += item.expensa || 0;
      acc.porCobrarMulta += item.multa || 0;
      return acc;
    }, { porCobrarExpensa: 0, porCobrarMulta: 0 });
    
    return totals;
  }, [data?.data]);

  // Usar los totales calculados o los del extraData si están disponibles
  const finalTotals = {
    porCobrarExpensa: extraData?.porCobrarExpensa || calculatedTotals.porCobrarExpensa,
    porCobrarMulta: extraData?.porCobrarMulta || calculatedTotals.porCobrarMulta,
  };

  // Calcular el total de morosidad
  const totalMorosidad = finalTotals.porCobrarExpensa + finalTotals.porCobrarMulta;

  // Calcular porcentajes para la gráfica
  const porcentajeExpensas =
    totalMorosidad > 0
      ? Math.round((finalTotals.porCobrarExpensa / totalMorosidad) * 100)
      : 0;
  const porcentajeMultas =
    totalMorosidad > 0 ? Math.round((finalTotals.porCobrarMulta / totalMorosidad) * 100) : 0;

  // Componente del panel derecho con gráfico y widgets
  // Actualizar la configuración del gráfico en la función renderRightPanel
  const renderRightPanel = () => {
    // Definir los colores consistentes para los widgets y el gráfico
    const expensaColor = 'var(--cCompl5)'; // Color naranja para expensas (del IconBilletera)
    const multaColor = 'var(--cCompl3)'; // Color morado para multas (del IconMultas)
    const totalColor = 'var(--cWhite)'; // Color verde para el total (del IconHandcoin)

    return (
      <div className={styles.rightPanel}>
        <div className={styles.subtitle}>Representación gráfica del estado general de morosos </div>
        <div className={styles.widgetsPanel}>
          <section>
            <WidgetDefaulterResume
              title={'Total de expensas'}
              amount={`Bs ${formatNumber(finalTotals.porCobrarExpensa)}`}
              pointColor={'var(--cCompl5)'}
              icon={
                <IconHandcoin
                  size={26}
                  color={'var(--cCompl5)'}
                  style={{ borderColor: 'var(--cCompl5)', borderWidth: 1 }}
                />
              }
              iconBorderColor="var(--cCompl5)"
              backgroundColor={'var(--cHoverCompl8)'}
              textColor="white"
              style={{ width: '100%', borderColor: 'var(--cCompl5)' }}
            />

            <WidgetDefaulterResume
              title={'Total de multas'}
              amount={`Bs ${formatNumber(finalTotals.porCobrarMulta)}`}
              pointColor={'var(--cCompl3)'}
              icon={<IconMultas size={26} color={'var(--cCompl3)'} />}
              iconBorderColor="var(--cCompl3)"
              backgroundColor={'var(--cHoverCompl6)'}
              textColor="white"
              style={{ width: '100%', borderColor: 'var(--cCompl3)' }}
            />
          </section>
        </div>
        <div className={styles.graphPanel}>
          <GraphBase
            data={{
              labels: ['Expensas', 'Multas'],
              values: [
                {
                  name: 'Expensas',
                  values: [finalTotals.porCobrarExpensa],
                },
                {
                  name: 'Multas',
                  values: [finalTotals.porCobrarMulta],
                },
              ],
            }}
            chartTypes={['donut']}
            background="darkv2"
            options={{
              // title: "Representación gráfica del estado general de morosos",
              subtitle: '',
              label: 'Total de morosidad general entre expensas y multas',
              // Usar exactamente los mismos colores que los fondos de los widgets
              colors: [expensaColor, multaColor],
              height: 380,
              width: 380,
              centerText: 'Total',
            }}
          />
        </div>
        <div
          style={{
            fontWeight: 'Bold',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column',
          }}
        ></div>
      </div>
    );
  };
  return (
    <LoadingScreen>
      <div className={`${styles.container} defaulters-view-container`}>
        <h1 className={styles.title}>Morosos</h1>
        <WidgetDashCard
          title="Total de unidades morosas"
          data={`${defaultersLength}`}
          onClick={() => {}}
          tooltip={true}
          tooltipTitle="Lista de unidades que no han  pagado sus expensas a tiempo."
          icon={
            <IconHousing
              reverse
              size={32}
              color={
                !defaultersLength || defaultersLength === 0 ? 'var(--cWhiteV1)' : 'var(--cInfo)'
              }
              style={{
                backgroundColor:
                  !defaultersLength || defaultersLength === 0
                    ? 'var(--cHover)'
                    : 'var(--cHoverCompl3)',
              }}
              circle
            />
          }
          className={styles.widgetResumeCard}
          style={{ maxWidth: 280 }}
        />

        <div className={styles.listContainer}>
          <List
            height={'calc(100vh - 380px)'}
            renderRight={data?.data && data.data.length > 0 ? renderRightPanel : undefined}
            emptyMsg="Lista de morosos vacía. Una vez las cuotas corran, los"
            emptyLine2="residentes con pagos atrasados los verás aquí."
            emptyIcon={<IconCategories size={80} color="var(--cWhiteV1)" />}
            emptyFullScreen={true}
          />
        </div>
      </div>
    </LoadingScreen>
  );
};

export default DefaultersView;
