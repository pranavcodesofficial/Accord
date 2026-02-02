"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ClockIcon,
  LinkIcon,
  ChatBubbleLeftRightIcon,
  GlobeAltIcon,
  DocumentDuplicateIcon,
  EnvelopeIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import { ProtectedRoute } from "@/components/protected-route";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { DecisionForm } from "@/components/decision-form";
import api from "@/lib/api";
import { CreateDecisionInput, Decision } from "@/types";

export default function DecisionDetailPage() {
  return (
    <ProtectedRoute>
      <DecisionDetailContent />
    </ProtectedRoute>
  );
}

function DecisionDetailContent() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;

  const [isSuperseding, setIsSuperseding] = React.useState(false);

  // Fetch decision with history
  const { data: history, isLoading, error } = useQuery({
    queryKey: ["decision-history", id],
    queryFn: () => api.getDecisionHistory(id),
  });

  // Supersede mutation
  const supersedeMutation = useMutation({
    mutationFn: (input: CreateDecisionInput) => api.supersedeDecision(id, input),
    onSuccess: (newDecision) => {
      queryClient.invalidateQueries({ queryKey: ["decisions"] });
      queryClient.invalidateQueries({ queryKey: ["decision-history", id] });
      router.push(`/decisions/${newDecision.id}`);
    },
  });

  const handleSupersede = async (input: CreateDecisionInput) => {
    await supersedeMutation.mutateAsync(input);
  };

  const decision = history?.current;

  // Export handlers
  const handleEmailExport = () => {
    if (!decision) return;
    const subject = encodeURIComponent(`Decision: ${decision.decision_text.slice(0, 50)}...`);
    const body = encodeURIComponent(
      `Decision Summary:\n${decision.decision_text}\n\nRationale:\n${decision.rationale || "N/A"}\n\nSource: ${decision.source_link || "N/A"}\n\nLogged on: ${new Date(decision.created_at).toLocaleString()}`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const handleNotionExport = () => {
    // For MVP, open Notion with pre-filled content via URL
    // In production, this would use the Notion API
    const content = encodeURIComponent(decision?.decision_text || "");
    window.open(`https://www.notion.so/new?content=${content}`, "_blank");
  };

  const handleGoogleDocsExport = () => {
    // Open Google Docs create page
    // In production, this would use the Google Docs API
    window.open("https://docs.google.com/document/create", "_blank");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const platformIcons: Record<string, React.ReactNode> = {
    slack: <ChatBubbleLeftRightIcon className="h-4 w-4" />,
    chatgpt: <GlobeAltIcon className="h-4 w-4" />,
    web: <GlobeAltIcon className="h-4 w-4" />,
  };

  if (isLoading) {
    return (
      <div className="app-gradient min-h-screen">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <GlassCard className="p-8 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-4" />
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8" />
            <div className="h-20 bg-gray-200 rounded w-full" />
          </GlassCard>
        </div>
      </div>
    );
  }

  if (error || !decision) {
    return (
      <div className="app-gradient min-h-screen">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <GlassCard className="p-12 text-center">
            <p className="text-red-600 mb-4">Decision not found</p>
            <Button onClick={() => router.push("/dashboard")}>
              Back to Dashboard
            </Button>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="app-gradient min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/70 border-b border-white/60">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard")}
            className="text-gray-600"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex items-center gap-2">
            {/* Export Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <ArrowTopRightOnSquareIcon className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleNotionExport}>
                  <DocumentDuplicateIcon className="w-4 h-4 mr-2" />
                  Export to Notion
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleGoogleDocsExport}>
                  <DocumentDuplicateIcon className="w-4 h-4 mr-2" />
                  Export to Google Docs
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleEmailExport}>
                  <EnvelopeIcon className="w-4 h-4 mr-2" />
                  Send via Email
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Supersede Button */}
            {!decision.is_superseded && (
              <Button size="sm" onClick={() => setIsSuperseding(true)}>
                <ArrowPathIcon className="w-4 h-4 mr-2" />
                Update Decision
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Decision Card */}
        <GlassCard variant="elevated" className="p-8">
          {/* Status badges */}
          <div className="flex flex-wrap gap-2 mb-6">
            {decision.source_platform && (
              <Badge variant="secondary" className="flex items-center gap-1.5">
                {platformIcons[decision.source_platform.toLowerCase()] || (
                  <GlobeAltIcon className="h-4 w-4" />
                )}
                <span className="capitalize">{decision.source_platform}</span>
              </Badge>
            )}
            {decision.is_superseded && (
              <Badge
                variant="outline"
                className="flex items-center gap-1.5 text-amber-600 border-amber-300 bg-amber-50/50"
              >
                <ArrowPathIcon className="h-3.5 w-3.5" />
                Superseded
              </Badge>
            )}
          </div>

          {/* Decision text */}
          <h1 className="text-2xl font-semibold text-gray-900 mb-4 leading-relaxed">
            {decision.decision_text}
          </h1>

          {/* Rationale */}
          {decision.rationale && (
            <div className="mb-6">
              <h2 className="text-sm font-medium text-gray-500 mb-2">Rationale</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {decision.rationale}
              </p>
            </div>
          )}

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-4 pt-6 border-t border-gray-100/50 text-sm text-gray-500">
            <div className="flex items-center gap-1.5">
              <ClockIcon className="w-4 h-4" />
              <span>{formatDate(decision.created_at)}</span>
            </div>
            {decision.source_link && (
              <a
                href={decision.source_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700"
              >
                <LinkIcon className="w-4 h-4" />
                View Source
              </a>
            )}
          </div>
        </GlassCard>

        {/* History Section */}
        {(history?.supersedes || (history?.superseded_by && history.superseded_by.length > 0)) && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Decision History</h2>

            {/* Supersedes (previous version) */}
            {history.supersedes && (
              <GlassCard
                className="p-5 cursor-pointer hover:bg-white/60 opacity-70"
                onClick={() => router.push(`/decisions/${history.supersedes!.id}`)}
              >
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="text-gray-500">
                    Previous
                  </Badge>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {history.supersedes.decision_text}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(history.supersedes.created_at)}
                    </p>
                  </div>
                </div>
              </GlassCard>
            )}

            {/* Superseded by (newer versions) */}
            {history.superseded_by?.map((newer) => (
              <GlassCard
                key={newer.id}
                className="p-5 cursor-pointer hover:bg-white/60"
                onClick={() => router.push(`/decisions/${newer.id}`)}
              >
                <div className="flex items-start gap-3">
                  <Badge variant="default" className="bg-green-500">
                    Updated
                  </Badge>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {newer.decision_text}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(newer.created_at)}
                    </p>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </main>

      {/* Supersede Form Modal */}
      <DecisionForm
        open={isSuperseding}
        onOpenChange={setIsSuperseding}
        onSubmit={handleSupersede}
        isLoading={supersedeMutation.isPending}
        initialData={{
          decision_text: decision.decision_text,
          rationale: decision.rationale || "",
          source_platform: decision.source_platform || "web",
        }}
        title="Update Decision"
        description="Create a new version of this decision. The original will be marked as superseded."
      />
    </div>
  );
}
