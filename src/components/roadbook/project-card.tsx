"use client";

import Link from "next/link";
import { ArrowRight, Copy, Download, MapPin, MoreVertical, Route, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatKm } from "@/lib/roadbook/calc";
import type { RoadbookSummary } from "@/lib/roadbook/types";
import { formatRelativeTime } from "@/lib/utils";

interface ProjectCardProps {
  summary: RoadbookSummary;
  onDuplicate: (summary: RoadbookSummary) => void;
  onDelete: (summary: RoadbookSummary) => void;
  onExport: (summary: RoadbookSummary) => void;
}

export function ProjectCard({ summary, onDuplicate, onDelete, onExport }: ProjectCardProps) {
  return (
    <Card className="group flex flex-col justify-between overflow-hidden transition-all hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/70">
      <div className="h-1 bg-gradient-to-r from-red-500 to-red-600" />
      <CardHeader className="flex-row items-start justify-between gap-2 space-y-0 pb-2">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <Route className="h-5 w-5" />
          </div>
          <div className="min-w-0 pt-0.5">
            <p className="truncate text-base font-semibold tracking-tight text-slate-900">{summary.name}</p>
            <p className="mt-0.5 text-xs text-slate-400">Actualitzat {formatRelativeTime(summary.updatedAt)}</p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0" aria-label="Més accions">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => onDuplicate(summary)}>
              <Copy className="h-3.5 w-3.5" /> Duplica
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onExport(summary)}>
              <Download className="h-3.5 w-3.5" /> Exporta JSON
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onDelete(summary)} className="text-red-600 data-[highlighted]:bg-red-50">
              <Trash2 className="h-3.5 w-3.5" /> Elimina
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-1.5">
        <Badge variant="outline">
          <MapPin className="mr-1 h-3 w-3" />
          {summary.stageCount} etapa{summary.stageCount === 1 ? "" : "es"}
        </Badge>
        <Badge variant="outline">
          <Route className="mr-1 h-3 w-3" />
          {summary.sectorCount} sector{summary.sectorCount === 1 ? "" : "s"}
        </Badge>
        <span className="ml-auto text-sm font-bold tabular-nums text-slate-900">
          {formatKm(summary.totalDistanceKm)} <span className="text-xs font-medium text-slate-400">km</span>
        </span>
      </CardContent>
      <CardFooter>
        <Button asChild variant="primary" className="w-full">
          <Link href={`/r/${summary.id}`}>
            Obre
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
