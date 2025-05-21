// helpers.js

// Parses a schedule string (e.g., "M/W 7:30-9:00 AM") into an object with day list and start/end times (in minutes)
function parseSchedule(scheduleStr) {
  const dayMatch = scheduleStr.match(/^[A-Za-z\/]+/);
  let days = [];
  if (dayMatch) {
    days = dayMatch[0].split('/');
  }
  const parts = scheduleStr.split(' ');
  let timeStr = "";
  let period = "";
  if (parts.length >= 2) {
    timeStr = parts[1];
  }
  if (parts.length >= 3) {
    period = parts[2];
  }
  const [startTime, endTime] = timeStr.split('-');
  function convertToMinutes(time, period) {
    let [hours, minutes] = time.split(':').map(Number);
    if (period) {
      period = period.toUpperCase();
      if (period === "PM" && hours < 12) hours += 12;
      if (period === "AM" && hours === 12) hours = 0;
    }
    return hours * 60 + minutes;
  }
  const startMinutes = convertToMinutes(startTime, period);
  const endMinutes = convertToMinutes(endTime, period);
  return { days, startMinutes, endMinutes };
}

// Determines whether two schedule strings conflict (overlapping time on a common day)
function schedulesConflict(scheduleStr1, scheduleStr2) {
  const sch1 = parseSchedule(scheduleStr1);
  const sch2 = parseSchedule(scheduleStr2);
  const commonDays = sch1.days.filter(day => sch2.days.includes(day));
  if (commonDays.length === 0) return false;
  return sch1.startMinutes < sch2.endMinutes && sch2.startMinutes < sch1.endMinutes;
}

// Capitalize the first letter of a word.
function capitalize(word) {
  if (!word) return "";
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

module.exports = { parseSchedule, schedulesConflict, capitalize };
