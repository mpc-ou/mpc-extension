import { InfoIcon, PackageIcon, UsersIcon } from "lucide-react";
import infoData from "@/assets/data/info.json";
import { ButtonNavSite } from "@/components/custom/button-nav-site";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { _GITHUB_RELEASE_URL } from "@/constants";
import packageJson from "../../package.json";

type Feature = {
  title: string;
  description: string;
};

type ChangelogEntry = {
  version: string;
  date: string;
  changes: string[];
};

type InfoData = {
  features: Feature[];
  changelog: ChangelogEntry[];
  credits: {
    team: string;
    contributors: string[];
  };
};

type InfoDialogProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function InfoDialog({ open, onOpenChange }: InfoDialogProps) {
  const data = infoData as InfoData;
  const version = packageJson.version;

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogTrigger asChild>
        <Button rel='noopener' size='sm' variant='link'>
          <InfoIcon className='h-5 w-5' />
        </Button>
      </DialogTrigger>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <PackageIcon className='h-5 w-5' />
            MPC Extension
          </DialogTitle>
          <DialogDescription>Extension hỗ trợ sinh viên trường Đại học Mở TP. HCM</DialogDescription>
        </DialogHeader>

        <div className='mt-3 space-y-3'>
          <div>
            <h3 className='mb-2 flex items-center gap-2 font-semibold text-sm'>
              <PackageIcon className='h-4 w-4' />
              Phiên bản
            </h3>
            <p className='text-muted-foreground text-sm'>
              Hiện tại: <span className='font-medium font-mono'>v{version}</span>
            </p>
          </div>

          <Separator />

          <div>
            <h3 className='mb-3 flex items-center gap-2 font-semibold text-sm'>
              <InfoIcon className='h-4 w-4' />
              Lịch sử cập nhật
            </h3>
            <div className='space-y-4'>
              Chi tiết tại
              <ButtonNavSite isBlank url={_GITHUB_RELEASE_URL} variant='link'>
                Github Releases
              </ButtonNavSite>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className='mb-2 flex items-center gap-2 font-semibold text-sm'>
              <UsersIcon className='h-4 w-4' />
              Đóng góp
            </h3>
            <p className='text-muted-foreground text-sm'>
              Được phát triển bởi <span className='font-medium'>{data.credits.team}</span>
            </p>
            {data.credits.contributors.length > 0 && (
              <p className='mt-1 text-muted-foreground text-sm'>Đóng góp: {data.credits.contributors.join(", ")}</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
