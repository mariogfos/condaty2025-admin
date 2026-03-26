import React from 'react'
import WidgetBase from '../../WidgetBase/WidgetBase'
import Button from '@/mk/components/forms/Button/Button'
import useAxios from '@/mk/hooks/useAxios';
import { useAuth } from '@/mk/contexts/AuthProvider';
import styles from './WidgetCalculatePenalty.module.css'

const WidgetCalculatePenalty = () => {
  const {execute,reLoad} = useAxios();
  const { showToast,  userCan} = useAuth();

    const calculatePenalty = async () => {
        if (userCan("home", "C") == false)
          return showToast("No tiene permisos para calcular multas", "error");
        const { data: multas, error } = await execute(
          "/setmultas",
          "GET",
          {},
          false
        );
        if (multas.success) {
          if (multas?.data?.multas <= 0) {
            showToast("Las multas de hoy ya han sido agregadas", "info");
          } else {
            showToast(
              "Multas aplicadas a " + multas?.data?.multas + " unidades",
              "success"
            );
            reLoad();
          }
        } else {
          alert("Ha ocurrido un error al calcular las multas");
        }
      };


  return (
    <WidgetBase className={styles.widgetCalculatePenalty}>
    <div>  
      <div>
        Control de morosidad
      </div>
      <div>
        Con un solo clic puedes calcular las multas y
        garantizar la responsabilidad financiera de los
        residentes.
      </div>                   
      <Button
        onClick={calculatePenalty}>
        Calcular multas
      </Button>
    </div>
    </WidgetBase>
  )
}

export default WidgetCalculatePenalty