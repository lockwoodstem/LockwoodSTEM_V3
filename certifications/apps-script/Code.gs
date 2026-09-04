/**
 * LockwoodSTEM Certification Account Backend
 *
 * Deploy as a Google Apps Script Web App:
 * - Execute as: Me
 * - Who has access: Anyone
 *
 * Then paste the /exec Web App URL into:
 * certifications/auth-config.js
 *
 * Required Script Properties:
 * - AUTH_SECRET: a long random authentication secret
 * - TEACHER_SETUP_CODE: a private code used to create additional teacher accounts
 * - DEFAULT_TEACHER_TEMP_PASSWORD: one-time temporary password consumed by setup()
 *   when provisioning the default Teacher Admin account. The property is deleted
 *   automatically after the account is created.
 */

const SERVER_VERSION = '2026-08-23-teacher-approved-reset-v1';

const DEFAULT_TEACHER_ACCOUNT = {
  firstName: 'Jonathan',
  lastName: 'Lockwood',
  email: 'jlockwood@cornerstonecharter.com',
  teacherId: 'JLOCKWOOD',
  period: 'Teacher',
  role: 'teacher_admin',
  status: 'active',
  mustChangePassword: true
};

const SHEET_USERS = 'Users';
const SHEET_SESSIONS = 'Sessions';
const SHEET_CERTIFICATIONS = 'Certifications';
const SHEET_HANDS_ON = 'HandsOn';
const SHEET_PASSWORD_RESETS = 'PasswordResets'; // Legacy email-reset sheet; retained for compatibility only.
const SHEET_PASSWORD_RESET_REQUESTS = 'PasswordResetRequests';

function doGet() {
  return json_({
    ok: true,
    message: 'LockwoodSTEM Certification Account Backend is running.',
    serverVersion: SERVER_VERSION
  });
}


function setup() {
  setup_();
  const result = ensureDefaultTeacherAccount_();
  return 'LockwoodSTEM certification account sheets created. ' + result.message;
}

function promoteTeacherAccount() {
  setup_();
  const teacherEmail = PropertiesService.getScriptProperties().getProperty('TEACHER_EMAIL') || DEFAULT_TEACHER_ACCOUNT.email;
  const found = findUser_(teacherEmail, teacherEmail);
  if (!found) {
    return 'No user account found for ' + teacherEmail + '. Create the account first or set TEACHER_EMAIL in Script Properties.';
  }
  const users = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_USERS);
  users.getRange(found.row, 3).setValue(new Date().toISOString());
  users.getRange(found.row, 11).setValue('teacher_admin');
  users.getRange(found.row, 12).setValue('active');
  return 'Teacher Admin role assigned to ' + teacherEmail;
}

function diagnoseTeacherAccount() {
  setup_();
  const found = findUser_(DEFAULT_TEACHER_ACCOUNT.email, DEFAULT_TEACHER_ACCOUNT.teacherId);
  if (!found) {
    return JSON.stringify({
      serverVersion: SERVER_VERSION,
      found: false,
      email: DEFAULT_TEACHER_ACCOUNT.email,
      spreadsheetId: SpreadsheetApp.getActiveSpreadsheet().getId()
    }, null, 2);
  }
  ensureDefaultTeacherRoleForFound_(found);
  return JSON.stringify({
    serverVersion: SERVER_VERSION,
    found: true,
    email: found.user.email,
    teacherId: found.user.studentId,
    role: found.user.role,
    status: found.user.status,
    mustChangePassword: found.user.mustChangePassword,
    spreadsheetId: SpreadsheetApp.getActiveSpreadsheet().getId()
  }, null, 2);
}


function doPost(e) {
  try {
    setup_();

    const payload = JSON.parse(e.postData && e.postData.contents ? e.postData.contents : '{}');
    const action = String(payload.action || '').toLowerCase();

    if (action === 'register') return register_(payload);
    if (action === 'registerteacher') return registerTeacher_(payload);
    if (action === 'login') return login_(payload);
    if (action === 'validate') return validate_(payload);
    if (action === 'logout') return logout_(payload);
    if (action === 'changepassword') return changePassword_(payload);
    if (action === 'requestpasswordreset') return requestPasswordReset_(payload);
    if (action === 'forgotpassword') return requestPasswordReset_(payload); // Supports cached older login pages without sending email.
    if (action === 'approvepasswordreset') return approvePasswordReset_(payload);
    if (action === 'dismisspasswordreset') return dismissPasswordReset_(payload);
    if (action === 'teacherinitiatepasswordreset') return teacherInitiatePasswordReset_(payload);
    if (action === 'resetpasswordwithcode') return resetPasswordWithCode_(payload);
    if (action === 'resetpassword') return json_({ ok: false, error: 'Email reset links are no longer used. Enter the teacher-approved reset code instead.' });
    if (action === 'submitcertification') return submitCertification_(payload);
    if (action === 'getcertificationstatus') return getCertificationStatus_(payload);
    if (action === 'getallcertificationstatuses') return getAllCertificationStatuses_(payload);
    if (action === 'sethandsoncompletion') return setHandsOnCompletion_(payload);
    if (action === 'getteacherdashboard') return getTeacherDashboard_(payload);
    if (action === 'getserverinfo') return json_({ ok: true, serverVersion: SERVER_VERSION });

    return json_({ ok: false, error: 'Unknown account action.' });
  } catch (err) {
    return json_({ ok: false, error: err.message || String(err) });
  }
}

function setup_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  let users = ss.getSheetByName(SHEET_USERS);
  if (!users) {
    users = ss.insertSheet(SHEET_USERS);
    users.appendRow([
      'userId', 'createdAt', 'updatedAt', 'firstName', 'lastName',
      'email', 'studentId', 'period', 'passwordSalt', 'passwordHash',
      'role', 'status', 'lastLogin', 'mustChangePassword', 'passwordChangedAt'
    ]);
    users.setFrozenRows(1);
  } else {
    ensureUserSheetColumns_(users);
  }

  let sessions = ss.getSheetByName(SHEET_SESSIONS);
  if (!sessions) {
    sessions = ss.insertSheet(SHEET_SESSIONS);
    sessions.appendRow([
      'token', 'userId', 'createdAt', 'expiresAt', 'revokedAt'
    ]);
    sessions.setFrozenRows(1);
  }

  let certs = ss.getSheetByName(SHEET_CERTIFICATIONS);
  if (!certs) {
    certs = ss.insertSheet(SHEET_CERTIFICATIONS);
    certs.appendRow([
      'attemptId', 'timestamp', 'userId', 'firstName', 'lastName', 'email',
      'studentId', 'period', 'certId', 'certName', 'scorePercent',
      'correct', 'total', 'passed', 'answersJson'
    ]);
    certs.setFrozenRows(1);
  }

  let handsOn = ss.getSheetByName(SHEET_HANDS_ON);
  if (!handsOn) {
    handsOn = ss.insertSheet(SHEET_HANDS_ON);
    handsOn.appendRow([
      'recordId', 'timestamp', 'teacherUserId', 'teacherName',
      'studentUserId', 'certId', 'completed', 'notes'
    ]);
    handsOn.setFrozenRows(1);
  }

  let passwordResets = ss.getSheetByName(SHEET_PASSWORD_RESETS);
  if (!passwordResets) {
    passwordResets = ss.insertSheet(SHEET_PASSWORD_RESETS);
    passwordResets.appendRow([
      'resetId', 'createdAt', 'userId', 'email', 'tokenHash',
      'expiresAt', 'usedAt', 'requestedIdentifier'
    ]);
    passwordResets.setFrozenRows(1);
  }

  let resetRequests = ss.getSheetByName(SHEET_PASSWORD_RESET_REQUESTS);
  if (!resetRequests) {
    resetRequests = ss.insertSheet(SHEET_PASSWORD_RESET_REQUESTS);
    resetRequests.appendRow([
      'requestId', 'requestedAt', 'userId', 'firstName', 'lastName',
      'email', 'studentId', 'period', 'requestedIdentifier', 'status',
      'approvedAt', 'approvedByUserId', 'approvedByName', 'codeHash',
      'expiresAt', 'usedAt', 'attempts', 'dismissedAt'
    ]);
    resetRequests.setFrozenRows(1);
  }
}

function register_(payload) {
  const firstName = clean_(payload.firstName);
  const lastName = clean_(payload.lastName);
  const email = clean_(payload.email).toLowerCase();
  const studentId = clean_(payload.studentId);
  const period = clean_(payload.period);
  const password = String(payload.password || '');

  if (!firstName || !lastName || !email || !studentId || !period || !password) {
    return json_({ ok: false, error: 'All account fields are required.' });
  }
  if (password.length < 8) {
    return json_({ ok: false, error: 'Password must be at least 8 characters.' });
  }

  const users = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_USERS);
  const existing = findUser_(email, studentId);
  if (existing) {
    return json_({ ok: false, error: 'An account already exists for that email or student ID.' });
  }

  const userId = Utilities.getUuid();
  const salt = Utilities.getUuid();
  const hash = hashPassword_(password, salt);
  const now = new Date().toISOString();

  users.appendRow([
    userId, now, now, firstName, lastName, email, studentId, period,
    salt, hash, 'student', 'active', '', false, ''
  ]);

  const user = publicUser_({
    userId, firstName, lastName, email, studentId, period,
    role: 'student', status: 'active'
  });

  const session = createSession_(userId);
  return json_({
    ok: true,
    token: session.token,
    expiresAt: session.expiresAt,
    user
  });
}


