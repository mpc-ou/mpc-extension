import { GraduationCap, InfoIcon, Mail, MapPin, Phone, Trash2, User } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import thongTinMd from "@/assets/docs/thong_tin.md?raw";
import { CopyableField } from "@/components/custom/copyable-field";
import { MarkdownModal } from "@/components/custom/markdown-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { _COURSE_LABEL_MAPPING, _USER_LABEL_MAPPING } from "@/constants/default";
import { useConfirm } from "@/hooks/use-confirm";
import { useInfoStore } from "@/store/use-info-store";

export function PersonalInfoPage() {
  const { userData, courseData, getData } = useInfoStore();
  const [guideOpen, setGuideOpen] = useState(false);
  const confirm = useConfirm();

  useEffect(() => {
    getData();
  }, [getData]);

  if (!userData?.userId) {
    return (
      <div className='flex h-[60vh] flex-col items-center justify-center space-y-4'>
        <div className='mb-4 rounded-full bg-muted p-6'>
          <User className='h-12 w-12 text-muted-foreground' />
        </div>
        <h2 className='font-semibold text-2xl'>Chưa có dữ liệu cá nhân</h2>
        <p className='mb-6 max-w-md text-center text-muted-foreground'>
          Hệ thống chưa tìm thấy dữ liệu sinh viên của bạn. Vui lòng cập nhật để xem thông tin.
        </p>
        <Button onClick={() => setGuideOpen(true)} variant='outline'>
          <InfoIcon className='mr-2 h-4 w-4' />
          Hướng dẫn đồng bộ
        </Button>
        <MarkdownModal
          isOpen={guideOpen}
          markdownContent={thongTinMd}
          onClose={() => setGuideOpen(false)}
          title='Hướng dẫn cập nhật thông tin'
        />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex justify-end gap-2'>
        <Button onClick={() => setGuideOpen(true)} variant='outline'>
          <InfoIcon className='mr-2 h-4 w-4' />
          Hướng dẫn đồng bộ
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='outline'>
              <Trash2 className='mr-2 h-4 w-4' />
              Thao tác
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuItem
              onClick={async () => {
                const isConfirmed = await confirm({
                  title: "Xác nhận xóa dữ liệu",
                  description: "Bạn có chắc chắn muốn xóa toàn bộ thông tin cá nhân? Hành động này không thể hoàn tác.",
                  confirmText: "Xóa thông tin",
                  variant: "destructive"
                });
                if (isConfirmed) {
                  await useInfoStore.getState().clearData();
                  toast.success("Đã xóa thông tin cá nhân");
                }
              }}
            >
              <Trash2 className='mr-2 h-4 w-4 text-red-500' />
              Xóa thông tin
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className='flex flex-col gap-6 md:flex-row'>
        <Card className='w-full md:w-1/3'>
          <CardHeader className='flex flex-col items-center pb-2 text-center sm:flex-row sm:gap-4 sm:text-left'>
            <div className='mb-3 flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-primary/20 bg-muted sm:mb-0 sm:h-24 sm:w-24'>
              {userData.avatar ? (
                <img alt='Avatar' className='h-full w-full object-cover' height={96} src={userData.avatar} width={96} />
              ) : (
                <User className='h-12 w-12 text-muted-foreground' />
              )}
            </div>
            <div className='sm:min-w-0'>
              <CardTitle className='text-xl'>{userData.fullName}</CardTitle>
              <p className='text-muted-foreground text-sm'>{userData.userId}</p>
              <Badge className='mt-2' variant='secondary'>
                {userData.presenceStatus || "Đang học"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className='space-y-4 pt-4'>
            <div className='flex items-center gap-3 text-sm'>
              <Mail className='h-4 w-4 text-muted-foreground' />
              <CopyableField copyable hideable={false} value={userData.email} />
            </div>
            <div className='flex items-center gap-3 text-sm'>
              <Phone className='h-4 w-4 text-muted-foreground' />
              <CopyableField value={userData.phone} />
            </div>
            <div className='flex items-center gap-3 text-sm'>
              <MapPin className='h-4 w-4 shrink-0 text-muted-foreground' />
              <CopyableField value={userData.residentialAddress} />
            </div>
          </CardContent>
        </Card>

        <div className='w-full space-y-6 md:w-2/3'>
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='flex items-center gap-2 text-lg'>
                <User className='h-5 w-5 text-primary' /> Thông tin chung
              </CardTitle>
            </CardHeader>
            <CardContent className='grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2'>
              <div>
                <p className='text-muted-foreground text-xs'>{_USER_LABEL_MAPPING.dateOfBirth}</p>
                <CopyableField value={userData.dateOfBirth} />
              </div>
              <div>
                <p className='text-muted-foreground text-xs'>{_USER_LABEL_MAPPING.gender}</p>
                <p className='font-medium text-sm'>{userData.gender}</p>
              </div>
              <div>
                <p className='text-muted-foreground text-xs'>{_USER_LABEL_MAPPING.identityNumber}</p>
                <CopyableField value={userData.identityNumber} />
              </div>
              <div>
                <p className='text-muted-foreground text-xs'>{_USER_LABEL_MAPPING.placeOfBirth}</p>
                <CopyableField value={userData.placeOfBirth} />
              </div>
              <div>
                <p className='text-muted-foreground text-xs'>{_USER_LABEL_MAPPING.ethnicity}</p>
                <p className='font-medium text-sm'>{userData.ethnicity}</p>
              </div>
              <div>
                <p className='text-muted-foreground text-xs'>{_USER_LABEL_MAPPING.religion}</p>
                <p className='font-medium text-sm'>{userData.religion}</p>
              </div>
              <div>
                <p className='text-muted-foreground text-xs'>{_USER_LABEL_MAPPING.nationality}</p>
                <p className='font-medium text-sm'>{userData.nationality}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='flex items-center gap-2 text-lg'>
                <GraduationCap className='h-5 w-5 text-primary' /> Khóa học
              </CardTitle>
            </CardHeader>
            <CardContent className='grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2'>
              <div>
                <p className='text-muted-foreground text-xs'>{_COURSE_LABEL_MAPPING.major}</p>
                <p className='font-medium text-sm'>{courseData.major}</p>
              </div>
              <div>
                <p className='text-muted-foreground text-xs'>{_COURSE_LABEL_MAPPING.faculty}</p>
                <p className='font-medium text-sm'>{courseData.faculty}</p>
              </div>
              <div>
                <p className='text-muted-foreground text-xs'>{_COURSE_LABEL_MAPPING.classCode}</p>
                <p className='font-medium text-sm'>{courseData.classCode}</p>
              </div>
              <div>
                <p className='text-muted-foreground text-xs'>{_COURSE_LABEL_MAPPING.academicYear}</p>
                <p className='font-medium text-sm'>{courseData.academicYear}</p>
              </div>
              <div className='sm:col-span-2'>
                <p className='text-muted-foreground text-xs'>{_COURSE_LABEL_MAPPING.degreeProgram}</p>
                <p className='font-medium text-sm'>{courseData.degreeProgram}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='text-lg'>Thành tích & Khen thưởng</CardTitle>
        </CardHeader>
        <CardContent>
          {userData.awards && userData.awards.length > 0 ? (
            <div className='overflow-x-auto rounded-md border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên quyết định</TableHead>
                    <TableHead>Hình thức</TableHead>
                    <TableHead className='text-center'>Ngày khen thưởng</TableHead>
                    <TableHead>Ghi chú</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userData.awards.map((award) => (
                    <TableRow key={`${award.decisionDate}-${award.decisionName}`}>
                      <TableCell className='font-medium'>{award.decisionName}</TableCell>
                      <TableCell>{award.formOfReward}</TableCell>
                      <TableCell className='text-center'>{award.decisionDate}</TableCell>
                      <TableCell>{award.note}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className='rounded-md border border-dashed py-6 text-center text-muted-foreground text-sm'>
              Chưa có dữ liệu khen thưởng.
            </div>
          )}
        </CardContent>
      </Card>

      <MarkdownModal
        isOpen={guideOpen}
        markdownContent={thongTinMd}
        onClose={() => setGuideOpen(false)}
        title='Hướng dẫn cập nhật thông tin'
      />
    </div>
  );
}
