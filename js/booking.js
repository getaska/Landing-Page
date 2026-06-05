var GETASKA_WHATSAPP = '2349168357737';

/* ── Calendar state ──────────────────────────────────────────── */
var cal = { required: 0, selected: [], year: 0, month: 0 };

/* ── Utilities ───────────────────────────────────────────────── */
function pad(n) { return n < 10 ? '0' + n : '' + n; }
function dateKey(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }

var MONTH_LONG  = ['January','February','March','April','May','June','July','August','September','October','November','December'];
var MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function fmtDate(d) { return MONTH_SHORT[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear(); }
function isSelected(d) { var k = dateKey(d); return cal.selected.some(function(s){ return dateKey(s) === k; }); }
function isToday(d)    { var t = new Date(); return d.getFullYear()===t.getFullYear() && d.getMonth()===t.getMonth() && d.getDate()===t.getDate(); }
function isPast(d)     { var t = new Date(); t.setHours(0,0,0,0); return d < t; }

/* ── Calendar renderer ───────────────────────────────────────── */
function drawCalendar() {
  var y = cal.year, m = cal.month, now = new Date();
  var firstDow  = (new Date(y, m, 1).getDay() + 6) % 7;   // 0 = Monday
  var daysInMon = new Date(y, m + 1, 0).getDate();
  var sel = cal.selected.length, req = cal.required;

  /* Progress dots */
  var dots = '';
  for (var p = 0; p < req; p++) dots += '<span class="gdot' + (p < sel ? ' gdot-on' : '') + '"></span>';

  /* Day cells */
  var cells = '';
  for (var e = 0; e < firstDow; e++) cells += '<div class="gcell"></div>';
  for (var day = 1; day <= daysInMon; day++) {
    var d   = new Date(y, m, day);
    var cls = 'gcell';
    if (isPast(d)) { cls += ' gcell-past'; }
    else {
      cls += ' gcell-active';
      if (isSelected(d)) cls += ' gcell-sel';
      if (isToday(d))    cls += ' gcell-today';
    }
    cells += '<div class="' + cls + '" data-k="' + dateKey(d) + '">' + day + '</div>';
  }

  var remaining     = req - sel;
  var confirmLabel  = remaining > 0
    ? 'Select ' + remaining + ' more date' + (remaining > 1 ? 's' : '')
    : 'Confirm Dates ✓';

  document.getElementById('cal-title').textContent = 'Select your ' + req + ' date' + (req > 1 ? 's' : '');
  document.getElementById('cal-body').innerHTML =
    /* Month nav */
    '<div class="gcal-header">' +
      '<button type="button" class="gcal-nav" id="gcal-prev"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg></button>' +
      '<span class="gcal-month">' + MONTH_LONG[m] + ' ' + y + '</span>' +
      '<button type="button" class="gcal-nav" id="gcal-next"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg></button>' +
    '</div>' +
    /* Progress */
    '<div class="gcal-dots">' + dots + '</div>' +
    '<p class="gcal-dots-label">' + sel + ' of ' + req + ' date' + (req > 1 ? 's' : '') + ' selected</p>' +
    /* Grid */
    '<div class="gcal-grid">' +
      '<div class="gcell-lbl">MO</div><div class="gcell-lbl">TU</div><div class="gcell-lbl">WE</div>' +
      '<div class="gcell-lbl">TH</div><div class="gcell-lbl">FR</div><div class="gcell-lbl">SA</div><div class="gcell-lbl">SU</div>' +
      cells +
    '</div>' +
    /* Confirm */
    '<button type="button" id="gcal-confirm" class="gcal-confirm"' + (remaining > 0 ? ' disabled' : '') + '>' +
      confirmLabel +
    '</button>';

  /* Disable prev when on current month */
  var prevBtn = document.getElementById('gcal-prev');
  if (y === now.getFullYear() && m === now.getMonth()) {
    prevBtn.disabled = true; prevBtn.style.opacity = '0.2'; prevBtn.style.cursor = 'default';
  }

  /* Month navigation */
  prevBtn.addEventListener('click', function() {
    cal.month--; if (cal.month < 0) { cal.month = 11; cal.year--; } drawCalendar();
  });
  document.getElementById('gcal-next').addEventListener('click', function() {
    cal.month++; if (cal.month > 11) { cal.month = 0; cal.year++; } drawCalendar();
  });

  /* Day selection */
  document.querySelectorAll('.gcell.gcell-active').forEach(function(cell) {
    cell.addEventListener('click', function() {
      var k = this.getAttribute('data-k');
      var idx = -1;
      cal.selected.forEach(function(s, i) { if (dateKey(s) === k) idx = i; });
      if (idx !== -1) {
        cal.selected.splice(idx, 1);
      } else if (cal.selected.length < cal.required) {
        var pts = k.split('-');
        cal.selected.push(new Date(+pts[0], +pts[1] - 1, +pts[2]));
      }
      drawCalendar();
    });
  });

  /* Confirm */
  if (remaining === 0) {
    document.getElementById('gcal-confirm').addEventListener('click', function() {
      closeModal();
      drawTimePickers();
      updatePickBtn();
    });
  }
}

/* ── Modal open / close ──────────────────────────────────────── */
function openModal() {
  var now = new Date();
  cal.year = now.getFullYear(); cal.month = now.getMonth();
  drawCalendar();
  document.getElementById('cal-modal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('cal-modal').style.display = 'none';
  document.body.style.overflow = '';
}

/* ── Time pickers (after dates confirmed) ────────────────────── */
function drawTimePickers() {
  cal.selected.sort(function(a, b) { return a - b; });
  var container = document.getElementById('date-time-pickers');

  var timeStyle = '-webkit-appearance:none;-moz-appearance:none;appearance:none;' +
    'border-radius:12px;padding:12px 16px;min-height:46px;height:auto;width:100%;' +
    'display:block;box-sizing:border-box;border:1px solid #c8e8e3;font-size:15px;' +
    'font-family:inherit;color:#373737;-webkit-text-fill-color:#373737;background:#fff;' +
    'box-shadow:none;margin:0;';

  container.innerHTML = cal.selected.map(function(d, i) {
    return '<div style="display:flex;align-items:center;gap:12px;padding:14px 16px;' +
      'background:#f4faf9;border-radius:14px;border:1px solid #d1ede9;">' +
      '<div style="width:36px;height:36px;background:#2a9f8f;border-radius:50%;flex-shrink:0;' +
      'display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:#fff;">' + (i + 1) + '</div>' +
      '<div style="flex:1;">' +
      '<div style="font-size:13px;font-weight:700;color:#172b33;margin-bottom:6px;">' + fmtDate(d) + '</div>' +
      '<label style="font-size:11px;font-weight:600;color:#6e8a96;letter-spacing:.5px;text-transform:uppercase;display:block;margin-bottom:4px;">Pickup Time</label>' +
      '<input type="time" name="time-' + i + '" required style="' + timeStyle + '">' +
      '</div></div>';
  }).join('');

  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '10px';
}

/* ── Update pick button after dates selected ─────────────────── */
function updatePickBtn() {
  var btn = document.getElementById('open-calendar');
  var labels = cal.selected.map(function(d) {
    return MONTH_SHORT[d.getMonth()] + ' ' + d.getDate();
  }).join(', ');
  btn.innerHTML = '📅 ' + labels + ' <span style="font-size:12px;opacity:0.75;">(tap to change)</span>';
  btn.style.background = '#e8f7f5';
  btn.style.color      = '#2a9f8f';
  btn.style.border     = '1.5px solid #a8ddd6';
  btn.style.opacity    = '1';
}

var AIRPORT_SERVICES = ['Airport Pickup', 'Airport Drop-off'];

/* ── Single date + time field (airport services) ─────────────── */
function renderSingleDateTime() {
  var s = 'border-radius:100px;padding:16px 24px;min-height:60px;width:100%;display:block;' +
    'box-sizing:border-box;border:1px solid #eff0f6;box-shadow:0 2px 7px 0 rgba(20,20,43,.08);' +
    'font-size:16px;font-family:inherit;color:#373737;-webkit-text-fill-color:#373737;background:#fff;';
  return '<div><label class="brix---input-label">Date &amp; Time</label>' +
    '<input name="airport-datetime" type="datetime-local" required style="' + s + '"></div>';
}

/* ── Monthly booking date fields ─────────────────────────────── */
function renderMonthlyFields() {
  var s = 'border-radius:100px;padding:16px 24px;min-height:60px;width:100%;display:block;' +
    'box-sizing:border-box;border:1px solid #eff0f6;box-shadow:0 2px 7px 0 rgba(20,20,43,.08);' +
    'font-size:16px;font-family:inherit;color:#373737;-webkit-text-fill-color:#373737;background:#fff;';
  return '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">' +
    '<div><label class="brix---input-label">Start Date</label><input name="start-date" type="date" required style="' + s + '"></div>' +
    '<div><label class="brix---input-label">End Date</label><input name="end-date" type="date" required style="' + s + '"></div>' +
    '</div>';
}

/* ── Reset helper ────────────────────────────────────────────── */
function resetDateSection(clearDaysInput) {
  cal.selected = [];
  var daysInput  = document.getElementById('bd-days');
  var openCalBtn = document.getElementById('open-calendar');
  var timePick   = document.getElementById('date-time-pickers');
  var monthFlds  = document.getElementById('monthly-fields');

  // Only clear the days input when explicitly requested (service change / form reset)
  if (clearDaysInput && daysInput) daysInput.value = '';

  if (timePick)   { timePick.innerHTML = ''; timePick.style.display = 'none'; }
  if (monthFlds)  { monthFlds.innerHTML = ''; monthFlds.style.display = 'none'; }
  if (openCalBtn) {
    openCalBtn.innerHTML = '📅 Pick Dates';
    openCalBtn.style.cssText = 'flex:1;padding:0 20px;background:#2a9f8f;color:#fff;border:none;' +
      'border-radius:100px;font-size:15px;font-weight:600;cursor:pointer;min-height:60px;' +
      'display:flex;align-items:center;justify-content:center;gap:8px;opacity:0.45;transition:all .2s;';
    openCalBtn.disabled = true;
  }
}

/* ── Wire up DOM ─────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function() {
  var serviceSelect = document.getElementById('bd-service');
  var daysInput     = document.getElementById('bd-days');
  var daysWrapper   = document.getElementById('days-wrapper');
  var openCalBtn    = document.getElementById('open-calendar');
  var calModal      = document.getElementById('cal-modal');

  /* Service change */
  if (serviceSelect) {
    serviceSelect.addEventListener('change', function() {
      var svc = this.value;
      resetDateSection(true);
      var mf = document.getElementById('monthly-fields');
      if (AIRPORT_SERVICES.indexOf(svc) !== -1) {
        daysWrapper.style.display = 'none';
        mf.innerHTML = renderSingleDateTime();
        mf.style.display = 'block';
      } else if (svc === 'Monthly Booking') {
        daysWrapper.style.display = 'none';
        mf.innerHTML = renderMonthlyFields();
        mf.style.display = 'block';
      } else if (svc) {
        daysWrapper.style.display = 'block';
      } else {
        daysWrapper.style.display = 'none';
      }
    });
  }

  /* Days input */
  if (daysInput) {
    daysInput.addEventListener('input', function() {
      // Strip any non-numeric characters the user might type
      this.value = this.value.replace(/[^0-9]/g, '');
      var n = parseInt(this.value, 10);
      resetDateSection(false); // keep days input value — only reset calendar/time pickers
      daysWrapper.style.display = 'block';
      var btn = document.getElementById('open-calendar');
      if (n >= 1 && n <= 30) {
        cal.required = n;
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor  = 'pointer';
      } else {
        btn.disabled = true;
        btn.style.opacity = '0.45';
      }
    });
  }

  /* Open calendar button */
  if (openCalBtn) {
    openCalBtn.addEventListener('click', function() {
      if (!this.disabled) openModal();
    });
  }

  /* Close modal */
  var closeBtn = document.getElementById('cal-close');
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (calModal) {
    calModal.addEventListener('click', function(e) {
      if (e.target === calModal) closeModal();
    });
  }

  /* Form submit */
  var bookingForm = document.getElementById('booking-form');
  if (bookingForm) {
    bookingForm.addEventListener('submit', function(e) {
      e.preventDefault();
      var data    = new FormData(bookingForm);
      var service = data.get('service') || '';
      var dateInfo = '';

      if (AIRPORT_SERVICES.indexOf(service) !== -1) {
        dateInfo = 'Date & Time: ' + (data.get('airport-datetime') || '');
      } else if (service === 'Monthly Booking') {
        dateInfo = 'Start Date: ' + (data.get('start-date') || '') +
                   '\nEnd Date: '  + (data.get('end-date')   || '');
      } else {
        var daysN = data.get('days') || '';
        if (daysN) dateInfo = 'Number of Days: ' + daysN + '\n';
        cal.selected.sort(function(a,b){ return a-b; }).forEach(function(d, i) {
          var t = data.get('time-' + i) || '';
          dateInfo += fmtDate(d) + (t ? ' at ' + t : '') + '\n';
        });
      }

      var message =
        'Hello Getaska! I want to book a ride.\n\n' +
        'Name: '        + (data.get('name')        || '') + '\n' +
        'Phone: '       + (data.get('phone')        || '') + '\n' +
        'Service: '     + service                          + '\n' +
        'Vehicle: '     + (data.get('vehicle')      || '') + '\n' +
        'Pickup: '      + (data.get('pickup')       || '') + '\n' +
        'Destination: ' + (data.get('destination')  || '') +
        (dateInfo ? '\n\n' + dateInfo : '');

      window.open('https://wa.me/' + GETASKA_WHATSAPP + '?text=' + encodeURIComponent(message), '_blank');

      document.getElementById('booking-message').innerHTML =
        "<span style='color:green;font-weight:600;'>Redirecting to WhatsApp — we'll confirm your booking shortly!</span>";

      bookingForm.reset();
      if (serviceSelect) serviceSelect.value = '';
      daysWrapper.style.display = 'none';
      resetDateSection(true); // full reset including days input after submission
    });
  }
});