function registerTeacher_(payload) {
  setup_();

  const firstName = clean_(payload.firstName);
  const lastName = clean_(payload.lastName);
  const email = clean_(payload.email).toLowerCase();
  const teacherId = clean_(payload.teacherId);
  const password = String(payload.password || '');
  const token = clean_(payload.token);
  const suppliedSetupCode = clean_(payload.setupCode);
  const requestedRole = clean_(payload.role).toLowerCase() === 'teacher_admin' ? 'teacher_admin' : 'teacher';

  if (!firstName || !lastName || !email || !teacherId || !password) {
    return json_({ ok: false, error: 'All teacher account fields are required.' });
  }
  if (password.length < 8) {
    return json_({ ok: false, error: 'Password must be at least 8 characters.' });
  }

  let authorizedByTeacher = null;
  if (token) {
    const auth = validateTokenForServer_(token);
    if (auth.ok && isTeacherAdminRole_(auth.user.role) && !auth.user.mustChangePassword) {
      authorizedByTeacher = auth.user;
    }
  }

  const existingTeacherCount = countTeacherAccounts_();
  if (!authorizedByTeacher) {
    const expectedSetupCode = PropertiesService.getScriptProperties().getProperty('TEACHER_SETUP_CODE') || '';
    if (!expectedSetupCode) {
      return json_({
        ok: false,
        error: 'Teacher setup is not configured. Add a TEACHER_SETUP_CODE value in Google Apps Script Project Settings > Script Properties.'
      });
    }
    if (!secureEquals_(suppliedSetupCode, expectedSetupCode)) {
      return json_({ ok: false, error: 'The private teacher setup code is incorrect.' });
    }
    if (existingTeacherCount > 0) {
      return json_({
        ok: false,
        error: 'A teacher account already exists. Sign in as a teacher to create another teacher account.'
      });
    }
  }

  const existing = findUser_(email, teacherId);
  if (existing) {
    return json_({ ok: false, error: 'An account already exists for that email or teacher ID.' });
  }

  const userId = Utilities.getUuid();
  const salt = Utilities.getUuid();
  const hash = hashPassword_(password, salt);
  const now = new Date().toISOString();
  const users = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_USERS);

  users.appendRow([
    userId, now, now, firstName, lastName, email, teacherId, 'Teacher',
    salt, hash, requestedRole, 'active', '', false, ''
  ]);

  const user = publicUser_({
    userId: userId,
    firstName: firstName,
    lastName: lastName,
    email: email,
    studentId: teacherId,
    period: 'Teacher',
    role: requestedRole,
    status: 'active',
    mustChangePassword: false
  });

  if (authorizedByTeacher) {
    return json_({
      ok: true,
      user: user,
      createdBy: publicUser_(authorizedByTeacher)
    });
  }

  const session = createSession_(userId);
  return json_({
    ok: true,
    token: session.token,
    expiresAt: session.expiresAt,
    user: user
  });
}

function login_(payload) {
  const identifier = clean_(payload.identifier).toLowerCase();
  const password = String(payload.password || '');

  if (!identifier || !password) {
    return json_({ ok: false, error: 'Email/student ID and password are required.' });
  }

  const found = findUser_(identifier, identifier);
  if (!found) {
    return json_({ ok: false, error: 'Account not found.' });
  }

  ensureDefaultTeacherRoleForFound_(found);
  const row = found.row;
  const user = found.user;
  if (String(user.status).toLowerCase() !== 'active') {
    return json_({ ok: false, error: 'This account is not active.' });
  }

  const expected = hashPassword_(password, user.passwordSalt);
  if (expected !== user.passwordHash) {
    return json_({ ok: false, error: 'Incorrect password.' });
  }

  const users = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_USERS);
  users.getRange(row, 13).setValue(new Date().toISOString());

  const session = createSession_(user.userId);
  return json_({
    ok: true,
    token: session.token,
    expiresAt: session.expiresAt,
    user: publicUser_(user)
  });
}

function validate_(payload) {
  const token = clean_(payload.token);
  if (!token) return json_({ ok: false, error: 'Missing session token.' });

  const sessions = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_SESSIONS);
  const values = sessions.getDataRange().getValues();
  const now = new Date();

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (String(row[0]) === token) {
      const userId = row[1];
      const expiresAt = new Date(row[3]);
      const revokedAt = row[4];

      if (revokedAt) return json_({ ok: false, error: 'Session has been logged out.' });
      if (expiresAt < now) return json_({ ok: false, error: 'Session has expired.' });

      const found = findUserById_(userId);
      if (!found) return json_({ ok: false, error: 'Account not found.' });
      ensureDefaultTeacherRoleForFound_(found);
      if (String(found.user.status).toLowerCase() !== 'active') {
        return json_({ ok: false, error: 'This account is not active.' });
      }

      return json_({ ok: true, user: publicUser_(found.user) });
    }
  }

  return json_({ ok: false, error: 'Invalid session token.' });
}

function logout_(payload) {
  const token = clean_(payload.token);
  if (!token) return json_({ ok: true });

  const sessions = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_SESSIONS);
  const values = sessions.getDataRange().getValues();

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === token) {
      sessions.getRange(i + 1, 5).setValue(new Date().toISOString());
      break;
    }
  }

  return json_({ ok: true });
}


function submitCertification_(payload) {
  const token = clean_(payload.token);
  const certId = clean_(payload.certId);
  const certName = clean_(payload.certName) || certId;
  const answers = payload.answers || {};

  if (!token) return json_({ ok: false, error: 'Missing session token.' });
  const auth = validateTokenForServer_(token);
  if (!auth.ok) return json_(auth);

  let score;
  if (certId === 'engineering-safety') {
    score = scoreEngineeringSafety_(answers);
  } else if (certId === '3d-printing') {
    score = score3DPrinting_(answers);
  } else if (certId === 'laser-cutting') {
    score = scoreLaserCutting_(answers);
  } else if (certId === 'drill-press') {
    score = scoreDrillPress_(answers);
  } else if (certId === 'hand-cutting-tools') {
    score = scoreHandCuttingTools_(answers);
  } else if (certId === 'soldering') {
    score = scoreSoldering_(answers);
  } else if (certId === 'cnc') {
    score = scoreCNC_(answers);
  } else if (certId === 'technical-sketching') {
    score = scoreTechnicalSketching_(answers);
  } else if (certId === 'engineering-documentation') {
    score = scoreEngineeringDocumentation_(answers);
  } else if (certId === 'fusion-cad-level-1') {
    score = scoreFusionCADLevel1_(answers);
  } else if (certId === 'engineering-drawings') {
    score = scoreEngineeringDrawings_(answers);
  } else if (certId === 'fusion-cad-level-2') {
    score = scoreFusionCADLevel2_(answers);
  } else if (certId === 'design-review') {
    score = scoreDesignReview_(answers);
  } else {
    return json_({ ok: false, error: 'Unknown certification.' });
  }
  const passed = score.percent >= 80;
  const now = new Date().toISOString();
  const attemptId = Utilities.getUuid();

  const certs = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_CERTIFICATIONS);
  certs.appendRow([
    attemptId,
    now,
    auth.user.userId,
    auth.user.firstName,
    auth.user.lastName,
    auth.user.email,
    auth.user.studentId,
    auth.user.period,
    certId,
    certName,
    score.percent,
    score.correct,
    score.total,
    passed,
    JSON.stringify(answers)
  ]);

  const currentStatus = statusForUserCert_(auth.user.userId, certId);
  return json_({
    ok: true,
    attemptId: attemptId,
    certId: certId,
    certName: certName,
    percent: score.percent,
    correct: score.correct,
    total: score.total,
    onlinePassed: passed,
    passed: currentStatus.badgeEarned,
    handsOnComplete: currentStatus.handsOnComplete,
    badgeEarned: currentStatus.badgeEarned,
    recordedAt: now
  });
}


function getCertificationStatus_(payload) {
  const token = clean_(payload.token);
  const certId = clean_(payload.certId);
  if (!token) return json_({ ok: false, error: 'Missing session token.' });

  const auth = validateTokenForServer_(token);
  if (!auth.ok) return json_(auth);

  return json_({
    ok: true,
    status: statusForUserCert_(auth.user.userId, certId)
  });
}

function getAllCertificationStatuses_(payload) {
  const token = clean_(payload.token);
  if (!token) return json_({ ok: false, error: 'Missing session token.' });

  const auth = validateTokenForServer_(token);
  if (!auth.ok) return json_(auth);

  const certIds = getCertificationIds_();
  const statuses = {};
  certIds.forEach(function (certId) {
    statuses[certId] = statusForUserCert_(auth.user.userId, certId);
  });

  return json_({
    ok: true,
    statuses: statuses
  });
}

