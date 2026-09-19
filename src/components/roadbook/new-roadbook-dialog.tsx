"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createProject } from "@/lib/projects";

interface NewRoadbookDialogProps {
  trigger?: React.ReactNode;
  onCreated?: () => void;
}

export function NewRoadbookDialog({ trigger, onCreated }: NewRoadbookDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [stageCount, setStageCount] = useState(1);
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    const finalName = name.trim() || "Rally sense nom";
    setCreating(true);
    try {
      const roadbook = await createProject(finalName, stageCount);
      onCreated?.();
      setOpen(false);
      router.push(`/r/${roadbook.id}`);
    } catch (error) {
      console.error(error);
      toast.error("No s'ha pogut crear el roadbook.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="h-4 w-4" />
            Nou roadbook
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crea el teu roadbook</DialogTitle>
          <DialogDescription>
            Només cal un nom per començar. Podràs afegir etapes, sectors i instruccions tot seguit.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rb-name">Nom del ral·li</Label>
            <Input
              id="rb-name"
              autoFocus
              placeholder="Ex: Rally Costa Brava 2026"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleCreate();
              }}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rb-stages">Nombre d&apos;etapes inicials</Label>
            <Input
              id="rb-stages"
              type="number"
              min={1}
              max={20}
              value={stageCount}
              onChange={(e) => setStageCount(Math.max(1, Number(e.target.value) || 1))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel·la
          </Button>
          <Button variant="primary" onClick={handleCreate} disabled={creating}>
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Crea el roadbook
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
