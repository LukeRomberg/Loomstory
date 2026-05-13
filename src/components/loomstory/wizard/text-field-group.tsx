"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export interface TextField {
  key: string;
  label: string;
  placeholder?: string;
  helpText?: string;
  multiline?: boolean;
  required?: boolean;
}

interface TextFieldGroupProps {
  fields: TextField[];
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
}

export function TextFieldGroup({ fields, values, onChange }: TextFieldGroupProps) {
  function handleChange(key: string, value: string) {
    onChange({ ...values, [key]: value });
  }

  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <div key={field.key} className="space-y-1.5">
          <Label className="text-base text-muted-foreground">{field.label}</Label>
          {field.multiline ? (
            <Textarea
              value={values[field.key] ?? ""}
              onChange={(e) => handleChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              rows={4}
            />
          ) : (
            <Input
              value={values[field.key] ?? ""}
              onChange={(e) => handleChange(field.key, e.target.value)}
              placeholder={field.placeholder}
            />
          )}
          {field.helpText && (
            <p className="text-sm text-muted-foreground font-lore">
              {field.helpText}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
