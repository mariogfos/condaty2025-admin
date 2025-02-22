import Input from '@/mk/components/forms/Input/Input'
import React from 'react'
import styles from './Config.module.css'


interface DefaulterConfigProps {
    formState:any;
    onChange:any;
    errors:any;
}
const DefaulterConfig = ({formState,onChange,errors}:DefaulterConfigProps) => {
  return (
    <div className=" ">
    <div className={styles.textTitle} style={{fontSize:24}}>
      Gestionar a los morosos es una tarea importante para los
      administradores de condominios
    </div>
       <div className={styles.textSubtitle}>
      Configura las acciones que se tomarán con los mororsos de tu
      comunidad
            </div>
    <div style={{display:'flex',flexDirection:'column',marginTop:16}}>
      <div className={styles.boxDefaulter}>
        <section>                  
              <div className={styles.textTitle} >Pre-aviso</div>
              <div className={styles.textSubtitle}>
              Define la cantidad de expensas una vez que se establece el
              período de soft baneo, los morosos que no paguen sus cuotas
              dentro de ese período recibirán notificaciones en la app
              informándoles que su acceso será bloqueado si no pagan sus
              deudas.
              </div>
        </section>

        <div className="flex gap-5 items-center my-3">
                    <div className="text-tWhite text-sm font-light">
                    Número de expensas
                  </div>
          <div className={styles.inputBoxDefaulter}>
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

      <div className={styles.boxDefaulter}>
      <section> 
                  <div className={styles.textTitle}>Bloqueo</div>
                  <div className={styles.textSubtitle}>
                  Define la cantidad de expensas atrasadas puede tener un moroso
                  para que ya no pueda usar la app esta acción bloqueará el
                  acceso de un moroso a la app Condaty de forma permanente.
                </div>
        </section>        
        <div className="flex gap-5 items-center my-3">
                    <div className="text-tWhite text-sm font-light">
                     Número de expensas
                  </div>
          <div className={styles.inputBoxDefaulter}>
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

      <div >
        <div className={styles.boxDefaulter}>
        <section>
                  <div className={styles.textTitle}>Multas por morosidad </div>
                  <div className={styles.textSubtitle}>
                    Configura las multas por morosidad en Condaty y garantiza el
                    cumplimiento de las cuotas mensuales. Con nuestro sistema,
                    puedes establecer el porcentaje de la multa y el número de
                    meses que transcurrirán antes de que se comience a cobrar.
                </div>
        </section>
        </div>
        <div className={styles.boxDefaulter}>
          <section style={{alignSelf:'flex-start'}}>
              <div className={styles.textTitle}>
                 Porcentaje de multa por morosidad
                  </div>
                    <div className={styles.textSubtitle}>
                    Establece el porcentaje de la multa que se aplicará por cada
                    mes de morosidad.
                  </div>
                  </section>
       
        <div className="flex gap-5 items-center ">
                    <div className="text-tWhite text-sm font-light">Porcentaje        </div>
          <div className={styles.inputBoxDefaulter}>
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
                    <div className="text-tWhite">%        </div>
        </div>
        </div>

        <div className={styles.boxDefaulter}>
          <section style={{alignSelf:'flex-start'}}>
                    <div className={styles.textTitle}>
                    Meses para empezar a cobrar la multa
                  </div>
                    <div className={styles.textSubtitle}>
                      Establece el número de meses que transcurrirán antes de que
                      se comience a cobrar la multa por morosidad.
                  </div>
                  </section>
        </div>
        <div className="flex gap-5 items-center ">
      
          <div className={styles.inputBoxDefaulter} style={{marginBottom:'var(--spL)'}}>
            <Input
              type="text"
              label="Número de meses"
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