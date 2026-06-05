import {
  CircleHelp,
  Download,
  HardDrive,
  Monitor,
  Moon,
  RefreshCw,
  Save,
  Settings,
  Sun,
  Upload,
  UserCog
} from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { _DEFAULT_SITE_URL_MAPPING } from "@/constants/default";
import { useConfirm } from "@/hooks/use-confirm";
import { type ThemeMode } from "@/lib/theme";
import { useGlobalStore } from "@/store/use-global-store";
import { useUserSettingsStore } from "@/store/use-user-settings-store";
import { decryptData, encryptData } from "@/utils/encryption";
import { formatFileSize } from "@/utils/file";
import { PersonalSettings } from "./components/personal-settings";
import { SchoolParams } from "./components/school-params";
import { UrlConfig } from "./components/url-config";

type SettingsPageProps = { theme: ThemeMode; onThemeChange: (mode: ThemeMode) => void };

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: React.FC<{ className?: string }> }[] = [
  { value: "light", label: "Sáng", icon: Sun },
  { value: "dark", label: "Tối", icon: Moon },
  { value: "system", label: "Hệ thống", icon: Monitor }
];

function SectionHeader({
  icon: Icon,
  title,
  description
}: {
  icon: React.FC<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className='flex items-center gap-3 rounded-t-lg p-4'>
      <div className='flex h-9 w-9 items-center justify-center rounded-md bg-primary/10'>
        <Icon className='h-4 w-4 text-primary' />
      </div>
      <div>
        <p className='font-semibold text-sm'>{title}</p>
        <p className='text-muted-foreground text-xs'>{description}</p>
      </div>
    </div>
  );
}

async function performImport(file: File, confirm: ReturnType<typeof useConfirm>): Promise<boolean> {
  const text = await file.text();
  const decrypted = await decryptData(text);
  const parsed = JSON.parse(decrypted);

  if (!parsed || typeof parsed !== "object" || !(parsed.local || parsed.sync)) {
    toast.error("Tệp tin sao lưu không đúng định dạng!");
    return false;
  }

  const ok = await confirm({
    title: "Khôi phục dữ liệu",
    description:
      "Thao tác này sẽ ghi đè toàn bộ dữ liệu hiện tại bằng dữ liệu trong file sao lưu. Bạn có muốn tiếp tục?",
    confirmText: "Khôi phục",
    cancelText: "Hủy"
  });

  if (ok) {
    await browser.storage.local.clear();
    await browser.storage.sync.clear();

    if (parsed.local) {
      await browser.storage.local.set(parsed.local);
    }
    if (parsed.sync) {
      await browser.storage.sync.set(parsed.sync);
    }
    return true;
  }
  return false;
}

