import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { type ThemeMode } from "@/lib/theme";

const ICONS = { light: Sun, dark: Moon, system: Monitor } as const;
const LABELS: Record<ThemeMode, string> = { light: "Sáng", dark: "Tối", system: "Hệ thống" };

export function ThemeToggle({ theme, onThemeChange }: { theme: ThemeMode; onThemeChange: (t: ThemeMode) => void }) {
  const Icon = ICONS[theme];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button aria-label='Đổi giao diện' className='h-8 w-8' size='icon' variant='ghost'>
          <Icon className='h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-36'>
        {(Object.keys(LABELS) as ThemeMode[]).map((mode) => {
          const ModeIcon = ICONS[mode];
          return (
            <DropdownMenuItem key={mode} onClick={() => onThemeChange(mode)}>
              <ModeIcon className='mr-2 h-4 w-4' />
              {LABELS[mode]}
              {theme === mode && <span className='ml-auto text-primary'>✓</span>}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
