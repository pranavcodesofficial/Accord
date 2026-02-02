"use client";

import * as React from "react";
import { 
  ChatBubbleLeftRightIcon, 
  GlobeAltIcon, 
  LinkIcon,
  ClockIcon,
  ArrowPathIcon 
} from "@heroicons/react/24/outline";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Decision } from "@/types";

interface DecisionCardProps {
  decision: Decision;
  onClick?: () => void;
  onSupersede?: (decision: Decision) => void;
  className?: string;
}

const platformIcons: Record<string, React.ReactNode> = {
  slack: <ChatBubbleLeftRightIcon className="h-4 w-4" />,
  chatgpt: <GlobeAltIcon className="h-4 w-4" />,
  web: <GlobeAltIcon className="h-4 w-4" />,
};

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

export function DecisionCard({ decision, onClick, onSupersede, className }: DecisionCardProps) {
  const handleSupersede = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSupersede?.(decision);
  };

  return (
    <GlassCard
      className={cn(
        "p-5 cursor-pointer transition-all duration-200",
        "hover:bg-white/70 hover:shadow-[0_8px_32px_rgba(0,0,0,0.1)] hover:-translate-y-0.5",
        decision.is_superseded && "opacity-50 hover:opacity-70",
        className
      )}
      onClick={onClick}
    >
      <div className="space-y-3">
        {/* Header with badges */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {decision.source_platform && (
              <Badge variant="secondary" className="flex items-center gap-1.5 bg-gray-100/80 text-gray-600">
                {platformIcons[decision.source_platform.toLowerCase()] || <GlobeAltIcon className="h-4 w-4" />}
                <span className="capitalize">{decision.source_platform}</span>
              </Badge>
            )}
            {decision.is_superseded && (
              <Badge className="flex items-center gap-1.5 text-amber-700 bg-amber-100/80 border-amber-200">
                <ArrowPathIcon className="h-3.5 w-3.5" />
                SUPERSEDED
              </Badge>
            )}
          </div>
          
          {/* Supersede button - only show for active decisions */}
          {!decision.is_superseded && onSupersede && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSupersede}
              className="text-gray-400 hover:text-blue-600 hover:bg-blue-50/50 -mr-2 -mt-1"
            >
              <ArrowPathIcon className="h-4 w-4 mr-1" />
              Supersede
            </Button>
          )}
        </div>

        {/* Decision text */}
        <div>
          <h3 className={cn(
            "text-base font-semibold leading-snug line-clamp-2",
            decision.is_superseded ? "text-gray-500" : "text-gray-900"
          )}>
            {decision.decision_text}
          </h3>
          {decision.rationale && (
            <p className="mt-2 text-sm text-gray-500 line-clamp-2 leading-relaxed">
              {decision.rationale}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100/60">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <ClockIcon className="h-3.5 w-3.5" />
            <span>{timeAgo(decision.created_at)}</span>
          </div>
          {decision.source_link && (
            <a
              href={decision.source_link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 transition-colors"
            >
              <LinkIcon className="h-3.5 w-3.5" />
              Source
            </a>
          )}
        </div>
      </div>
    </GlassCard>
  );
}
