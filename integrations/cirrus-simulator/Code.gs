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

function include_(name) {
  return HtmlService.createHtmlOutputFromFile(name).getContent();
}

function getStudentStatus(email) {
  ensureSheets_();
  email = normalizeEmail_(email);
  if (!email) return { ok:false, message:'Enter your school email.' };

  const students = sheet_('Students').getDataRange().getValues();
  for (let i = 1; i < students.length; i++) {
    if (normalizeEmail_(students[i][0]) === email) {
      return {
        ok:true,
        email,
        orientationComplete: String(students[i][2]).toLowerCase() === 'true',
        studentName: students[i][1] || ''
      };
    }
  }
  return { ok:true, email, orientationComplete:false, studentName:'' };
}

function getAvailableSlots(email) {
  ensureSheets_();
  const status = getStudentStatus(email);
  if (!status.ok) return status;

  const now = new Date();
  const endDate = new Date(now.getTime() + CONFIG.DAYS_AHEAD * 86400000);
  const availability = sheet_('Availability').getDataRange().getValues();
  const reservations = activeReservations_();
  const slots = [];

  for (let i = 1; i < availability.length; i++) {
    const [dateValue,startValue,endValue,enabled,note] = availability[i];
    if (!isTruthy_(enabled) || !dateValue || !startValue || !endValue) continue;

    const day = dateOnly_(dateValue);
    let start = combineDateTime_(day,startValue);
    const end = combineDateTime_(day,endValue);
    if (!start || !end || end <= start) continue;

    while (start.getTime() + CONFIG.SLOT_MINUTES * 60000 <= end.getTime()) {
      const slotEnd = new Date(start.getTime() + CONFIG.SLOT_MINUTES * 60000);
      if (start > now && start <= endDate && !isReserved_(start,reservations)) {
        slots.push({
          key: Utilities.formatDate(start, CONFIG.TIME_ZONE, "yyyy-MM-dd'T'HH:mm:ss"),
          dateLabel: Utilities.formatDate(start, CONFIG.TIME_ZONE, 'EEE, MMM d'),
          timeLabel: Utilities.formatDate(start, CONFIG.TIME_ZONE, 'h:mm a') + ' – ' + Utilities.formatDate(slotEnd, CONFIG.TIME_ZONE, 'h:mm a'),
          note: note || ''
        });
      }
      start = slotEnd;
    }
  }

  slots.sort((a,b) => a.key.localeCompare(b.key));
  return {
    ok:true,
    orientationComplete:status.orientationComplete,
    sessionType: status.orientationComplete ? 'Simulator Session' : 'Orientation',
    slots
  };
}

function bookSlot(form) {
  ensureSheets_();
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const name = String(form.name || '').trim();
    const email = normalizeEmail_(form.email);
    const slotKey = String(form.slotKey || '').trim();
    if (!name || !email || !slotKey) return {ok:false,message:'Name, email, and time are required.'};

    const settings = settings_();
    const domain = String(settings.AllowedEmailDomain || '').trim().toLowerCase();
    if (domain && !email.endsWith('@' + domain)) {
      return {ok:false,message:'Please use your approved school email address.'};
    }

    const studentStatus = getStudentStatus(email);
    const sessionType = studentStatus.orientationComplete ? 'Simulator Session' : 'Orientation';

    if (countActiveForEmail_(email) >= CONFIG.MAX_ACTIVE_RESERVATIONS_PER_STUDENT) {
      return {ok:false,message:'You already have an active simulator reservation. Cancel or complete it before reserving another time.'};
    }

    const slots = getAvailableSlots(email);
    if (!slots.ok || !slots.slots.some(s => s.key === slotKey)) {
      return {ok:false,message:'That time is no longer available. Choose another slot.'};
    }

    const start = new Date(slotKey);
    const end = new Date(start.getTime() + CONFIG.SLOT_MINUTES * 60000);
    const id = 'SIM-' + Utilities.getUuid().slice(0,8).toUpperCase();

    sheet_('Reservations').appendRow([
      new Date(), id, start, end, name, email, sessionType, 'Confirmed', ''
    ]);

    upsertStudent_(email,name);

    return {
      ok:true,
      reservationId:id,
      sessionType,
      dateLabel:Utilities.formatDate(start,CONFIG.TIME_ZONE,'EEEE, MMMM d, yyyy'),
      timeLabel:Utilities.formatDate(start,CONFIG.TIME_ZONE,'h:mm a') + ' – ' + Utilities.formatDate(end,CONFIG.TIME_ZONE,'h:mm a')
    };
  } finally {
    lock.releaseLock();
  }
}

