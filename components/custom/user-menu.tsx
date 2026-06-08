import { Check, ChevronDown, Trash2, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { storage } from "#imports";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { _DEFAULT_COURSE_DATA, _DEFAULT_USER_DATA } from "@/constants/default";
import { getAvatarKey, getStudentKeys } from "@/constants/storage";
import { useConfirm } from "@/hooks/use-confirm";
import { useCalendarStore } from "@/store/use-calendar-store";
import { useCurrentUserStore } from "@/store/use-current-user-store";
import { useInfoStore } from "@/store/use-info-store";
import { useScoreStore } from "@/store/use-score-store";

async function _deleteStudentData(studentId: string) {
  const studentKeys = getStudentKeys(studentId);
  const avtKey = getAvatarKey(studentId);
  const removeListKeys = [...studentKeys, avtKey];
  await storage.removeItems(removeListKeys);
}

export function UserMenu() {
  const { studentId, displayName, avatar, viewStudentId, setViewStudentId } = useCurrentUserStore();
  const confirm = useConfirm();

  const isViewingOther = viewStudentId !== "" && viewStudentId !== studentId;

  const handleDeleteCurrentUser = async () => {
    if (!studentId) {
      toast.error("Chưa có MSSV để xóa");
      return;
    }

    const isConfirmed = await confirm({
      title: "Xóa dữ liệu người dùng",
      description: `Bạn có chắc muốn xóa toàn bộ dữ liệu của MSSV <strong>${studentId}</strong>. Thao tác này không thể hoàn tác.`,
      confirmText: "Xóa",
      variant: "destructive"
    });

    if (!isConfirmed) {
      return;
    }

    try {
      await _deleteStudentData(studentId);
      useInfoStore.getState().setUserData(_DEFAULT_USER_DATA);
      useInfoStore.getState().setCourseData(_DEFAULT_COURSE_DATA);
      useScoreStore.getState().setScores([]);
      useScoreStore.getState().setOriginalScores([]);
      useCalendarStore.getState().setStudyCalendarData([]);
      useCalendarStore.getState().setExamCalendarData([]);
      toast.success("Đã xóa toàn bộ dữ liệu");
    } catch {
      toast.error("Lỗi khi xóa dữ liệu");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className='h-8 gap-2 px-2' variant='ghost'>
          {avatar ? (
            <img alt='' className='h-6 w-6 rounded-full object-cover' height={24} src={avatar} width={24} />
          ) : (
            <div className='flex h-6 w-6 items-center justify-center rounded-full bg-primary/10'>
              <UserIcon className='h-3.5 w-3.5 text-primary' />
            </div>
          )}
          <div className='hidden flex-col items-start text-left sm:flex'>
            <span className='max-w-30 truncate font-medium text-xs leading-tight'>
              {displayName || "Chưa xác định"}
            </span>
            <span className='text-[10px] text-muted-foreground leading-tight'>{studentId || "Chưa có MSSV"}</span>
          </div>
          <ChevronDown className='h-3 w-3 text-muted-foreground' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-52'>
        <DropdownMenuLabel className='font-normal'>
          <p className='font-medium text-sm'>{displayName || "Chưa xác định"}</p>
          <p className='text-muted-foreground text-xs'>{studentId || "Chưa có MSSV"}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isViewingOther && (
          <>
            <DropdownMenuItem
              onClick={() => {
                setViewStudentId("");
                toast.success("Đã quay về tài khoản hiện tại");
              }}
            >
              <Check className='mr-2 h-4 w-4' />
              Quay về tài khoản hiện tại
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        {/* <DropdownMenuSeparator /> */}
        <DropdownMenuItem className='text-destructive' onClick={handleDeleteCurrentUser}>
          <Trash2 className='mr-2 h-4 w-4' />
          Xóa dữ liệu
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
