import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (semesterName: string) => void;
  initialValue: string;
  mode?: "add" | "edit";
};

export const FormSemesterDialog = ({ open, onOpenChange, onSubmit, initialValue, mode = "add" }: Props) => {
  const [semesterName, setSemesterName] = useState(initialValue);

  useEffect(() => {
    if (open) {
      setSemesterName(initialValue);
    }
  }, [open, initialValue]);

  const handleSubmit = () => {
    const trimmedName = semesterName.trim();
    if (!trimmedName) {
      return;
    }
    onSubmit(trimmedName);
    setSemesterName("Học kỳ mới");
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "add" ? "Thêm học kỳ mới" : "Sửa tên học kỳ"}</DialogTitle>
          <DialogDescription>{mode === "add" ? "Nhập tên cho học kỳ mới" : "Cập nhật tên học kỳ"}</DialogDescription>
        </DialogHeader>
        <div className='space-y-4 py-4'>
          <div className='space-y-2'>
            <Label htmlFor='semester-name'>Tiêu đề kỳ học</Label>
            <Input
              id='semester-name'
              onChange={(e) => setSemesterName(e.target.value)}
              placeholder='Học kỳ mới'
              value={semesterName}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant='outline'>
            Hủy
          </Button>
          <Button onClick={handleSubmit}>{mode === "add" ? "Thêm" : "Cập nhật"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
