import React, { useMemo } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { FormField } from '@/store/useFormBuilderStore';
import { DynamicField } from './DynamicField';
import { Button } from '@/components/ui/button';

interface DynamicFormProps {
  formDefinition: {
    fields: FormField[];
  };
  onSubmit: (data: any) => void;
  defaultValues?: any;
}

export function DynamicForm({ formDefinition, onSubmit, defaultValues = {} }: DynamicFormProps) {
  const { fields } = formDefinition;

  const schema = useMemo(() => {
    const shape: Record<string, z.ZodTypeAny> = {};
    
    fields.forEach(field => {
      let fieldSchema: z.ZodTypeAny;

      switch (field.type) {
        case 'number':
          fieldSchema = z.number({ invalid_type_error: "Must be a number" });
          break;
        case 'checkbox':
          fieldSchema = z.boolean().or(z.array(z.string()));
          break;
        case 'switch':
          fieldSchema = z.boolean();
          break;
        default:
          fieldSchema = z.string();
      }

      let isRequired = false;
      if (field.validations && field.validations.length > 0) {
        field.validations.forEach(v => {
          if (v.type === 'required') {
            isRequired = true;
            if (fieldSchema instanceof z.ZodString) {
              fieldSchema = fieldSchema.min(1, { message: v.message || 'Required' });
            } else if (fieldSchema instanceof z.ZodNumber) {
              fieldSchema = fieldSchema.min(-Infinity, { message: v.message || 'Required' });
            }
          }
          if (fieldSchema instanceof z.ZodString) {
            if (v.type === 'minLength') fieldSchema = fieldSchema.min(v.value, { message: v.message });
            if (v.type === 'maxLength') fieldSchema = fieldSchema.max(v.value, { message: v.message });
            if (v.type === 'email') fieldSchema = fieldSchema.email({ message: v.message });
            if (v.type === 'url') fieldSchema = fieldSchema.url({ message: v.message });
            if (v.type === 'regex') fieldSchema = fieldSchema.regex(new RegExp(v.value), { message: v.message });
            // Client-side Alphanumeric Regex Validation
            if (v.type === 'alphanumeric') fieldSchema = fieldSchema.regex(/^[a-zA-Z0-9\s]*$/, { message: v.message || 'Must be alphanumeric' });
          }
          if (fieldSchema instanceof z.ZodNumber) {
             if (v.type === 'min') fieldSchema = fieldSchema.min(v.value, { message: v.message });
             if (v.type === 'max') fieldSchema = fieldSchema.max(v.value, { message: v.message });
          }
        });
      }

      if (!isRequired && field.type !== 'switch' && field.type !== 'checkbox') {
        fieldSchema = fieldSchema.optional();
      }

      shape[field.name] = fieldSchema;
    });

    return z.object(shape);
  }, [fields]);

  const methods = useForm({
    resolver: zodResolver(schema),
    defaultValues: fields.reduce((acc, field) => {
      acc[field.name] = defaultValues[field.name] ?? field.defaultValue ?? '';
      if (field.type === 'switch' || field.type === 'checkbox') {
        acc[field.name] = defaultValues[field.name] ?? field.defaultValue ?? false;
      }
      return acc;
    }, {} as any)
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
        {fields.map(field => (
          <DynamicField key={field.id} field={field} />
        ))}
        <Button type="submit">Submit Form</Button>
      </form>
    </FormProvider>
  );
}