function getTeacherDashboard_(payload) {
  const token = clean_(payload.token);
  if (!token) return json_({ ok: false, error: 'Missing session token.' });

  const auth = validateTokenForServer_(token);
  if (!auth.ok) return json_(auth);
  if (!isTeacherRole_(auth.user.role)) {
    return json_({ ok: false, error: 'Teacher access is required.' });
  }
  if (auth.user.mustChangePassword) {
    return json_({ ok: false, error: 'Change the temporary password before using teacher tools.' });
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const usersSheet = ss.getSheetByName(SHEET_USERS);
  const certSheet = ss.getSheetByName(SHEET_CERTIFICATIONS);
  const handsSheet = ss.getSheetByName(SHEET_HANDS_ON);
  const certIds = getCertificationIds_();
  const certSet = {};
  certIds.forEach(function (certId) { certSet[certId] = true; });

  // Read each sheet only once. The previous implementation called
  // statusForUserCert_ for every student/certification combination, which
  // repeatedly reread the entire Certifications and HandsOn sheets and could
  // time out as class records grew.
  const userValues = usersSheet.getDataRange().getValues();
  const students = [];
  const studentById = {};

  for (let i = 1; i < userValues.length; i++) {
    const user = rowToUser_(userValues[i]);
    if (isTeacherRole_(user.role)) continue;
    if (String(user.status).toLowerCase() !== 'active') continue;

    const student = {
      userId: user.userId,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: [user.firstName, user.lastName].filter(Boolean).join(' '),
      email: user.email,
      studentId: user.studentId,
      period: user.period,
      statuses: {}
    };
    students.push(student);
    studentById[String(user.userId)] = student;
  }

  const onlineMap = {};
  if (certSheet) {
    const certValues = certSheet.getDataRange().getValues();
    for (let i = 1; i < certValues.length; i++) {
      const row = certValues[i];
      const userId = String(row[2] || '');
      const certId = String(row[8] || '');
      if (!studentById[userId] || !certSet[certId]) continue;

      const key = userId + '||' + certId;
      if (!onlineMap[key]) {
        onlineMap[key] = {
          hasAttempt: false,
          attempts: 0,
          bestPercent: 0,
          lastAttemptAt: '',
          onlinePassed: false,
          certifiedAt: ''
        };
      }

      const item = onlineMap[key];
      const timestamp = String(row[1] || '');
      const percent = Number(row[10]) || 0;
      const rowPassed = String(row[13]).toLowerCase() === 'true';

      item.hasAttempt = true;
      item.attempts++;
      if (percent > item.bestPercent) item.bestPercent = percent;
      if (!item.lastAttemptAt || dateMs_(timestamp) > dateMs_(item.lastAttemptAt)) {
        item.lastAttemptAt = timestamp;
      }
      if (rowPassed) {
        item.onlinePassed = true;
        if (!item.certifiedAt || dateMs_(timestamp) < dateMs_(item.certifiedAt)) {
          item.certifiedAt = timestamp;
        }
      }
    }
  }

  const handsMap = {};
  if (handsSheet) {
    const handsValues = handsSheet.getDataRange().getValues();
    for (let i = 1; i < handsValues.length; i++) {
      const row = handsValues[i];
      const userId = String(row[4] || '');
      const certId = String(row[5] || '');
      if (!studentById[userId] || !certSet[certId]) continue;

      const key = userId + '||' + certId;
      const timestamp = String(row[1] || '');
      const existing = handsMap[key];
      if (!existing || dateMs_(timestamp) > dateMs_(existing.timestamp)) {
        handsMap[key] = {
          timestamp: timestamp,
          teacherName: String(row[3] || ''),
          completed: String(row[6]).toLowerCase() === 'true',
          notes: String(row[7] || '')
        };
      }
    }
  }

  students.forEach(function (student) {
    certIds.forEach(function (certId) {
      const key = String(student.userId) + '||' + certId;
      const online = onlineMap[key] || {
        hasAttempt: false,
        attempts: 0,
        bestPercent: 0,
        lastAttemptAt: '',
        onlinePassed: false,
        certifiedAt: ''
      };
      const requiresHandsOn = requiresHandsOn_(certId);
      const hands = handsMap[key] || {
        timestamp: '',
        teacherName: '',
        completed: false,
        notes: ''
      };
      const requiresOnline = requiresOnlineTest_(certId);
      const onlinePassed = requiresOnline ? !!online.onlinePassed : false;
      const handsOnComplete = requiresHandsOn ? !!hands.completed : false;
      const badgeEarned = onlinePassed && (!requiresHandsOn || handsOnComplete);
      const certifiedAt = badgeEarned
        ? (requiresHandsOn ? (hands.timestamp || online.certifiedAt || '') : (online.certifiedAt || ''))
        : '';

      student.statuses[certId] = {
        certId: certId,
        category: certificationCategory_(certId),
        hasAttempt: !!online.hasAttempt,
        attempts: Number(online.attempts || 0),
        bestPercent: Number(online.bestPercent || 0),
        lastAttemptAt: online.lastAttemptAt || '',
        onlinePassed: onlinePassed,
        passed: badgeEarned,
        requiresHandsOn: requiresHandsOn,
        requiresOnline: requiresOnline,
        handsOnComplete: handsOnComplete,
        handsOnAt: hands.timestamp || '',
        handsOnTeacher: hands.teacherName || '',
        badgeEarned: badgeEarned,
        certifiedAt: certifiedAt
      };
    });
  });

  const summary = students.reduce(function (totals, student) {
    certIds.forEach(function (certId) {
      const status = student.statuses[certId] || {};
      if (status.onlinePassed) totals.onlinePassed++;
      if (status.badgeEarned) totals.badgesEarned++;
      if (status.requiresHandsOn && status.onlinePassed && !status.handsOnComplete) totals.pendingApprovals++;
      if (status.requiresHandsOn && status.badgeEarned) totals.equipmentBadges++;
    });
    return totals;
  }, {
    studentAccounts: students.length,
    onlinePassed: 0,
    badgesEarned: 0,
    pendingApprovals: 0,
    equipmentBadges: 0
  });

  const passwordResetRequests = pendingPasswordResetRequests_(studentById);

  return json_({
    ok: true,
    serverVersion: SERVER_VERSION,
    teacher: publicUser_(auth.user),
    certifications: getCertificationList_(),
    students: students,
    passwordResetRequests: passwordResetRequests,
    summary: summary
  });
}

function dateMs_(value) {
  const ms = new Date(value).getTime();
  return isNaN(ms) ? 0 : ms;
}

function setHandsOnCompletion_(payload) {
  const token = clean_(payload.token);
  const studentUserId = clean_(payload.studentUserId);
  const certId = clean_(payload.certId);
  const completed = String(payload.completed).toLowerCase() === 'true';
  const notes = clean_(payload.notes);

  if (!token) return json_({ ok: false, error: 'Missing session token.' });
  if (!studentUserId || !certId) return json_({ ok: false, error: 'Missing student or certification.' });

  const auth = validateTokenForServer_(token);
  if (!auth.ok) return json_(auth);
  if (!isTeacherRole_(auth.user.role)) {
    return json_({ ok: false, error: 'Teacher access is required.' });
  }
  if (auth.user.mustChangePassword) {
    return json_({ ok: false, error: 'Change the temporary password before approving certifications.' });
  }

  const student = findUserById_(studentUserId);
  if (!student) return json_({ ok: false, error: 'Student account not found.' });

  if (!requiresHandsOn_(certId)) {
    return json_({ ok: false, error: 'This certification does not require a hands-on approval.' });
  }

  const status = statusForUserCert_(studentUserId, certId);
  if (requiresOnlineTest_(certId) && !status.onlinePassed && completed) {
    return json_({ ok: false, error: 'Online test must be passed before hands-on completion can be marked.' });
  }

  const handsOn = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_HANDS_ON);
  handsOn.appendRow([
    Utilities.getUuid(),
    new Date().toISOString(),
    auth.user.userId,
    [auth.user.firstName, auth.user.lastName].filter(Boolean).join(' '),
    studentUserId,
    certId,
    completed,
    notes
  ]);

  return json_({
    ok: true,
    status: statusForUserCert_(studentUserId, certId)
  });
}

function statusForUserCert_(userId, certId) {
  const online = onlineStatusForUserCert_(userId, certId);
  const requiresHandsOn = requiresHandsOn_(certId);
  const hands = requiresHandsOn ? handsOnStatusForUserCert_(userId, certId) : { completed: false, timestamp: '', teacherName: '', notes: '' };
  const requiresOnline = requiresOnlineTest_(certId);
  const onlinePassed = requiresOnline ? online.onlinePassed : false;
  const handsOnComplete = requiresHandsOn ? hands.completed : false;
  const badgeEarned = onlinePassed && (!requiresHandsOn || handsOnComplete);
  const certifiedAt = badgeEarned ? (requiresHandsOn ? (hands.timestamp || online.certifiedAt || '') : (online.certifiedAt || '')) : '';

  return {
    certId: certId,
    category: certificationCategory_(certId),
    hasAttempt: online.hasAttempt,
    attempts: online.attempts,
    bestPercent: online.bestPercent,
    lastAttemptAt: online.lastAttemptAt,
    onlinePassed: onlinePassed,
    passed: badgeEarned,
    requiresHandsOn: requiresHandsOn,
    requiresOnline: requiresOnline,
    handsOnComplete: handsOnComplete,
    handsOnAt: hands.timestamp,
    handsOnTeacher: hands.teacherName,
    badgeEarned: badgeEarned,
    certifiedAt: certifiedAt
  };
}

