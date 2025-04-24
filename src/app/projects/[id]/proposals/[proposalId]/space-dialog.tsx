"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SpaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (space: Space) => void;
}

interface Space {
  constructionType: string;
  floorArea: string;
  description: string;
  spaceType: string;
  discipline: string;
  hvacSystem: string;
  fee: string;
}

const constructionTypes = [
  "New Construction",
  "Renovation",
  "Tenant Improvement",
  "Historic Renovation",
];

const spaceTypes = [
  "Office",
  "Retail",
  "Healthcare",
  "Education",
  "Industrial",
  "Residential",
  "Mixed-Use",
];

const disciplines = [
  "Mechanical",
  "Plumbing",
  "Electrical",
  "M&P",
  "MEP",
];

const hvacSystems = [
  "VAV System",
  "VRF System",
  "Chilled Beam",
  "Fan Coil Units",
  "Split System",
  "Package Units",
];

export function SpaceDialog({ open, onOpenChange, onSave }: SpaceDialogProps) {
  const [space, setSpace] = React.useState<Space>({
    constructionType: "",
    floorArea: "",
    description: "",
    spaceType: "",
    discipline: "",
    hvacSystem: "",
    fee: "",
  });

  const formatCurrency = (value: string) => {
    const number = parseFloat(value.replace(/[^\d.-]/g, ''));
    if (isNaN(number)) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(number);
  };

  const handleSave = () => {
    onSave(space);
    onOpenChange(false);
    setSpace({
      constructionType: "",
      floorArea: "",
      description: "",
      spaceType: "",
      discipline: "",
      hvacSystem: "",
      fee: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground dark:bg-[#374151] dark:text-[#E5E7EB]">
        <DialogHeader>
          <DialogTitle>Add New Space</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Select
            value={space.constructionType}
            onValueChange={(value) => setSpace({ ...space, constructionType: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Construction Type" />
            </SelectTrigger>
            <SelectContent className="bg-background text-foreground dark:bg-[#374151] dark:text-[#E5E7EB]">
              {constructionTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <input
            type="number"
            value={space.floorArea}
            onChange={(e) => setSpace({ ...space, floorArea: e.target.value })}
            className="w-full px-3 py-2 border border-[#4DB6AC] dark:border-[#4DB6AC] rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground dark:bg-[#374151] dark:text-[#E5E7EB]"
            placeholder="Enter floor area (sq ft)"
          />

          <textarea
            value={space.description}
            onChange={(e) => setSpace({ ...space, description: e.target.value })}
            className="w-full px-3 py-2 border border-[#4DB6AC] dark:border-[#4DB6AC] rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground dark:bg-[#374151] dark:text-[#E5E7EB]"
            rows={3}
            placeholder="Enter space description"
          />

          <Select
            value={space.spaceType}
            onValueChange={(value) => setSpace({ ...space, spaceType: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Space Type" />
            </SelectTrigger>
            <SelectContent className="bg-background text-foreground dark:bg-[#374151] dark:text-[#E5E7EB]">
              {spaceTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={space.discipline}
            onValueChange={(value) => setSpace({ ...space, discipline: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Discipline" />
            </SelectTrigger>
            <SelectContent className="bg-background text-foreground dark:bg-[#374151] dark:text-[#E5E7EB]">
              {disciplines.map((discipline) => (
                <SelectItem key={discipline} value={discipline}>
                  {discipline}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={space.hvacSystem}
            onValueChange={(value) => setSpace({ ...space, hvacSystem: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select HVAC System" />
            </SelectTrigger>
            <SelectContent className="bg-background text-foreground dark:bg-[#374151] dark:text-[#E5E7EB]">
              {hvacSystems.map((system) => (
                <SelectItem key={system} value={system}>
                  {system}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <input
            type="text"
            value={space.fee}
            onChange={(e) => {
              const formatted = formatCurrency(e.target.value);
              if (formatted) {
                setSpace({ ...space, fee: formatted });
              }
            }}
            className="w-full px-3 py-2 border border-[#4DB6AC] dark:border-[#4DB6AC] rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground dark:bg-[#374151] dark:text-[#E5E7EB]"
            placeholder="Fee"
          />
        </div>
        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 transition-colors ml-2"
          >
            Save Space
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}