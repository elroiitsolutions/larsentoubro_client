import React from 'react';
import { useFormContext, Controller, useWatch } from 'react-hook-form';
import type { FormField } from '@/store/useFormBuilderStore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SelectSeparator
} from "@/components/ui/select"

export function DynamicField({ field }: { field: FormField }) {
  const { control, formState: { errors } } = useFormContext();
  const formValues = useWatch();

  const isVisible = React.useMemo(() => {
    if (!field.conditions || field.conditions.length === 0) return true;
    return field.conditions.every(cond => {
      const targetVal = formValues[cond.fieldId];
      switch (cond.operator) {
        case 'equals': return targetVal === cond.value;
        case 'notEquals': return targetVal !== cond.value;
        case 'contains': return typeof targetVal === 'string' && targetVal.includes(cond.value);
        case 'exists': return !!targetVal;
        case 'notExists': return !targetVal;
        default: return true;
      }
    });
  }, [field.conditions, formValues]);

  if (!isVisible) return null;

  const error = errors[field.name];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 w-full">
      <Label htmlFor={field.name} className={`sm:w-1/3 shrink-0 text-xs sm:text-sm font-semibold text-foreground flex items-center justify-between ${error ? 'text-destructive' : ''}`}>
        <span className="truncate">{field.label}</span>
        {field.validations?.some(v => v.type === 'required') && <span className="text-destructive ml-1 font-bold">*</span>}
      </Label>
      <div className="flex-1 min-w-0 w-full space-y-1">
      
      <Controller
        name={field.name}
        control={control}
        render={({ field: hookField }) => {
          switch (field.type) {
            case 'text':
            case 'email':
            case 'password':
            case 'number':
            case 'date':
              return (
                <Input
                  {...hookField}
                  id={field.name}
                  type={field.type}
                  placeholder={field.placeholder}
                  disabled={field.disabled}
                  readOnly={field.readOnly}
                  className={error ? 'border-destructive focus-visible:ring-destructive' : ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (field.type === 'number') {
                      hookField.onChange(val === '' ? undefined : Number(val));
                    } else {
                      hookField.onChange(val);
                    }
                  }}
                  value={hookField.value ?? ''}
                />
              );
            case 'textarea':
              return (
                <textarea
                  {...hookField}
                  id={field.name}
                  placeholder={field.placeholder}
                  disabled={field.disabled}
                  readOnly={field.readOnly}
                  className={`flex min-h-[80px] w-full min-w-0 rounded-2xl border border-transparent bg-input/50 px-3 py-2 text-base transition-[color,box-shadow] duration-200 outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 ${error ? 'border-destructive focus-visible:ring-destructive/20' : ''}`}
                />
              );
            case 'select':
              return (
                <Select disabled={field.disabled} name={field.name} value={hookField.value || ""} onValueChange={(val) => hookField.onChange(val)}>
                  <SelectTrigger className={`flex h-9 w-full min-w-0 rounded-2xl border border-transparent bg-input/50 px-2.5 py-1 text-base transition-[color,box-shadow] duration-200 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 ${error ? 'border-destructive focus-visible:ring-destructive/20' : ''}`}>
                    <SelectValue placeholder="Select an option" />
                  </SelectTrigger>
                  <SelectContent>
                    {(field.options || []).map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              );
            case 'radio':
              return (
                <div className="flex gap-4">
                  {(field.options || []).map(opt => (
                    <div key={opt.value} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id={`${field.name}-${opt.value}`}
                        value={opt.value}
                        checked={hookField.value === opt.value}
                        onChange={() => hookField.onChange(opt.value)}
                        disabled={field.disabled}
                        className="h-4 w-4 text-primary border-primary"
                      />
                      <label htmlFor={`${field.name}-${opt.value}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {opt.label}
                      </label>
                    </div>
                  ))}
                </div>
              );
            case 'checkbox':
              return (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={field.name}
                    checked={!!hookField.value}
                    onChange={(e) => hookField.onChange(e.target.checked)}
                    disabled={field.disabled}
                    className="h-4 w-4 rounded border-primary text-primary focus:ring-primary"
                  />
                </div>
              );
            case 'switch':
              return (
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={!!hookField.value}
                    onClick={() => hookField.onChange(!hookField.value)}
                    disabled={field.disabled}
                    className={`${
                      hookField.value ? 'bg-primary' : 'bg-input'
                    } peer inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    <span
                      data-state={hookField.value ? 'checked' : 'unchecked'}
                      className={`${
                        hookField.value ? 'translate-x-5' : 'translate-x-0'
                      } pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform`}
                    />
                  </button>
                </div>
              );
            default:
              return <div>Unsupported field type: {field.type}</div>;
          }
        }}
      />
      {field.helperText && <p className="text-xs text-muted-foreground">{field.helperText}</p>}
      {error && <p className="text-xs font-medium text-destructive">{error.message as string}</p>}
      </div>
    </div>
  );
}
