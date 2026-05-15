const { callAIStructured, trackTokenUsage } = require('./aiClient');

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const DEFAULT_PERIODS = [
  { period: 1, startTime: '08:00', endTime: '08:40' },
  { period: 2, startTime: '08:40', endTime: '09:20' },
  { period: 3, startTime: '09:20', endTime: '10:00' },
  { period: 4, startTime: '10:20', endTime: '11:00' },
  { period: 5, startTime: '11:00', endTime: '11:40' },
  { period: 6, startTime: '11:40', endTime: '12:20' },
  { period: 7, startTime: '13:00', endTime: '13:40' },
  { period: 8, startTime: '13:40', endTime: '14:20' },
];

const detectClashes = (slots) => {
  const clashes = [];
  const teacherSchedule = {};

  for (const slot of slots) {
    if (!slot.teacher) continue;
    const teacherId = slot.teacher.toString();
    const key = `${teacherId}:${slot.day}:${slot.period}`;
    if (teacherSchedule[key]) {
      clashes.push({
        teacher: teacherId,
        day: slot.day,
        period: slot.period,
        conflict: [teacherSchedule[key], slot]
      });
    } else {
      teacherSchedule[key] = slot;
    }
  }
  return clashes;
};

const generateTimetable = async ({ classId, className, term, subjects, periodsPerDay = 8, schoolName }, schoolId) => {
  const subjectList = subjects.map(s => ({
    id: s._id?.toString() || s.id,
    name: s.name,
    teacher: s.teacher?.name || s.teacherName || 'TBD',
    teacherId: s.teacher?._id?.toString() || s.teacherId,
    periodsPerWeek: s.periodsPerWeek || 4
  }));

  const userPrompt = `Generate a weekly school timetable for a Nigerian secondary school class.

Return this exact JSON:
{
  "slots": [
    {
      "day": "Monday|Tuesday|Wednesday|Thursday|Friday",
      "period": number,
      "startTime": "HH:MM",
      "endTime": "HH:MM",
      "subjectId": "string",
      "subjectName": "string",
      "teacherId": "string",
      "teacherName": "string"
    }
  ]
}

Parameters:
- Class: ${className}
- Term: ${term}
- School: ${schoolName || 'Nigerian School'}
- Periods per day: ${periodsPerDay}
- Subjects and required periods per week:
${subjectList.map(s => `  ${s.name} (${s.periodsPerWeek} periods/week, Teacher: ${s.teacher})`).join('\n')}

Rules:
1. No teacher double-booked in the same period on the same day
2. Core subjects (Math, English) must appear at least 5 times per week
3. Period 3 on Mondays is typically Assembly (skip if not applicable)
4. Spread subjects evenly across the week
5. Use the period times: ${JSON.stringify(DEFAULT_PERIODS)}`;

  const result = await callAIStructured(null, userPrompt, { maxTokens: 3000 });
  await trackTokenUsage(schoolId, result.tokens);

  const rawSlots = result.data?.slots || [];
  const mappedSlots = rawSlots.map(slot => {
    const subject = subjectList.find(s => s.name === slot.subjectName || s.id === slot.subjectId);
    const periodDef = DEFAULT_PERIODS.find(p => p.period === slot.period) || {};
    return {
      day: slot.day,
      period: slot.period,
      startTime: slot.startTime || periodDef.startTime,
      endTime: slot.endTime || periodDef.endTime,
      subject: subject?.id || slot.subjectId,
      teacher: subject?.teacherId || slot.teacherId,
    };
  });

  const clashes = detectClashes(mappedSlots);
  return { slots: mappedSlots, clashes, aiGenerated: true };
};

module.exports = { generateTimetable, detectClashes, DEFAULT_PERIODS, DAYS };
