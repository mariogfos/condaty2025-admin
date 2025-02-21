import Input from '@/mk/components/forms/Input/Input'
import React from 'react'


interface DefaulterConfigProps {
    formState:any;
    onChange:any;
    errors:any;
}
const DefaulterConfig = ({formState,onChange,errors}:DefaulterConfigProps) => {
  return (
    <div className=" ">
    <p className="text-[24px] text-tWhite ">
      Gestionar a los morosos es una tarea importante para los
      administradores de condominios
    </p>
    <p className="text-sm text-lightv3 mb-8">
      Configura las acciones que se tomarán con los mororsos de tu
      comunidad
    </p>
    <div>
      <div className="gap-5 mb-10 items-center">
        <p className="text-tWhite text-base">Pre-aviso</p>
        <p className="text-lightv3 text-sm">
          Define la cantidad de expensas una vez que se establece el
          período de soft baneo, los morosos que no paguen sus cuotas
          dentro de ese período recibirán notificaciones en la app
          informándoles que su acceso será bloqueado si no pagan sus
          deudas.
        </p>
        <div className="flex gap-5 items-center my-3">
          <p className="text-tWhite text-sm font-light">
            Número de expensas
          </p>
          <div className="w-[15%] tablet:w-1/12">
            <Input
              type="number"
              label=""
              className="flex items-center"
              name="soft_limit"
              error={errors}
              required
              value={formState?.soft_limit}
              onChange={onChange}
            />
          </div>
        </div>
      </div>

      <div className=" gap-5 mb-10 items-center">
        <p className="text-tWhite text-base">Bloqueo</p>
        <p className="text-lightv3 text-sm">
          Define la cantidad de expensas atrasadas puede tener un moroso
          para que ya no pueda usar la app esta acción bloqueará el
          acceso de un moroso a la app Condaty de forma permanente.
        </p>
        <div className="flex gap-5 items-center my-3">
          <p className="text-tWhite text-sm font-light">
            Número de expensas
          </p>
          <div className="w-[15%] tablet:w-1/12">
            <Input
              type="number"
              label=""
              className="flex items-center"
              name="hard_limit"
              error={errors}
              required
              value={formState?.hard_limit}
              onChange={onChange}
            />
          </div>
        </div>
      </div>

      <div className="my-8">
        <p className="text-2xl text-tWhite ">Multas por morosidad</p>
        <p className="text-lightv3 text-sm">
          Configura las multas por morosidad en Condaty y garantiza el
          cumplimiento de las cuotas mensuales. Con nuestro sistema,
          puedes establecer el porcentaje de la multa y el número de
          meses que transcurrirán antes de que se comience a cobrar.
        </p>

        <div className="mt-10 mb-2">
          <p className="text-base text-tWhite">
            Porcentaje de multa por morosidad
          </p>
          <p className="text-lightv3 text-sm">
            Establece el porcentaje de la multa que se aplicará por cada
            mes de morosidad.
          </p>
        </div>
        <div className="flex gap-5 items-center ">
          <p className="text-tWhite text-sm font-light">Porcentaje</p>
          <div className="w-[15%] tablet:w-1/12">
            <Input
              label=""
              className="flex items-center"
              name="penalty_percent"
              error={errors}
              required
              value={formState.penalty_percent}
              onChange={onChange}
            />
          </div>
          <p className="text-tWhite">%</p>
        </div>

        <div className="mt-10 mb-2">
          <p className="text-base text-tWhite">
            Meses para empezar a cobrar la multa
          </p>
          <p className="text-lightv3 text-sm">
            Establece el número de meses que transcurrirán antes de que
            se comience a cobrar la multa por morosidad.
          </p>
        </div>
        <div className="flex gap-5 items-center ">
          <p className="text-tWhite text-sm font-light">
            Número de meses
          </p>
          <div className="w-[15%] tablet:w-1/12">
            <Input
              type="text"
              label=""
              className="flex items-center"
              name="penalty_limit"
              error={errors}
              required
              value={formState?.penalty_limit}
              onChange={onChange}
            />
          </div>
        </div>
      </div>
    </div>
  </div>
  )
}

export default DefaulterConfig