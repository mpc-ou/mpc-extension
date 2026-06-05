import { AlertCircle, ChevronDown, ChevronRight, Globe, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { _DEFAULT_SITE_URL_MAPPING } from "@/constants/default";

export function UrlConfig({
  urlMapping,
  handleURLChange,
  handleResetSite
}: {
  urlMapping: _SITE_MAPPING;
  handleURLChange: (siteKey: _SITE_CATE, path: string[], value: string) => void;
  handleResetSite: (siteKey: _SITE_CATE) => void;
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className='rounded-lg border'>
      <button
        className='flex w-full items-center gap-3 p-3 text-left'
        onClick={() => setShowAdvanced(!showAdvanced)}
        type='button'
      >
        <Globe className='h-4 w-4 text-muted-foreground' />
        <span className='flex-1 font-medium text-sm'>Cấu hình URL nâng cao</span>
        {showAdvanced ? <ChevronDown className='h-4 w-4' /> : <ChevronRight className='h-4 w-4' />}
      </button>

      {showAdvanced && (
        <div className='space-y-4 border-t px-3 py-3'>
          <div className='flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-800 dark:bg-amber-950/30'>
            <AlertCircle className='mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400' />
            <p className='text-[10px] text-amber-700 leading-tight dark:text-amber-300'>
              Trường <b>Regex</b> hỗ trợ biểu thức chính quy (RegExp). Extension sẽ so khớp URL hiện tại với regex để
              xác định trang.
            </p>
          </div>

          {(["sv", "kcq"] as _SITE_CATE[]).map((siteKey) => (
            <div className='space-y-2 rounded-lg border p-3' key={siteKey}>
              <div className='flex items-center justify-between pb-2'>
                <div>
                  <span className='font-medium text-sm'>{_DEFAULT_SITE_URL_MAPPING[siteKey].label}</span>
                  <p className='font-mono text-[10px] text-muted-foreground'>
                    {_DEFAULT_SITE_URL_MAPPING[siteKey].homepage.url}
                  </p>
                </div>
                <Button
                  className='h-6 gap-1 text-[10px]'
                  onClick={() => handleResetSite(siteKey)}
                  size='sm'
                  variant='secondary'
                >
                  <RefreshCw className='h-3 w-3' />
                  Đặt lại
                </Button>
              </div>

              <div className='space-y-3'>
                <div className='grid grid-cols-[100px_1fr] items-start gap-2'>
                  <Label className='pt-1.5 font-medium text-xs leading-tight'>Trang chủ</Label>
                  <div className='relative'>
                    <Input
                      className='h-7 pr-6 font-mono text-xs'
                      onChange={(e) => handleURLChange(siteKey, ["homepage", "regex"], e.target.value)}
                      placeholder='Regex nhận diện'
                      value={urlMapping[siteKey].homepage.regex}
                    />
                    <UrlTooltip />
                  </div>
                </div>
                {Object.entries(urlMapping[siteKey].pages).map(([pageKey, page]) => (
                  <div className='grid grid-cols-[100px_1fr] items-start gap-2' key={pageKey}>
                    <Label className='pt-1.5 font-medium text-xs leading-tight'>{page.label}</Label>
                    <div className='relative'>
                      <Input
                        className='h-7 pr-6 font-mono text-xs'
                        onChange={(e) => handleURLChange(siteKey, ["pages", pageKey, "regex"], e.target.value)}
                        placeholder='Regex nhận diện'
                        value={page.regex}
                      />
                      <UrlTooltip />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function UrlTooltip() {
  return (
    <div className='-translate-y-1/2 absolute top-1/2 right-1.5'>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className='flex h-4 w-4 cursor-help items-center justify-center rounded-full bg-muted text-[10px] text-muted-foreground'>
            ?
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className='max-w-xs text-xs'>Pattern regex để nhận diện URL hiện tại.</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