function cancelReservation(email,reservationId) {
  ensureSheets_();
  email = normalizeEmail_(email);
  reservationId = String(reservationId || '').trim().toUpperCase();
  const sh = sheet_('Reservations');
  const values = sh.getDataRange().getValues();

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][1]).toUpperCase() === reservationId &&
        normalizeEmail_(values[i][5]) === email &&
        String(values[i][7]).toLowerCase() === 'confirmed') {
      sh.getRange(i+1,8).setValue('Cancelled');
      return {ok:true,message:'Your reservation has been cancelled.'};
    }
  }
  return {ok:false,message:'No matching active reservation was found.'};
}

function markOrientationComplete(email) {
  // Teacher utility: run manually from Apps Script or update Students column C to TRUE.
  ensureSheets_();
  email = normalizeEmail_(email);
  const sh = sheet_('Students');
  const values = sh.getDataRange().getValues();
  for (let i=1;i<values.length;i++) {
    if (normalizeEmail_(values[i][0]) === email) {
      sh.getRange(i+1,3).setValue(true);
      sh.getRange(i+1,4).setValue(new Date());
      return;
    }
  }
  sh.appendRow([email,'',true,new Date()]);
}

function ensureSheets_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const specs = {
    Availability:['Date','Start Time','End Time','Enabled','Note'],
    Students:['Email','Student Name','Orientation Complete','Orientation Completed On'],
    Reservations:['Created','Reservation ID','Start','End','Student Name','Student Email','Session Type','Status','Notes'],
    Settings:['Key','Value']
  };
  Object.keys(specs).forEach(name => {
    let sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name);
    if (sh.getLastRow() === 0) sh.appendRow(specs[name]);
    sh.setFrozenRows(1);
  });

  const settings = sheet_('Settings');
  if (settings.getLastRow() === 1) {
    settings.getRange(2,1,3,2).setValues([
      ['AllowedEmailDomain',''],
      ['TimeZone','America/New_York'],
      ['Instructions','Enter availability windows on the Availability tab. Students see 30-minute slots generated from those windows.']
    ]);
  }
}

function sheet_(name) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
}

function settings_() {
  const rows = sheet_('Settings').getDataRange().getValues();
  const out = {};
  for (let i=1;i<rows.length;i++) if (rows[i][0]) out[String(rows[i][0])] = rows[i][1];
  return out;
}

function activeReservations_() {
  const values = sheet_('Reservations').getDataRange().getValues();
  return values.slice(1).filter(r => String(r[7]).toLowerCase() === 'confirmed');
}

function isReserved_(start,reservations) {
  return reservations.some(r => {
    const d = r[2] instanceof Date ? r[2] : new Date(r[2]);
    return d && d.getTime() === start.getTime();
  });
}

function countActiveForEmail_(email) {
  return activeReservations_().filter(r => normalizeEmail_(r[5]) === email).length;
}

function upsertStudent_(email,name) {
  const sh = sheet_('Students');
  const values = sh.getDataRange().getValues();
  for (let i=1;i<values.length;i++) {
    if (normalizeEmail_(values[i][0]) === email) {
      if (!values[i][1] && name) sh.getRange(i+1,2).setValue(name);
      return;
    }
  }
  sh.appendRow([email,name,false,'']);
}

function normalizeEmail_(value) {
  return String(value || '').trim().toLowerCase();
}

function isTruthy_(value) {
  return value === true || String(value).toLowerCase() === 'true' || String(value).toLowerCase() === 'yes' || String(value) === '1';
}

function dateOnly_(value) {
  const d = value instanceof Date ? new Date(value) : new Date(value);
  if (isNaN(d)) return null;
  return new Date(d.getFullYear(),d.getMonth(),d.getDate());
}

function combineDateTime_(date,timeValue) {
  if (!date) return null;
  let h=0,m=0;
  if (timeValue instanceof Date) {
    h=timeValue.getHours(); m=timeValue.getMinutes();
  } else {
    const match=String(timeValue).match(/(\d{1,2}):(\d{2})/);
    if (!match) return null;
    h=Number(match[1]); m=Number(match[2]);
  }
  return new Date(date.getFullYear(),date.getMonth(),date.getDate(),h,m,0,0);
}