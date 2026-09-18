"use client"

import * as React from "react"
import { Popover as PopoverPrimitive } from "@base-ui/react/popover"
import { CheckIcon, ChevronDownIcon, SearchIcon, X } from "lucide-react"
import { cn } from "@/lib/utils"

export type SearchableSelectOption = string | { label: string; value: string }

export interface SearchableSelectProps {
  value?: string
  onValueChange: (value: string) => void
  options: SearchableSelectOption[]
  placeholder?: string
  searchPlaceholder?: string
  allLabel?: string
  allValue?: string
  showAll?: boolean
  className?: string
  disabled?: boolean
}

export function SearchableSelect({
  value = "",
  onValueChange,
  options = [],
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  allLabel = "All",
  allValue = "All",
  showAll = true,
  className,
  disabled = false,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (open) {
      setSearch("")
      const timer = setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [open])

  const normalizedOptions = React.useMemo(() => {
    const opts = options.map(opt => typeof opt === 'string' ? { label: opt, value: opt } : opt)
    const seen = new Set()
    return opts.filter(opt => {
      if (!opt || opt.value === null || opt.value === undefined || String(opt.value).trim() === "") return false
      if (seen.has(opt.value)) return false
      seen.add(opt.value)
      return true
    })
  }, [options])

  const filteredOptions = React.useMemo(() => {
    if (!search.trim()) return normalizedOptions
    const query = search.toLowerCase().trim()
    return normalizedOptions.filter((opt) =>
      String(opt.label).toLowerCase().includes(query) || String(opt.value).toLowerCase().includes(query)
    )
  }, [normalizedOptions, search])

  const isAllSelected =
    value === "All" || value === "" || value === allValue

  const selectedOption = React.useMemo(() => normalizedOptions.find(opt => opt.value === value), [normalizedOptions, value])

  const displayValue = isAllSelected
    ? allLabel || placeholder
    : selectedOption ? selectedOption.label : value

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger
        disabled={disabled}
        className={cn(
          "flex h-9.5 w-full items-center justify-between rounded-xl border border-border/80 bg-background/60 px-3 py-1.5 text-xs ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-background hover:bg-background/90 transition-all shadow-xs cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 text-left select-none",
          className
        )}
      >
        <span className="truncate font-medium text-foreground">
          {displayValue}
        </span>
        <ChevronDownIcon className="size-3.5 opacity-60 shrink-0 ml-1.5 transition-transform duration-200 data-[state=open]:rotate-180" />
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner
          className="isolate z-50 outline-none"
          align="start"
          side="bottom"
          sideOffset={4}
        >
          <PopoverPrimitive.Popup
            className="z-50 max-h-80 w-(--anchor-width) min-w-48 origin-(--transform-origin) overflow-hidden rounded-xl border border-border/80 bg-popover/95 backdrop-blur-xl text-popover-foreground shadow-xl ring-1 ring-foreground/5 duration-100 outline-none data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 flex flex-col"
          >
            {/* Top Search Input */}
            <div className="flex items-center border-b border-border/60 px-3 py-2 gap-2 bg-muted/30">
              <SearchIcon className="size-3.5 text-muted-foreground shrink-0 opacity-70" />
              <input
                ref={inputRef}
                type="text"
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground/70 text-foreground"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("")
                    inputRef.current?.focus()
                  }}
                  className="text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>

            {/* Scrollable Option List */}
            <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5">
              {/* All Option */}
              {showAll &&
                (!search.trim() ||
                  (allLabel || "All")
                    .toLowerCase()
                    .includes(search.toLowerCase().trim())) && (
                  <div
                    onClick={() => {
                      onValueChange(allValue)
                      setOpen(false)
                    }}
                    className={cn(
                      "group/item relative flex min-h-7 cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs outline-none select-none hover:bg-accent hover:text-accent-foreground transition-colors",
                      isAllSelected &&
                        "bg-primary/10 text-primary font-semibold"
                    )}
                  >
                    <div className="size-4 flex items-center justify-center shrink-0">
                      {isAllSelected ? (
                        <CheckIcon className="size-3.5 text-primary shrink-0" />
                      ) : null}
                    </div>
                    <span className="truncate">{allLabel || "All"}</span>
                  </div>
                )}

              {/* Filtered Options */}
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => {
                  const isSelected = value === opt.value && !isAllSelected
                  return (
                    <div
                      key={opt.value}
                      onClick={() => {
                        onValueChange(opt.value)
                        setOpen(false)
                      }}
                      className={cn(
                        "group/item relative flex min-h-7 cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs outline-none select-none hover:bg-accent hover:text-accent-foreground transition-colors",
                        isSelected && "bg-primary/10 text-primary font-semibold"
                      )}
                    >
                      <div className="size-4 flex items-center justify-center shrink-0">
                        {isSelected ? (
                          <CheckIcon className="size-3.5 text-primary shrink-0" />
                        ) : null}
                      </div>
                      <span className="truncate">{opt.label}</span>
                    </div>
                  )
                })
              ) : (
                <div className="py-5 text-center text-xs text-muted-foreground select-none">
                  No matching options found.
                </div>
              )}
            </div>
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}
