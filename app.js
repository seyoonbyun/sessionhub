// ===== Supabase =====
const supabaseClient = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);

// ===== State =====
let userName = '';
let userPhone = '';

const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
const monthNames = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

// 대한민국 공휴일 (MM-DD 고정 공휴일 + 연도별 음력 공휴일)
const holidays = {
  fixed: ['01-01', '03-01', '05-05', '06-06', '08-15', '10-03', '10-09', '12-25'],
  '2025': ['01-28', '01-29', '01-30', '05-05', '05-06'],
  '2026': ['02-16', '02-17', '02-18', '05-24', '09-24', '09-25', '09-26'],
  '2027': ['02-05', '02-06', '02-07', '05-13', '10-13', '10-14', '10-15'],
};

function isHoliday(date) {
  const mmdd = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const year = String(date.getFullYear());
  return holidays.fixed.includes(mmdd) || (holidays[year] && holidays[year].includes(mmdd));
}

function isDateDisabled(date) {
  const day = date.getDay();
  return day === 0 || day === 6 || isHoliday(date);
}

const today = new Date();
let currentYear = today.getFullYear();
let currentMonth = today.getMonth();
let selectedDate = new Date(currentYear, currentMonth, today.getDate());
while (isDateDisabled(selectedDate)) {
  selectedDate.setDate(selectedDate.getDate() + 1);
}
currentYear = selectedDate.getFullYear();
currentMonth = selectedDate.getMonth();
let selectedTime = null;
let busyTimes = [];

const baseTimeSlots = [
  '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00',
];

// ===== Page Navigation =====
function showPage(page) {
  document.getElementById('pageIntro').classList.toggle('hidden', page !== 'intro');
  document.getElementById('pageBooking').classList.toggle('hidden', page !== 'booking');
  document.getElementById('pageMyBookings').classList.toggle('hidden', page !== 'myBookings');

  if (page === 'myBookings') {
    document.getElementById('lookupResults').classList.add('hidden');
    document.getElementById('lookupEmpty').classList.add('hidden');
    document.getElementById('lookupPhone').value = '';
  }

  if (page === 'booking') {
    document.getElementById('displayName').textContent = userName;
    document.getElementById('displayPhone').textContent = userPhone || '없음';
    document.getElementById('timeSlotDate').textContent = selectedDate
      ? formatDate(selectedDate)
      : '날짜를 선택하세요';
    renderCalendar();
    if (selectedDate) {
      fetchBusyTimes(selectedDate);
    } else {
      renderTimeSlots();
    }
  }
}

// ===== Intro Page =====
const nameInput = document.getElementById('nameInput');
const nameClear = document.getElementById('nameClear');
const homeForm = document.getElementById('homeForm');

nameInput.addEventListener('input', () => {
  nameClear.style.display = nameInput.value ? 'block' : 'none';
});

nameClear.addEventListener('click', () => {
  nameInput.value = '';
  nameClear.style.display = 'none';
  nameInput.focus();
});

homeForm.addEventListener('submit', (e) => {
  e.preventDefault();
  userName = nameInput.value.trim();
  userPhone = document.getElementById('phoneInput').value.replace(/-/g, '');
  if (userName && userPhone) {
    showPage('booking');
  }
});

