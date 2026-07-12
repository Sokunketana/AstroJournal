import React from 'react';
import Button from '../Button';
import { Check, X, Pencil, Trash2 } from 'lucide-react';
import type { EditableActionsProps } from './EditableActions.types';

const EditableActions: React.FC<EditableActionsProps> = ({
  isEditing,
  onSave,
  onCancel,
  onEdit,
  onDelete,
  isSaveDisabled = false,
  editContainerClassName = 'flex items-center gap-2',
  viewContainerClassName = 'flex items-center gap-2',
  saveButtonClassName = '',
  cancelButtonClassName = '',
  editButtonClassName = '',
  deleteButtonClassName = '',
  viewVariant = 'default',
}) => {
  if (isEditing) {
    return (
      <div className={editContainerClassName}>
        {onSave && (
          <Button variant="success" icon={Check} onClick={onSave} disabled={isSaveDisabled} className={saveButtonClassName}>
            Save
          </Button>
        )}
        {onCancel && (
          <Button variant="ghost" icon={X} onClick={onCancel} className={cancelButtonClassName}>
            Cancel
          </Button>
        )}
      </div>
    );
  }
 
  if (viewVariant === 'icon') {
    return (
      <div className={viewContainerClassName}>
        {onEdit && <Button variant="icon" icon={Pencil} onClick={onEdit} className={editButtonClassName} />}
        {onDelete && <Button variant="icon" icon={Trash2} onClick={onDelete} className={deleteButtonClassName} />}
      </div>
    );
  }

  return (
    <div className={viewContainerClassName}>
      {onEdit && (
        <Button variant="ghost" icon={Pencil} onClick={onEdit} className={editButtonClassName}>
          Edit
        </Button>
      )}
      {onDelete && (
        <Button variant="danger" icon={Trash2} onClick={onDelete} className={deleteButtonClassName}>
          Delete Entry
        </Button>
      )}
    </div>
  );
};

export default EditableActions;
