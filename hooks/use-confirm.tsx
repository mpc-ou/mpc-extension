import { create } from "zustand";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export type ConfirmOptions = {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
};

type ConfirmStore = {
  isOpen: boolean;
  options: ConfirmOptions;
  resolver: ((value: boolean) => void) | null;
  confirm: (options?: ConfirmOptions) => Promise<boolean>;
  close: (value: boolean) => void;
};

export const useConfirmStore = create<ConfirmStore>((set, get) => ({
  isOpen: false,
  options: {},
  resolver: null,
  confirm: (options) => {
    return new Promise((resolve) => {
      set({ isOpen: true, options: options || {}, resolver: resolve });
    });
  },
  close: (value) => {
    const { resolver } = get();
    if (resolver) {
      resolver(value);
    }
    set({ isOpen: false, resolver: null });
  }
}));

export function ConfirmDialogProvider() {
  const { isOpen, options, close } = useConfirmStore();

  return (
    <AlertDialog onOpenChange={(open) => !open && close(false)} open={isOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{options.title || "Xác nhận"}</AlertDialogTitle>
          <AlertDialogDescription
            // biome-ignore lint/security/noDangerouslySetInnerHtml: description is always authored by developers, never user input
            dangerouslySetInnerHTML={{
              __html: options.description || "Bạn có chắc chắn muốn thực hiện hành động này?"
            }}
          />
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => close(false)}>{options.cancelText || "Hủy"}</AlertDialogCancel>
          <AlertDialogAction
            className={cn(options.variant === "destructive" && "bg-red-600")}
            onClick={() => close(true)}
          >
            {options.confirmText || "Xác nhận"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function useConfirm() {
  const confirm = useConfirmStore((state) => state.confirm);
  return confirm;
}
