'use client'

import { useState } from 'react'
import { RiCalendarLine, RiCloseLine } from '@remixicon/react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

/**
 * Pick an expiry date.
 *
 * A native `<input type="date">` renders differently in every browser and
 * ignores the app's styling entirely, so this is the app's own calendar.
 * `value` and `onChange` speak ISO strings, or null for "never".
 */
export function DatePicker({
  value,
  onChange,
  placeholder = 'Set a date',
}: {
  value: string | null
  onChange: (iso: string | null) => void
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const selected = value ? new Date(value) : undefined

  function pick(date: Date | undefined) {
    if (!date) return
    // Expiry means "through the end of that day", not midnight at its start.
    const end = new Date(date)
    end.setHours(23, 59, 59, 999)
    onChange(end.toISOString())
    setOpen(false)
  }

  return (
    <div className="flex items-center gap-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button variant="outline" size="sm" className="font-normal">
              <RiCalendarLine data-icon="inline-start" />
              {selected ? selected.toLocaleDateString() : placeholder}
            </Button>
          }
        />
        {/* Every caller so far sits inside one of the app's own modals, which
            paint at z-60; the popover's own z-50 would leave the calendar
            behind them. Drops out once those modals move to <Dialog>. */}
        <PopoverContent positionerClassName="z-[70]" className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={pick}
            defaultMonth={selected}
            disabled={{ before: new Date() }}
            autoFocus
          />
        </PopoverContent>
      </Popover>
      {value && (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onChange(null)}
          title="Remove expiry"
        >
          <RiCloseLine />
        </Button>
      )}
    </div>
  )
}
