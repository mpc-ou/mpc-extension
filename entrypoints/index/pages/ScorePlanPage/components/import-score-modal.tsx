import { CheckCircleIcon, FileIcon, UploadCloudIcon, XIcon } from "lucide-react";
import React, { useRef, useState } from "react";
import { toast } from "sonner";
import { read, utils } from "xlsx";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { _CSV_DELIMITER_REGEX, _LIMIT_FILE_SIZE, _TRAINING_POINT_REGEX } from "@/constants/io";
import { useGlobalStore } from "@/store/use-global-store";
import { PointCharacterType, ScoreGroupType } from "@/types";
import { formatFileSize } from "@/utils/file";
import { updateIgnoreSubject, updateScoreAvg } from "@/utils/score";

type ImportScoreModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportSuccess: (data: ScoreGroupType[]) => void;
};

export function ImportScoreModal({ open, onOpenChange, onImportSuccess }: ImportScoreModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const ignoreList = useGlobalStore((s) => s.ignoreList);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files?.[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (selectedFile: File) => {
    if (
      !(selectedFile.name.endsWith(".csv") || selectedFile.name.endsWith(".xlsx") || selectedFile.name.endsWith(".xls"))
    ) {
      toast.error("Chỉ hỗ trợ file định dạng CSV hoặc XLSX.");
      return;
    }
    if (selectedFile.size > _LIMIT_FILE_SIZE) {
      toast.error(`Kích thước file không được vượt quá ${formatFileSize(_LIMIT_FILE_SIZE)}.`);
      return;
    }
    setFile(selectedFile);
  };

  const removeFile = () => {
    setFile(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const parseScoreDataIfValid = (
    row: string[],
    firstCol: string,
    secondCol: string,
    currentSemester: ScoreGroupType
  ) => {
    if (secondCol && secondCol !== "Mã MH" && !firstCol.startsWith("-")) {
      const point10 = row[9] || "";
      const point4 = row[10] || "";
      const parsed10 = Number.parseFloat(point10);
      const parsed4 = Number.parseFloat(point4);

      currentSemester.data.push({
        code: secondCol,
        credit: Number.parseInt(row[4], 10) || 0,
        name: row[3] || "",
        point: {
          scale10: point10 !== "" && !Number.isNaN(parsed10) ? parsed10 : 0,
          scale4: point4 !== "" && !Number.isNaN(parsed4) ? parsed4 : 0,
          character: (row[11] || "") as PointCharacterType
        }
      });
    }
  };

  const parseTrainingPoint = (row: string[], firstCol: string): number | null => {
    const trPointRaw = row[1] || firstCol.match(_TRAINING_POINT_REGEX)?.[1] || "";
    if (trPointRaw && !Number.isNaN(Number.parseInt(trPointRaw, 10))) {
      return Number.parseInt(trPointRaw, 10);
    }
    return null;
  };

  const tryParseCSVSemester = (_row: string[], i: number, firstCol: string): ScoreGroupType | null => {
    if (firstCol.startsWith("Học kỳ") || firstCol === "Bảo lưu") {
      return {
        id: i - 1,
        title: firstCol,
        data: [],
        totalCredit: 0,
        trainingPoint: null,
        avgPoint: { scale10: 0, scale4: 0 }
      };
    }
    return null;
  };

  const parseCSVToJSON = (fileContent: string): ScoreGroupType[] => {
    const lines = fileContent.split("\n");
    const semesters: ScoreGroupType[] = [];
    let currentSemester: ScoreGroupType | null = null;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) {
        continue;
      }

      const row = line.split(_CSV_DELIMITER_REGEX).map((col) => col.replace(/(^"|"$)/g, "").trim());
      const firstCol = row[0] || "";
      const secondCol = row[1] || "";

      const semester = tryParseCSVSemester(row, i, firstCol);
      if (semester) {
        currentSemester = semester;
        semesters.push(currentSemester);
        continue;
      }

      if (!currentSemester) {
        continue;
      }

      if (firstCol.includes("Điểm rèn luyện học kỳ:")) {
        const trPoint = parseTrainingPoint(row, firstCol);
        if (trPoint !== null) {
          currentSemester.trainingPoint = trPoint;
        }
        continue;
      }

      parseScoreDataIfValid(row, firstCol, secondCol, currentSemester);
    }

    return semesters;
  };

  const handleImport = async () => {
    if (!file) {
      return;
    }
    setIsLoading(true);

    try {
      let text = "";
      if (file.name.endsWith(".csv")) {
        text = await file.text();
      } else {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = read(arrayBuffer, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        text = utils.sheet_to_csv(worksheet);
      }

      let parsedSemesters = parseCSVToJSON(text);

      parsedSemesters = updateIgnoreSubject(parsedSemesters, ignoreList);
      parsedSemesters = updateScoreAvg(parsedSemesters);

      onImportSuccess(parsedSemesters);
      setFile(null);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Lỗi khi parse file CSV:", error);
      toast.error("Có lỗi xảy ra khi đọc file. Vui lòng kiểm tra lại định dạng.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Tải bảng điểm thủ công</DialogTitle>
          <DialogDescription>
            Tải lên file dữ liệu bảng điểm dạng CSV (.csv) hoặc Excel (.xlsx, .xls) để nhập vào hệ thống. Kích thước tối
            đa 1MB.
          </DialogDescription>
        </DialogHeader>

        <button
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
            dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
          }`}
          onClick={() => inputRef.current?.click()}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              inputRef.current?.click();
            }
          }}
          type='button'
        >
          <input accept='.csv, .xlsx, .xls' className='hidden' onChange={handleChange} ref={inputRef} type='file' />

          {file ? (
            <div className='flex w-full items-center gap-4 rounded-md bg-muted/50 p-3'>
              <FileIcon className='h-8 w-8 text-primary' />
              <div className='flex-1 overflow-hidden'>
                <p className='truncate font-medium text-sm'>{file.name}</p>
                <p className='text-muted-foreground text-xs'>{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <Button
                className='h-8 w-8 text-muted-foreground hover:text-destructive'
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  removeFile();
                }}
                size='icon'
                variant='ghost'
              >
                <XIcon className='h-4 w-4' />
              </Button>
            </div>
          ) : (
            <div className='flex flex-col items-center gap-2 text-center'>
              <UploadCloudIcon className='h-10 w-10 text-muted-foreground' />
              <p className='font-medium'>
                Kéo thả file vào đây hoặc <span className='text-primary'>chọn file</span>
              </p>
              <p className='text-muted-foreground text-xs'>Hỗ trợ file: .csv, .xlsx, .xls</p>
            </div>
          )}
        </button>

        <DialogFooter className='flex w-full justify-between sm:justify-between'>
          <Button onClick={() => onOpenChange(false)} variant='secondary'>
            Hủy
          </Button>
          <Button disabled={!file || isLoading} onClick={handleImport}>
            <CheckCircleIcon className='mr-2 h-4 w-4' />
            Nhập dữ liệu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