// ===== Calendar =====
function formatDate(d) {
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${dayNames[d.getDay()]}요일`;
}

function formatDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function renderCalendar() {
  const cal = document.getElementById('calendar');
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrev = new Date(currentYear, currentMonth, 0).getDate();

  let html = `
    <div class="calendar-header">
      <div class="calendar-title">${monthNames[currentMonth]} ${currentYear}</div>
      <div class="calendar-nav">
        <button onclick="prevMonth()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg></button>
        <button onclick="nextMonth()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg></button>
      </div>
    </div>
    <div class="calendar-weekdays">
      <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
    </div>
    <div class="calendar-days">`;

  for (let i = firstDay - 1; i >= 0; i--) {
    html += `<button class="calendar-day outside" disabled>${daysInPrev - i}</button>`;
  }

  const today = new Date();
  for (let d = 1; d <= daysInMonth; d++) {
    const thisDate = new Date(currentYear, currentMonth, d);
    const disabled = isDateDisabled(thisDate);
    let cls = 'calendar-day';
    if (disabled) cls += ' outside';
    else if (selectedDate && selectedDate.getTime() === thisDate.getTime()) cls += ' selected';
    else if (today.getFullYear() === currentYear && today.getMonth() === currentMonth && today.getDate() === d) cls += ' today';
    html += `<button class="${cls}" ${disabled ? 'disabled' : `onclick="selectDate(${currentYear},${currentMonth},${d})"`}>${d}</button>`;
  }

  const totalCells = firstDay + daysInMonth;
  const remaining = (7 - (totalCells % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    html += `<button class="calendar-day outside" disabled>${i}</button>`;
  }

  html += '</div>';
  cal.innerHTML = html;
}

function prevMonth() {
  currentMonth--;
  if (currentMonth < 0) { currentMonth = 11; currentYear--; }
  renderCalendar();
}

function nextMonth() {
  currentMonth++;
  if (currentMonth > 11) { currentMonth = 0; currentYear++; }
  renderCalendar();
}

function selectDate(y, m, d) {
  selectedDate = new Date(y, m, d);
  currentYear = y;
  currentMonth = m;
  renderCalendar();
  document.getElementById('timeSlotDate').textContent = formatDate(selectedDate);
  fetchBusyTimes(selectedDate);
}

// ===== Google Calendar =====
async function fetchBusyTimes(date) {
  const dateStr = formatDateStr(date);
  const timeMin = encodeURIComponent(`${dateStr}T00:00:00+09:00`);
  const timeMax = encodeURIComponent(`${dateStr}T23:59:59+09:00`);
  const calendarId = encodeURIComponent(CONFIG.GOOGLE_CALENDAR_ID);
  const url = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?key=${CONFIG.GOOGLE_API_KEY}&timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`;

  // 로딩 표시
  const container = document.getElementById('timeSlots');
  container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--gray-400);font-size:14px;">시간 확인 중...</div>';

  try {
    const res = await fetch(url);
    const data = await res.json();

    console.log('Google Calendar API response:', data);

    if (data.error) {
      console.error('Google Calendar API error:', data.error);
      // 캘린더 공개 설정 안 된 경우 안내
      if (data.error.code === 404 || data.error.code === 403) {
        console.warn('캘린더가 공개 설정되어 있지 않거나, API 키/캘린더 ID를 확인해주세요.');
      }
      busyTimes = [];
      renderTimeSlots();
      return;
    }

    busyTimes = (data.items || []).map(event => ({
      start: new Date(event.start.dateTime || event.start.date),
      end: new Date(event.end.dateTime || event.end.date),
    }));

    console.log('Busy times:', busyTimes.map(b => `${b.start.toLocaleString()} ~ ${b.end.toLocaleString()}`));
  } catch (err) {
    console.error('Google Calendar fetch error:', err);
    busyTimes = [];
  }

  renderTimeSlots();
}

function isTimeBusy(timeStr, date) {
  const [h, m] = timeStr.split(':').map(Number);
  const slotStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, m);
  const slotEnd = new Date(slotStart.getTime() + 30 * 60 * 1000); // 30분 단위

  return busyTimes.some(busy => slotStart < busy.end && slotEnd > busy.start);
}

// ===== Time Slots =====
function renderTimeSlots() {
  const container = document.getElementById('timeSlots');
  container.innerHTML = baseTimeSlots
    .map((time) => {
      const available = !isTimeBusy(time, selectedDate);
      const isSelected = selectedTime === time;
      if (!available) {
        return `<div class="time-slot-row">
          <button class="time-slot-btn unavailable" disabled>${time}</button>
          <div class="time-slot-next visible unavailable">
            <button disabled>예약됨</button>
          </div>
        </div>`;
      }
      return `
        <div class="time-slot-row">
          <button class="time-slot-btn ${isSelected ? 'selected' : ''}" onclick="selectTime('${time}')">${time}</button>
          <div class="time-slot-next visible ${isSelected ? '' : 'placeholder'}">
            <button ${isSelected ? 'onclick="goToForm()"' : 'disabled'}>${isSelected ? '다음' : '예약'}</button>
          </div>
        </div>`;
    })
    .join('');
}

function selectTime(time) {
  selectedTime = time;
  renderTimeSlots();
}

// ===== Booking Steps =====
function showStep(step) {
  document.getElementById('stepSelect').classList.toggle('hidden', step !== 'select');
  document.getElementById('stepForm').classList.toggle('hidden', step !== 'form');
  document.getElementById('stepSuccess').classList.toggle('hidden', step !== 'success');
  document.getElementById('backBtn').classList.toggle('hidden', step !== 'form');

  const left = document.getElementById('bookingLeft');
  left.classList.toggle('form-step', step !== 'select');

  const dt = document.getElementById('selectedDatetime');
  if ((step === 'form' || step === 'success') && selectedTime && selectedDate) {
    dt.classList.remove('hidden');
    document.getElementById('dtDate').textContent = formatDate(selectedDate);
    document.getElementById('dtTime').textContent = selectedTime;
  } else {
    dt.classList.add('hidden');
  }
}

function goToForm() {
  if (selectedTime) showStep('form');
}

function goToSelect() {
  selectedTime = null;
  showStep('select');
  renderTimeSlots();
}

