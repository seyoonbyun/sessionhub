/**
 * SessionHub - Google Calendar 연동 스크립트
 *
 * [배포 방법]
 * 1. https://script.google.com 접속
 * 2. 새 프로젝트 생성 후 아래 코드 붙여넣기
 * 3. 상단 메뉴 > 배포 > 새 배포
 * 4. 유형: 웹 앱
 *    - 다음 사용자로 실행: 나 (캘린더 소유자)
 *    - 액세스 권한: 모든 사용자
 * 5. 배포 후 생성된 URL을 config.js의 GOOGLE_APPS_SCRIPT_URL에 입력
 */

var CALENDAR_ID = 'hq@joy-bnikorea.com';
var SPREADSHEET_ID = '1FAHhhH1RRQUqz-X213_HjJUqQxtpoFbfb9nrsmPIjws';

function doGet(e) {
  try {
    var p = e.parameter;

    if (!p.date || !p.time) {
      return respond({ status: 'error', message: '날짜 또는 시간 누락' });
    }

    // 1) 구글 캘린더 이벤트 생성
    var calendar = CalendarApp.getCalendarById(CALENDAR_ID);
    if (!calendar) {
      return respond({ status: 'error', message: '캘린더를 찾을 수 없습니다. CALENDAR_ID를 확인하세요.' });
    }

    var startDate = new Date(p.date + 'T' + p.time + ':00+09:00');
    var durationMin = parseInt(p.duration) || 60;
    var endDate = new Date(startDate.getTime() + durationMin * 60 * 1000);

    calendar.createEvent(
      p.title || '[SessionHub] 예약',
      startDate,
      endDate,
      { description: p.description || '' }
    );

    // 2) 구글 스프레드시트에 저장
    if (SPREADSHEET_ID) {
      saveToSheet(p);
    }

    // 3) 예약 확인 이메일 발송
    if (p.email) {
      sendConfirmationEmail(p, durationMin);
    }

    return respond({ status: 'ok' });

  } catch (err) {
    return respond({ status: 'error', message: err.toString() });
  }
}

function saveToSheet(p) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheets()[0]; // 첫 번째 시트 사용

  // 헤더가 없으면 자동 생성
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['예약일시', '예약자', '연락처', '이메일', '서비스', '날짜', '시간', '이용시간(분)', '메모']);
    sheet.getRange(1, 1, 1, 9).setFontWeight('bold');
  }

  sheet.appendRow([
    new Date(),           // 예약일시 (기록 시점)
    p.name || '',
    p.phone || '',
    p.email || '',
    p.service || '',
    p.date || '',
    p.time || '',
    p.duration || '',
    p.memo || '',
  ]);
}

function sendConfirmationEmail(p, durationMin) {
  var subject = '[SessionHub] 예약이 확정되었습니다';
  var body = [
    p.name + '님, 예약이 확정되었습니다.',
    '',
    '━━━━━━━━━━━━━━━━━━━━',
    '📋 예약 상세 정보',
    '━━━━━━━━━━━━━━━━━━━━',
    '',
    '▪ 예약번호: ' + (p.phone || '-'),
    '▪ 예약자: ' + p.name,
    '▪ 서비스: ' + (p.service || '-'),
    '▪ 날짜: ' + p.date,
    '▪ 시간: ' + p.time,
    '▪ 이용시간: ' + durationMin + '분',
    p.memo ? '▪ 메모: ' + p.memo : '',
    '',
    '━━━━━━━━━━━━━━━━━━━━',
    '',
    '일정에 맞춰 참석해 주시기 바랍니다.',
    '문의사항이 있으시면 연락 주세요.',
    '',
    '※ 나의 예약내역은 사이트의 "나의 예약" 메뉴에서',
    '  예약번호(전화번호)로 조회하실 수 있습니다.',
    '',
    'SessionHub 드림',
  ].filter(Boolean).join('\n');

  MailApp.sendEmail(p.email, subject, body);
}

function respond(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
