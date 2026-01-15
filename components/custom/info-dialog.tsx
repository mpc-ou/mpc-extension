import { InfoIcon, PackageIcon, SparklesIcon, UsersIcon } from "lucide-react";
import infoData from "@/assets/data/info.json";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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

        <ScrollArea className='max-h-[60vh] pr-4'>
          <div className='space-y-6'>
            {/* Version */}
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

            {/* Features */}
            <div>
              <h3 className='mb-3 flex items-center gap-2 font-semibold text-sm'>
                <SparklesIcon className='h-4 w-4' />
                Tính năng
              </h3>
              <div className='space-y-3'>
                {data.features.map((feature) => (
                  <div className='space-y-1' key={feature.title}>
                    <h4 className='font-medium text-sm'>{feature.title}</h4>
                    <p className='text-muted-foreground text-sm'>{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Changelog */}
            <div>
              <h3 className='mb-3 flex items-center gap-2 font-semibold text-sm'>
                <InfoIcon className='h-4 w-4' />
                Lịch sử cập nhật
              </h3>
              <div className='space-y-4'>
                {data.changelog.map((release) => (
                  <div className='space-y-2' key={release.version}>
                    <div className='flex items-center gap-2'>
                      <span className='font-medium font-mono text-sm'>v{release.version}</span>
                      <span className='text-muted-foreground text-xs'>{release.date}</span>
                    </div>
                    <ul className='ml-4 list-disc space-y-1'>
                      {release.changes.map((change) => (
                        <li className='text-muted-foreground text-sm' key={change}>
                          {change}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Credits */}
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
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
