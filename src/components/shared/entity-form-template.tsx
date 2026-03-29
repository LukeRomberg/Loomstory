"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2 } from "lucide-react";

interface EntityFormTemplateProps {
  mode: "create" | "edit";
  entityType: string;
  onSubmit: () => void;
  onCancel: () => void;
  onDelete?: () => void;
  saving: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}

export function EntityFormTemplate({
  mode,
  entityType,
  onSubmit,
  onCancel,
  onDelete,
  saving,
  disabled,
  children,
}: EntityFormTemplateProps) {
  const isCreate = mode === "create";
  const submitLabel = isCreate
    ? saving
      ? `Creating...`
      : `Create ${entityType}`
    : saving
      ? `Updating...`
      : `Update ${entityType}`;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit();
  }

  return (
    <Card className="grain">
      <CardHeader>
        <CardTitle className="font-heading">
          {isCreate ? `Create ${entityType}` : `Edit ${entityType}`}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {children}

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <Button
                type="submit"
                disabled={saving || disabled}
                className="gold-glow"
              >
                {submitLabel}
              </Button>
              <Button type="button" variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
            </div>
            {!isCreate && onDelete && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={onDelete}
              >
                <Trash2 className="size-4 mr-1" />
                Delete
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
