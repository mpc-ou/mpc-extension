import { useEffect, useId, useState } from "react";
import subjectsData from "@/assets/data/subject.json";
import { Combobox } from "@/components/custom/combobox";
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
import { Separator } from "@/components/ui/separator";
import type { PointCharacterType } from "@/types";
import { parseScale10ToCharacterAndScale4 } from "@/utils";

type SubjectDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEditMode: boolean;
  initialData?: { code: string; name: string; credit: string; scale10: string } | null;
  onSubmit: (subject: {
    code: string;
    name: string;
    credit: number;
    point: { scale10: number; scale4: number; character: PointCharacterType };
  }) => void;
};

export function SubjectDialog({ open, onOpenChange, isEditMode, initialData, onSubmit }: SubjectDialogProps) {
  const [formData, setFormData] = useState({ code: "", name: "", credit: "", scale10: "" });

  useEffect(() => {
    if (open) {
      setFormData(initialData || { code: "", name: "", credit: "", scale10: "" });
    }
  }, [open, initialData]);

  const idCode = useId();
  const idName = useId();
  const idCredit = useId();
  const idScale10 = useId();

  const subjectOptions = subjectsData.map((s) => ({
    value: `${s.code}|${s.name}|${s.credit}`,
    label: `${s.code} - ${s.name} (${s.credit} TC)`
  }));

  const handleSubjectSelect = (val: string) => {
    if (val) {
      const [code, name, credit] = val.split("|");
      setFormData({ ...formData, code, name, credit });
    }
  };

  const isFormValid = formData.code && formData.name && formData.credit && formData.scale10;

  const handleSubmit = () => {
    const s10 = Number(formData.scale10);
    const { scale4, character } = parseScale10ToCharacterAndScale4(s10);
    onSubmit({
      code: formData.code,
      name: formData.name,
      credit: Number(formData.credit),
      point: { scale10: s10, scale4, character }
    });
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className='sm:max-w-150'>
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Chỉnh sửa môn học" : "Thêm môn học"}</DialogTitle>
          <DialogDescription>{isEditMode ? "Cập nhật thông tin." : "Nhập thông tin môn học mới."}</DialogDescription>
        </DialogHeader>
        <div className='grid gap-4 py-4'>
          <div className='grid grid-cols-4 items-center gap-4'>
            <Label className='text-right'>Chọn môn học</Label>
            <div className='col-span-3'>
              <Combobox
                emptyText='Không tìm thấy'
                onValueChange={handleSubjectSelect}
                options={subjectOptions}
                placeholder='Chọn từ danh sách...'
                searchPlaceholder='Tìm kiếm...'
              />
            </div>
          </div>
          <Separator />
          <div className='grid grid-cols-4 items-center gap-4'>
            <Label className='text-right' htmlFor={idCode}>
              Mã môn
            </Label>
            <Input
              className='col-span-3'
              id={idCode}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              value={formData.code}
            />
          </div>
          <div className='grid grid-cols-4 items-center gap-4'>
            <Label className='text-right' htmlFor={idName}>
              Tên môn
            </Label>
            <Input
              className='col-span-3'
              id={idName}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              value={formData.name}
            />
          </div>
          <div className='grid grid-cols-4 items-center gap-4'>
            <Label className='text-right' htmlFor={idCredit}>
              Tín chỉ
            </Label>
            <Input
              className='col-span-3'
              id={idCredit}
              max='6'
              min='1'
              onChange={(e) => setFormData({ ...formData, credit: e.target.value })}
              type='number'
              value={formData.credit}
            />
          </div>
          <div className='grid grid-cols-4 items-center gap-4'>
            <Label className='text-right' htmlFor={idScale10}>
              Điểm hệ 10
            </Label>
            <Input
              className='col-span-3'
              id={idScale10}
              max='10'
              min='0'
              onChange={(e) => {
                const v = Number.parseFloat(e.target.value);
                if (e.target.value === "" || Number.isNaN(v)) {
                  setFormData({ ...formData, scale10: "" });
                } else {
                  setFormData({ ...formData, scale10: String(Math.min(10, Math.max(0, v))) });
                }
              }}
              step='0.1'
              type='number'
              value={formData.scale10}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant='outline'>
            Hủy
          </Button>
          <Button disabled={!isFormValid} onClick={handleSubmit}>
            {isEditMode ? "Cập nhật" : "Thêm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
