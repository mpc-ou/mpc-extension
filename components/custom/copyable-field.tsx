import { Check, Copy, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type CopyableFieldProps = {
  value: string;
  hideable?: boolean;
  defaultHidden?: boolean;
  copyable?: boolean;
  className?: string;
};

export function CopyableField({
  value,
  hideable = true,
  defaultHidden = true,
  copyable = true,
  className
}: CopyableFieldProps) {
  const [visible, setVisible] = useState(!defaultHidden);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!value) {
      return;
    }
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayValue = hideable && !visible ? "••••••••" : value;

  return (
    <span className={`inline-flex items-center gap-1 ${className || ""}`}>
      <span className='font-medium text-sm'>{displayValue}</span>
      {hideable && (
        <Button
          className='h-6 w-6'
          onClick={() => setVisible(!visible)}
          size='icon'
          title={visible ? "Ẩn" : "Hiện"}
          variant='ghost'
        >
          {visible ? <EyeOff className='h-3 w-3' /> : <Eye className='h-3 w-3' />}
        </Button>
      )}
      {copyable && (
        <Button className='h-6 w-6' onClick={handleCopy} size='icon' title='Copy' variant='ghost'>
          {copied ? <Check className='h-3 w-3 text-green-500' /> : <Copy className='h-3 w-3' />}
        </Button>
      )}
    </span>
  );
}
