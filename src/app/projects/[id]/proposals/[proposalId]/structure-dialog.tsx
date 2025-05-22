"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface Structure {
  constructionType: string;
  floorArea: string;
  description: string;
  spaceType: string;
  discipline: string;
  hvacSystem: string;
  fee: string;
}

interface StructureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (structure: Structure) => void;
}

export function StructureDialog({ open, onOpenChange, onSave }: StructureDialogProps) {
  const [structure, setStructure] = useState<Structure>({
    constructionType: "New Construction",
    floorArea: "0",
    description: "New Structure",
    spaceType: "Office",
    discipline: "MEP",
    hvacSystem: "VAV System",
    fee: "$0.00"
  });

  const handleSave = () => {
    onSave(structure);
    setStructure({
      constructionType: "New Construction",
      floorArea: "0",
      description: "New Structure",
      spaceType: "Office",
      discipline: "MEP",
      hvacSystem: "VAV System",
      fee: "$0.00"
    });
    onOpenChange(false);
  };

  const formatCurrency = (value: string) => {
    const number = parseFloat(value.replace(/[^\d.-]/g, ''));
    if (isNaN(number)) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(number);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Structure</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="constructionType">Construction Type</Label>
            <Select
              value={structure.constructionType}
              onValueChange={(value) => setStructure({ ...structure, constructionType: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select construction type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="New Construction">New Construction</SelectItem>
                <SelectItem value="Renovation">Renovation</SelectItem>
                <SelectItem value="Addition">Addition</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="floorArea">Floor Area (sq ft)</Label>
            <Input
              id="floorArea"
              type="number"
              value={structure.floorArea}
              onChange={(e) => setStructure({ ...structure, floorArea: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={structure.description}
              onChange={(e) => setStructure({ ...structure, description: e.target.value })}
              placeholder="Enter structure description"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="spaceType">Space Type</Label>
            <Select
              value={structure.spaceType}
              onValueChange={(value) => setStructure({ ...structure, spaceType: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select space type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Office">Office</SelectItem>
                <SelectItem value="Retail">Retail</SelectItem>
                <SelectItem value="Industrial">Industrial</SelectItem>
                <SelectItem value="Healthcare">Healthcare</SelectItem>
                <SelectItem value="Education">Education</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="discipline">Discipline</Label>
            <Select
              value={structure.discipline}
              onValueChange={(value) => setStructure({ ...structure, discipline: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select discipline" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MEP">MEP</SelectItem>
                <SelectItem value="Architectural">Architectural</SelectItem>
                <SelectItem value="Structural">Structural</SelectItem>
                <SelectItem value="Civil">Civil</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="hvacSystem">HVAC System</Label>
            <Select
              value={structure.hvacSystem}
              onValueChange={(value) => setStructure({ ...structure, hvacSystem: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select HVAC system" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VAV System">VAV System</SelectItem>
                <SelectItem value="CAV System">CAV System</SelectItem>
                <SelectItem value="Heat Pump">Heat Pump</SelectItem>
                <SelectItem value="Split System">Split System</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="fee">Fee</Label>
            <Input
              id="fee"
              value={structure.fee}
              onChange={(e) => {
                const formatted = formatCurrency(e.target.value);
                if (formatted) {
                  setStructure({ ...structure, fee: formatted });
                }
              }}
              placeholder="$0.00"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Structure</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 