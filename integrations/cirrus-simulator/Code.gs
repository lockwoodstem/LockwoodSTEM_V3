const CONFIG = {
  TIME_ZONE: Session.getScriptTimeZone() || 'America/New_York',
  SLOT_MINUTES: 30,
  DAYS_AHEAD: 60,
  MAX_ACTIVE_RESERVATIONS_PER_STUDENT: 1
};

function doGet(e) {
  ensureSheets_();
  const template = HtmlService.createTemplateFromFile('Index');
  template.initialEmail = (e && e.parameter && e.parameter.email) || '';
  return template.evaluate()
    .setTitle('Cirrus G7 Simulator Reservations')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getReservationOptions(email) {
  ensureSheets_();

  const status = getStudentStatus(email);
  if (!status.ok) return status;

  const now = new Date();
  const horizon = new Date(now.getTime() + CONFIG.DAYS_AHEAD * 86400000);
  const reservations = activeReservations_();
  const blackoutKeys = blackoutDateKeys_();
  const instructorSessions = instructorLedSessions_(now, horizon, blackoutKeys, reservations);

  const freeFlightSlots = buildFreeFlightSlots_(
    now,
    horizon,
    reservations,
    blackoutKeys,
    instructorSessions
  );

  return {
    ok: true,
    orientationComplete: status.orientationComplete,
    orientationRequired: !status.orientationComplete,
    studentName: status.studentName || '',
    freeFlightSlots,
    instructorLedSlots: instructorSessions.map(s => ({
      key: s.key,
      dateLabel: s.dateLabel,
      timeLabel: s.timeLabel,
      title: s.title,
      note: s.note || ''
    }))
  };
}

function getStudentStatus(email) {
  ensureSheets_();
  email = normalizeEmail_(email);

  if (!email) {
    return {ok:false,message:'Enter your school email.'};
  }

  const students = sheet_('Students').getDataRange().getValues();

  for (let i = 1; i < students.length; i++) {
    if (normalizeEmail_(students[i][0]) === email) {
      return {
        ok: true,
        email,
        orientationComplete:
          String(students[i][2]).toLowerCase() === 'true',
        studentName: students[i][1] || ''
      };
    }
  }

  return {
    ok:true,
    email,
    orientationComplete:false,
    studentName:''
  };
}

function buildFreeFlightSlots_(now,horizon,reservations,blackoutKeys,instructorSessions) {
  const slotMap = {};

  const oneTime = sheet_('Availability').getDataRange().getValues();

  for (let i = 1; i < oneTime.length; i++) {
    const [dateValue,startValue,endValue,enabled,note] = oneTime[i];

    if (!isTruthy_(enabled) || !dateValue || !startValue || !endValue) continue;

    const day = dateOnly_(dateValue);
    if (!day || blackoutKeys.has(dateKey_(day))) continue;

    addFreeFlightWindow_(
      slotMap,
      day,
      startValue,
      endValue,
      note,
      now,
      horizon,
      reservations,
      instructorSessions
    );
  }

  const recurring = sheet_('Recurring Availability').getDataRange().getValues();

  for (let i = 1; i < recurring.length; i++) {
    const [
      weekday,
      startValue,
      endValue,
      startDateValue,
      endDateValue,
      enabled,
      note
    ] = recurring[i];

    if (
      !isTruthy_(enabled) ||
      !weekday ||
      !startValue ||
      !endValue ||
      !startDateValue ||
      !endDateValue
    ) continue;

    const ruleStart = dateOnly_(startDateValue);
    const ruleEnd = dateOnly_(endDateValue);

    if (!ruleStart || !ruleEnd || ruleEnd < ruleStart) continue;

    const searchStart = maxDate_(dateOnly_(now), ruleStart);
    const searchEnd = minDate_(dateOnly_(horizon), ruleEnd);

    for (
      let day = new Date(searchStart);
      day <= searchEnd;
      day.setDate(day.getDate() + 1)
    ) {
      const currentDay = new Date(day);

      if (weekdayName_(currentDay) !== String(weekday).trim()) continue;
      if (blackoutKeys.has(dateKey_(currentDay))) continue;

      addFreeFlightWindow_(
        slotMap,
        currentDay,
        startValue,
        endValue,
        note,
        now,
        horizon,
        reservations,
        instructorSessions
      );
    }
  }

  return Object.values(slotMap)
    .sort((a,b) => a.key.localeCompare(b.key));
}

function addFreeFlightWindow_(
  slotMap,
  day,
  startValue,
  endValue,
  note,
  now,
  horizon,
  reservations,
  instructorSessions
) {
  let start = combineDateTime_(day,startValue);
  const windowEnd = combineDateTime_(day,endValue);

  if (!start || !windowEnd || windowEnd <= start) return;

  while (
    start.getTime() + CONFIG.SLOT_MINUTES * 60000 <=
    windowEnd.getTime()
  ) {
    const end = new Date(
      start.getTime() + CONFIG.SLOT_MINUTES * 60000
    );

    if (
      start > now &&
      start <= horizon &&
      !overlapsReservations_(start,end,reservations) &&
      !overlapsInstructorSessions_(start,end,instructorSessions)
    ) {
      const key = Utilities.formatDate(
        start,
        CONFIG.TIME_ZONE,
        "yyyy-MM-dd'T'HH:mm:ss"
      );

      if (!slotMap[key]) {
        slotMap[key] = {
          key,
          dateLabel:
            Utilities.formatDate(start,CONFIG.TIME_ZONE,'EEE, MMM d'),
          timeLabel:
            Utilities.formatDate(start,CONFIG.TIME_ZONE,'h:mm a') +
            ' – ' +
            Utilities.formatDate(end,CONFIG.TIME_ZONE,'h:mm a'),
          note: note || ''
        };
      }
    }

    start = end;
  }
}

function instructorLedSessions_(now,horizon,blackoutKeys,reservations) {
  const values =
    sheet_('Instructor Led Sessions').getDataRange().getValues();

  const sessions = [];

  for (let i = 1; i < values.length; i++) {
    const [
      dateValue,
      startValue,
      endValue,
      title,
      enabled,
      note
    ] = values[i];

    if (
      !isTruthy_(enabled) ||
      !dateValue ||
      !startValue ||
      !endValue
    ) continue;

    const day = dateOnly_(dateValue);
    if (!day || blackoutKeys.has(dateKey_(day))) continue;

    const start = combineDateTime_(day,startValue);
    const end = combineDateTime_(day,endValue);

    if (!start || !end || end <= start) continue;
    if (start <= now || start > horizon) continue;
    if (overlapsReservations_(start,end,reservations)) continue;

    const key =
      Utilities.formatDate(
        start,
        CONFIG.TIME_ZONE,
        "yyyy-MM-dd'T'HH:mm:ss"
      ) +
      '|IL|' +
      i;

    sessions.push({
      key,
      start,
      end,
      title: String(title || 'Instructor-Led Session').trim(),
      note: note || '',
      dateLabel:
        Utilities.formatDate(start,CONFIG.TIME_ZONE,'EEE, MMM d'),
      timeLabel:
        Utilities.formatDate(start,CONFIG.TIME_ZONE,'h:mm a') +
        ' – ' +
        Utilities.formatDate(end,CONFIG.TIME_ZONE,'h:mm a')
    });
  }

  sessions.sort((a,b) => a.start - b.start);
  return sessions;
}

function bookSlot(form) {
  ensureSheets_();

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const name = String(form.name || '').trim();
    const email = normalizeEmail_(form.email);
    const requestedType = String(form.sessionType || '').trim();
    const slotKey = String(form.slotKey || '').trim();

    if (!name || !email || !slotKey) {
      return {
        ok:false,
        message:'Name, email, and time are required.'
      };
    }

    const settings = settings_();
    const domain =
      String(settings.AllowedEmailDomain || '').trim().toLowerCase();

    if (domain && !email.endsWith('@' + domain)) {
      return {
        ok:false,
        message:'Please use your approved school email address.'
      };
    }

    if (
      countActiveForEmail_(email) >=
      CONFIG.MAX_ACTIVE_RESERVATIONS_PER_STUDENT
    ) {
      return {
        ok:false,
        message:
          'You already have an active simulator reservation. Cancel or complete it before reserving another time.'
      };
    }

    const studentStatus = getStudentStatus(email);
    const options = getReservationOptions(email);

    if (!options.ok) return options;

    let sessionType;
    let selected;
    let start;
    let end;
    let notes = '';

    if (!studentStatus.orientationComplete) {
      sessionType = 'Orientation';

      selected =
        options.freeFlightSlots.find(s => s.key === slotKey);

      if (!selected) {
        return {
          ok:false,
          message:
            'First-time users must reserve an Orientation during a standard available time.'
        };
      }

      start = new Date(selected.key);
      end = new Date(
        start.getTime() + CONFIG.SLOT_MINUTES * 60000
      );

    } else if (requestedType === 'Instructor-Led Session') {
      sessionType = 'Instructor-Led Session';

      selected =
        instructorLedSessions_(
          new Date(),
          new Date(
            Date.now() + CONFIG.DAYS_AHEAD * 86400000
          ),
          blackoutDateKeys_(),
          activeReservations_()
        ).find(s => s.key === slotKey);

      if (!selected) {
        return {
          ok:false,
          message:
            'That instructor-led session is no longer available.'
        };
      }

      start = selected.start;
      end = selected.end;
      notes = selected.title;

    } else {
      sessionType = 'Free Flight';

      selected =
        options.freeFlightSlots.find(s => s.key === slotKey);

      if (!selected) {
        return {
          ok:false,
          message:
            'That Free Flight time is no longer available.'
        };
      }

      start = new Date(selected.key);
      end = new Date(
        start.getTime() + CONFIG.SLOT_MINUTES * 60000
      );
    }

    const id =
      'SIM-' +
      Utilities.getUuid().slice(0,8).toUpperCase();

    sheet_('Reservations').appendRow([
      new Date(),
      id,
      start,
      end,
      name,
      email,
      sessionType,
      'Confirmed',
      notes
    ]);

    upsertStudent_(email,name);

    return {
      ok:true,
      reservationId:id,
      sessionType,
      sessionTitle:notes,
      dateLabel:
        Utilities.formatDate(
          start,
          CONFIG.TIME_ZONE,
          'EEEE, MMMM d, yyyy'
        ),
      timeLabel:
        Utilities.formatDate(
          start,
          CONFIG.TIME_ZONE,
          'h:mm a'
        ) +
        ' – ' +
        Utilities.formatDate(
          end,
          CONFIG.TIME_ZONE,
          'h:mm a'
        )
    };

  } finally {
    lock.releaseLock();
  }
}

