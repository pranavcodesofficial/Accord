"use client";

import * as React from "react";
import { ArrowDownIcon, ClockIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreateDecisionInput, Decision } from "@/types";

interface SupersedeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateDecisionInput) => Promise<void>;
  originalDecision: Decision | null;
  isLoading?: boolean;
}

function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function SupersedeModal({
  open,
  onOpenChange,
  onSubmit,
  originalDecision,
  isLoading = false,
}: SupersedeModalProps) {
  const [decisionText, setDecisionText] = React.useState("");
  const [rationale, setRationale] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setDecisionText("");
      setRationale("");
      setError(null);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!decisionText.trim()) {
      setError("New decision is required");
      return;
    }

    try {
      await onSubmit({
        decision_text: decisionText.trim(),
        rationale: rationale.trim() || undefined,
        source_platform: "web",
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to supersede decision");
    }
  };

  if (!originalDecision) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] bg-white/90 backdrop-blur-2xl border-white/60 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Update Decision</DialogTitle>
          <DialogDescription className="text-gray-500">
            Create a new version. The original will be marked as superseded.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {/* Original Decision (Read-only) */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-500">Original Decision</Label>
            <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-100">
              <p className="text-sm text-gray-600 leading-relaxed">
                {originalDecision.decision_text}
              </p>
              {originalDecision.rationale && (
                <p className="mt-2 text-xs text-gray-400">
                  {originalDecision.rationale}
                </p>
              )}
              <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-400">
                <ClockIcon className="h-3.5 w-3.5" />
                <span>{timeAgo(originalDecision.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-50 text-blue-500">
              <ArrowDownIcon className="w-5 h-5" />
            </div>
          </div>

          {/* New Decision */}
          <div className="space-y-2">
            <Label htmlFor="new_decision" className="text-sm font-medium">
              New Decision <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="new_decision"
              placeholder="What is the updated decision?"
              value={decisionText}
              onChange={(e) => setDecisionText(e.target.value)}
              className="min-h-[100px] resize-none bg-white/50 text-base"
              autoFocus
            />
          </div>

          {/* Rationale */}
          <div className="space-y-2">
            <Label htmlFor="new_rationale" className="text-sm font-medium">
              Rationale for Change
            </Label>
            <Textarea
              id="new_rationale"
              placeholder="Why is this decision being updated?"
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              className="min-h-[80px] resize-none bg-white/50"
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="text-sm text-red-600 bg-red-50/80 p-3 rounded-lg">
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
              {isLoading ? "Updating..." : "Update Decision"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
