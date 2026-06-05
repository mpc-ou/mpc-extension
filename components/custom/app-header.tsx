import { ChevronLeft, PanelLeft } from "lucide-react";
import { ThemeToggle } from "@/components/custom/theme-toggle";
import { UserMenu } from "@/components/custom/user-menu";
import { Button } from "@/components/ui/button";
import { type ThemeMode } from "@/lib/theme";
import { cn } from "@/lib/utils";

type AppHeaderProps = {
  breadcrumbs: string[];
  onSidebarToggle?: () => void;
  sidebarCollapsed?: boolean;
  theme?: ThemeMode;
  onThemeChange?: (theme: ThemeMode) => void;
  actions?: React.ReactNode;
};

export function AppHeader({
  breadcrumbs,
  onSidebarToggle,
  sidebarCollapsed,
  theme = "system",
  onThemeChange,
  actions
}: AppHeaderProps) {
  return (
    <header className='sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur-sm'>
      {onSidebarToggle && (
        <Button
          aria-label={sidebarCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
          className='h-8 w-8'
          onClick={onSidebarToggle}
          size='icon'
          variant='ghost'
        >
          {sidebarCollapsed ? <PanelLeft className='h-5 w-5' /> : <ChevronLeft className='h-5 w-5' />}
        </Button>
      )}

      <nav aria-label='Breadcrumb' className='flex min-w-0 items-center gap-1.5 text-sm'>
        {breadcrumbs.map((crumb, idx) => {
          const isLast = idx === breadcrumbs.length - 1;
          const content = (
            <span
              className={cn(
                "truncate",
                isLast
                  ? "font-semibold text-foreground"
                  : "text-muted-foreground transition-colors hover:text-foreground"
              )}
            >
              {crumb}
            </span>
          );

          return (
            <span className='flex min-w-0 items-center gap-1.5' key={crumb}>
              {idx > 0 && <span className='text-muted-foreground'>/</span>}
              {isLast ? (
                content
              ) : (
                <a className='truncate' href={crumb === "MPC" ? "#dashboard" : "#"}>
                  {content}
                </a>
              )}
            </span>
          );
        })}
      </nav>

      <div className='flex-1' />

      <UserMenu />

      {actions}

      {onThemeChange && <ThemeToggle onThemeChange={onThemeChange} theme={theme} />}
    </header>
  );
}
