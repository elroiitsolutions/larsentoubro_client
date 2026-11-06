import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

export interface CalendarProps {
  className?: string
  selected?: Date | string | null
  onSelect?: (date: Date, dateString: string) => void
  minDate?: Date | string
  maxDate?: Date | string
  disabled?: (date: Date) => boolean
  initialDate?: Date | string
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

function toDate(val?: Date | string | null): Date | null {
  if (!val) return null
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val
  // Parse string (e.g. YYYY-MM-DD)
  const parts = val.split("-")
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10)
    const m = parseInt(parts[1], 10) - 1
    const d = parseInt(parts[2], 10)
    const dt = new Date(y, m, d)
    return isNaN(dt.getTime()) ? null : dt
  }
  const dt = new Date(val)
  return isNaN(dt.getTime()) ? null : dt
}

function formatDateString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function isSameDay(d1: Date | null, d2: Date | null): boolean {
  if (!d1 || !d2) return false
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  )
}

export function Calendar({
  className,
  selected,
  onSelect,
  minDate,
  maxDate,
  disabled,
  initialDate,
}: CalendarProps) {
  const selectedDate = React.useMemo(() => toDate(selected), [selected])
  const parsedMinDate = React.useMemo(() => toDate(minDate), [minDate])
  const parsedMaxDate = React.useMemo(() => toDate(maxDate), [maxDate])

  const initialViewDate = React.useMemo(() => {
    return selectedDate || toDate(initialDate) || new Date()
  }, [selectedDate, initialDate])

  const [currentMonth, setCurrentMonth] = React.useState<number>(initialViewDate.getMonth())
  const [currentYear, setCurrentYear] = React.useState<number>(initialViewDate.getFullYear())

  // Sync view when selectedDate changes externally
  React.useEffect(() => {
    if (selectedDate) {
      setCurrentMonth(selectedDate.getMonth())
      setCurrentYear(selectedDate.getFullYear())
    }
  }, [selectedDate])

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear((y) => y - 1)
    } else {
      setCurrentMonth((m) => m - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear((y) => y + 1)
    } else {
      setCurrentMonth((m) => m + 1)
    }
  }

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentYear(parseInt(e.target.value, 10))
  }

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentMonth(parseInt(e.target.value, 10))
  }

  // Days in current month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  // Day of week for 1st day of month (0 = Sun, 1 = Mon, ..., 6 = Sat)
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay()
  // Days in previous month
  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate()

  const today = new Date()

  // Generate calendar cells (6 rows * 7 cols = 42 cells)
  const cells: Array<{
    date: Date
    dayNumber: number
    isCurrentMonth: boolean
    isDisabled: boolean
    isSelected: boolean
    isToday: boolean
  }> = []

  // Trailing days from previous month
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const d = prevMonthDays - i
    const prevMonthDate = new Date(currentYear, currentMonth - 1, d)
    cells.push({
      date: prevMonthDate,
      dayNumber: d,
      isCurrentMonth: false,
      isDisabled: true,
      isSelected: isSameDay(prevMonthDate, selectedDate),
      isToday: isSameDay(prevMonthDate, today),
    })
  }

  // Days of current month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentYear, currentMonth, day)
    let isDisabled = false

    if (parsedMinDate) {
      const minStart = new Date(parsedMinDate.getFullYear(), parsedMinDate.getMonth(), parsedMinDate.getDate())
      if (date < minStart) isDisabled = true
    }

    if (parsedMaxDate) {
      const maxEnd = new Date(parsedMaxDate.getFullYear(), parsedMaxDate.getMonth(), parsedMaxDate.getDate(), 23, 59, 59)
      if (date > maxEnd) isDisabled = true
    }

    if (disabled && disabled(date)) {
      isDisabled = true
    }

    cells.push({
      date,
      dayNumber: day,
      isCurrentMonth: true,
      isDisabled,
      isSelected: isSameDay(date, selectedDate),
      isToday: isSameDay(date, today),
    })
  }

  // Leading days of next month to fill complete grid
  const remainingCells = 42 - cells.length
  for (let day = 1; day <= remainingCells; day++) {
    const nextMonthDate = new Date(currentYear, currentMonth + 1, day)
    cells.push({
      date: nextMonthDate,
      dayNumber: day,
      isCurrentMonth: false,
      isDisabled: true,
      isSelected: isSameDay(nextMonthDate, selectedDate),
      isToday: isSameDay(nextMonthDate, today),
    })
  }

  // Generate year options (-5 years to +10 years from current year)
  const yearOptions = React.useMemo(() => {
    const baseYear = new Date().getFullYear()
    const years: number[] = []
    for (let y = baseYear - 5; y <= baseYear + 10; y++) {
      years.push(y)
    }
    return years
  }, [])

  return (
    <div className={cn("p-3 bg-background text-foreground select-none w-[280px]", className)}>
      {/* Month & Year Header with Controls */}
      <div className="flex items-center justify-between pb-3 border-b border-border/60">
        <div className="flex items-center gap-1.5">
          <select
            value={currentMonth}
            onChange={handleMonthChange}
            className="text-xs font-bold bg-muted/40 hover:bg-muted border border-border/60 rounded-md px-1.5 py-1 cursor-pointer outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {MONTH_NAMES.map((name, idx) => (
              <option key={name} value={idx}>
                {name}
              </option>
            ))}
          </select>
          <select
            value={currentYear}
            onChange={handleYearChange}
            className="text-xs font-bold bg-muted/40 hover:bg-muted border border-border/60 rounded-md px-1.5 py-1 cursor-pointer outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="size-7 rounded-md border border-border/60 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Previous month"
          >
            <ChevronLeft className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="size-7 rounded-md border border-border/60 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Next month"
          >
            <ChevronRight className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-1 pt-2 pb-1 text-center">
        {WEEKDAYS.map((wd) => (
          <div key={wd} className="text-[11px] font-semibold text-muted-foreground">
            {wd}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 pt-1">
        {cells.map((cell, idx) => {
          if (!cell.isCurrentMonth) {
            return (
              <div
                key={idx}
                className="size-8 flex items-center justify-center text-xs text-muted-foreground/30 font-medium"
              >
                {cell.dayNumber}
              </div>
            )
          }

          if (cell.isDisabled) {
            return (
              <div
                key={idx}
                className="size-8 flex items-center justify-center text-xs text-muted-foreground/30 font-medium cursor-not-allowed"
                title="Date not available"
              >
                {cell.dayNumber}
              </div>
            )
          }

          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelect?.(cell.date, formatDateString(cell.date))}
              className={cn(
                "size-8 text-xs rounded-lg flex items-center justify-center transition-all cursor-pointer font-medium",
                cell.isSelected
                  ? "bg-emerald-600 text-white font-bold shadow-xs hover:bg-emerald-700 hover:text-white ring-2 ring-emerald-500/30"
                  : cell.isToday
                  ? "border border-emerald-500/60 font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-muted"
                  : "text-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {cell.dayNumber}
            </button>
          )
        })}
      </div>

      {/* Footer quick action */}
      <div className="pt-3 mt-2 border-t border-border/60 flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={() => {
            const now = new Date()
            onSelect?.(now, formatDateString(now))
          }}
          className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
        >
          Today
        </button>
        {selectedDate && (
          <span className="text-[11px] font-mono text-muted-foreground">
            {formatDateString(selectedDate)}
          </span>
        )}
      </div>
    </div>
  )
}

