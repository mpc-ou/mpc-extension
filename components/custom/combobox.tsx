import { Check, ChevronsUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { removeVietnameseTones } from "@/utils";

type ComboboxProps = {
  options: Array<{
    value: string;
    label: string;
  }>;
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  emptyText?: string;
  searchPlaceholder?: string;
  className?: string;
  disabled?: boolean;
  limit?: number;
};

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Select option...",
  emptyText = "No option found.",
  searchPlaceholder = "Search...",
  className,
  disabled = false,
  limit = 20
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedOption = options.find((option) => option.value === value);

  const filteredOptions = useMemo(() => {
    if (!search) {
      return options.slice(0, limit);
    }

    const searchNoTone = removeVietnameseTones(search.toLowerCase());
    const matched = options.filter((option) => {
      const labelNoTone = removeVietnameseTones(option.label.toLowerCase());
      const valueNoTone = removeVietnameseTones(option.value.toLowerCase());
      return labelNoTone.includes(searchNoTone) || valueNoTone.includes(searchNoTone);
    });

    return matched.slice(0, limit);
  }, [options, search, limit]);

  return (
    <Popover
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
          setSearch("");
        }
      }}
      open={open}
    >
      <PopoverTrigger asChild>
        <Button
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
          role='combobox'
          variant='outline'
        >
          {selectedOption?.label || placeholder}
          <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent align='end' className='w-full p-0'>
        <Command shouldFilter={false}>
          <CommandInput onValueChange={setSearch} placeholder={searchPlaceholder} value={search} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  onSelect={() => {
                    const newValue = option.value === value ? "" : option.value;
                    onValueChange?.(newValue);
                    setSearch("");
                    setOpen(false);
                  }}
                  value={option.value}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === option.value ? "opacity-100" : "opacity-0")} />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