// ===== Google Calendar Event Creation =====
async function createCalendarEvent(bookingData) {
  if (!CONFIG.GOOGLE_APPS_SCRIPT_URL) return;

  const { name, phone, service, duration, memo, email, booking_date, booking_time } = bookingData;
  const durationMin = duration || 60;

  const params = new URLSearchParams({
    title: `[SessionHub] ${name} - ${service}`,
    date: booking_date,
    time: booking_time,
    duration: durationMin,
    description: [
      `예약자: ${name}`,
      `연락처: ${phone}`,
      `이메일: ${email}`,
      `서비스: ${service}`,
      `이용시간: ${durationMin}분`,
      memo ? `메모: ${memo}` : '',
    ].filter(Boolean).join('\n'),
    // 스프레드시트 저장용 데이터
    name,
    phone,
    email,
    service,
    memo: memo || '',
  });

  try {
    await fetch(`${CONFIG.GOOGLE_APPS_SCRIPT_URL}?${params}`, { method: 'GET', mode: 'no-cors' });
  } catch (err) {
    console.error('Google Calendar event creation error:', err);
  }
}

// ===== Booking Form Submit (Supabase) =====
document.getElementById('bookingForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const bookingData = {
    booking_id: userPhone,
    name: userName,
    phone: userPhone,
    service: document.getElementById('serviceSelect').selectedOptions[0]?.text || '',
    duration: parseInt(document.getElementById('durationSelect').value) || null,
    memo: document.getElementById('memoInput').value || null,
    email: document.getElementById('emailInput').value,
    booking_date: selectedDate ? formatDateStr(selectedDate) : null,
    booking_time: selectedTime || null,
  };

  const submitBtn = document.querySelector('.booking-submit');
  submitBtn.disabled = true;
  submitBtn.textContent = '저장 중...';

  const { error } = await supabaseClient.from('bookings').insert([bookingData]);

  if (error) {
    console.error('Supabase insert error:', error);
    alert('예약 저장 중 오류가 발생했습니다. 다시 시도해주세요.');
    submitBtn.disabled = false;
    submitBtn.textContent = '예약하기';
    return;
  }

  // 구글 캘린더에 이벤트 생성 (Supabase 저장 성공 후)
  await createCalendarEvent(bookingData);

  submitBtn.disabled = false;
  submitBtn.textContent = '예약하기';
  showStep('success');
});

// ===== My Bookings Lookup =====
document.getElementById('lookupForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const phone = document.getElementById('lookupPhone').value.replace(/-/g, '');
  if (!phone) return;

  const lookupBtn = document.querySelector('#lookupForm .btn');
  lookupBtn.disabled = true;
  lookupBtn.textContent = '조회 중...';

  const { data, error } = await supabaseClient
    .from('bookings')
    .select('*')
    .eq('booking_id', phone)
    .order('created_at', { ascending: false });

  lookupBtn.disabled = false;
  lookupBtn.textContent = '예약 조회';

  const resultsEl = document.getElementById('lookupResults');
  const emptyEl = document.getElementById('lookupEmpty');
  const listEl = document.getElementById('lookupList');

  if (error) {
    console.error('Supabase select error:', error);
    alert('조회 중 오류가 발생했습니다.');
    return;
  }

  if (!data || data.length === 0) {
    resultsEl.classList.add('hidden');
    emptyEl.classList.remove('hidden');
    return;
  }

  emptyEl.classList.add('hidden');
  resultsEl.classList.remove('hidden');

  listEl.innerHTML = data.map((b) => `
    <div class="my-booking-card">
      <div class="my-booking-row">
        <span class="my-booking-label">예약자</span>
        <span class="my-booking-value">${b.name}</span>
      </div>
      <div class="my-booking-row">
        <span class="my-booking-label">예약번호</span>
        <span class="my-booking-value">${b.booking_id}</span>
      </div>
      <div class="my-booking-row">
        <span class="my-booking-label">서비스</span>
        <span class="my-booking-value">${b.service || '-'}</span>
      </div>
      <div class="my-booking-row">
        <span class="my-booking-label">날짜</span>
        <span class="my-booking-value">${b.booking_date || '-'}</span>
      </div>
      <div class="my-booking-row">
        <span class="my-booking-label">시간</span>
        <span class="my-booking-value">${b.booking_time || '-'}</span>
      </div>
      <div class="my-booking-row">
        <span class="my-booking-label">이용시간</span>
        <span class="my-booking-value">${b.duration ? b.duration + '분' : '-'}</span>
      </div>
      <div class="my-booking-row">
        <span class="my-booking-label">이메일</span>
        <span class="my-booking-value">${b.email || '-'}</span>
      </div>
      <div class="my-booking-row">
        <span class="my-booking-label">메모</span>
        <span class="my-booking-value">${b.memo || '-'}</span>
      </div>
      <div class="my-booking-time-stamp">예약일시: ${new Date(b.created_at).toLocaleString('ko-KR')}</div>
    </div>
  `).join('');
});

// ===== Menu =====
function toggleMenu() {
  document.getElementById('menuDropdown').classList.toggle('hidden');
}
function closeMenu() {
  document.getElementById('menuDropdown').classList.add('hidden');
}
document.addEventListener('click', (e) => {
  const wrapper = document.querySelector('.menu-wrapper');
  if (wrapper && !wrapper.contains(e.target)) closeMenu();
});

// ===== Init =====
document.getElementById('goToIntroBtn').addEventListener('click', () => {
  showPage('intro');
});
showPage('intro');
