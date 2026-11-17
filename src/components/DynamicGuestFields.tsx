import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cleanAndFormatIndianMobile } from "@/utils/validation"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { DatePickerField } from "@/components/DynamicForm/DynamicField"

export interface DynamicGuestFieldsProps {
    fields: any[];
    values: Record<string, any>;
    onChange: (fieldKey: string, value: any) => void;
    errors?: Record<string, string | undefined>;
    excludeFieldNames?: string[];
}

export const DEFAULT_GUEST_FIELDS = [
    { id: "f_name", name: "name", label: "Full Name", type: "text", required: true, placeholder: "e.g. Ramesh Kumar", order: 0 },
    { id: "f_phone", name: "phone", label: "Phone Number", type: "phone", required: true, placeholder: "9876543210", order: 1 },
    { id: "f_email", name: "email", label: "Email Address", type: "email", required: false, placeholder: "e.g. ramesh.inspector@gmail.com", order: 2 },
    { id: "f_org", name: "organization", label: "Organization / Contractor", type: "text", required: false, placeholder: "e.g. Bureau Veritas / SGS India / Third-Party", order: 3 },
    { id: "f_purpose", name: "purpose", label: "Purpose of Visit", type: "textarea", required: false, placeholder: "e.g. QR tool inspection, Safety certification", order: 4 },
];

export function getGuestFieldCanonicalKey(field: any): string {
    const name = String(field?.name || "").toLowerCase().trim();
    const label = String(field?.label || "").toLowerCase().trim();
    const id = String(field?.id || "").toLowerCase().trim();

    if (name === "name" || label === "full name" || label === "name" || label === "guest name" || id === "name") return "name";
    if (name === "phone" || name === "phonenumber" || label.includes("phone") || label.includes("mobile") || id === "phone") return "phone";
    if (name === "email" || label.includes("email") || id === "email") return "email";
    if (name === "organization" || label.includes("organization") || label.includes("contractor") || label.includes("company") || label.includes("firm") || id === "organization") return "organization";
    if (name === "purpose" || label.includes("purpose") || id === "purpose") return "purpose";

    return field?.name || field?.id || field?.label || "";
}