export function SettingsPage({ theme, onThemeChange }: SettingsPageProps) {
  const {
    fixedPoint,
    ignoreList,
    siteURLMapping,
    retakeRatioLimit,
    maxCreditsPerSemester,
    minCreditsPerSemester,
    maxCreditsWarning,
    maxCreditsSummer,
    drlWarningThreshold,
    matchSubjectByName,
    setFixedPoint,
    setIgnoreList,
    setSiteURLMapping,
    setRetakeRatioLimit,
    setMaxCreditsPerSemester,
    setMinCreditsPerSemester,
    setMaxCreditsWarning,
    setMaxCreditsSummer,
    setDrlWarningThreshold,
    setMatchSubjectByName,
    saveData,
    getData
  } = useGlobalStore();
  const {
    settings: userSettings,
    setSettings: setUserSettings,
    getData: getUserSettings,
    saveData: saveUserSettings
  } = useUserSettingsStore();
  const confirm = useConfirm();

  const [ignoreListText, setIgnoreListText] = useState("");
  const [urlMapping, setURLMapping] = useState<_SITE_MAPPING>(siteURLMapping);

  const [trainingSemesters, setTrainingSemesters] = useState(userSettings.trainingSemesters);
  const [totalProgramCredits, setTotalProgramCredits] = useState(userSettings.totalProgramCredits);

  const [localRetakeRatio, setLocalRetakeRatio] = useState(retakeRatioLimit);
  const [localMaxCreditsPerSem, setLocalMaxCreditsPerSem] = useState(maxCreditsPerSemester);
  const [localMinCreditsPerSem, setLocalMinCreditsPerSem] = useState(minCreditsPerSemester);
  const [localMaxCreditsWarn, setLocalMaxCreditsWarn] = useState(maxCreditsWarning);
  const [localMaxCreditsSum, setLocalMaxCreditsSum] = useState(maxCreditsSummer);
  const [localDrlThreshold, setLocalDrlThreshold] = useState(drlWarningThreshold);
  const [localMatchByName, setLocalMatchByName] = useState(matchSubjectByName);

  const [storageUsage, setStorageUsage] = useState({ localBytes: 0, syncBytes: 0 });

  const refreshStorageUsage = useCallback(async () => {
    const [localData, syncData] = await Promise.all([browser.storage.local.get(null), browser.storage.sync.get(null)]);
    setStorageUsage({
      localBytes: new Blob([JSON.stringify(localData)]).size,
      syncBytes: new Blob([JSON.stringify(syncData)]).size
    });
  }, []);

  useLayoutEffect(() => {
    Promise.all([getData(), getUserSettings(), refreshStorageUsage()]);
  }, [getData, getUserSettings, refreshStorageUsage]);
  useEffect(() => {
    setIgnoreListText(ignoreList.join(","));
  }, [ignoreList]);
  useEffect(() => {
    setURLMapping(siteURLMapping);
  }, [siteURLMapping]);
  useEffect(() => {
    setLocalMatchByName(matchSubjectByName);
  }, [matchSubjectByName]);
  useEffect(() => {
    setTrainingSemesters(userSettings.trainingSemesters);
    setTotalProgramCredits(userSettings.totalProgramCredits);
  }, [userSettings]);

  const handleSave = async () => {
    const list = ignoreListText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    setIgnoreList(list);
    setSiteURLMapping(urlMapping);
    setRetakeRatioLimit(localRetakeRatio);
    setMaxCreditsPerSemester(localMaxCreditsPerSem);
    setMinCreditsPerSemester(localMinCreditsPerSem);
    setMaxCreditsWarning(localMaxCreditsWarn);
    setMaxCreditsSummer(localMaxCreditsSum);
    setDrlWarningThreshold(localDrlThreshold);
    setMatchSubjectByName(localMatchByName);
    setUserSettings({ trainingSemesters, totalProgramCredits });
    await Promise.all([saveData(), saveUserSettings()]);
    toast.success("Đã lưu cài đặt!");
  };

  const handleExportBackup = async () => {
    try {
      const localData = await browser.storage.local.get(null);
      const syncData = await browser.storage.sync.get(null);

      const payload = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        local: localData,
        sync: syncData
      };

      const encrypted = await encryptData(JSON.stringify(payload));

      let studentIdStr = "backup";
      try {
        const userRaw = await storage.getItem<string>("local:currentUser");
        if (userRaw) {
          const parsed = JSON.parse(userRaw);
          if (parsed.studentId) {
            studentIdStr = parsed.studentId;
          }
        }
      } catch {
        /* ignore */
      }

      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const fileName = `mpc_backup_${studentIdStr}_${dateStr}.mpcext`;

      const blob = new Blob([encrypted], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);

      toast.success("Xuất dữ liệu thành công!");
    } catch (e) {
      console.error("Backup export error:", e);
      toast.error("Không thể xuất file sao lưu!");
    }
  };

  const handleImportBackup = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".mpcext";
    input.onchange = async (e) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) {
        return;
      }

      try {
        const success = await performImport(file, confirm);
        if (success) {
          toast.success("Khôi phục dữ liệu thành công! Đang tải lại...");
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        }
      } catch (err) {
        console.error("Import backup error:", err);
        toast.error("Giải mã thất bại! Vui lòng kiểm tra lại file sao lưu (.mpcext) hoặc khóa bí mật.");
      }
    };
    input.click();
  };

  const handleURLChange = (siteKey: _SITE_CATE, path: string[], value: string) => {
    setURLMapping((prev) => {
      const updated = structuredClone(prev);
      let obj: Record<string, unknown> = updated[siteKey] as Record<string, unknown>;
      for (let i = 0; i < path.length - 1; i++) {
        obj = obj[path[i]] as Record<string, unknown>;
      }
      const lastKey = path.at(-1) ?? "";
      if (lastKey) {
        obj[lastKey] = value;
      }
      return updated;
    });
  };

  const handleResetSite = (siteKey: _SITE_CATE) => {
    setURLMapping((prev) => ({ ...prev, [siteKey]: structuredClone(_DEFAULT_SITE_URL_MAPPING[siteKey]) }));
    toast.success(`Đã đặt lại URL cho ${_DEFAULT_SITE_URL_MAPPING[siteKey].label}`);
  };

  return (
    <div className='mx-auto max-w-2xl space-y-6 pb-12'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10'>
            <Settings className='h-5 w-5 text-primary' />
          </div>
          <div>
            <h1 className='font-bold text-xl'>Cài đặt</h1>
            <p className='text-muted-foreground text-sm'>Tùy chỉnh Extension theo ý muốn của bạn</p>
          </div>
        </div>
        <Button className='gap-2' onClick={handleSave}>
          <Save className='h-4 w-4' />
          Lưu thay đổi
        </Button>
      </div>

      <Card>
        <SectionHeader
          description='Cài đặt theo MSSV, ảnh hưởng đến tính toán học lực và dự đoán điểm'
          icon={UserCog}
          title='Cài đặt cá nhân'
        />
        <CardContent className='pt-0'>
          <PersonalSettings
            setTotalProgramCredits={setTotalProgramCredits}
            setTrainingSemesters={setTrainingSemesters}
            totalProgramCredits={totalProgramCredits}
            trainingSemesters={trainingSemesters}
          />
        </CardContent>
      </Card>

      <Card>
        <SectionHeader
          description='Áp dụng cho tất cả tài khoản, đồng bộ qua các thiết bị'
          icon={Settings}
          title='Cài đặt chung'
        />
        <CardContent className='space-y-6 pt-0'>
          <div className='space-y-2'>
            <Label className='font-medium'>Chế độ màu sắc</Label>
            <div className='grid grid-cols-3 gap-2'>
              {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
                <button
                  className={`flex flex-col items-center gap-1 rounded-lg border p-2 transition-all hover:border-primary/50 ${theme === value ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-card"}`}
                  key={value}
                  onClick={() => onThemeChange(value)}
                  type='button'
                >
                  <Icon className={`h-4 w-4 ${theme === value ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`font-medium text-xs ${theme === value ? "text-primary" : "text-foreground"}`}>
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className='flex items-center justify-between gap-4'>
            <div>
              <Label className='font-medium'>Số chữ số thập phân</Label>
              <p className='mt-0.5 text-[10px] text-muted-foreground'>Áp dụng cho GPA và điểm số</p>
            </div>
            <Input
              className='h-8 w-20 text-center text-sm'
              max='10'
              min='1'
              onChange={(e) => {
                const v = e.target.value;
                if (v === "") {
                  return;
                }
                const n = Number(v);
                if (!Number.isNaN(n)) {
                  setFixedPoint(Math.min(10, Math.max(1, n)));
                }
              }}
              type='number'
              value={fixedPoint}
            />
          </div>

          <div className='flex items-center gap-3'>
            <Checkbox
              checked={localMatchByName}
              id='match-by-name'
              onCheckedChange={(v) => setLocalMatchByName(v === true)}
            />
            <div className='flex items-center gap-1.5'>
              <Label className='cursor-pointer font-medium' htmlFor='match-by-name'>
                So sánh cải thiện bằng tên môn
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <CircleHelp className='h-3.5 w-3.5 cursor-help text-muted-foreground' />
                </TooltipTrigger>
                <TooltipContent className='max-w-64' side='right'>
                  Một số trường đổi mã môn qua các năm (VD: "Cơ sở lập trình" năm 2022 có mã khác 2026). Bật để nhận
                  diện môn cải thiện qua tên + số tín chỉ thay vì chỉ mã môn.
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          <div className='space-y-1.5'>
            <Label className='font-medium'>Danh sách môn học loại khỏi GPA</Label>
            <p className='text-[10px] text-muted-foreground'>
              Mã môn bắt đầu với các ký tự sau sẽ bị loại khỏi tính GPA (phân cách bởi dấu phẩy)
            </p>
            <Textarea
              className='min-h-15 font-mono text-xs'
              onChange={(e) => setIgnoreListText(e.target.value)}
              placeholder='_,MEETING,PEDU,...'
              rows={2}
              value={ignoreListText}
            />
          </div>

          <SchoolParams
            localDrlThreshold={localDrlThreshold}
            localMaxCreditsPerSem={localMaxCreditsPerSem}
            localMaxCreditsSum={localMaxCreditsSum}
            localMaxCreditsWarn={localMaxCreditsWarn}
            localMinCreditsPerSem={localMinCreditsPerSem}
            localRetakeRatio={localRetakeRatio}
            setLocalDrlThreshold={setLocalDrlThreshold}
            setLocalMaxCreditsPerSem={setLocalMaxCreditsPerSem}
            setLocalMaxCreditsSum={setLocalMaxCreditsSum}
            setLocalMaxCreditsWarn={setLocalMaxCreditsWarn}
            setLocalMinCreditsPerSem={setLocalMinCreditsPerSem}
            setLocalRetakeRatio={setLocalRetakeRatio}
          />

          <UrlConfig handleResetSite={handleResetSite} handleURLChange={handleURLChange} urlMapping={urlMapping} />

          <div className='space-y-2 rounded-lg border p-3'>
            <div className='flex items-center gap-2'>
              <HardDrive className='h-4 w-4 text-muted-foreground' />
              <span className='font-medium text-sm'>Dung lượng lưu trữ</span>
              <Button className='ml-auto h-6 gap-1 text-[10px]' onClick={refreshStorageUsage} size='sm' variant='ghost'>
                <RefreshCw className='h-3 w-3' />
                Làm mới
              </Button>
            </div>
            <StorageBar
              bytes={storageUsage.localBytes}
              color='bg-primary'
              label='Local'
              maxBytes={10 * 1024 * 1024}
              maxLabel='10 MB'
            />
            <StorageBar
              bytes={storageUsage.syncBytes}
              color='bg-emerald-500'
              label='Sync'
              maxBytes={100 * 1024}
              maxLabel='100 KB'
            />
          </div>

          <div className='space-y-2 rounded-lg border p-3'>
            <div className='flex items-center gap-2'>
              <Save className='h-4 w-4 text-muted-foreground' />
              <span className='font-medium text-sm'>Đóng gói & Sao lưu dữ liệu (.mpcext)</span>
            </div>
            <p className='font-light text-[10px] text-muted-foreground leading-relaxed'>
              Đóng gói và mã hóa toàn bộ dữ liệu MPC Extension của bạn (bao gồm nhiều tài khoản học sinh, thông tin điểm
              số, lịch học/thi, các thiết lập tùy chỉnh) thành một tệp tin <code>.mpcext</code> bảo mật cao để lưu trữ
              hoặc chuyển đổi thiết bị.
            </p>
            <div className='grid grid-cols-2 gap-2 pt-1'>
              <Button className='h-8 gap-1.5 text-xs' onClick={handleExportBackup} variant='outline'>
                <Download className='h-3.5 w-3.5' />
                Xuất file .mpcext
              </Button>
              <Button className='h-8 gap-1.5 text-xs' onClick={handleImportBackup} variant='outline'>
                <Upload className='h-3.5 w-3.5' />
                Nhập file .mpcext
              </Button>
            </div>
          </div>

          <div className='rounded-lg border border-destructive/50 p-3'>
            <p className='mb-2 font-medium text-destructive text-sm'>Vùng nguy hiểm</p>
            <p className='mb-3 text-[10px] text-muted-foreground'>Xóa toàn bộ dữ liệu extension trên trình duyệt</p>
            <Button
              className='w-full'
              onClick={async () => {
                const ok = await confirm({
                  title: "Cảnh báo nguy hiểm",
                  description:
                    "Bạn có chắc chắn muốn xóa TOÀN BỘ dữ liệu (thông tin, điểm số, lịch học/thi)? Thao tác này không thể hoàn tác!",
                  confirmText: "Xóa toàn bộ",
                  cancelText: "Hủy",
                  variant: "destructive"
                });
                if (ok) {
                  await browser.storage.local.clear();
                  await browser.storage.sync.clear();
                  window.location.reload();
                }
              }}
              variant='destructive'
            >
              Xóa toàn bộ dữ liệu
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StorageBar({
  label,
  maxLabel,
  bytes,
  maxBytes,
  color
}: {
  label: string;
  maxLabel: string;
  bytes: number;
  maxBytes: number;
  color: string;
}) {
  return (
    <div>
      <div className='mb-0.5 flex justify-between text-xs'>
        <span className='text-muted-foreground'>{label}</span>
        <span className='font-mono'>
          {formatFileSize(bytes)} / {maxLabel}
        </span>
      </div>
      <div className='h-2 w-full overflow-hidden rounded-full bg-muted'>
        <div
          className={`h-full rounded-full ${color} transition-all`}
          style={{ width: `${Math.min((bytes / maxBytes) * 100, 100)}%` }}
        />
      </div>
    </div>
  );
}
