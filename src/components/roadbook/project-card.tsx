"use client";

import Link from "next/link";
import { Copy, Download, MapPin, MoreVertical, Route, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card className="flex flex-col justify-between transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
      <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
        <div className="min-w-0">
          <CardTitle className="truncate">{summary.name}</CardTitle>
          <p className="mt-0.5 text-xs text-slate-400">Actualitzat {formatRelativeTime(summary.updatedAt)}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Més accions">
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
      <CardContent className="flex flex-wrap gap-1.5">
        <Badge variant="outline">
          <MapPin className="mr-1 h-3 w-3" />
          {summary.stageCount} etapa{summary.stageCount === 1 ? "" : "es"}
        </Badge>
        <Badge variant="outline">
          <Route className="mr-1 h-3 w-3" />
          {summary.sectorCount} sector{summary.sectorCount === 1 ? "" : "s"}
        </Badge>
        <Badge variant="default" className="bg-red-50 text-red-700">
          {formatKm(summary.totalDistanceKm)} km
        </Badge>
      </CardContent>
      <CardFooter>
        <Button asChild variant="primary" className="w-full">
          <Link href={`/r/${summary.id}`}>Obre</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
