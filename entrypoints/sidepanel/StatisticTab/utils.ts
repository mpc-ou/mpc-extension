import { _DEFAULT_IGNORE_SEMESTER_TITLE } from "@/constants/default";
import { ScoreGroupType } from "@/entrypoints/sidepanel/PointTab/type";
import { _DEFAULT_CHARACTER_COUNT } from "@/entrypoints/sidepanel/StatisticTab/default";
import { SemesterAvgType } from "@/entrypoints/sidepanel/StatisticTab/type";

const calculateStatistics = (scores: ScoreGroupType[]) => {
  let countAllSemester = scores.length;
  let countIgnoreSemester = 0;

  let countAllCredit = 0;
  let countIgnoreCredit = 0;

  let countAllSubject = 0;
  let countIgnoreSubject = 0;

  let countAllCharacter = 0;

  const characterCount = { ..._DEFAULT_CHARACTER_COUNT };

  const semesterAvg: SemesterAvgType[] = [];

  let sum10 = 0;
  let sum4 = 0;

  for (const semester of scores) {
    if (semester.title.includes(_DEFAULT_IGNORE_SEMESTER_TITLE) || !semester.avgPoint.scale10) {
      countIgnoreSemester++;
    }

    for (const subject of semester.data) {
      countAllSubject++;

      if (subject.isIgnore) {
        countIgnoreSubject++;
        countIgnoreCredit += subject.credit || 0;
      } else {
        countAllCharacter++;
        characterCount[subject.point.character]++;
      }

      countAllCredit += subject.credit || 0;
    }

    if (!(semester.avgPoint.scale10 && semester.avgPoint.scale4)) {
      continue;
    }

    semesterAvg.unshift({
      title: semester.title,
      scale10: semester.avgPoint.scale10,
      scale4: semester.avgPoint.scale4
    });

    sum10 += semester.avgPoint.scale10;
    sum4 += semester.avgPoint.scale4;
  }

  const countSemesterValid = countAllSemester - countIgnoreSemester;

  return {
    credit: {
      total: countAllCredit,
      ignore: countIgnoreCredit,
      valid: countAllCredit - countIgnoreCredit
    },
    semester: {
      total: countAllSemester,
      ignore: countIgnoreSemester,
      valid: countSemesterValid,
      avg10: sum10 / countSemesterValid,
      avg4: sum4 / countSemesterValid,
      data: semesterAvg
    },
    subject: {
      total: countAllSubject,
      ignore: countIgnoreSubject,
      valid: countAllSubject - countIgnoreSubject
    },
    character: {
      total: countAllCharacter,
      detail: characterCount
    }
  };
};

export { calculateStatistics };
