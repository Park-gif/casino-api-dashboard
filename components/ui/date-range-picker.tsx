"use client"

import * as React from "react"

interface DateRange {
  from: Date | null;
  to: Date | null;
}

interface DatePickerWithRangeProps {
  value: DateRange | undefined;
  onChange: (date: DateRange | undefined) => void;
  className?: string;
}

export function DatePickerWithRange({
  value,
  onChange,
  className,
}: DatePickerWithRangeProps) {
  return (
    <div className={className}>
      <div className="flex gap-2">
        <input
          type="date"
          value={value?.from?.toISOString().split('T')[0] || ''}
          onChange={(e) => {
            const from = e.target.value ? new Date(e.target.value) : null;
            onChange({ from, to: value?.to || null });
          }}
          className="border rounded px-2 py-1"
        />
        <input
          type="date"
          value={value?.to?.toISOString().split('T')[0] || ''}
          onChange={(e) => {
            const to = e.target.value ? new Date(e.target.value) : null;
            onChange({ from: value?.from || null, to });
          }}
          className="border rounded px-2 py-1"
        />
      </div>
    </div>
  )
} 