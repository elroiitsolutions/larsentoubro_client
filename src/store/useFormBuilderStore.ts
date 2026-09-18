import { create } from 'zustand';

export type FieldType =
  | 'text'
  | 'number'
  | 'email'
  | 'password'
  | 'date'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'textarea'
  | 'file'
  | 'switch';

export interface ValidationRule {
  type: string;
  value?: any;
  message: string;
}

export interface FormCondition {
  fieldId: string;
  operator: string;
  value: any;
}

export interface FormField {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  defaultValue?: any;
  helperText?: string;
  options?: { label: string; value: string }[];
  validations?: ValidationRule[];
  conditions?: FormCondition[];
  group?: string;
  order: number;
  disabled?: boolean;
  readOnly?: boolean;
}

interface FormBuilderState {
  fields: FormField[];
  selectedFieldId: string | null;
  formName: string;
  formSlug: string;
  formDescription: string;
  setFormName: (name: string) => void;
  setFormSlug: (slug: string) => void;
  setFormDescription: (description: string) => void;
  addField: (field: FormField) => void;
  removeField: (id: string) => void;
  updateField: (id: string, updates: Partial<FormField>) => void;
  reorderFields: (startIndex: number, endIndex: number) => void;
  setSelectedFieldId: (id: string | null) => void;
  loadForm: (form: any) => void;
}

export const useFormBuilderStore = create<FormBuilderState>((set) => ({
  fields: [],
  selectedFieldId: null,
  formName: '',
  formSlug: '',
  formDescription: '',
  setFormName: (name) => set({ formName: name }),
  setFormSlug: (slug) => set({ formSlug: slug }),
  setFormDescription: (description) => set({ formDescription: description }),
  addField: (field) => {
    // Automatically add 'alphanumeric' rule for text-based fields by default
    if (['text', 'textarea', 'password'].includes(field.type)) {
      if (!field.validations) field.validations = [];
      field.validations.push({ type: 'alphanumeric', message: 'Must be alphanumeric' });
    }
    return set((state) => ({
      fields: [...state.fields, { ...field, order: state.fields.length }],
      selectedFieldId: field.id,
    }));
  },
  removeField: (id) =>
    set((state) => {
      const remaining = state.fields.filter((f) => f.id !== id);
      const reordered = remaining.map((f, idx) => ({ ...f, order: idx }));
      return {
        fields: reordered,
        selectedFieldId: state.selectedFieldId === id ? null : state.selectedFieldId,
      };
    }),
  updateField: (id, updates) =>
    set((state) => ({
      fields: state.fields.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    })),
  reorderFields: (startIndex, endIndex) =>
    set((state) => {
      const result = Array.from(state.fields);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      
      const reordered = result.map((f, index) => ({ ...f, order: index }));
      return { fields: reordered };
    }),
  setSelectedFieldId: (id) => set({ selectedFieldId: id }),
  loadForm: (form) =>
    set({
      formName: form.name,
      formSlug: form.slug,
      formDescription: form.description || '',
      fields: form.fields || [],
      selectedFieldId: null,
    }),
}));