function onlineStatusForUserCert_(userId, certId) {
  const certs = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_CERTIFICATIONS);
  const values = certs.getDataRange().getValues();

  let attempts = 0;
  let bestPercent = 0;
  let lastAttemptAt = '';
  let certifiedAt = '';
  let onlinePassed = false;

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const rowUserId = String(row[2]);
    const rowCertId = String(row[8]);
    if (rowUserId !== String(userId) || rowCertId !== String(certId)) continue;

    attempts++;
    const timestamp = String(row[1]);
    const percent = Number(row[10]) || 0;
    const rowPassed = String(row[13]).toLowerCase() === 'true';

    if (!lastAttemptAt || new Date(timestamp) > new Date(lastAttemptAt)) {
      lastAttemptAt = timestamp;
    }
    if (percent > bestPercent) bestPercent = percent;
    if (rowPassed) {
      onlinePassed = true;
      if (!certifiedAt || new Date(timestamp) < new Date(certifiedAt)) {
        certifiedAt = timestamp;
      }
    }
  }

  return {
    hasAttempt: attempts > 0,
    attempts: attempts,
    bestPercent: bestPercent,
    lastAttemptAt: lastAttemptAt,
    onlinePassed: onlinePassed,
    certifiedAt: certifiedAt
  };
}

function handsOnStatusForUserCert_(userId, certId) {
  const handsOn = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_HANDS_ON);
  const values = handsOn.getDataRange().getValues();

  let latest = null;
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const rowUserId = String(row[4]);
    const rowCertId = String(row[5]);
    if (rowUserId !== String(userId) || rowCertId !== String(certId)) continue;
    if (!latest || new Date(row[1]) > new Date(latest.timestamp)) {
      latest = {
        timestamp: String(row[1]),
        teacherName: String(row[3]),
        completed: String(row[6]).toLowerCase() === 'true',
        notes: String(row[7] || '')
      };
    }
  }

  return latest || {
    timestamp: '',
    teacherName: '',
    completed: false,
    notes: ''
  };
}

function getCertificationList_() {
  return [
    { certId: 'engineering-safety', label: 'Engineering Safety', hasOnline: true },
    { certId: 'technical-sketching', label: 'Technical Sketching', hasOnline: true },
    { certId: 'engineering-documentation', label: 'Engineering Documentation', hasOnline: true },
    { certId: 'fusion-cad-level-1', label: 'Fusion CAD Level 1', hasOnline: true },
    { certId: 'engineering-drawings', label: 'Engineering Drawings', hasOnline: true },
    { certId: 'fusion-cad-level-2', label: 'Fusion CAD Level 2', hasOnline: true },
    { certId: 'design-review', label: 'Design Review', hasOnline: true },
    { certId: '3d-printing', label: '3D Printing', hasOnline: true },
    { certId: 'laser-cutting', label: 'Laser Cutting', hasOnline: true },
    { certId: 'cnc', label: 'CNC Mill', hasOnline: true },
    { certId: 'drill-press', label: 'Drill Press', hasOnline: true },
    { certId: 'soldering', label: 'Soldering', hasOnline: true },
    { certId: 'hand-cutting-tools', label: 'Hand & Cutting Tools', hasOnline: true }
  ];
}

function getCertificationIds_() {
  return getCertificationList_().map(function (cert) { return cert.certId; });
}

function requiresOnlineTest_(certId) {
  return certId === 'engineering-safety' || certId === '3d-printing' || certId === 'laser-cutting' || certId === 'drill-press' || certId === 'hand-cutting-tools' || certId === 'soldering' || certId === 'cnc' || certId === 'technical-sketching' || certId === 'engineering-documentation' || certId === 'fusion-cad-level-1' || certId === 'engineering-drawings' || certId === 'fusion-cad-level-2' || certId === 'design-review';
}

function requiresHandsOn_(certId) {
  return ['3d-printing', 'laser-cutting', 'cnc', 'drill-press', 'soldering', 'hand-cutting-tools'].indexOf(String(certId)) >= 0;
}

function certificationCategory_(certId) {
  if (certId === 'engineering-safety') return 'safety';
  if (certId === 'design-review') return 'professional';
  if (requiresHandsOn_(certId)) return 'equipment';
  return 'academic';
}

function validateTokenForServer_(token) {
  const sessions = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_SESSIONS);
  const values = sessions.getDataRange().getValues();
  const now = new Date();

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (String(row[0]) === String(token)) {
      const userId = row[1];
      const expiresAt = new Date(row[3]);
      const revokedAt = row[4];

      if (revokedAt) return { ok: false, error: 'Session has been logged out.' };
      if (expiresAt < now) return { ok: false, error: 'Session has expired.' };

      const found = findUserById_(userId);
      if (!found) return { ok: false, error: 'Account not found.' };
      ensureDefaultTeacherRoleForFound_(found);
      if (String(found.user.status).toLowerCase() !== 'active') {
        return { ok: false, error: 'This account is not active.' };
      }

      return { ok: true, user: found.user };
    }
  }
  return { ok: false, error: 'Invalid session token.' };
}

function scoreEngineeringSafety_(answers) {
  const key = {
    q1: 'complete instruction/certification and receive permission',
    q2: 'fabricating, cutting, drilling, sanding, soldering, or using powered equipment',
    q3: 'report it and do not use it',
    q4: 'get caught in moving equipment',
    q5: 'catch and pull a hand toward moving parts',
    q6: 'stop work and alert the teacher immediately',
    q7: 'never acceptable',
    q8: 'not be used until approved by the teacher',
    q9: 'only after the machine fully stops',
    q10: 'keep materials secure and hands away from danger',
    q11: 'not operate it',
    q12: 'it allows safe movement and emergency access',
    q13: 'a broken bit, damaged cord, missing guard, or unusual machine behavior',
    q14: 'help identify hazards before someone gets hurt',
    q15: 'return tools, clean the area, and secure materials',
    q16: 'for immediate safety concerns',
    q17: 'they are unsure about a tool, material, setup, or procedure',
    q18: 'handled carefully and allowed to cool or be deburred when needed',
    q19: 'the student, classmates, equipment, and workspace',
    q20: 'pause when unsure, communicate concerns, and follow the approved process'
  };

  let correct = 0;
  const total = Object.keys(key).length;
  Object.keys(key).forEach(function (id) {
    if (String(answers[id] || '').trim() === key[id]) correct++;
  });

  return {
    correct: correct,
    total: total,
    percent: Math.round((correct / total) * 100)
  };
}



function ensureUserSheetColumns_(users) {
  const required = [
    'userId', 'createdAt', 'updatedAt', 'firstName', 'lastName',
    'email', 'studentId', 'period', 'passwordSalt', 'passwordHash',
    'role', 'status', 'lastLogin', 'mustChangePassword', 'passwordChangedAt'
  ];
  const currentColumns = Math.max(users.getLastColumn(), required.length);
  const headers = users.getRange(1, 1, 1, currentColumns).getValues()[0];
  required.forEach(function (name, index) {
    if (String(headers[index] || '') !== name) {
      users.getRange(1, index + 1).setValue(name);
    }
  });
}

function ensureDefaultTeacherAccount_() {
  const properties = PropertiesService.getScriptProperties();
  const temporaryPassword = String(properties.getProperty('DEFAULT_TEACHER_TEMP_PASSWORD') || '');
  const existing = findUser_(DEFAULT_TEACHER_ACCOUNT.email, DEFAULT_TEACHER_ACCOUNT.teacherId);
  const users = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_USERS);

  if (existing) {
    users.getRange(existing.row, 3).setValue(new Date().toISOString());
    users.getRange(existing.row, 4).setValue(DEFAULT_TEACHER_ACCOUNT.firstName);
    users.getRange(existing.row, 5).setValue(DEFAULT_TEACHER_ACCOUNT.lastName);
    users.getRange(existing.row, 6).setValue(DEFAULT_TEACHER_ACCOUNT.email);
    users.getRange(existing.row, 7).setValue(DEFAULT_TEACHER_ACCOUNT.teacherId);
    users.getRange(existing.row, 8).setValue(DEFAULT_TEACHER_ACCOUNT.period);
    users.getRange(existing.row, 11).setValue(DEFAULT_TEACHER_ACCOUNT.role);
    users.getRange(existing.row, 12).setValue(DEFAULT_TEACHER_ACCOUNT.status);
    if (temporaryPassword) {
      const salt = Utilities.getUuid();
      users.getRange(existing.row, 9).setValue(salt);
      users.getRange(existing.row, 10).setValue(hashPassword_(temporaryPassword, salt));
      users.getRange(existing.row, 14).setValue(true);
      users.getRange(existing.row, 15).setValue('');
      properties.deleteProperty('DEFAULT_TEACHER_TEMP_PASSWORD');
      return { created: false, updated: true, message: 'The default Teacher Admin account was updated and requires a password change at first sign-in.' };
    }
    return { created: false, updated: true, message: 'The default Teacher Admin account already exists.' };
  }

  if (!temporaryPassword) {
    return {
      created: false,
      updated: false,
      message: 'The default Teacher Admin account is ready to provision after DEFAULT_TEACHER_TEMP_PASSWORD is added to Script Properties and setup() is run again.'
    };
  }

  const userId = Utilities.getUuid();
  const salt = Utilities.getUuid();
  const hash = hashPassword_(temporaryPassword, salt);
  const now = new Date().toISOString();
  users.appendRow([
    userId, now, now,
    DEFAULT_TEACHER_ACCOUNT.firstName,
    DEFAULT_TEACHER_ACCOUNT.lastName,
    DEFAULT_TEACHER_ACCOUNT.email,
    DEFAULT_TEACHER_ACCOUNT.teacherId,
    DEFAULT_TEACHER_ACCOUNT.period,
    salt, hash,
    DEFAULT_TEACHER_ACCOUNT.role,
    DEFAULT_TEACHER_ACCOUNT.status,
    '', true, ''
  ]);
  properties.deleteProperty('DEFAULT_TEACHER_TEMP_PASSWORD');
  return { created: true, updated: false, message: 'The default Teacher Admin account was created and requires a password change at first sign-in.' };
}

