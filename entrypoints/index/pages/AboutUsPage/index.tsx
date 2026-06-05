import {
  BookOpenText,
  FacebookIcon,
  GithubIcon,
  MessageCircleIcon,
  PackageIcon,
  ShieldCheck,
  UsersIcon
} from "lucide-react";
import { useState } from "react";
import infoData from "@/assets/data/info.json";
import cachTinhToanMd from "@/assets/docs/cach_tinh_toan.md?raw";
import { ButtonNavSite } from "@/components/custom/button-nav-site";
import { MarkdownModal } from "@/components/custom/markdown-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { _FACEBOOK_URL, _GITHUB_RELEASE_URL, _GITHUB_URL, _MESSENGER_URL } from "@/constants";
import { useGlobalStore } from "@/store/use-global-store";
import { useUserSettingsStore } from "@/store/use-user-settings-store";
import { buildCalcParams } from "@/utils/markdown-params";
import packageJson from "../../../../package.json";

type InfoData = {
  credits: {
    team: string;
    contributors: string[];
  };
};

export function AboutUsPage() {
  const [calcOpen, setCalcOpen] = useState(false);
  const {
    retakeRatioLimit,
    maxCreditsPerSemester,
    minCreditsPerSemester,
    maxCreditsWarning,
    maxCreditsSummer,
    drlWarningThreshold
  } = useGlobalStore();
  const userSettings = useUserSettingsStore((s) => s.settings);
  const data = infoData as InfoData;
  const version = packageJson.version;

  const calcParams = buildCalcParams({
    retakeRatioLimit,
    maxCreditsPerSemester,
    minCreditsPerSemester,
    maxCreditsWarning,
    maxCreditsSummer,
    drlWarningThreshold,
    totalProgramCredits: userSettings.totalProgramCredits,
    trainingSemesters: userSettings.trainingSemesters
  });

  return (
    <div className='container mx-auto max-w-4xl p-4 lg:p-8'>
      <div className='mb-8 flex flex-col items-start gap-2'>
        <h1 className='font-bold text-3xl tracking-tight'>Về chúng tôi</h1>
        <p className='text-lg text-muted-foreground'>
          Thông tin về dự án MPC Extension và CLB Lập trình trên thiết bị di động (MPC).
        </p>
      </div>

      <div className='grid gap-6 md:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle className='text-xl'>Dự án MPC Extension</CardTitle>
            <CardDescription>Trợ thủ đắc lực cho sinh viên OU</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4 text-sm'>
            <div>
              <h3 className='mb-1 flex items-center gap-2 font-semibold text-sm'>
                <PackageIcon className='h-4 w-4' />
                Phiên bản
              </h3>
              <p className='text-muted-foreground'>
                Hiện tại: <span className='font-medium font-mono'>v{version}</span>
              </p>
            </div>

            <Separator />

            <div>
              <h3 className='mb-1 font-semibold text-sm'>Lịch sử cập nhật</h3>
              <p className='text-muted-foreground'>
                Chi tiết tại{" "}
                <ButtonNavSite isBlank url={_GITHUB_RELEASE_URL} variant='link'>
                  Github Releases
                </ButtonNavSite>
              </p>
            </div>

            <Separator />

            <div>
              <h3 className='mb-1 flex items-center gap-2 font-semibold text-sm'>
                <UsersIcon className='h-4 w-4' />
                Đóng góp
              </h3>
              <p className='text-muted-foreground'>
                Được phát triển bởi <span className='font-medium'>{data.credits.team}</span>
              </p>
              {data.credits.contributors.length > 0 && (
                <p className='mt-1 text-muted-foreground'>Đóng góp: {data.credits.contributors.join(", ")}</p>
              )}
            </div>

            <Separator />

            <ButtonNavSite className='w-full' isBlank rel='noopener' url={_GITHUB_URL} variant='outline'>
              <GithubIcon className='mr-2 h-4 w-4' />
              Mã nguồn Github
            </ButtonNavSite>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            {/* Ảnh logo nửa trái, title và des nửa phải */}
            <div className='flex items-center gap-4'>
              <div className='flex h-16 w-16 items-center justify-center'>
                <img alt='MPC Logo' className='h-full w-full object-cover' height={64} src='/icon/128.png' width={64} />
              </div>
              <div>
                <CardTitle className='text-lg'>Mobile Programming Club</CardTitle>
                <CardDescription>Câu lạc bộ lập trình trên thiết bị di động (MPC)</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className='space-y-4 text-sm'>
            <p>
              CLB Lập trình trên thiết bị di động (MPC) là nơi quy tụ những sinh viên đam mê lập trình và phát triển
              phần mềm tại OU. Chúng tôi thường xuyên tổ chức các buổi training, workshop và các dự án thực tế để sinh
              viên có môi trường rèn luyện.
            </p>
            <p>Extension này là một trong những sản phẩm phi lợi nhuận được thực hiện bởi các thành viên trong CLB.</p>
            <div className='flex gap-3 pt-4'>
              <ButtonNavSite className='flex-1' isBlank rel='noopener' url={_FACEBOOK_URL} variant='outline'>
                <FacebookIcon className='mr-2 h-4 w-4 text-blue-600' />
                Fanpage CLB
              </ButtonNavSite>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className='mt-6 border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-900/10'>
        <CardHeader>
          <CardTitle className='text-lg'>Góp ý & Báo lỗi</CardTitle>
          <CardDescription>Giúp chúng tôi hoàn thiện sản phẩm hơn</CardDescription>
        </CardHeader>
        <CardContent>
          <p className='mb-4 text-sm'>
            Nếu bạn phát hiện lỗi (bug) trong quá trình sử dụng hoặc có ý tưởng muốn đóng góp thêm tính năng cho MPC
            Extension, vui lòng để lại tin nhắn cho CLB.
          </p>
          <ButtonNavSite className='flex-1' isBlank rel='noopener' url={_MESSENGER_URL} variant='outline'>
            <MessageCircleIcon className='mr-2 h-4 w-4 text-blue-500' />
            Messenger CLB
          </ButtonNavSite>
        </CardContent>
      </Card>

      <Card className='mt-6 border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-900/10'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-lg'>
            <ShieldCheck className='h-5 w-5 text-green-600 dark:text-green-400' />
            Cam kết bảo mật & Quyền riêng tư
          </CardTitle>
          <CardDescription>Dữ liệu của bạn thuộc về bạn</CardDescription>
        </CardHeader>
        <CardContent className='space-y-3 text-sm'>
          <p>
            MPC Extension <strong>không gọi bất kỳ API bên ngoài nào</strong> và{" "}
            <strong>không gửi dữ liệu lên máy chủ</strong> của chúng tôi hay bất kỳ bên thứ ba nào.
          </p>
          <ul className='list-inside list-disc space-y-1 text-muted-foreground'>
            <li>
              Toàn bộ dữ liệu (thông tin cá nhân, điểm số, lịch học, lịch thi) chỉ được <strong>lưu cục bộ</strong> trên
              trình duyệt của bạn thông qua Chrome Storage.
            </li>
            <li>Extension chỉ đọc dữ liệu trực tiếp từ trang web của trường khi bạn chủ động nhấn nút "Nhập".</li>
            <li>Không có tài khoản, không cần đăng nhập, không theo dõi hành vi.</li>
          </ul>
          <p className='text-muted-foreground'>
            Bạn có thể xóa toàn bộ dữ liệu bất kỳ lúc nào trong phần <strong>Cài đặt</strong> của Dashboard.
          </p>
        </CardContent>
      </Card>

      <div className='mt-6 flex justify-center'>
        <Button className='gap-2' onClick={() => setCalcOpen(true)} size='lg' variant='outline'>
          <BookOpenText className='h-5 w-5' />
          Cách tiện ích hoạt động
        </Button>
      </div>

      <MarkdownModal
        isOpen={calcOpen}
        markdownContent={cachTinhToanMd}
        onClose={() => setCalcOpen(false)}
        params={calcParams}
        title='Cách tính toán — MPC Extension'
      />
    </div>
  );
}