function cancelReservation(email,reservationId) {
  ensureSheets_();

  email = normalizeEmail_(email);
  reservationId =
    String(reservationId || '').trim().toUpperCase();

  const sh = sheet_('Reservations');
  const values = sh.getDataRange().getValues();

  for (let i = 1; i < values.length; i++) {
    if (
      String(values[i][1]).toUpperCase() === reservationId &&
      normalizeEmail_(values[i][5]) === email &&
      String(values[i][7]).toLowerCase() === 'confirmed'
    ) {
      sh.getRange(i + 1,8).setValue('Cancelled');

      return {
        ok:true,
        message:'Your reservation has been cancelled.'
      };
    }
  }

  return {
    ok:false,
    message:'No matching active reservation was found.'
  };
}

function markOrientationComplete(email) {
  ensureSheets_();

  email = normalizeEmail_(email);

  const sh = sheet_('Students');
  const values = sh.getDataRange().getValues();

  for (let i = 1; i < values.length; i++) {
    if (normalizeEmail_(values[i][0]) === email) {
      sh.getRange(i + 1,3).setValue(true);
      sh.getRange(i + 1,4).setValue(new Date());
      return;
    }
  }

  sh.appendRow([
    email,
    '',
    true,
    new Date()
  ]);
}

function blackoutDateKeys_() {
  const values =
    sheet_('Blackout Dates').getDataRange().getValues();

  const keys = new Set();

  for (let i = 1; i < values.length; i++) {
    const [dateValue,enabled] = values[i];

    if (!isTruthy_(enabled) || !dateValue) continue;

    const day = dateOnly_(dateValue);

    if (day) {
      keys.add(dateKey_(day));
    }
  }

  return keys;
}

