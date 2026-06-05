import { type LucideIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type SidebarNavItem = {
  key: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
};

type AppSidebarProps = {
  navItems: SidebarNavItem[];
  activeKey: string;
  onNavigate: (key: string) => void;
  collapsed: boolean;
  onToggle: () => void;
  isMobile?: boolean;
  onClose?: () => void;
  logo?: React.ReactNode;
  logoCollapsed?: React.ReactNode;
  footer?: React.ReactNode;
};

export function AppSidebar({
  navItems,
  activeKey,
  onNavigate,
  collapsed,
  isMobile,
  onClose,
  logo,
  logoCollapsed,
  footer
}: AppSidebarProps) {
  const handleNavClick = (key: string) => {
    onNavigate(key);
    if (isMobile && onClose) {
      onClose();
    }
  };

  return (
    <>
      {isMobile && !collapsed && (
        <button
          aria-label='Đóng thanh bên'
          className='fixed inset-0 z-30 cursor-default border-none bg-black/50 lg:hidden'
          onClick={onClose}
          onKeyDown={(e) => e.key === "Escape" && onClose?.()}
          type='button'
        />
      )}

      <aside
        className={cn(
          "flex h-screen flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out",
          collapsed ? "w-16" : "w-64",
          isMobile && !collapsed ? "fixed top-0 left-0 z-40 shadow-2xl lg:relative lg:shadow-none" : "",
          isMobile && collapsed ? "hidden lg:flex" : "flex"
        )}
      >
        <div className={cn("flex h-14 shrink-0 items-center border-b px-3", collapsed ? "justify-center" : "px-4")}>
          {collapsed ? (logoCollapsed ?? logo) : logo}
        </div>

        <nav className='flex-1 space-y-1 overflow-y-auto px-2 py-4'>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeKey === item.key;

            const btn = (
              <button
                className={cn(
                  "flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 font-medium text-sm transition-all duration-150",
                  collapsed && "justify-center px-0",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
                key={item.key}
                onClick={() => handleNavClick(item.key)}
                type='button'
              >
                <Icon className={cn("shrink-0", collapsed ? "h-5 w-5" : "h-4 w-4")} />
                {!collapsed && <span className='truncate'>{item.label}</span>}
                {!collapsed && item.badge && (
                  <span className='ml-auto rounded-full bg-primary/10 px-1.5 py-0.5 text-primary text-xs'>
                    {item.badge}
                  </span>
                )}
              </button>
            );

            if (collapsed) {
              return (
                <Tooltip delayDuration={0} key={item.key}>
                  <TooltipTrigger asChild>{btn}</TooltipTrigger>
                  <TooltipContent side='right'>
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              );
            }

            return btn;
          })}
        </nav>

        {!collapsed && footer && <div className='shrink-0 border-t p-3'>{footer}</div>}
      </aside>
    </>
  );
}
