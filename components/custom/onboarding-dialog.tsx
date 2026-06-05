import { ArrowLeft, ArrowRight, Check, HelpCircle, Sparkles, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { _DEFAULT_USER_SETTINGS, _OUCOMMUNITY_PROGRAM_URL } from "@/constants/default";
import type { UserSettingsType } from "@/types";

const _STORAGE_KEY = "local:mpc-onboarding-completed";
const TOTAL_STEPS = 3;

type OnboardingDialogProps = {
  open: boolean;
  onComplete: (settings: UserSettingsType) => void;
  onSkip: () => void;
};

export function OnboardingDialog({ open, onComplete, onSkip }: OnboardingDialogProps) {
  const [step, setStep] = useState(0);
  const [settings, setSettings] = useState<UserSettingsType>({ ..._DEFAULT_USER_SETTINGS });

  const dotKeys = useMemo(() => Array.from({ length: TOTAL_STEPS }, (_, i) => `dot-${i}`), []);

  const handleFinish = () => {
    storage.setItem(_STORAGE_KEY, "1");
    onComplete(settings);
  };

  const handleSkip = () => {
    storage.setItem(_STORAGE_KEY, "1");
    onSkip();
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS - 1) {
      setStep((s) => s + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    setStep((s) => Math.max(0, s - 1));
  };

  return (
    <Dialog
      modal
      onOpenChange={() => {
        /* modal — no close via overlay */
      }}
      open={open}
    >
      <DialogContent
        className='sm:max-w-2xl'
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        showCloseButton={false}
      >
        <div className='flex justify-center gap-1.5'>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i <= step ? "w-6 bg-primary" : "w-1.5 bg-muted"
              }`}
              key={dotKeys[i]}
            />
          ))}
        </div>

        {step === 0 && (
          <div className='flex flex-col items-center gap-4 py-2'>
            <div className='flex h-36 w-36 items-center justify-center rounded-2xl'>
              <img
                alt='MPC'
                className='h-full w-full object-cover'
                height={144}
                src='/imgs/onboarding-0.png'
                width={144}
              />
            </div>
            <DialogHeader className='text-center'>
              <DialogTitle className='text-xl'>Chào mừng đến với MPC Extension</DialogTitle>
              <DialogDescription className='text-sm leading-relaxed'>
                Công cụ do <span className='font-semibold text-foreground'>CLB MPC</span> tạo ra nhằm giúp sinh viên
                trường Đại học Mở TP.HCM theo dõi điểm số, lịch học, học phí và nhiều tiện ích khác một cách dễ dàng.
              </DialogDescription>
            </DialogHeader>
          </div>
        )}

        {step === 1 && (
          <div className='flex flex-col gap-5 py-2'>
            <div className='flex items-center gap-3'>
              <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10'>
                <Sparkles className='h-5 w-5 text-amber-500' />
              </div>
              <div>
                <h3 className='font-semibold'>Thiết lập nhanh</h3>
                <p className='text-muted-foreground text-xs'>Giúp MPC tính toán chính xác hơn cho bạn</p>
              </div>
            </div>

            <div className='space-y-4'>
              <div className='space-y-1.5'>
                <div className='flex items-center gap-1.5'>
                  <Label>Chương trình học của bạn có bao nhiêu tín chỉ?</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        className='inline-flex h-4 w-4 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80'
                        type='button'
                      >
                        <HelpCircle className='h-3 w-3' />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className='max-w-55 text-xs' side='top'>
                      Là số tín chỉ trong chương trình ngành của bạn
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className='text-[10px] text-muted-foreground'>
                  Không biết?{" "}
                  <a
                    className='font-medium text-amber-600 underline underline-offset-2'
                    href={_OUCOMMUNITY_PROGRAM_URL}
                    rel='noopener noreferrer'
                    target='_blank'
                  >
                    Xem ở đây nè
                  </a>
                </p>
                <Input
                  onChange={(e) => setSettings((s) => ({ ...s, totalProgramCredits: Number(e.target.value) || 0 }))}
                  type='number'
                  value={settings.totalProgramCredits}
                />
              </div>

              <div className='space-y-1.5'>
                <div className='flex items-center gap-1.5'>
                  <Label>Chương trình học bạn tính bao nhiêu học kỳ?</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        className='inline-flex h-4 w-4 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80'
                        type='button'
                      >
                        <HelpCircle className='h-3 w-3' />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className='max-w-55 text-xs' side='top'>
                      Là số kỳ dùng để tính toán DRL tích lũy xét tốt nghiệp
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  onChange={(e) => setSettings((s) => ({ ...s, trainingSemesters: Number(e.target.value) || 10 }))}
                  type='number'
                  value={settings.trainingSemesters}
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className='flex flex-col gap-4 py-2'>
            <div className='flex items-center gap-3'>
              <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10'>
                <Zap className='h-5 w-5 text-green-500' />
              </div>
              <div>
                <h3 className='font-semibold'>Sẵn sàng khám phá</h3>
                <p className='text-muted-foreground text-xs'>Vài điều bạn cần biết để dùng MPC hiệu quả</p>
              </div>
            </div>

            <div className='space-y-4'>
              <div className='rounded-lg border p-3'>
                <p className='text-sm leading-relaxed'>
                  Các chức năng nhập dữ liệu, vui lòng tương tác bằng{" "}
                  <span className='font-semibold text-primary'>popup</span> góc trên trình duyệt
                </p>
                <p className='mt-1 text-muted-foreground text-xs'>Ghim extension để dễ dùng nè 👆</p>

                <div className='mt-3 flex items-center justify-center rounded-md text-muted-foreground text-xs'>
                  <img
                    alt='MPC'
                    className='h-full w-full max-w-[40vh] object-cover'
                    height={200}
                    src='imgs/onboarding-1.jpg'
                    width={400}
                  />
                </div>
              </div>

              <div className='rounded-lg border p-3'>
                <p className='text-sm leading-relaxed'>
                  * Nếu bạn muốn tùy biến sau, vui lòng vào <span className='font-semibold text-primary'>Cài đặt</span>{" "}
                  nhé
                </p>
                <p className='mt-1 text-muted-foreground text-xs'>
                  MPC có nhiều tùy chỉnh để phù hợp với nhu cầu của bạn
                </p>
              </div>
            </div>
          </div>
        )}

        <div className='flex items-center justify-between'>
          <Button onClick={handleSkip} size='sm' variant='ghost'>
            Bỏ qua
          </Button>

          <div className='flex items-center gap-2'>
            {step > 0 && (
              <Button onClick={handlePrev} size='sm' variant='outline'>
                <ArrowLeft className='h-4 w-4' />
                Trước
              </Button>
            )}
            <Button onClick={handleNext} size='sm'>
              {step === TOTAL_STEPS - 1 ? (
                <>
                  <Check className='h-4 w-4' />
                  Hoàn thành
                </>
              ) : (
                <>
                  Tiếp theo
                  <ArrowRight className='h-4 w-4' />
                </>
              )}
            </Button>
          </div>
        </div>

        <p className='text-center text-muted-foreground text-xs'>
          Thiết lập xong hoặc bỏ qua sẽ không hiển thị lại. Có thể chỉnh sửa sau trong Cài đặt.
        </p>
      </DialogContent>
    </Dialog>
  );
}
