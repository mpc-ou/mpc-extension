import { EditIcon, MoreVerticalIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import subjectsData from "@/assets/data/subject.json";
import { Combobox } from "@/components/custom/combobox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { _DEFAULT_FORM_DATA } from "@/entrypoints/popup/PointTab/default";
import { parseScale10ToCharacterAndScale4, removeVietnameseTones } from "@/utils";
import { ScoreFilterType, ScoreGroupType, ScoreRecordType } from "./type";

type Props = {
  data: ScoreGroupType[];
  filter: ScoreFilterType;
  handleDeleteSubject: (semesterIdx: number, subjectIdx: number) => void;
  handleAddSubject: (semesterIdx: number, subject: Omit<ScoreRecordType, "isIgnore" | "isHead">) => void;
  handleEditSubject: (
    semesterIdx: number,
    subjectIdx: number,
    subject: Omit<ScoreRecordType, "isIgnore" | "isHead">
  ) => void;
  fixedPoint: number;
  handleEditSemester?: (semesterIdx: number) => void;
  handleDeleteSemester?: (semesterIdx: number) => void;
};

const DataTable = ({
  data,
  filter,
  handleDeleteSubject,
  handleAddSubject,
  handleEditSubject,
  handleEditSemester,
  handleDeleteSemester,
  fixedPoint
}: Props) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedSemesterIdx, setSelectedSemesterIdx] = useState<number>(0);
  const [selectedSubjectIdx, setSelectedSubjectIdx] = useState<number>(0);
  const [deletingSemesterIdx, setDeletingSemesterIdx] = useState<number | null>(null);
  const [formData, setFormData] = useState(_DEFAULT_FORM_DATA);

  const subjectOptions = subjectsData.map((subject) => ({
    value: `${subject.code}|${subject.name}|${subject.credit}`,
    label: `${subject.code} - ${subject.name} (${subject.credit} TC)`
  }));

  const handleSubjectSelect = (selectedValue: string) => {
    if (selectedValue) {
      const [code, name, credit] = selectedValue.split("|");
      setFormData({
        ...formData,
        code,
        name,
        credit
      });
    }
  };

  const handleOpenAddDialog = (semesterIdx: number) => {
    setSelectedSemesterIdx(semesterIdx);
    setIsEditMode(false);
    setFormData({
      code: "",
      name: "",
      credit: "",
      scale10: ""
    });
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (semesterIdx: number, subjectIdx: number, subject: ScoreRecordType) => {
    setSelectedSemesterIdx(semesterIdx);
    setSelectedSubjectIdx(subjectIdx);
    setIsEditMode(true);
    setFormData({
      code: subject.code,
      name: subject.name,
      credit: subject.credit?.toString() || "",
      scale10: subject.point.scale10?.toString() || ""
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const scale10 = Number(formData.scale10);
    const { scale4, character } = parseScale10ToCharacterAndScale4(scale10);

    const subjectData = {
      code: formData.code,
      name: formData.name,
      credit: Number(formData.credit),
      point: {
        scale10,
        scale4,
        character
      }
    };

    if (isEditMode) {
      handleEditSubject(selectedSemesterIdx, selectedSubjectIdx, subjectData);
    } else {
      handleAddSubject(selectedSemesterIdx, subjectData);
    }

    setDialogOpen(false);
  };

  const isFormValid = formData.code && formData.name && formData.credit && formData.scale10;

  const shouldShowSubject = (subject: ScoreRecordType, filter: ScoreFilterType): boolean => {
    const subjectNameNoTone = removeVietnameseTones(subject.name);
    const filterTextNoTone = removeVietnameseTones(filter.queryText);
    const isMatchFilter =
      subjectNameNoTone.includes(filterTextNoTone) || subject.code.toLowerCase().includes(filterTextNoTone);

    if (filter.isOnlyCalcGPA && (subject.isIgnore || !subject.point.character)) {
      return false;
    }

    if (filter.queryText.trim() !== "" && !isMatchFilter) {
      return false;
    }

    return true;
  };

  return (
    <div className='space-y-4 px-2'>
      {data.map((semester, semesterIdx) => {
        const filteredData = semester.data.filter((item) => {
          const queryText = removeVietnameseTones(filter.queryText.toLowerCase());
          const code = removeVietnameseTones(item.code.toLowerCase());
          const name = removeVietnameseTones(item.name.toLowerCase());

          const isMatchQuery = queryText === "" || code.includes(queryText) || name.includes(queryText);
          const isCalcGPAOnly = !filter.isOnlyCalcGPA || (!item.isIgnore && item.point.character);

          return !!isMatchQuery && isCalcGPAOnly;
        });

        if (semester.data.length > 0 && filteredData.length === 0) {
          return null;
        }

        return (
          <div className='overflow-hidden rounded-md border shadow' key={semester.id}>
            <div className='flex items-center justify-between bg-blue-100 px-4 py-2'>
              <div>
                <div className='font-semibold'>{semester.title}</div>
                <div className='text-muted-foreground text-sm'>
                  Hệ 10: {semester.avgPoint.scale10?.toFixed(fixedPoint) || "---"} - Hệ 4:{" "}
                  {semester.avgPoint.scale4?.toFixed(fixedPoint) || "---"}
                </div>
              </div>
              <div className='flex items-center gap-2'>
                <Button
                  className='bg-white'
                  onClick={() => handleOpenAddDialog(semesterIdx)}
                  size='sm'
                  variant='outline'
                >
                  <PlusIcon className='mr-2 h-4 w-4' />
                  Thêm môn
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button aria-label='Tùy chọn học kỳ' size='icon' variant='ghost'>
                      <MoreVerticalIcon />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    <DropdownMenuGroup>
                      <DropdownMenuItem onClick={() => handleEditSemester?.(semesterIdx)}>
                        <EditIcon className='mr-2 h-4 w-4 text-blue-500' />
                        Sửa học kỳ
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDeletingSemesterIdx(semesterIdx)}>
                        <Trash2Icon className='mr-2 h-4 w-4 text-red-500' />
                        Xóa học kỳ
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {semester.data.length === 0 ? (
              <div className='bg-muted/20 py-2 text-center'>
                <p className='text-muted-foreground text-sm'>Chưa có môn học nào trong học kỳ này</p>
              </div>
            ) : (
              <Table className='w-full table-fixed'>
                <TableHeader>
                  <TableRow>
                    <TableHead className='w-[15%]'>Mã môn</TableHead>
                    <TableHead className='w-[35%]'>Tên môn</TableHead>
                    <TableHead className='w-[6%] text-center'>TC</TableHead>
                    <TableHead className='w-[8%] text-center'>Hệ 10</TableHead>
                    <TableHead className='w-[8%] text-center'>Hệ 4</TableHead>
                    <TableHead className='w-[10%] text-center'>Điểm</TableHead>
                    <TableHead className='w-[9%] text-center'>Thao tác</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {semester.data.map((subject, subjectIdx) => {
                    if (!shouldShowSubject(subject, filter)) {
                      return null;
                    }

                    return (
                      <TableRow className={subject.isIgnore ? "bg-gray-300" : ""} key={subject.code}>
                        <TableCell className='w-[15%]'>{subject.code}</TableCell>
                        <TableCell className='w-[35%]'>
                          <Tooltip>
                            <TooltipTrigger className='w-full truncate text-left'>{subject.name}</TooltipTrigger>
                            <TooltipContent>{subject.name}</TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell className='w-[6%] text-center'>{subject.credit}</TableCell>
                        <TableCell className='w-[8%] text-center'>{subject.point.scale10 ?? "-"}</TableCell>
                        <TableCell className='w-[8%] text-center'>{subject.point.scale4 ?? "-"}</TableCell>
                        <TableCell className='w-[10%] text-center'>{subject.point.character}</TableCell>
                        <TableCell className='w-[9%] text-center'>
                          <div className='flex items-center justify-center gap-3'>
                            <EditIcon
                              className='h-4 w-4 cursor-pointer text-blue-500 hover:text-blue-700'
                              onClick={() => handleOpenEditDialog(semesterIdx, subjectIdx, subject)}
                            />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Trash2Icon className='h-4 w-4 cursor-pointer text-red-500 hover:text-red-700' />
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Bạn chắc chắn muốn xóa môn học này?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Hành động này không thể hoàn tác. Môn học "{subject.name}" sẽ bị xóa khỏi danh sách
                                    điểm của bạn?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteSubject(semesterIdx, subjectIdx)}>
                                    Tiếp tục
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        );
      })}
      <Dialog onOpenChange={setDialogOpen} open={dialogOpen}>
        <DialogContent className='sm:max-w-150'>
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Chỉnh sửa môn học" : "Thêm môn học mới"}</DialogTitle>
            <DialogDescription>
              {isEditMode ? "Cập nhật thông tin môn học." : "Nhập thông tin môn học để thêm vào học kỳ được chọn."}
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label className='text-right'>Chọn môn học</Label>
              <div className='col-span-3'>
                <Combobox
                  emptyText='Không tìm thấy môn học'
                  onValueChange={handleSubjectSelect}
                  options={subjectOptions}
                  placeholder='Chọn từ danh sách môn học (CNTT)...'
                  searchPlaceholder='Tìm kiếm môn học...'
                />
              </div>
            </div>
            <Separator />
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label className='text-right' htmlFor='subject-code'>
                Mã môn
              </Label>
              <Input
                className='col-span-3'
                id='subject-code'
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder='VD: MATH101'
                value={formData.code}
              />
            </div>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label className='text-right' htmlFor='subject-name'>
                Tên môn
              </Label>
              <Input
                className='col-span-3'
                id='subject-name'
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder='VD: Toán cao cấp'
                value={formData.name}
              />
            </div>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label className='text-right' htmlFor='subject-credit'>
                Tín chỉ
              </Label>
              <Input
                className='col-span-3'
                id='subject-credit'
                max='6'
                min='1'
                onChange={(e) => setFormData({ ...formData, credit: e.target.value })}
                placeholder='VD: 3'
                type='number'
                value={formData.credit}
              />
            </div>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label className='text-right' htmlFor='subject-scale10'>
                Điểm hệ 10
              </Label>
              <Input
                className='col-span-3'
                id='subject-scale10'
                max='10'
                min='0'
                onChange={(e) => setFormData({ ...formData, scale10: e.target.value })}
                placeholder='VD: 8.5'
                step='0.1'
                type='number'
                value={formData.scale10}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setDialogOpen(false)} type='button' variant='outline'>
              Hủy
            </Button>
            <Button disabled={!isFormValid} onClick={handleSubmit} type='button'>
              {isEditMode ? "Cập nhật" : "Thêm môn học"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog onOpenChange={(open) => !open && setDeletingSemesterIdx(null)} open={deletingSemesterIdx !== null}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn chắc chắn muốn xóa học kỳ này?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Học kỳ "{data[deletingSemesterIdx ?? 0]?.title}" và tất cả môn học trong
              đó sẽ bị xóa vĩnh viễn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingSemesterIdx(null)}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingSemesterIdx !== null) {
                  handleDeleteSemester?.(deletingSemesterIdx);
                  setDeletingSemesterIdx(null);
                }
              }}
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export { DataTable };
