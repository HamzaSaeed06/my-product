"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Option {
  id: string;
  label: string;
}

export function PromotionFilters({
  fromSections,
  targetYears,
  targetClasses,
  targetSections,
  selected,
}: {
  fromSections: Option[];
  targetYears: Option[];
  targetClasses: Option[];
  targetSections: Option[];
  selected: { fromSectionId: string; targetYearId: string; targetClassId: string; targetSectionId: string };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams);
    params.set(key, value);
    router.push(`/dashboard/promotions?${params.toString()}`);
  }

  return (
    <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="promo-from-section">From section</Label>
        <Select value={selected.fromSectionId} onValueChange={(v) => v && update("fromSectionId", v)}>
          <SelectTrigger id="promo-from-section">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            {fromSections.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="promo-target-year">Target year</Label>
        <Select value={selected.targetYearId} onValueChange={(v) => v && update("targetYearId", v)}>
          <SelectTrigger id="promo-target-year">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            {targetYears.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="promo-target-class">Target class</Label>
        <Select value={selected.targetClassId} onValueChange={(v) => v && update("targetClassId", v)}>
          <SelectTrigger id="promo-target-class">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            {targetClasses.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="promo-target-section">Target section</Label>
        <Select value={selected.targetSectionId} onValueChange={(v) => v && update("targetSectionId", v)}>
          <SelectTrigger id="promo-target-section">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            {targetSections.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