function requestPasswordReset_(payload) {
  const identifierRaw = clean_(payload.identifier);
  const identifier = identifierRaw.toLowerCase();
  if (!identifier) {
    return json_({ ok: false, error: 'Enter your school email or student ID.' });
  }

  const publicMessage = 'If an active student account matches that information, the password-reset request has been sent to your teacher. Ask your teacher to approve it and give you the 6-digit reset code.';
  const found = findUser_(identifier, identifier);
  if (!found) return json_({ ok: true, message: publicMessage });

  const user = found.user;
  if (String(user.role || '').toLowerCase() !== 'student' || String(user.status || '').toLowerCase() !== 'active') {
    return json_({ ok: true, message: publicMessage });
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PASSWORD_RESET_REQUESTS);
  const values = sheet.getDataRange().getValues();
  const now = new Date();
  const throttleCutoff = now.getTime() - (5 * 60 * 1000);

  for (let i = values.length - 1; i >= 1; i--) {
    const row = values[i];
    if (String(row[2] || '') !== String(user.userId)) continue;
    const status = String(row[9] || '').toLowerCase();
    const requestedAt = new Date(row[1]);
    if (status === 'pending') return json_({ ok: true, message: publicMessage });
    if (requestedAt.getTime() >= throttleCutoff && ['approved', 'used', 'dismissed', 'superseded', 'locked'].includes(status)) {
      return json_({ ok: true, message: publicMessage });
    }
    break;
  }

  sheet.appendRow([
    Utilities.getUuid(), now.toISOString(), user.userId,
    user.firstName, user.lastName, user.email, user.studentId, user.period,
    identifierRaw, 'pending', '', '', '', '', '', '', 0, ''
  ]);

  return json_({ ok: true, message: publicMessage });
}

function pendingPasswordResetRequests_(studentById) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PASSWORD_RESET_REQUESTS);
  if (!sheet) return [];
  const values = sheet.getDataRange().getValues();
  const result = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (String(row[9] || '').toLowerCase() !== 'pending') continue;
    const userId = String(row[2] || '');
    const student = studentById && studentById[userId];
    if (!student) continue;
    result.push({
      requestId: String(row[0] || ''),
      requestedAt: String(row[1] || ''),
      userId: userId,
      firstName: student.firstName || String(row[3] || ''),
      lastName: student.lastName || String(row[4] || ''),
      fullName: student.fullName || [row[3], row[4]].filter(Boolean).join(' '),
      email: student.email || String(row[5] || ''),
      studentId: student.studentId || String(row[6] || ''),
      period: student.period || String(row[7] || '')
    });
  }
  result.sort(function (a, b) {
    const periodCompare = String(a.period || '').localeCompare(String(b.period || ''), undefined, { numeric: true });
    if (periodCompare) return periodCompare;
    return String(a.fullName || '').localeCompare(String(b.fullName || ''));
  });
  return result;
}

function approvePasswordReset_(payload) {
  const auth = requireTeacherAuthForReset_(payload);
  if (!auth.ok) return json_(auth);
  const requestId = clean_(payload.requestId);
  if (!requestId) return json_({ ok: false, error: 'Missing password-reset request.' });

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PASSWORD_RESET_REQUESTS);
  const values = sheet.getDataRange().getValues();
  let rowNumber = -1;
  let userId = '';
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0] || '') === requestId) {
      if (String(values[i][9] || '').toLowerCase() !== 'pending') {
        return json_({ ok: false, error: 'This reset request is no longer pending.' });
      }
      rowNumber = i + 1;
      userId = String(values[i][2] || '');
      break;
    }
  }
  if (rowNumber < 0 || !userId) return json_({ ok: false, error: 'Password-reset request not found.' });

  const found = findUserById_(userId);
  if (!found || String(found.user.role || '').toLowerCase() !== 'student' || String(found.user.status || '').toLowerCase() !== 'active') {
    return json_({ ok: false, error: 'The student account is not available for reset.' });
  }

  supersedeResetRequestsForUser_(userId, requestId);
  const code = generateResetCode_();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + (30 * 60 * 1000));
  const teacherName = [auth.user.firstName, auth.user.lastName].filter(Boolean).join(' ') || auth.user.email || 'Teacher';

  sheet.getRange(rowNumber, 10).setValue('approved');
  sheet.getRange(rowNumber, 11).setValue(now.toISOString());
  sheet.getRange(rowNumber, 12).setValue(auth.user.userId);
  sheet.getRange(rowNumber, 13).setValue(teacherName);
  sheet.getRange(rowNumber, 14).setValue(hashResetCode_(userId, code));
  sheet.getRange(rowNumber, 15).setValue(expiresAt.toISOString());
  sheet.getRange(rowNumber, 17).setValue(0);

  return json_({ ok: true, resetCode: code, expiresAt: expiresAt.toISOString(), student: publicUser_(found.user) });
}

function dismissPasswordReset_(payload) {
  const auth = requireTeacherAuthForReset_(payload);
  if (!auth.ok) return json_(auth);
  const requestId = clean_(payload.requestId);
  if (!requestId) return json_({ ok: false, error: 'Missing password-reset request.' });

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PASSWORD_RESET_REQUESTS);
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0] || '') !== requestId) continue;
    if (String(values[i][9] || '').toLowerCase() !== 'pending') {
      return json_({ ok: false, error: 'This reset request is no longer pending.' });
    }
    const now = new Date().toISOString();
    sheet.getRange(i + 1, 10).setValue('dismissed');
    sheet.getRange(i + 1, 18).setValue(now);
    return json_({ ok: true });
  }
  return json_({ ok: false, error: 'Password-reset request not found.' });
}

function teacherInitiatePasswordReset_(payload) {
  const auth = requireTeacherAuthForReset_(payload);
  if (!auth.ok) return json_(auth);
  const studentUserId = clean_(payload.studentUserId);
  if (!studentUserId) return json_({ ok: false, error: 'Missing student account.' });

  const found = findUserById_(studentUserId);
  if (!found || String(found.user.role || '').toLowerCase() !== 'student' || String(found.user.status || '').toLowerCase() !== 'active') {
    return json_({ ok: false, error: 'The student account is not available for reset.' });
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PASSWORD_RESET_REQUESTS);
  supersedeResetRequestsForUser_(studentUserId, '');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + (30 * 60 * 1000));
  const code = generateResetCode_();
  const teacherName = [auth.user.firstName, auth.user.lastName].filter(Boolean).join(' ') || auth.user.email || 'Teacher';
  const requestId = Utilities.getUuid();

  sheet.appendRow([
    requestId, now.toISOString(), found.user.userId,
    found.user.firstName, found.user.lastName, found.user.email, found.user.studentId, found.user.period,
    'teacher-initiated', 'approved', now.toISOString(), auth.user.userId, teacherName,
    hashResetCode_(studentUserId, code), expiresAt.toISOString(), '', 0, ''
  ]);

  return json_({ ok: true, resetCode: code, expiresAt: expiresAt.toISOString(), student: publicUser_(found.user) });
}

function resetPasswordWithCode_(payload) {
  const identifier = clean_(payload.identifier).toLowerCase();
  const code = clean_(payload.resetCode).replace(/\s+/g, '');
  const newPassword = String(payload.newPassword || '');
  if (!identifier || !code) return json_({ ok: false, error: 'Enter your school email or student ID and the 6-digit reset code.' });
  if (!/^\d{6}$/.test(code)) return json_({ ok: false, error: 'The reset code must be 6 digits.' });
  if (newPassword.length < 10) return json_({ ok: false, error: 'The new password must be at least 10 characters.' });

  const found = findUser_(identifier, identifier);
  if (!found || String(found.user.role || '').toLowerCase() !== 'student' || String(found.user.status || '').toLowerCase() !== 'active') {
    return json_({ ok: false, error: 'The reset code is invalid or expired.' });
  }

  const userId = String(found.user.userId);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PASSWORD_RESET_REQUESTS);
  const values = sheet.getDataRange().getValues();
  const now = new Date();
  let rowNumber = -1;

  for (let i = values.length - 1; i >= 1; i--) {
    const row = values[i];
    if (String(row[2] || '') !== userId) continue;
    if (String(row[9] || '').toLowerCase() !== 'approved') continue;
    if (row[15]) continue;
    const expiresAt = new Date(row[14]);
    if (isNaN(expiresAt.getTime()) || expiresAt < now) {
      sheet.getRange(i + 1, 10).setValue('expired');
      continue;
    }
    const attempts = Number(row[16] || 0);
    if (attempts >= 5) {
      sheet.getRange(i + 1, 10).setValue('locked');
      continue;
    }
    rowNumber = i + 1;
    const expectedHash = String(row[13] || '');
    const suppliedHash = hashResetCode_(userId, code);
    if (!secureEquals_(expectedHash, suppliedHash)) {
      const nextAttempts = attempts + 1;
      sheet.getRange(rowNumber, 17).setValue(nextAttempts);
      if (nextAttempts >= 5) sheet.getRange(rowNumber, 10).setValue('locked');
      return json_({ ok: false, error: 'The reset code is invalid or expired.' });
    }
    break;
  }

  if (rowNumber < 0) return json_({ ok: false, error: 'The reset code is invalid or expired. Ask your teacher for a new code.' });

  const users = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_USERS);
  const salt = Utilities.getUuid();
  const nowIso = now.toISOString();
  users.getRange(found.row, 3).setValue(nowIso);
  users.getRange(found.row, 9).setValue(salt);
  users.getRange(found.row, 10).setValue(hashPassword_(newPassword, salt));
  users.getRange(found.row, 14).setValue(false);
  users.getRange(found.row, 15).setValue(nowIso);

  sheet.getRange(rowNumber, 10).setValue('used');
  sheet.getRange(rowNumber, 16).setValue(nowIso);
  supersedeResetRequestsForUser_(userId, String(sheet.getRange(rowNumber, 1).getValue() || ''));
  revokeSessionsForUser_(userId, nowIso);
  return json_({ ok: true });
}

