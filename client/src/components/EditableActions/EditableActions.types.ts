export interface EditableActionsProps {
  isEditing: boolean;
  onSave?: () => void;
  onCancel?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isSaveDisabled?: boolean;
  editContainerClassName?: string;
  viewContainerClassName?: string;
  saveButtonClassName?: string;
  cancelButtonClassName?: string;
  editButtonClassName?: string;
  deleteButtonClassName?: string;
  viewVariant?: 'default' | 'icon';
}
