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
  IconRatioOn,
  IconTrash,
} from "@/components/layout/icons/IconsBiblioteca";
import TextArea from "@/mk/components/forms/TextArea/TextArea";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import WidgetScale from "@/components/WidgetScale/WidgetScale";


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
    <div className={styles.surveyquestion}>
      <h3>{question.name}</h3>
      <p>{question.description}</p>
      <div>
        {question.options.map((option) => (
          <div key={option.id}>
            <IconRatioOn color="var(--cBlackV2)" size={20} />
            <p>{option.name}</p>
          </div>
        ))}
      </div>
      <div>
        <IconEdit onClick={onEdit} />
        <IconTrash onClick={handleDelete} />
      </div>
      <DeleteConfirmationModal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
      />
    </div>
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
    <div className={styles.surveyquestion}>
      <h3>{question.name}</h3>
      <p>{question.description}</p>
      <div>
        {question.options.map((option) => (
          <div key={option.id}>
            <IconCheckOff color="var(--cBlackV2)" />
            <p>{option.name}</p>
          </div>
        ))}
      </div>
      <div>
        <IconEdit onClick={onEdit} />
        <IconTrash onClick={handleDelete} />
      </div>
      <DeleteConfirmationModal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
      />
    </div>
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
    <div className={styles.scale}>
      <WidgetScale
        title={question.name}
        description={question.description}
        minValue={parseInt(question.min)}
        maxValue={parseInt(question.max)}
        minLabel={question.options[0].name}
        maxLabel={question.options[question.options.length - 1].name}
      />
      <div>
        <IconEdit onClick={onEdit} />
        <IconTrash onClick={handleDelete} />
      </div>
      <DeleteConfirmationModal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
      />
    </div>
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
    <div className={styles.surveyquestion}>
      <h3>{question.name}</h3>
      <p>{question.description}</p>
      <div>
        <TextArea
          value={""}
          name=""
          label="Escribe tu respuesta aquí"
          lines={5}
          disabled={true}
        />
      </div>
      <div>
        <IconEdit onClick={onEdit} />
        <IconTrash onClick={handleDelete} />
      </div>
      <DeleteConfirmationModal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
      />
    </div>
  );
};
