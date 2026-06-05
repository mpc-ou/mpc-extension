import { Button } from "@/components/ui/button";
import { useGlobalStore } from "@/store/use-global-store";
import { getCurrTabURL, navigateToURL, openNewTab } from "@/utils";

type ButtonNavSiteProps = React.ComponentProps<typeof Button> & {
  url?: string;
  isBlank?: boolean;
};

const ButtonNavSite = ({ url, isBlank = false, onClick, ...props }: ButtonNavSiteProps) => {
  const setSiteCurrURL = useGlobalStore((s) => s.setSiteCurrURL);

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) {
      onClick(e);
    }

    if (!url) {
      return;
    }

    setTimeout(async () => {
      const currURL = await getCurrTabURL();
      setSiteCurrURL(currURL);
    }, 1000);

    if (isBlank) {
      await openNewTab(url);
    } else {
      await navigateToURL(url);
    }
  };

  return <Button {...props} onClick={handleClick} />;
};

export { ButtonNavSite };