function activeReservations_() {
  return sheet_('Reservations')
    .getDataRange()
    .getValues()
    .slice(1)
    .filter(
      r =>
        String(r[7]).toLowerCase() === 'confirmed'
    );
}

function overlapsReservations_(start,end,reservations) {
  return reservations.some(r => {
    const rStart =
      r[2] instanceof Date ? r[2] : new Date(r[2]);

    const rEnd =
      r[3] instanceof Date ? r[3] : new Date(r[3]);

    if (!rStart || !rEnd) return false;

    return start < rEnd && end > rStart;
  });
}

function overlapsInstructorSessions_(start,end,sessions) {
  return sessions.some(
    s => start < s.end && end > s.start
  );
}

function countActiveForEmail_(email) {
  return activeReservations_()
    .filter(
      r => normalizeEmail_(r[5]) === email
    )
    .length;
}

function upsertStudent_(email,name) {
  const sh = sheet_('Students');
  const values = sh.getDataRange().getValues();

  for (let i = 1; i < values.length; i++) {
    if (normalizeEmail_(values[i][0]) === email) {
      if (!values[i][1] && name) {
        sh.getRange(i + 1,2).setValue(name);
      }
      return;
    }
  }

  sh.appendRow([
    email,
    name,
    false,
    ''
  ]);
}

