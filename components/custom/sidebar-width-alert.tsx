import { TriangleAlert, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

const _MIN_WIDTH = 700;

export function SidebarWidthAlert() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const checkWidth = () => {
      setIsVisible(window.innerWidth < _MIN_WIDTH);
    };

    checkWidth();

    window.addEventListener("resize", checkWidth);
    return () => window.removeEventListener("resize", checkWidth);
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
  };

  if (isDismissed || !isVisible) {
    return null;
  }

  return (
    <div className='mb-4 p-4 pb-0'>
      <Alert className='relative pr-12' variant='destructive'>
        <TriangleAlert className='h-4 w-4' />
        <AlertTitle>Kích thước cửa sổ quá nhỏ</AlertTitle>
        <AlertDescription>
          Để có trải nghiệm tốt nhất, vui lòng mở rộng cửa sổ extension tối thiểu {_MIN_WIDTH}px.
        </AlertDescription>
        <Button
          className='absolute top-2 right-2 h-6 w-6 text-destructive hover:bg-destructive/10 hover:text-destructive'
          onClick={handleDismiss}
          size='icon'
          variant='ghost'
        >
          <X className='h-4 w-4' />
        </Button>
      </Alert>
    </div>
  );
}