function requireTeacherAuthForReset_(payload) {
  const token = clean_(payload.token);
  if (!token) return { ok: false, error: 'Missing teacher session token.' };
  const auth = validateTokenForServer_(token);
  if (!auth.ok) return auth;
  if (!isTeacherRole_(auth.user.role)) return { ok: false, error: 'Teacher access is required.' };
  if (auth.user.mustChangePassword) return { ok: false, error: 'Change the temporary password before using teacher tools.' };
  return auth;
}

function supersedeResetRequestsForUser_(userId, keepRequestId) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PASSWORD_RESET_REQUESTS);
  if (!sheet) return;
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][2] || '') !== String(userId)) continue;
    if (keepRequestId && String(values[i][0] || '') === String(keepRequestId)) continue;
    const status = String(values[i][9] || '').toLowerCase();
    if (status === 'pending' || status === 'approved') sheet.getRange(i + 1, 10).setValue('superseded');
  }
}

function generateResetCode_() {
  const secret = PropertiesService.getScriptProperties().getProperty('AUTH_SECRET') || 'CHANGE_THIS_SECRET_IN_SCRIPT_PROPERTIES';
  const seed = Utilities.getUuid() + ':' + new Date().getTime() + ':' + secret;
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, seed);
  let value = 0;
  for (let i = 0; i < 4; i++) value = (value * 256) + (bytes[i] < 0 ? bytes[i] + 256 : bytes[i]);
  return String(100000 + (value % 900000));
}

function hashResetCode_(userId, code) {
  const secret = PropertiesService.getScriptProperties().getProperty('AUTH_SECRET') || 'CHANGE_THIS_SECRET_IN_SCRIPT_PROPERTIES';
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, 'password-reset-code:' + userId + ':' + code + ':' + secret);
  return bytes.map(function (b) {
    const v = (b < 0 ? b + 256 : b).toString(16);
    return v.length === 1 ? '0' + v : v;
  }).join('');
}

function forgotPassword_(payload) {
  return requestPasswordReset_(payload);
}

function resetPassword_(payload) {
  return json_({ ok: false, error: 'Email reset links are no longer used. Ask your teacher for a 6-digit reset code.' });
}

function changePassword_(payload) {
  const token = clean_(payload.token);
  const currentPassword = String(payload.currentPassword || '');
  const newPassword = String(payload.newPassword || '');

  if (!token) return json_({ ok: false, error: 'Missing session token.' });
  if (!currentPassword || !newPassword) {
    return json_({ ok: false, error: 'Current and new passwords are required.' });
  }
  if (newPassword.length < 10) {
    return json_({ ok: false, error: 'The new password must be at least 10 characters.' });
  }
  if (currentPassword === newPassword) {
    return json_({ ok: false, error: 'Choose a new password that is different from the temporary password.' });
  }

  const auth = validateTokenForServer_(token);
  if (!auth.ok) return json_(auth);
  const found = findUserById_(auth.user.userId);
  if (!found) return json_({ ok: false, error: 'Account not found.' });

  const currentHash = hashPassword_(currentPassword, found.user.passwordSalt);
  if (!secureEquals_(currentHash, found.user.passwordHash)) {
    return json_({ ok: false, error: 'The current password is incorrect.' });
  }

  const users = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_USERS);
  const salt = Utilities.getUuid();
  const now = new Date().toISOString();
  users.getRange(found.row, 3).setValue(now);
  users.getRange(found.row, 9).setValue(salt);
  users.getRange(found.row, 10).setValue(hashPassword_(newPassword, salt));
  users.getRange(found.row, 14).setValue(false);
  users.getRange(found.row, 15).setValue(now);

  const refreshed = findUserById_(auth.user.userId);
  return json_({ ok: true, user: publicUser_(refreshed.user) });
}

function isDefaultTeacherAccount_(user) {
  if (!user) return false;
  const email = String(user.email || '').trim().toLowerCase();
  const teacherId = String(user.studentId || '').trim().toUpperCase();
  return email === String(DEFAULT_TEACHER_ACCOUNT.email).trim().toLowerCase() ||
    teacherId === String(DEFAULT_TEACHER_ACCOUNT.teacherId).trim().toUpperCase();
}

function ensureDefaultTeacherRoleForFound_(found) {
  if (!found || !found.user || !isDefaultTeacherAccount_(found.user)) return found;
  const needsUpdate = String(found.user.role || '').trim().toLowerCase() !== 'teacher_admin' ||
    String(found.user.status || '').trim().toLowerCase() !== 'active';
  if (needsUpdate) {
    const users = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_USERS);
    users.getRange(found.row, 3).setValue(new Date().toISOString());
    users.getRange(found.row, 11).setValue('teacher_admin');
    users.getRange(found.row, 12).setValue('active');
  }
  found.user.role = 'teacher_admin';
  found.user.status = 'active';
  return found;
}

function isTeacherRole_(role) {
  const normalized = String(role || '').trim().toLowerCase();
  return normalized === 'teacher' || normalized === 'teacher_admin';
}

function isTeacherAdminRole_(role) {
  return String(role || '').trim().toLowerCase() === 'teacher_admin';
}

function countTeacherAccounts_() {
  const users = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_USERS);
  const values = users.getDataRange().getValues();
  let count = 0;
  for (let i = 1; i < values.length; i++) {
    if (isTeacherRole_(values[i][10]) && String(values[i][11] || '').toLowerCase() === 'active') {
      count++;
    }
  }
  return count;
}

function secureEquals_(left, right) {
  const a = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(left || ''));
  const b = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(right || ''));
  if (a.length !== b.length) return false;
  let different = 0;
  for (let i = 0; i < a.length; i++) different |= (a[i] ^ b[i]);
  return different === 0;
}

function createSession_(userId) {
  const sessions = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_SESSIONS);
  const token = Utilities.getUuid() + '-' + Utilities.getUuid();
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + 1000 * 60 * 60 * 24 * 30); // 30 days

  sessions.appendRow([
    token,
    userId,
    createdAt.toISOString(),
    expiresAt.toISOString(),
    ''
  ]);

  return {
    token,
    expiresAt: expiresAt.toISOString()
  };
}

function findUser_(emailOrIdentifier, studentIdOrIdentifier) {
  const users = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_USERS);
  const values = users.getDataRange().getValues();

  const emailNeedle = String(emailOrIdentifier || '').toLowerCase();
  const idNeedle = String(studentIdOrIdentifier || '').toLowerCase();

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const email = String(row[5] || '').toLowerCase();
    const studentId = String(row[6] || '').toLowerCase();
    if (email === emailNeedle || studentId === idNeedle) {
      return { row: i + 1, user: rowToUser_(row) };
    }
  }
  return null;
}

function findUserById_(userId) {
  const users = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_USERS);
  const values = users.getDataRange().getValues();

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (String(row[0]) === String(userId)) {
      return { row: i + 1, user: rowToUser_(row) };
    }
  }
  return null;
}

function rowToUser_(row) {
  return {
    userId: row[0],
    createdAt: row[1],
    updatedAt: row[2],
    firstName: row[3],
    lastName: row[4],
    email: row[5],
    studentId: row[6],
    period: row[7],
    passwordSalt: row[8],
    passwordHash: row[9],
    role: row[10],
    status: row[11],
    lastLogin: row[12],
    mustChangePassword: String(row[13]).toLowerCase() === 'true',
    passwordChangedAt: row[14]
  };
}

function publicUser_(user) {
  const effectiveRole = isDefaultTeacherAccount_(user) ? 'teacher_admin' : user.role;
  return {
    userId: user.userId,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: [user.firstName, user.lastName].filter(Boolean).join(' '),
    email: user.email,
    studentId: user.studentId,
    period: user.period,
    role: effectiveRole,
    status: user.status,
    mustChangePassword: !!user.mustChangePassword
  };
}

function hashPassword_(password, salt) {
  const secret = PropertiesService.getScriptProperties().getProperty('AUTH_SECRET') || 'CHANGE_THIS_SECRET_IN_SCRIPT_PROPERTIES';
  const raw = salt + ':' + password + ':' + secret;
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, raw);
  return bytes.map(function (b) {
    const v = (b < 0 ? b + 256 : b).toString(16);
    return v.length === 1 ? '0' + v : v;
  }).join('');
}

