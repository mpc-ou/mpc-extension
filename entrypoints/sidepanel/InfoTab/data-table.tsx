import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { _COURSE_LABEL_MAPPING, _USER_LABEL_MAPPING } from "@/entrypoints/sidepanel/InfoTab/default";
import { CourseType, UserType } from "@/entrypoints/sidepanel/InfoTab/type";

type Props = {
  userData: UserType;
  courseData: CourseType;
};

const DataTable = ({ userData, courseData }: Props) => (
  <div className='space-y-6 p-4'>
    <h3 className='mb-2 font-semibold'>Thông tin cá nhân</h3>
    <Table className='w-full table-fixed'>
      <TableHeader>
        <TableRow>
          <TableHead colSpan={4}>Trường</TableHead>
          <TableHead colSpan={5}>Giá trị</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {(Object.keys(_USER_LABEL_MAPPING) as (keyof UserType)[]).map((key) => {
          const value = userData[key];
          const isDate = key === "updatedAt";
          const displayValue = isDate ? format(new Date(value) as Date, "HH:mm:ss dd-MM-yyyy") : (value ?? "N/A");

          return (
            <TableRow key={key}>
              <TableCell className='font-medium' colSpan={4}>
                {_USER_LABEL_MAPPING[key]}
              </TableCell>
              <TableCell colSpan={5}>{displayValue}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>

    <h3 className='mb-2 font-semibold'>Thông tin lớp học</h3>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead colSpan={4}>Trường</TableHead>
          <TableHead colSpan={5}>Giá trị</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {(Object.keys(_COURSE_LABEL_MAPPING) as (keyof CourseType)[]).map((key) => {
          const value = courseData[key];
          const isDate = key === "updatedAt";
          const displayValue = isDate ? format(new Date(value) as Date, "HH:mm:ss dd-MM-yyyy") : (value ?? "N/A");

          return (
            <TableRow key={key}>
              <TableCell className='font-medium' colSpan={4}>
                {_COURSE_LABEL_MAPPING[key]}
              </TableCell>
              <TableCell colSpan={5}>{displayValue}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  </div>
);

export { DataTable };
