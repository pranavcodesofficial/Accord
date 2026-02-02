"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreateDecisionInput } from "@/types";

interface DecisionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateDecisionInput) => Promise<void>;
  isLoading?: boolean;
  initialData?: Partial<CreateDecisionInput>;
  title?: string;
  description?: string;
}

export function DecisionForm({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
  initialData,
  title = "Log Decision",
  description = "Capture an important decision with context for your team.",
}: DecisionFormProps) {
  const [formData, setFormData] = React.useState<CreateDecisionInput>({
    decision_text: initialData?.decision_text || "",
    rationale: initialData?.rationale || "",
    source_platform: initialData?.source_platform || "web",
    source_link: initialData?.source_link || "",
  });
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setFormData({
        decision_text: initialData?.decision_text || "",
        rationale: initialData?.rationale || "",
        source_platform: initialData?.source_platform || "web",
        source_link: initialData?.source_link || "",
      });
      setError(null);
    }
  }, [open, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.decision_text.trim()) {
      setError("Decision summary is required");
      return;
    }

    try {
      await onSubmit(formData);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save decision");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-white/80 backdrop-blur-2xl border-white/60">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
          <DialogDescription className="text-gray-600">
            {description}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {/* Decision Summary */}
          <div className="space-y-2">
            <Label htmlFor="decision_text" className="text-sm font-medium">
              Decision Summary <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="decision_text"
              placeholder="What was decided? e.g., 'We will use PostgreSQL for the database...'"
              value={formData.decision_text}
              onChange={(e) =>
                setFormData({ ...formData, decision_text: e.target.value })
              }
              className="min-h-[100px] resize-none bg-white/50"
              autoFocus
            />
          </div>

          {/* Rationale */}
          <div className="space-y-2">
            <Label htmlFor="rationale" className="text-sm font-medium">
              Rationale
            </Label>
            <Textarea
              id="rationale"
              placeholder="Why was this decision made?"
              value={formData.rationale}
              onChange={(e) =>
                setFormData({ ...formData, rationale: e.target.value })
              }
              className="min-h-[80px] resize-none bg-white/50"
            />
          </div>

          {/* Source Link */}
          <div className="space-y-2">
            <Label htmlFor="source_link" className="text-sm font-medium">
              Source Link
            </Label>
            <Input
              id="source_link"
              type="url"
              placeholder="https://docs.google.com/..."
              value={formData.source_link}
              onChange={(e) =>
                setFormData({ ...formData, source_link: e.target.value })
              }
              className="bg-white/50"
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="text-sm text-red-600 bg-red-50/50 p-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Decision"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
