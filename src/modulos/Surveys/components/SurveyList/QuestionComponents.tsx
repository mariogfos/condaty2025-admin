import React, { useState } from "react";
import {
  SingleChoiceQuestion,
  MultipleChoiceQuestion,
  ScaleQuestion,
  TextQuestion,
} from "./QuestionInterfaces";
import styles from "./SurveyList.module.css";
import {
  IconCheckOff,
  IconEdit,
  IconRatioOff,
  IconRatioOn,
  IconTrash,
} from "@/components/layout/icons/IconsBiblioteca";
import TextArea from "@/mk/components/forms/TextArea/TextArea";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import SurveyQuestion from "../Questions/SurveyQuestion";
import SingleChoice from "../Questions/SingleChoice";
import MultipleChoice from "../Questions/MultipleChoice";
import ScaleChoice from "../Questions/ScaleChoice";
import TextChoice from "../Questions/TextChoice";


// Reutilizamos la lógica para cada tipo de pregunta
const DeleteConfirmationModal: React.FC<{
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
}> = ({ show, onClose, onConfirm }) => (
  <DataModal
    open={show}
    title="Eliminar pregunta"
    onClose={onClose}
    buttonText="Eliminar"
    buttonCancel="Cancelar"
    onSave={onConfirm}
  >
    <p className={styles.modalLogout}>
      ¿Estás seguro de que deseas eliminar esta pregunta?
    </p>
  </DataModal>
);

export const SingleChoiceQuestionComponent: React.FC<{
  question: SingleChoiceQuestion;
  onDelete: () => void;
  onEdit: () => void;
}> = ({ question, onDelete, onEdit }) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    onDelete();
    setShowDeleteModal(false);
  };

  return (
    <SurveyQuestion
      label={question.question_text}
      description={question.description}
      className={styles.surveyquestion}
      actions={
        <div style={{color: 'var(--cWhiteV1)'}}>
          <IconEdit onClick={onEdit} />
          <IconTrash onClick={handleDelete} />
          <DeleteConfirmationModal
            show={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={confirmDelete}
          />
        </div>
      }
    >
      <SingleChoice
        options={question.soptions}
        onChange={() => {}}
        readOnly={true}
      />
    </SurveyQuestion>
  );
};

// Repetir la misma lógica en los demás componentes

export const MultipleChoiceQuestionComponent: React.FC<{
  question: MultipleChoiceQuestion;
  onDelete: () => void;
  onEdit: () => void;
}> = ({ question, onDelete, onEdit }) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    onDelete();
    setShowDeleteModal(false);
  };

  return (
    <SurveyQuestion
      label={question.question_text}
      description={question.description}
      className={styles.surveyquestion}
      actions={
        <div>
          <IconEdit onClick={onEdit} />
          <IconTrash onClick={handleDelete} />
          <DeleteConfirmationModal
            show={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={confirmDelete}
          />
        </div>
      }
    >
      <MultipleChoice
        options={question.soptions}
        onChange={() => {}}
        readOnly={true}
      />
    </SurveyQuestion>
  );
};

export const ScaleQuestionComponent: React.FC<{
  question: ScaleQuestion;
  onDelete: () => void;
  onEdit: () => void;
}> = ({ question, onDelete, onEdit }) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    onDelete();
    setShowDeleteModal(false);
  };

  return (
    <SurveyQuestion
      label={question.question_text}
      description={question.description}
      className={styles.scale}
      actions={
        <div>
          <IconEdit onClick={onEdit} />
          <IconTrash onClick={handleDelete} />
          <DeleteConfirmationModal
            show={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={confirmDelete}
          />
        </div>
      }
    >
      <ScaleChoice
        minOptions={question.min_options}
        maxOptions={question.max_options}
        minLabel={(question as any).label_first || question.soptions[0]?.option_text}
        maxLabel={(question as any).label_last || question.soptions[question.soptions.length - 1]?.option_text}
        onChange={() => {}}
        readOnly={true}
      />
    </SurveyQuestion>
  );
};

export const TextQuestionComponent: React.FC<{
  question: TextQuestion;
  onDelete: () => void;
  onEdit: () => void;
}> = ({ question, onDelete, onEdit }) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    onDelete();
    setShowDeleteModal(false);
  };

  return (
    <SurveyQuestion
      label={question.question_text}
      description={question.description}
      className={styles.surveyquestion}
      actions={
        <div>
          <IconEdit onClick={onEdit} />
          <IconTrash onClick={handleDelete} />
          <DeleteConfirmationModal
            show={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={confirmDelete}
          />
        </div>
      }
    >
      <TextChoice
        name={`preview_${question.id}`}
        onChange={() => {}}
        readOnly={true}
      />
    </SurveyQuestion>
  );
};