function clean_(value) {
  return String(value == null ? '' : value).trim();
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}


function score3DPrinting_(answers) {
  const key = {
    q1: 'printer profile, filament/material profile, model scale, and estimated print time',
    q2: 'PLA unless another material is approved',
    q3: 'only after instruction, certification requirements, and permission',
    q4: 'matches slicing assumptions to the printer being used',
    q5: 'check units and scale before printing',
    q6: 'improve bed contact, reduce unnecessary supports, and support the part\'s function',
    q7: 'when the model has unsupported overhangs or features that need them',
    q8: 'the part\'s function, time, material use, and required strength',
    q9: 'layer, support, orientation, and first-layer problems before printing',
    q10: 'clear, installed correctly, and ready for the selected printer',
    q11: 'poor first-layer adhesion often causes print failure',
    q12: 'stop or ask for help immediately',
    q13: 'parts are moving or hot surfaces may be present',
    q14: 'teacher-approved, clean, dry, untangled, and properly supported',
    q15: 'reported instead of forced',
    q16: 'using approved methods after cooling when required',
    q17: 'cleaned up and disposed of in the correct location',
    q18: 'identifying the cause and changing the design, orientation, or settings before reprinting',
    q19: 'complete a safe supervised print workflow from setup through cleanup',
    q20: 'the online test is passed and the teacher marks the hands-on portion complete'
  };

  let correct = 0;
  const total = Object.keys(key).length;
  Object.keys(key).forEach(function (id) {
    if (String(answers[id] || '').trim() === key[id]) correct++;
  });

  return {
    correct: correct,
    total: total,
    percent: Math.round((correct / total) * 100)
  };
}


function scoreLaserCutting_(answers) {
  const key = {
    q1: 'instruction, certification requirements, teacher permission, and supervision expectations are met',
    q2: 'staying with the laser and watching the job for smoke, flame, material movement, and unsafe behavior',
    q3: 'not lasered unless identified and approved',
    q4: 'on and functioning before cutting or engraving',
    q5: 'stop or pause the job and ask for help',
    q6: 'pause/stop the job and alert the teacher',
    q7: 'material approval, file scale, operation settings, focus/origin, ventilation, and job boundary',
    q8: 'cutting or scoring',
    q9: 'engraving',
    q10: 'cause the same path to cut more than once and overburn material',
    q11: 'the job fits on the material and is positioned correctly',
    q12: 'flat and secure on the bed so it will not shift during the job',
    q13: 'only after motion stops and it is safe to do so',
    q14: 'reduce flare-ups and improve cut quality when required',
    q15: 'pause/stop the job and ask for help',
    q16: 'hot edges, smoldering pieces, scrap, and machine/material issues',
    q17: 'removing parts/scrap safely, cleaning the bed, and returning tools/materials',
    q18: 'stop and ask for help',
    q19: 'complete a safe supervised laser workflow from material approval through cleanup',
    q20: 'the online test is passed and the teacher marks the hands-on portion complete'
  };

  let correct = 0;
  const total = Object.keys(key).length;
  Object.keys(key).forEach(function (id) {
    if (String(answers[id] || '').trim() === key[id]) correct++;
  });

  return {
    correct: correct,
    total: total,
    percent: Math.round((correct / total) * 100)
  };
}


function scoreDrillPress_(answers) {
  const key = {
    q1: 'instruction, certification requirements, teacher permission, and supervision expectations are met',
    q2: 'rotating parts, entanglement, flying chips, and spinning workpieces',
    q3: 'whenever drilling or standing near active drilling',
    q4: 'secured before operating the drill press',
    q5: 'catch in rotating parts and pull a hand toward the bit',
    q6: 'removed immediately after tightening and before turning on the machine',
    q7: 'correct for the material and hole size, straight, undamaged, and seated properly',
    q8: 'clamped or held in an approved vise/fixture',
    q9: 'prevent the workpiece from spinning or shifting and keep hands away from the bit',
    q10: 'reduce tear-out and protect the drill press table',
    q11: 'material, bit size, and teacher-approved settings',
    q12: 'slower speeds',
    q13: 'start the machine, lower the bit with controlled pressure, and avoid forcing the cut',
    q14: 'drill a little, back out to clear chips, then continue',
    q15: 'after the spindle fully stops, using a brush or approved tool',
    q16: 'turn off the machine and wait for the spindle and bit to fully stop',
    q17: 'stop and check the setup or ask for help',
    q18: 'stop the machine and ask for teacher assistance',
    q19: 'removing chips safely, returning bits/clamps/tools, and leaving the station ready',
    q20: 'the online test is passed and the teacher marks the hands-on portion complete'
  };

  let correct = 0;
  const total = Object.keys(key).length;
  Object.keys(key).forEach(function (id) {
    if (String(answers[id] || '').trim() === key[id]) correct++;
  });

  return {
    correct: correct,
    total: total,
    percent: Math.round((correct / total) * 100)
  };
}


function scoreHandCuttingTools_(answers) {
  const key = {
    q1: 'instruction and teacher permission',
    q2: 'measure, mark, support, and secure the material',
    q3: 'away from the body, hands, and classmates',
    q4: 'behind or away from the blade path',
    q5: 'light repeated passes instead of one forced deep cut',
    q6: 'retracted, covered, or stored safely',
    q7: 'reported and not used',
    q8: 'secure material and keep hands out of the tool path',
    q9: 'puts fingers in the blade path',
    q10: 'protect the table and support the cut',
    q11: 'only on approved materials and thicknesses',
    q12: 'closed or point-down, and passed handle-first',
    q13: 'secured when needed and handled with controlled strokes',
    q14: 'deburred, sanded, or handled carefully when appropriate',
    q15: 'approved cleanup methods, not by blowing them into the air',
    q16: 'feels dull, damaged, loose, or unsafe',
    q17: 'stop and ask for help',
    q18: 'returning tools, disposing of scrap correctly, and leaving the station ready',
    q19: 'safely measure, support, cut, finish, and clean up under teacher observation',
    q20: 'the online test is passed and the teacher marks the hands-on portion complete'
  };

  let correct = 0;
  const total = Object.keys(key).length;
  Object.keys(key).forEach(function (id) {
    if (String(answers[id] || '').trim() === key[id]) correct++;
  });

  return {
    correct: correct,
    total: total,
    percent: Math.round((correct / total) * 100)
  };
}


function scoreSoldering_(answers) {
  const key = {
    q1: 'instruction, certification requirements, teacher permission, and supervision expectations are met',
    q2: 'whenever the station is active or recently used',
    q3: 'returned to its stand',
    q4: 'hot solder, clipped leads, and small parts can injure eyes',
    q5: 'reduce direct exposure to solder fumes',
    q6: 'kept away from soldering stations',
    q7: 'iron stand, fume control, tip cleaner, solder, secured work, and clear workspace',
    q8: 'transfers heat better',
    q9: 'approved sponge or brass wool methods',
    q10: 'heat the joint surfaces, then feed solder into the heated joint',
    q11: 'shiny/smooth, properly wetted, and not excessive',
    q12: 'dull, grainy, cracked, balled-up, or poorly bonded',
    q13: 'accidental solder connecting points that should be separate',
    q14: 'hide problems or create shorts',
    q15: 'create weak or intermittent electrical connections',
    q16: 'small pieces can fly and injure eyes or create debris',
    q17: 'damage components, insulation, or the circuit board',
    q18: 'inspect for bridges, cold joints, loose wires, and clipped leads',
    q19: 'turning off/unplugging as instructed, returning tools, disposing scraps, and washing hands',
    q20: 'the online test is passed and the teacher marks the hands-on portion complete'
  };

  let correct = 0;
  const total = Object.keys(key).length;
  Object.keys(key).forEach(function (id) {
    if (String(answers[id] || '').trim() === key[id]) correct++;
  });

  return {
    correct: correct,
    total: total,
    percent: Math.round((correct / total) * 100)
  };
}


function scoreCNC_(answers) {
  const key = {
    q1: 'instruction, certification requirements, teacher permission, and supervision expectations are met',
    q2: 'automatic machine motion, rotating tools, flying chips, dust, and loose stock',
    q3: 'during CNC setup, cutting, chip clearing, and cleanup',
    q4: 'catch in rotating parts and pull a hand toward the tool',
    q5: 'the teacher has approved the material for the machine, bit, and project',
    q6: 'cause a crash, wrong depth, incomplete cut, or damage',
    q7: 'correct for the material and operation, undamaged, and secured properly',
    q8: 'units, scale, stock size, origin, setup orientation, tool, and toolpath preview',
    q9: 'wrong depth, collisions, clamp hits, and toolpaths outside the stock',
    q10: 'review and approval according to the class workflow',
    q11: 'secure stock so it cannot shift or spin during cutting',
    q12: 'outside the toolpath',
    q13: 'cutting depth relative to the stock or machine bed',
    q14: 'machine motion and setup before the real cut',
    q15: 'sound, chips, dust, tool motion, and stock movement',
    q16: 'the stock moves, the bit breaks, unusual sounds occur, or the toolpath looks wrong',
    q17: 'wait for the spindle and all motion to fully stop',
    q18: 'with approved brushes or vacuum methods after motion stops',
    q19: 'safely set up, review, monitor, stop, and clean up a supervised CNC workflow',
    q20: 'the online test is passed and the teacher marks the hands-on portion complete'
  };

  let correct = 0;
  const total = Object.keys(key).length;
  Object.keys(key).forEach(function (id) {
    if (String(answers[id] || '').trim() === key[id]) correct++;
  });

  return {
    correct: correct,
    total: total,
    percent: Math.round((correct / total) * 100)
  };
}


