import React, { useState } from 'react';
import { useFormContext, Controller, useWatch } from 'react-hook-form';
import type { FormField } from '@/store/useFormBuilderStore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, X as XIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DatePickerFieldProps {
  value: any;
  onChange: (val: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
  placeholder?: string;
  hasError?: boolean;
  id?: string;
  className?: string;
  hideActionBadge?: boolean;
}

export function DatePickerField({
  value,
  onChange,
  disabled,
  readOnly,
  placeholder,
  hasError,
  id,
  className,
  hideActionBadge
}: DatePickerFieldProps) {
  const [open, setOpen] = useState(false);

  const formatDateDisplay = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const parts = String(dateStr).split("-");
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        const dt = new Date(y, m, d);
        if (!isNaN(dt.getTime())) {
          return dt.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
          });
        }
      }
      const dt = new Date(dateStr);
      return isNaN(dt.getTime())
        ? String(dateStr)
        : dt.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
          });
    } catch {
      return String(dateStr);
    }
  };

  const displayText = value ? formatDateDisplay(value) : "";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          disabled={disabled || readOnly}
          onClick={() => !disabled && !readOnly && setOpen((prev) => !prev)}
          className={cn(
            "h-9 w-full min-w-0 rounded-lg border border-input bg-background/60 px-3 py-1 text-sm transition-[color,box-shadow,border-color] duration-200 outline-none flex items-center justify-between text-left cursor-pointer hover:bg-muted/30 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 shadow-xs",
            hasError ? "border-destructive focus-visible:ring-destructive/20 text-destructive" : "",
            !displayText ? "text-muted-foreground/70" : "text-foreground font-medium",
            className
          )}
        >
          <div className="flex items-center gap-2 truncate">
            <CalendarIcon className="size-3.5 text-primary shrink-0" />
            <span className="truncate">
              {displayText || placeholder || "Select date (DD/MM/YYYY)"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 ml-1.5">
            {displayText && !disabled && !readOnly && (
              <span
                role="button"
                tabIndex={0}
                title="Clear date"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange("");
                }}
                className="p-0.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <XIcon className="size-3.5" />
              </span>
            )}
            {!hideActionBadge && (
              <span className="text-[11px] font-semibold text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded">
                {open ? "Close" : "Pick Date"}
              </span>
            )}
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 border border-border/80 shadow-2xl rounded-2xl overflow-hidden bg-background z-50"
        align="start"
      >
        <Calendar
          selected={value}
          onSelect={(_d, dateStr) => {
            onChange(dateStr);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

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
  const fieldTypeLower = String(field.type || '').toLowerCase();
  const isDateField = fieldTypeLower === 'date' || fieldTypeLower === 'calendar' || fieldTypeLower === 'calender';

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
          if (isDateField) {
            return (
              <DatePickerField
                id={field.name}
                value={hookField.value}
                onChange={(val) => hookField.onChange(val)}
                disabled={field.disabled}
                readOnly={field.readOnly}
                placeholder={field.placeholder}
                hasError={Boolean(error)}
              />
            );
          }

          switch (field.type) {
            case 'text':
            case 'email':
            case 'password':
            case 'number':
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