export function DynamicGuestFields({
    fields,
    values,
    onChange,
    errors = {},
    excludeFieldNames = [],
}: DynamicGuestFieldsProps) {
    const activeFields = Array.isArray(fields) && fields.length > 0 ? fields : DEFAULT_GUEST_FIELDS;

    const normalizedExcluded = (excludeFieldNames || []).map((n) => n.toLowerCase());

    const displayList = activeFields
        .filter((f: any) => {
            const key = String(f.name || f.id || f.label || "").toLowerCase();
            return !normalizedExcluded.includes(key);
        })
        .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));

    if (displayList.length === 0) {
        return null;
    }

    return (
        <div className="space-y-3">
            {displayList.map((field: any, index: number) => {
                const canonicalKey = getGuestFieldCanonicalKey(field);
                const rawKey = field.name || field.id || field.label;
                const fieldKey = canonicalKey || rawKey;

                // Base label cleaned of any hardcoded "(Optional)" or "*"
                const rawLabel = String(field.label || field.name || "");
                const baseLabel = rawLabel
                    .replace(/\s*\(optional\)\s*$/i, "")
                    .replace(/\s*\*+\s*$/, "")
                    .trim() || rawLabel;

                // Value lookup: check canonical key, then rawKey, then field.label, then inside customFields
                const value = values[canonicalKey] !== undefined && values[canonicalKey] !== ""
                    ? values[canonicalKey]
                    : (values[rawKey] !== undefined && values[rawKey] !== ""
                        ? values[rawKey]
                        : (values[field.label] !== undefined && values[field.label] !== ""
                            ? values[field.label]
                            : (values.customFields?.[canonicalKey] ?? values.customFields?.[rawKey] ?? values.customFields?.[field.label] ?? "")));

                const isRequired = Boolean(field.required) || Boolean(field.validations?.some((v: any) => v.type === "required"));
                const error = errors[canonicalKey] || errors[rawKey] || errors[field.id] || errors[field.name];

                // Helper to propagate changes
                const handleChange = (newVal: any) => {
                    onChange(fieldKey, newVal);
                    if (rawKey && rawKey !== fieldKey) {
                        onChange(rawKey, newVal);
                    }
                };

                // Label header element
                const labelElement = (
                    <label className="text-[11px] font-semibold text-foreground/90 block mb-1">
                        {baseLabel} {isRequired ? <span className="text-rose-500">*</span> : <span className="text-muted-foreground font-normal">(Optional)</span>}
                    </label>
                );

                // 1. Phone Number (special formatted input with +91 prefix)
                const isPhone = field.type === "phone" || canonicalKey === "phone" || String(field.label).toLowerCase().includes("phone") || String(field.label).toLowerCase().includes("mobile");
                if (isPhone) {
                    return (
                        <div key={field.id || `field_${index}`}>
                            {labelElement}
                            <div className={`flex rounded-lg border bg-background overflow-hidden focus-within:ring-2 focus-within:ring-primary/30 h-7.5 sm:h-8 ${error ? "border-rose-500" : "border-input"}`}>
                                <span className="px-2.5 bg-muted/40 border-r border-border text-xs font-mono font-medium text-muted-foreground flex items-center shrink-0">
                                    +91
                                </span>
                                <Input
                                    type="tel"
                                    placeholder={field.placeholder?.trim() || "9876543210"}
                                    maxLength={16}
                                    value={value || ""}
                                    onPaste={(e) => {
                                        e.preventDefault();
                                        const pasted = e.clipboardData.getData("text");
                                        const clean = cleanAndFormatIndianMobile(pasted);
                                        handleChange(clean);
                                    }}
                                    onChange={(e) => {
                                        const clean = cleanAndFormatIndianMobile(e.target.value);
                                        handleChange(clean);
                                    }}
                                    className="border-0 focus-visible:ring-0 rounded-none h-full text-xs font-mono px-2.5"
                                />
                            </div>
                            {error && <p className="text-[10px] text-rose-500 font-medium mt-0.5">{error}</p>}
                        </div>
                    );
                }

                // 2. Textarea (e.g. Purpose of Visit / Inspection)
                if (field.type === "textarea") {
                    return (
                        <div key={field.id || `field_${index}`}>
                            {labelElement}
                            <Textarea
                                value={value || ""}
                                onChange={(e) => handleChange(e.target.value)}
                                placeholder={field.placeholder?.trim() || `Enter ${baseLabel.toLowerCase()}`}
                                className={`min-h-[60px] rounded-lg text-xs bg-background p-2 ${error ? "border-rose-500" : ""}`}
                            />
                            {error && <p className="text-[10px] text-rose-500 font-medium mt-0.5">{error}</p>}
                        </div>
                    );
                }

                // 3. Dropdown Select
                if (field.type === "select") {
                    const options = Array.isArray(field.options) ? field.options : [];
                    return (
                        <div key={field.id || `field_${index}`}>
                            {labelElement}
                            <Select
                                value={value ? String(value) : ""}
                                onValueChange={(val) => handleChange(val)}
                            >
                                <SelectTrigger className={`h-7.5 sm:h-8 w-full rounded-lg bg-background text-xs font-medium px-2.5 ${error ? "border-rose-500" : ""}`}>
                                    <SelectValue placeholder={field.placeholder?.trim() || `Select ${baseLabel.toLowerCase()}`} />
                                </SelectTrigger>
                                <SelectContent>
                                    {options.map((opt: any) => {
                                        const optVal = typeof opt === "string" ? opt : opt.value ?? opt.label;
                                        const optLabel = typeof opt === "string" ? opt : opt.label ?? opt.value;
                                        return (
                                            <SelectItem key={optVal} value={String(optVal)}>
                                                {String(optLabel)}
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                            {error && <p className="text-[10px] text-rose-500 font-medium mt-0.5">{error}</p>}
                        </div>
                    );
                }

                // 4. Number Input
                if (field.type === "number") {
                    return (
                        <div key={field.id || `field_${index}`}>
                            {labelElement}
                            <Input
                                type="number"
                                value={value ?? ""}
                                onChange={(e) => handleChange(e.target.value === "" ? "" : Number(e.target.value))}
                                placeholder={field.placeholder?.trim() || `Enter ${baseLabel.toLowerCase()}`}
                                className={`rounded-lg h-7.5 sm:h-8 text-xs px-2.5 ${error ? "border-rose-500" : ""}`}
                            />
                            {error && <p className="text-[10px] text-rose-500 font-medium mt-0.5">{error}</p>}
                        </div>
                    );
                }

                // 5. Date Input
                if (field.type === "date" || field.type === "calendar" || String(field.type).toLowerCase() === "calender") {
                    return (
                        <div key={field.id || `field_${index}`}>
                            {labelElement}
                            <DatePickerField
                                id={field.id || field.name}
                                value={value || ""}
                                onChange={(newVal) => handleChange(newVal)}
                                placeholder={field.placeholder?.trim()}
                                hasError={Boolean(error)}
                                className="h-7.5 sm:h-8 text-xs font-medium rounded-lg"
                            />
                            {error && <p className="text-[10px] text-rose-500 font-medium mt-0.5">{error}</p>}
                        </div>
                    );
                }

                // 6. Default Text / Email Input
                const isEmail = field.type === "email" || canonicalKey === "email" || String(field.label).toLowerCase().includes("email");
                return (
                    <div key={field.id || `field_${index}`}>
                        {labelElement}
                        <Input
                            type={isEmail ? "email" : "text"}
                            value={value || ""}
                            onChange={(e) => handleChange(e.target.value)}
                            placeholder={
                                field.placeholder?.trim() ||
                                (canonicalKey === "name"
                                    ? "e.g. Ramesh Kumar"
                                    : isEmail
                                    ? "e.g. ramesh.inspector@gmail.com"
                                    : canonicalKey === "organization"
                                    ? "e.g. Bureau Veritas / SGS India / Third-Party"
                                    : `Enter ${baseLabel.toLowerCase()}`)
                            }
                            className={`rounded-lg h-7.5 sm:h-8 text-xs px-2.5 ${error ? "border-rose-500" : ""}`}
                        />
                        {error && <p className="text-[10px] text-rose-500 font-medium mt-0.5">{error}</p>}
                    </div>
                );
            })}
        </div>
    );
}

export default DynamicGuestFields;
