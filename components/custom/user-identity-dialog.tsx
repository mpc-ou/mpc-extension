import { IdCardIcon, User2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCurrentUserStore } from "@/store/use-current-user-store";

type UserIdentityDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function UserIdentityDialog({ open, onOpenChange }: UserIdentityDialogProps) {
  const [studentId, setStudentId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const setCurrentUser = useCurrentUserStore((s) => s.setCurrentUser);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = studentId.trim();
    const cleanName = displayName.trim();

    if (!cleanId) {
      toast.error("Vui lòng nhập Mã số sinh viên (MSSV)!");
      return;
    }
    if (!cleanName) {
      toast.error("Vui lòng nhập Họ và tên!");
      return;
    }

    setCurrentUser(cleanId, cleanName, "");
    toast.success(`Chào mừng ${cleanName} (${cleanId}) đến với MPC Extension!`);
    onOpenChange(false);
  };

  return (
    <Dialog
      modal
      onOpenChange={() => {
        /* Keep open, do not allow closing without submit */
      }}
      open={open}
    >
      <DialogContent
        className='sm:max-w-md'
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 text-xl'>
            <span className='flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary'>
              <User2Icon className='h-4 w-4' />
            </span>
            Thông tin sinh viên
          </DialogTitle>
          <DialogDescription className='text-muted-foreground text-sm leading-relaxed'>
            Dường như đây là lần đầu bạn truy cập Dashboard hoặc chưa liên kết tài khoản từ cổng thông tin. Vui lòng
            nhập họ tên và MSSV để MPC chuẩn bị không gian học tập riêng cho bạn nhé!
          </DialogDescription>
        </DialogHeader>

        <form className='space-y-4 py-2' onSubmit={handleSubmit}>
          <div className='space-y-1.5'>
            <Label className='flex items-center gap-1.5' htmlFor='displayName'>
              <User2Icon className='h-3.5 w-3.5 text-muted-foreground' />
              Họ và tên của bạn
            </Label>
            <Input
              id='displayName'
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder='Ví dụ: Nguyễn Văn A'
              required
              value={displayName}
            />
          </div>

          <div className='space-y-1.5'>
            <Label className='flex items-center gap-1.5' htmlFor='studentId'>
              <IdCardIcon className='h-3.5 w-3.5 text-muted-foreground' />
              Mã số sinh viên (MSSV)
            </Label>
            <Input
              id='studentId'
              onChange={(e) => setStudentId(e.target.value)}
              placeholder='Ví dụ: 2251010001'
              required
              value={studentId}
            />
          </div>

          <div className='flex justify-end pt-2'>
            <Button className='w-full sm:w-auto' type='submit'>
              Xác nhận thông tin
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