function ensureSheets_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const specs = {
    Availability:
      ['Date','Start Time','End Time','Enabled','Note'],

    'Recurring Availability':
      ['Day','Start Time','End Time','Start Date','End Date','Enabled','Note'],

    'Blackout Dates':
      ['Date','Enabled','Note'],

    'Instructor Led Sessions':
      ['Date','Start Time','End Time','Session Title','Enabled','Note'],

    Students:
      ['Email','Student Name','Orientation Complete','Orientation Completed On'],

    Reservations:
      ['Created','Reservation ID','Start','End','Student Name','Student Email','Session Type','Status','Notes'],

    Settings:
      ['Key','Value']
  };

  Object.keys(specs).forEach(name => {
    let sh = ss.getSheetByName(name);

    if (!sh) {
      sh = ss.insertSheet(name);
    }

    if (sh.getLastRow() === 0) {
      sh.appendRow(specs[name]);
    }

    sh.setFrozenRows(1);
  });
}

function sheet_(name) {
  return SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName(name);
}

function settings_() {
  const rows =
    sheet_('Settings')
      .getDataRange()
      .getValues();

  const out = {};

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0]) {
      out[String(rows[i][0])] = rows[i][1];
    }
  }

  return out;
}

function normalizeEmail_(value) {
  return String(value || '').trim().toLowerCase();
}

function isTruthy_(value) {
  return (
    value === true ||
    String(value).toLowerCase() === 'true' ||
    String(value).toLowerCase() === 'yes' ||
    String(value) === '1'
  );
}

function dateOnly_(value) {
  const d =
    value instanceof Date
      ? new Date(value)
      : new Date(value);

  if (isNaN(d)) return null;

  return new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate()
  );
}

function combineDateTime_(date,timeValue) {
  if (!date) return null;

  let h = 0;
  let m = 0;

  if (timeValue instanceof Date) {
    h = timeValue.getHours();
    m = timeValue.getMinutes();

  } else {
    const text =
      String(timeValue).trim();

    let match =
      text.match(
        /^(\d{1,2}):(\d{2})$/
      );

    if (match) {
      h = Number(match[1]);
      m = Number(match[2]);

    } else {
      match =
        text.match(
          /^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i
        );

      if (!match) return null;

      h = Number(match[1]) % 12;
      m = Number(match[2] || 0);

      if (
        match[3].toUpperCase() === 'PM'
      ) {
        h += 12;
      }
    }
  }

  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    h,
    m,
    0,
    0
  );
}

function weekdayName_(date) {
  return [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
  ][date.getDay()];
}

function dateKey_(date) {
  return Utilities.formatDate(
    date,
    CONFIG.TIME_ZONE,
    'yyyy-MM-dd'
  );
}

function maxDate_(a,b) {
  return a > b ? a : b;
}

function minDate_(a,b) {
  return a < b ? a : b;
}