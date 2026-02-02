"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DocumentTextIcon } from "@heroicons/react/24/outline";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const [workspace_id, setWorkspaceId] = React.useState("");
  const [user_id, setUserId] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!workspace_id.trim() || !user_id.trim()) {
      setError("Both fields are required");
      return;
    }

    setIsLoading(true);
    try {
      await login({ workspace_id: workspace_id.trim(), user_id: user_id.trim() });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex flex-col items-center justify-center p-6">
      {/* Content */}
      <div className="w-full max-w-sm space-y-8">
        {/* Logo & Tagline */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-[22px] bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl shadow-blue-500/30">
            <DocumentTextIcon className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Accord</h1>
            <p className="text-gray-500 mt-2 text-lg">
              Capture decisions that matter.
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/60 shadow-xl shadow-gray-900/5 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="workspace_id" className="text-sm font-medium text-gray-700">
                Workspace ID
              </Label>
              <Input
                id="workspace_id"
                type="text"
                placeholder="your-workspace"
                value={workspace_id}
                onChange={(e) => setWorkspaceId(e.target.value)}
                className="h-12 bg-gray-50/50 border-gray-200 rounded-xl focus:bg-white"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user_id" className="text-sm font-medium text-gray-700">
                User ID
              </Label>
              <Input
                id="user_id"
                type="text"
                placeholder="your-user-id"
                value={user_id}
                onChange={(e) => setUserId(e.target.value)}
                className="h-12 bg-gray-50/50 border-gray-200 rounded-xl focus:bg-white"
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50/80 p-3 rounded-xl border border-red-100">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 rounded-xl bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-400">
          Never lose context again.
        </p>
      </div>
    </div>
  );
}
