import { Clock, FlaskConical, GraduationCap } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PERIOD_TIME_TABLES } from "@/constants/period-time";
import type { PeriodSession, PeriodTimeSlot, PeriodTimeTable } from "@/types";

function SessionTable({ session, showLab }: { session: PeriodSession; showLab: boolean }) {
  return (
    <div className='mb-4'>
      <h4 className='mb-2 font-semibold text-sm'>{session.sessionName}</h4>
      <div className='overflow-hidden rounded-md border'>
        <table className='w-full text-sm'>
          <thead>
            <tr className='bg-muted/50'>
              <th className='px-3 py-2 text-left font-medium'>{showLab ? "Nhóm / Tiết" : "Tiết học"}</th>
              <th className='px-3 py-2 text-left font-medium'>Bắt đầu</th>
              <th className='px-3 py-2 text-left font-medium'>Kết thúc</th>
            </tr>
          </thead>
          <tbody>
            {session.slots.map((slot: PeriodTimeSlot, idx: number) => (
              <tr
                className={`border-t ${slot.isBreak ? "bg-muted/30 text-muted-foreground italic" : ""}`}
                key={`${session.sessionName}-${idx}`}
              >
                <td className='px-3 py-1.5'>{slot.label}</td>
                <td className='px-3 py-1.5 font-mono'>{slot.start}</td>
                <td className='px-3 py-1.5 font-mono'>{slot.end}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GroupSchedule({ table }: { table: PeriodTimeTable }) {
  const [showLab, setShowLab] = useState(false);
  const schedule = showLab && table.labGroupSchedule ? table.labGroupSchedule : table.normalSchedule;

  return (
    <div>
      <div className='mb-3 flex items-center justify-between'>
        <p className='text-muted-foreground text-xs'>{table.campuses}</p>
        {table.labGroupSchedule && (
          <Button className='h-7 gap-1 text-xs' onClick={() => setShowLab(!showLab)} size='sm' variant='ghost'>
            {showLab ? (
              <>
                <GraduationCap className='h-3.5 w-3.5' />
                Lớp thường
              </>
            ) : (
              <>
                <FlaskConical className='h-3.5 w-3.5' />
                Thực hành (chia nhóm)
              </>
            )}
          </Button>
        )}
      </div>
      {schedule.map((session) => (
        <SessionTable key={session.sessionName} session={session} showLab={showLab} />
      ))}
    </div>
  );
}

export function PeriodTimeView() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size='sm' variant='outline'>
          <Clock className='mr-2 h-4 w-4' />
          Giờ học theo tiết
        </Button>
      </DialogTrigger>
      <DialogContent className='max-h-[85vh] max-w-2xl overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Khung giờ học theo tiết</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue={PERIOD_TIME_TABLES[0].groupName}>
          <TabsList className='w-full'>
            {PERIOD_TIME_TABLES.map((t) => (
              <TabsTrigger className='flex-1' key={t.groupName} value={t.groupName}>
                {t.groupName}
              </TabsTrigger>
            ))}
          </TabsList>
          {PERIOD_TIME_TABLES.map((table) => (
            <TabsContent key={table.groupName} value={table.groupName}>
              <GroupSchedule table={table} />
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
