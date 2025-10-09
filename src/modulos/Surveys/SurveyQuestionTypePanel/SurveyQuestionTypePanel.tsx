import React, { useState } from 'react';
import styles from './SurveyQuestionTypePanel.module.css';
import { IconParagraph, IconParkListCheckbox, IconSingleChoiceSurvey, IconTowtoneLinearScale, IconX } from '@/components/layout/icons/IconsBiblioteca';

interface SurveyQuestionTypePanelProps {
    openSurveyType: any;
    // formState:any;
    // setFormState:any;
    iconX?: boolean;
}
const SurveyQuestionTypePanel = ({openSurveyType,iconX}:SurveyQuestionTypePanelProps) => {
  const [view,setView]= useState(true);
   const ShowComponent =()=> {
    setView(false);
   }
if(!view){
  return null;
}else{
  return (
    <div className={styles.surveyQuestionTypePanel}>
        <div className={styles.surveyQuestionHeader}>
            <div >   
            <h2>Tipo de pregunta</h2>
            <p>Elige el tipo de pregunta que quieras para tu encuesta</p>
            </div>
            {iconX &&     <IconX onClick={ShowComponent} />}
        
        </div>

      <section>  
      <div className={styles.questionTypeOption} onClick={()=>openSurveyType('S')}>
        <div className={styles.icon}><IconSingleChoiceSurvey size={32}  /></div>
        <div className={styles.textContainer}>
          <h3>Opción única</h3>
          <p>(El afiliado solo podrá elegir una opción)</p>
        </div>
      </div>
      <div className={styles.questionTypeOption} onClick={()=>openSurveyType('N')}>
        <div className={styles.icon}><IconParkListCheckbox size={32}/></div>
        <div className={styles.textContainer}>
          <h3>Opción múltiple</h3>
          <p>(El afiliado elegirá más de una opción)</p>
        </div>
      </div>
      <div className={styles.questionTypeOption} onClick={()=>openSurveyType('E')}>
        <div className={styles.icon}><IconTowtoneLinearScale size={32} /></div>
        <div className={styles.textContainer}>
          <h3>Opción en escala</h3>
          <p>(El afiliado elegirá una puntuación entre el 1 y 10)</p>
        </div>
      </div>
      <div className={styles.questionTypeOption} onClick={()=>openSurveyType('T')}>
        <div className={styles.icon}><IconParagraph size={32}/></div>
        <div className={styles.textContainer}>
          <h3>Opción de caja de texto</h3>
          <p>(El afiliado responderá mediante un párrafo de texto)</p>
        </div>
      </div>
      </section>
    </div>
  );}
};

export default SurveyQuestionTypePanel;