function scoreTechnicalSketching_(answers) {
  const key = {
    q1: 'communicate shape, features, scale relationships, and design intent',
    q2: 'clear, readable, and accurate enough to communicate the idea',
    q3: 'plan proportions and layout before darkening final object lines',
    q4: 'distinguish final object edges from planning marks and notes',
    q5: 'three faces of an object in one pictorial view',
    q6: 'one vertical axis and two receding axes about 30° from horizontal',
    q7: 'stay parallel to the matching isometric axis',
    q8: 'ellipses',
    q9: 'front, top, and right side',
    q10: 'width, height, and depth relationships are consistent',
    q11: 'show the object\'s most descriptive shape when possible',
    q12: 'edges that can be seen from the selected view',
    q13: 'edges or features behind visible surfaces',
    q14: 'axes of symmetry, holes, cylinders, and circular features',
    q15: 'identify important features without cluttering the sketch',
    q16: 'a note refers to a specific feature',
    q17: 'date, title, purpose, sketch, notes, and revision information when needed',
    q18: 'kept with notes explaining what changed',
    q19: 'drawing too small to read or misaligning orthographic views',
    q20: 'the online test is passed and the teacher marks the hands-on portion complete'
  };

  let correct = 0;
  const total = Object.keys(key).length;
  Object.keys(key).forEach(function (id) {
    if (String(answers[id] || '').trim() === key[id]) correct++;
  });

  return {
    correct: correct,
    total: total,
    percent: Math.round((correct / total) * 100)
  };
}


function scoreEngineeringDocumentation_(answers) {
  const key = {
    q1: 'what was designed, tested, changed, and learned',
    q2: 'communicate, defend decisions, repeat tests, and improve designs',
    q3: 'date, title, project/task, and purpose',
    q4: 'labeled clearly',
    q5: 'kept with notes explaining changes and lessons learned',
    q6: 'why a decision was made using constraints, criteria, evidence, or test results',
    q7: 'criteria, weights when used, scores, and a short interpretation',
    q8: 'what was tested, how it was tested, and what variables were controlled or changed',
    q9: 'units',
    q10: 'recorded honestly and interpreted',
    q11: 'show useful evidence and include labels or captions',
    q12: 'what the image shows and why it matters',
    q13: 'what changed, when it changed, and why it changed',
    q14: 'provide comparison or evidence',
    q15: 'descriptive and includes project, part, version, or date when helpful',
    q16: 'organized by project',
    q17: 'problem, constraints, design process, testing, revisions, and final outcome',
    q18: 'evidence from sketches, tests, calculations, or observations',
    q19: 'summarize the design story, not replace the full notebook record',
    q20: 'the online test is passed and the teacher marks the hands-on portion complete'
  };

  let correct = 0;
  const total = Object.keys(key).length;
  Object.keys(key).forEach(function (id) {
    if (String(answers[id] || '').trim() === key[id]) correct++;
  });

  return {
    correct: correct,
    total: total,
    percent: Math.round((correct / total) * 100)
  };
}


function scoreFusionCADLevel1_(answers) {
  const key = {
    q1: 'dimensions and features can be changed later',
    q2: 'saving in the correct project folder with a descriptive name',
    q3: 'project, part, version, or assignment context when helpful',
    q4: 'an appropriate plane or face based on the part orientation',
    q5: 'symmetry, alignment, and future edits',
    q6: 'extrude features',
    q7: 'size and location',
    q8: 'relationships such as horizontal, vertical, parallel, perpendicular, and concentric',
    q9: 'more predictable and easier to revise',
    q10: 'stop and fix the constraint or dimension issue',
    q11: 'turn a closed sketch profile into a 3D solid or cut',
    q12: 'intentionally based on the design task',
    q13: 'modify edges based on design intent',
    q14: 'understand and edit the order of features',
    q15: 'edit sketch dimensions or feature settings when possible',
    q16: 'size, distance, diameter, and clearance',
    q17: 'units, orientation, model correctness, and required file type',
    q18: '3D printing workflows',
    q19: 'kept separate from exported manufacturing files when appropriate',
    q20: 'the online test is passed and the teacher marks the hands-on portion complete'
  };

  let correct = 0;
  const total = Object.keys(key).length;
  Object.keys(key).forEach(function (id) {
    if (String(answers[id] || '').trim() === key[id]) correct++;
  });

  return {
    correct: correct,
    total: total,
    percent: Math.round((correct / total) * 100)
  };
}


function scoreEngineeringDrawings_(answers) {
  const key = {
    q1: 'exact part shape, size, features, and production requirements',
    q2: 'inspect, fabricate, or model the part accurately',
    q3: 'front, top, and right side',
    q4: 'width, height, and depth match correctly',
    q5: 'show the most descriptive shape when possible',
    q6: 'edges that can be seen',
    q7: 'edges or features behind visible surfaces',
    q8: 'axes of symmetry, holes, cylinders, and circular features',
    q9: 'communicate measurements',
    q10: 'size and location clearly',
    q11: 'duplicate or conflicting dimensions',
    q12: 'where they are easy to read and relate to the correct feature',
    q13: 'centerlines and dimensions',
    q14: 'part, project, student/team, date, scale, units, and revision when required',
    q15: 'how the drawing view size relates to real part size',
    q16: 'show interior features by imagining the part cut open',
    q17: 'the cut material surface',
    q18: 'enlarge small or complex areas that are hard to read at normal scale',
    q19: 'what changed and why',
    q20: 'the online test is passed and the teacher marks the hands-on portion complete'
  };

  let correct = 0;
  const total = Object.keys(key).length;
  Object.keys(key).forEach(function (id) {
    if (String(answers[id] || '').trim() === key[id]) correct++;
  });

  return {
    correct: correct,
    total: total,
    percent: Math.round((correct / total) * 100)
  };
}


function scoreFusionCADLevel2_(answers) {
  const key = {
    q1: 'organized, editable, reviewable, and assembly or fabrication ready',
    q2: 'how sketches, features, components, and joints are structured',
    q3: 'a piece of geometry',
    q4: 'moves, repeats, appears in a BOM, or needs its own organization',
    q5: 'clear enough that the browser communicates the design structure',
    q6: 'how components are positioned or allowed to move relative to each other',
    q7: 'locks components together',
    q8: 'allows rotation around an axis',
    q9: 'allows motion along a line',
    q10: 'symmetry, alignment, offsets, hole placement, and angled features',
    q11: 'repeat features, bodies, or components using controlled spacing and count',
    q12: 'reflect geometry across a plane or line of symmetry',
    q13: 'thickness, clearance, hole spacing, or tab width',
    q14: 'easier to update and understand',
    q15: 'views, dimensions, notes, or title block information may need updates',
    q16: 'units, scale, orientation, part selection, and correct file type',
    q17: 'kept separate from exported manufacturing files',
    q18: 'model structure, intended motion, key dimensions, fabrication plan, and revision readiness',
    q19: 'timeline errors, broken references, missing joints, wrong materials, and outdated drawings',
    q20: 'the online test is passed and the teacher marks the hands-on portion complete'
  };

  let correct = 0;
  const total = Object.keys(key).length;
  Object.keys(key).forEach(function (id) {
    if (String(answers[id] || '').trim() === key[id]) correct++;
  });

  return {
    correct: correct,
    total: total,
    percent: Math.round((correct / total) * 100)
  };
}


function scoreDesignReview_(answers) {
  const key = {
    q1: 'a structured checkpoint used to improve a design before more time or material is committed',
    q2: 'reasoning, evidence, risks, and next steps',
    q3: 'the intended user or mission',
    q4: 'what success looks like',
    q5: 'limits such as material, time, size, tools, cost, safety, or performance requirements',
    q6: 'constraints, criteria, data, or observed performance',
    q7: 'evidence such as sketches, CAD, prototypes, calculations, measurements, or test data',
    q8: 'tradeoff discussions when multiple options are compared',
    q9: 'make the design easier to understand quickly',
    q10: 'cause the design to fail, become unsafe, or miss a requirement',
    q11: 'improving one criterion may weaken another',
    q12: 'named clearly instead of hidden',
    q13: 'listening fully, asking clarifying questions, and recording feedback',
    q14: 'task, owner, due date, and reason it matters',
    q15: 'safety, feasibility, major risks, and project deadlines',
    q16: 'only a conversation, not a complete engineering checkpoint',
    q17: 'decisions, feedback, action items, and planned revisions',
    q18: 'traceable',
    q19: 'separating critique of the design from personal identity',
    q20: 'the online test is passed and the teacher marks the hands-on portion complete'
  };

  let correct = 0;
  const total = Object.keys(key).length;
  Object.keys(key).forEach(function (id) {
    if (String(answers[id] || '').trim() === key[id]) correct++;
  });

  return {
    correct: correct,
    total: total,
    percent: Math.round((correct / total) * 100)
  };
}
