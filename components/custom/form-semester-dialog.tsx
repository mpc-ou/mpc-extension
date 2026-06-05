import { useEffect, useId, useState } from "react";
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
  onSubmit: (semesterName: string, trainingPoint: number | null) => void;
  initialValue: string;
  initialTrainingPoint?: number | null;
  mode?: "add" | "edit";
};

export const FormSemesterDialog = ({
  open,
  onOpenChange,
  onSubmit,
  initialValue,
  initialTrainingPoint,
  mode = "add"
}: Props) => {
  const [semesterName, setSemesterName] = useState(initialValue);
  const [trainingPoint, setTrainingPoint] = useState<number | null>(initialTrainingPoint ?? null);
  const nameId = useId();
  const pointId = useId();

  useEffect(() => {
    if (open) {
      setSemesterName(initialValue);
      setTrainingPoint(initialTrainingPoint ?? null);
    }
  }, [open, initialValue, initialTrainingPoint]);

  const handleSubmit = () => {
    const trimmedName = semesterName.trim();
    if (!trimmedName) {
      return;
    }
    onSubmit(trimmedName, trainingPoint);
    setSemesterName("Học kỳ mới");
    setTrainingPoint(null);
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "add" ? "Thêm học kỳ mới" : "Sửa thông tin học kỳ"}</DialogTitle>
          <DialogDescription>
            {mode === "add" ? "Nhập thông tin cho học kỳ mới" : "Cập nhật thông tin học kỳ"}
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-4 py-4'>
          <div className='space-y-2'>
            <Label htmlFor={nameId}>Tiêu đề kỳ học</Label>
            <Input
              id={nameId}
              onChange={(e) => setSemesterName(e.target.value)}
              placeholder='Học kỳ mới'
              value={semesterName}
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor={pointId}>Điểm rèn luyện</Label>
            <Input
              id={pointId}
              max='100'
              min='0'
              onChange={(e) => {
                const value = e.target.value;
                setTrainingPoint(value === "" ? null : Number(value));
              }}
              placeholder='VD: 80'
              type='number'
              value={trainingPoint ?? ""}
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
