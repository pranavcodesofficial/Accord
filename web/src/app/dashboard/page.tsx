"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  MagnifyingGlassIcon, 
  ArrowRightOnRectangleIcon,
  DocumentTextIcon,
  PlusIcon 
} from "@heroicons/react/24/outline";
import { ProtectedRoute } from "@/components/protected-route";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DecisionCard } from "@/components/decision-card";
import { DecisionForm } from "@/components/decision-form";
import { SupersedeModal } from "@/components/supersede-modal";
import { useAuth } from "@/context/auth-context";
import api from "@/lib/api";
import { CreateDecisionInput, Decision } from "@/types";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { logout, workspace_id } = useAuth();
  
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [supersedeTarget, setSupersedeTarget] = React.useState<Decision | null>(null);
  const [debouncedSearch, setDebouncedSearch] = React.useState("");

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch decisions
  const { data, isLoading, error } = useQuery({
    queryKey: ["decisions", debouncedSearch],
    queryFn: () =>
      api.listDecisions({
        search: debouncedSearch || undefined,
        limit: 100,
      }),
  });

  // Create decision mutation
  const createMutation = useMutation({
    mutationFn: (input: CreateDecisionInput) => api.createDecision(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["decisions"] });
    },
  });

  // Supersede decision mutation
  const supersedeMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: CreateDecisionInput }) => 
      api.supersedeDecision(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["decisions"] });
    },
  });

  const handleCreateDecision = async (input: CreateDecisionInput) => {
    await createMutation.mutateAsync(input);
  };

  const handleSupersedeDecision = async (input: CreateDecisionInput) => {
    if (!supersedeTarget) return;
    await supersedeMutation.mutateAsync({ id: supersedeTarget.id, input });
  };

  const handleDecisionClick = (decision: Decision) => {
    router.push(`/decisions/${decision.id}`);
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  // Separate active and superseded decisions
  const activeDecisions = data?.decisions.filter(d => !d.is_superseded) || [];
  const supersededDecisions = data?.decisions.filter(d => d.is_superseded) || [];

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-gray-200/50 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25">
              <DocumentTextIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 tracking-tight">Accord</h1>
              <Badge variant="secondary" className="mt-0.5 text-[10px] px-1.5 py-0 bg-gray-100 text-gray-500 font-medium">
                {workspace_id}
              </Badge>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100/80"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5 mr-1.5" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8 pb-24 space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search decisions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 bg-white/60 backdrop-blur-xl border-gray-200/60 rounded-2xl shadow-sm focus:bg-white focus:shadow-md transition-all"
          />
        </div>

        {/* Stats */}
        {data && (
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span className="font-medium">{activeDecisions.length} active</span>
            {supersededDecisions.length > 0 && (
              <>
                <span>·</span>
                <span>{supersededDecisions.length} superseded</span>
              </>
            )}
          </div>
        )}

        {/* Decision List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-6 bg-white/60 backdrop-blur-xl rounded-2xl border border-gray-200/60 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded-lg w-3/4 mb-3" />
                  <div className="h-3 bg-gray-100 rounded-lg w-1/2" />
                </div>
              ))}
            </div>
          ) : error ? (
            <GlassCard className="p-8 text-center">
              <p className="text-red-600 mb-4">
                Failed to load decisions. Please try again.
              </p>
              <Button
                variant="outline"
                onClick={() => queryClient.invalidateQueries({ queryKey: ["decisions"] })}
              >
                Retry
              </Button>
            </GlassCard>
          ) : data?.decisions.length === 0 ? (
            /* Empty State */
            <div className="py-16 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gray-100 mb-6">
                <DocumentTextIcon className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No decisions yet
              </h3>
              <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                Capture your first one.
              </p>
              <Button 
                onClick={() => setIsFormOpen(true)}
                className="bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/25"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Log Decision
              </Button>
            </div>
          ) : (
            <>
              {/* Active Decisions */}
              {activeDecisions.map((decision) => (
                <DecisionCard
                  key={decision.id}
                  decision={decision}
                  onClick={() => handleDecisionClick(decision)}
                  onSupersede={(d) => setSupersedeTarget(d)}
                />
              ))}
              
              {/* Superseded Decisions */}
              {supersededDecisions.length > 0 && (
                <div className="pt-6">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">
                    Superseded
                  </p>
                  <div className="space-y-3">
                    {supersededDecisions.map((decision) => (
                      <DecisionCard
                        key={decision.id}
                        decision={decision}
                        onClick={() => handleDecisionClick(decision)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Floating Action Button - Apple Style */}
      <button
        onClick={() => setIsFormOpen(true)}
        className="fixed bottom-8 right-8 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/40 hover:shadow-xl hover:shadow-blue-500/50 hover:scale-105 active:scale-95 transition-all duration-200"
        aria-label="Create new decision"
      >
        <PlusIcon className="w-7 h-7" />
      </button>

      {/* Decision Form Modal */}
      <DecisionForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleCreateDecision}
        isLoading={createMutation.isPending}
      />

      {/* Supersede Modal */}
      <SupersedeModal
        open={!!supersedeTarget}
        onOpenChange={(open) => !open && setSupersedeTarget(null)}
        onSubmit={handleSupersedeDecision}
        originalDecision={supersedeTarget}
        isLoading={supersedeMutation.isPending}
      />
    </div>
  );
}
