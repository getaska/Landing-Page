var GETASKA_WHATSAPP = '2349168357737';

/* ── Wizard state ────────────────────────────────────────────── */
var bw = { step: 1, service: null, duration: null, direction: null, vehicle: null };

var STEP_META = {
  1: { title: 'What do you need?', subtitle: 'Pick a service and vehicle' },
  2: { title: 'Where to?', subtitle: 'Tell us pickup and drop-off' },
  3: { title: 'When?', subtitle: 'Choose date and time' },
  4: { title: 'Review & book', subtitle: 'Check the details before you book' }
};

/* ── Calendar state ──────────────────────────────────────────── */
var cal = { required: 0, selected: [], year: 0, month: 0 };

/* ── Utilities ───────────────────────────────────────────────── */
function pad(n) { return n < 10 ? '0' + n : '' + n; }
function dateKey(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

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

  var dots = '';
  for (var p = 0; p < req; p++) dots += '<span class="gdot' + (p < sel ? ' gdot-on' : '') + '"></span>';

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
    '<div class="gcal-header">' +
      '<button type="button" class="gcal-nav" id="gcal-prev"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg></button>' +
      '<span class="gcal-month">' + MONTH_LONG[m] + ' ' + y + '</span>' +
      '<button type="button" class="gcal-nav" id="gcal-next"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg></button>' +
    '</div>' +
    '<div class="gcal-dots">' + dots + '</div>' +
    '<p class="gcal-dots-label">' + sel + ' of ' + req + ' date' + (req > 1 ? 's' : '') + ' selected</p>' +
    '<div class="gcal-grid">' +
      '<div class="gcell-lbl">MO</div><div class="gcell-lbl">TU</div><div class="gcell-lbl">WE</div>' +
      '<div class="gcell-lbl">TH</div><div class="gcell-lbl">FR</div><div class="gcell-lbl">SA</div><div class="gcell-lbl">SU</div>' +
      cells +
    '</div>' +
    '<button type="button" id="gcal-confirm" class="gcal-confirm"' + (remaining > 0 ? ' disabled' : '') + '>' +
      confirmLabel +
    '</button>';

  var prevBtn = document.getElementById('gcal-prev');
  if (y === now.getFullYear() && m === now.getMonth()) {
    prevBtn.disabled = true; prevBtn.style.opacity = '0.2'; prevBtn.style.cursor = 'default';
  }

  prevBtn.addEventListener('click', function() {
    cal.month--; if (cal.month < 0) { cal.month = 11; cal.year--; } drawCalendar();
  });
  document.getElementById('gcal-next').addEventListener('click', function() {
    cal.month++; if (cal.month > 11) { cal.month = 0; cal.year++; } drawCalendar();
  });

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

  if (remaining === 0) {
    document.getElementById('gcal-confirm').addEventListener('click', function() {
      closeModal();
      drawTimePickers();
      updatePickBtn(bw.service === 'airport' ? 'open-calendar-airport' : 'open-calendar');
      updateCta();
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
      '<input type="time" name="time-' + i + '" style="' + timeStyle + '">' +
      '</div></div>';
  }).join('');

  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '10px';
}

/* ── Monthly booking date fields ─────────────────────────────── */
function renderMonthlyFields() {
  var s = 'border-radius:100px;padding:16px 24px;min-height:60px;width:100%;display:block;' +
    'box-sizing:border-box;border:1px solid #eff0f6;box-shadow:0 2px 7px 0 rgba(20,20,43,.08);' +
    'font-size:16px;font-family:inherit;color:#373737;-webkit-text-fill-color:#373737;background:#fff;';
  return '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">' +
    '<div><label class="brix---input-label">Start Date</label><input id="start-date" name="start-date" type="date" style="' + s + '"></div>' +
    '<div><label class="brix---input-label">End Date</label><input id="end-date" name="end-date" type="date" style="' + s + '"></div>' +
    '</div>';
}

/* ── Pick-dates button label / reset ──────────────────────────── */
function updatePickBtn(btnId) {
  var btn = document.getElementById(btnId);
  if (!btn) return;
  var labels = cal.selected.slice().sort(function(a,b){ return a - b; }).map(function(d) {
    return MONTH_SHORT[d.getMonth()] + ' ' + d.getDate();
  }).join(', ');
  btn.innerHTML = '📅 ' + labels + ' <span style="font-size:12px;opacity:0.75;">(tap to change)</span>';
  btn.style.background = '#e8f7f5';
  btn.style.color      = '#2a9f8f';
  btn.style.border     = '1.5px solid #a8ddd6';
  btn.style.opacity    = '1';
}

function resetDateSection(clearDaysInput) {
  cal.selected = [];
  var daysInput  = document.getElementById('bd-days');
  var openCalBtn = document.getElementById('open-calendar');
  var airportBtn = document.getElementById('open-calendar-airport');
  var timePick   = document.getElementById('date-time-pickers');

  if (clearDaysInput && daysInput) daysInput.value = '';

  if (timePick) { timePick.innerHTML = ''; timePick.style.display = 'none'; }

  if (openCalBtn) {
    openCalBtn.innerHTML = '📅 Pick Dates';
    openCalBtn.style.cssText = 'flex:1;padding:0 20px;background:#2a9f8f;color:#fff;border:none;' +
      'border-radius:100px;font-size:15px;font-weight:600;cursor:pointer;min-height:60px;' +
      'display:flex;align-items:center;justify-content:center;gap:8px;opacity:0.45;transition:all .2s;';
    openCalBtn.disabled = true;
  }
  if (airportBtn) {
    airportBtn.innerHTML = '📅 Pick Date';
    airportBtn.style.cssText = 'width:100%;padding:0 20px;background:#2a9f8f;color:#fff;border:none;' +
      'border-radius:100px;font-size:15px;font-weight:600;cursor:pointer;min-height:60px;' +
      'display:flex;align-items:center;justify-content:center;gap:8px;transition:all .2s;';
  }
}

/* ── Service / sub-choice / vehicle selection ────────────────── */
function selectService(id) {
  bw.service = id;
  bw.duration = null;
  bw.direction = null;

  document.querySelectorAll('#bw-service-grid .bw-card').forEach(function(c) {
    c.classList.toggle('is-selected', c.getAttribute('data-service') === id);
  });
  document.querySelectorAll('#bw-duration-row .bw-pill, #bw-direction-row .bw-pill').forEach(function(p) {
    p.classList.remove('is-selected');
  });
  document.getElementById('bw-duration-row').style.display = (id === 'chauffeur') ? 'block' : 'none';
  document.getElementById('bw-direction-row').style.display = (id === 'airport') ? 'block' : 'none';

  var daysInput = document.getElementById('bd-days');
  if (daysInput) daysInput.value = '';
  cal.required = 0;
  resetDateSection(false);

  var monthlyEl = document.getElementById('monthly-fields');
  if (monthlyEl) { monthlyEl.innerHTML = ''; monthlyEl.removeAttribute('data-rendered'); monthlyEl.style.display = 'none'; }

  updateCta();
}

function selectDuration(id) {
  bw.duration = id;
  document.querySelectorAll('#bw-duration-row .bw-pill').forEach(function(p) {
    p.classList.toggle('is-selected', p.getAttribute('data-duration') === id);
  });
  updateCta();
}

function selectDirection(id) {
  bw.direction = id;
  document.querySelectorAll('#bw-direction-row .bw-pill').forEach(function(p) {
    p.classList.toggle('is-selected', p.getAttribute('data-direction') === id);
  });
  updateCta();
}

function selectVehicle(id) {
  bw.vehicle = id;
  document.querySelectorAll('#bw-vehicle-list .bw-vcard').forEach(function(v) {
    v.classList.toggle('is-selected', v.getAttribute('data-vehicle') === id);
  });
  updateCta();
}

/* ── Step validity ───────────────────────────────────────────── */
function step1Valid() {
  if (!bw.service || !bw.vehicle) return false;
  if (bw.service === 'chauffeur' && !bw.duration) return false;
  if (bw.service === 'airport' && !bw.direction) return false;
  return true;
}
function step2Valid() {
  var p = document.getElementById('bd-pickup');
  var d = document.getElementById('bd-destination');
  return !!(p && p.value.trim()) && !!(d && d.value.trim());
}
function step3Valid() {
  if (bw.service === 'monthly') {
    var s = document.getElementById('start-date');
    var e = document.getElementById('end-date');
    return !!(s && s.value) && !!(e && e.value);
  }
  var required = bw.service === 'airport' ? 1 : (parseInt((document.getElementById('bd-days') || {}).value, 10) || 0);
  if (!required || cal.selected.length !== required) return false;
  for (var i = 0; i < required; i++) {
    var t = document.querySelector('[name="time-' + i + '"]');
    if (!t || !t.value) return false;
  }
  return true;
}
function step4Valid() {
  var n = document.getElementById('bd-name');
  var p = document.getElementById('bd-phone');
  return !!(n && n.value.trim()) && !!(p && p.value.trim());
}
function currentStepValid() {
  if (bw.step === 1) return step1Valid();
  if (bw.step === 2) return step2Valid();
  if (bw.step === 3) return step3Valid();
  return step4Valid();
}

function updateCta() {
  var btn = document.getElementById('bw-cta');
  if (!btn) return;
  btn.disabled = !currentStepValid();
  if (bw.step < 4) {
    btn.textContent = 'Continue';
    btn.classList.remove('bw-cta-final');
  } else {
    btn.textContent = 'Book via WhatsApp';
    btn.classList.add('bw-cta-final');
  }
}

/* ── Step 3 visibility per service ───────────────────────────── */
function setupStep3Visibility() {
  var monthlyEl = document.getElementById('monthly-fields');
  var daysWrapper = document.getElementById('days-wrapper');
  var airportWrapper = document.getElementById('airport-date-wrapper');

  monthlyEl.style.display = 'none';
  daysWrapper.style.display = 'none';
  airportWrapper.style.display = 'none';

  if (bw.service === 'monthly') {
    if (!monthlyEl.getAttribute('data-rendered')) {
      monthlyEl.innerHTML = renderMonthlyFields();
      monthlyEl.setAttribute('data-rendered', '1');
    }
    monthlyEl.style.display = 'block';
  } else if (bw.service === 'airport') {
    airportWrapper.style.display = 'block';
    cal.required = 1;
    if (cal.selected.length) updatePickBtn('open-calendar-airport');
  } else {
    daysWrapper.style.display = 'block';
  }
}

/* ── Review summary (step 4) ──────────────────────────────────── */
function getServiceSummaryLabel() {
  if (bw.service === 'chauffeur') return 'Chauffeur Service' + (bw.duration ? ' (' + bw.duration + ' Hours)' : '');
  if (bw.service === 'airport') return bw.direction === 'dropoff' ? 'Airport Drop-off' : 'Airport Pickup';
  if (bw.service === 'corporate') return 'Corporate Transportation';
  if (bw.service === 'monthly') return 'Monthly Booking';
  if (bw.service === 'event') return 'Event Transportation';
  return '';
}

function getDateSummary() {
  if (bw.service === 'monthly') {
    var s = document.getElementById('start-date');
    var e = document.getElementById('end-date');
    return ((s && s.value) || '—') + '  →  ' + ((e && e.value) || '—');
  }
  if (!cal.selected.length) return '—';
  var sorted = cal.selected.slice().sort(function(a, b) { return a - b; });
  return sorted.map(function(d, i) {
    var t = document.querySelector('[name="time-' + i + '"]');
    var tv = t ? t.value : '';
    return fmtDate(d) + (tv ? ' at ' + tv : '');
  }).join(', ');
}

function summaryRow(label, value) {
  return '<div class="bw-summary-row"><span class="bw-label">' + escapeHtml(label) + '</span><span class="bw-value">' + escapeHtml(value) + '</span></div>';
}

function buildSummary() {
  var pickup = (document.getElementById('bd-pickup') || {}).value || '—';
  var destination = (document.getElementById('bd-destination') || {}).value || '—';
  document.getElementById('bw-summary').innerHTML =
    summaryRow('Service', getServiceSummaryLabel() || '—') +
    summaryRow('Vehicle', bw.vehicle || '—') +
    summaryRow('Route', pickup + '  →  ' + destination) +
    summaryRow('Date & time', getDateSummary());
}

/* ── Step navigation ─────────────────────────────────────────── */
function goToStep(n) {
  bw.step = n;
  for (var i = 1; i <= 4; i++) {
    var el = document.getElementById('bw-step-' + i);
    if (el) el.style.display = (i === n) ? 'flex' : 'none';
    var seg = document.getElementById('bw-seg-' + i);
    if (seg) seg.classList.toggle('bw-seg-on', i <= n);
  }
  document.getElementById('bw-title').textContent = STEP_META[n].title;
  document.getElementById('bw-subtitle').textContent = STEP_META[n].subtitle;
  document.getElementById('bw-step-badge').textContent = 'Step ' + n + ' of 4';
  document.getElementById('bw-back').style.display = n > 1 ? 'flex' : 'none';

  if (n === 3) setupStep3Visibility();
  if (n === 4) buildSummary();

  updateCta();
  var card = document.querySelector('.book-form-card');
  if (card) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ── WhatsApp message ────────────────────────────────────────── */
function buildMessage() {
  var name = (document.getElementById('bd-name') || {}).value || '';
  var phone = (document.getElementById('bd-phone') || {}).value || '';
  var pickup = (document.getElementById('bd-pickup') || {}).value || '';
  var destination = (document.getElementById('bd-destination') || {}).value || '';

  var dateInfo = '';
  if (bw.service === 'monthly') {
    var s = document.getElementById('start-date');
    var e = document.getElementById('end-date');
    dateInfo = 'Start Date: ' + ((s && s.value) || '') + '\nEnd Date: ' + ((e && e.value) || '');
  } else {
    var daysInput = document.getElementById('bd-days');
    if (bw.service !== 'airport' && daysInput && daysInput.value) {
      dateInfo += 'Number of Days: ' + daysInput.value + '\n';
    }
    var sorted = cal.selected.slice().sort(function(a, b) { return a - b; });
    sorted.forEach(function(d, i) {
      var t = document.querySelector('[name="time-' + i + '"]');
      var tv = t ? t.value : '';
      dateInfo += fmtDate(d) + (tv ? ' at ' + tv : '') + '\n';
    });
  }

  var message =
    'Hello Getaska! I want to book a ride.\n\n' +
    'Name: '        + name        + '\n' +
    'Phone: '       + phone       + '\n' +
    'Service: '     + getServiceSummaryLabel() + '\n' +
    'Vehicle: '     + (bw.vehicle || '') + '\n' +
    'Pickup: '      + pickup      + '\n' +
    'Destination: ' + destination +
    (dateInfo ? '\n\n' + dateInfo : '');

  window.open('https://wa.me/' + GETASKA_WHATSAPP + '?text=' + encodeURIComponent(message), '_blank', 'noopener');
}

/* ── Reset whole wizard ──────────────────────────────────────── */
function restartWizard() {
  bw = { step: 1, service: null, duration: null, direction: null, vehicle: null };
  document.querySelectorAll('.bw-card.is-selected, .bw-pill.is-selected, .bw-vcard.is-selected').forEach(function(el) {
    el.classList.remove('is-selected');
  });
  document.getElementById('bw-duration-row').style.display = 'none';
  document.getElementById('bw-direction-row').style.display = 'none';

  var bookingForm = document.getElementById('booking-form');
  if (bookingForm) bookingForm.reset();

  cal.selected = [];
  cal.required = 0;
  resetDateSection(true);

  var monthlyEl = document.getElementById('monthly-fields');
  if (monthlyEl) { monthlyEl.innerHTML = ''; monthlyEl.removeAttribute('data-rendered'); monthlyEl.style.display = 'none'; }

  var headerEl = document.querySelector('.bw-header');
  if (headerEl) headerEl.style.display = 'flex';
  document.getElementById('bw-progress').style.display = 'flex';
  if (bookingForm) bookingForm.style.display = 'block';
  document.getElementById('bw-success').style.display = 'none';
  document.getElementById('booking-message').innerHTML = '';

  goToStep(1);
}

/* ── Wire up DOM ─────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('#bw-service-grid .bw-card').forEach(function(card) {
    card.addEventListener('click', function() { selectService(this.getAttribute('data-service')); });
  });
  document.querySelectorAll('#bw-duration-row .bw-pill').forEach(function(p) {
    p.addEventListener('click', function() { selectDuration(this.getAttribute('data-duration')); });
  });
  document.querySelectorAll('#bw-direction-row .bw-pill').forEach(function(p) {
    p.addEventListener('click', function() { selectDirection(this.getAttribute('data-direction')); });
  });
  document.querySelectorAll('#bw-vehicle-list .bw-vcard').forEach(function(v) {
    v.addEventListener('click', function() { selectVehicle(this.getAttribute('data-vehicle')); });
  });

  ['bd-pickup', 'bd-destination', 'bd-name', 'bd-phone'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('input', updateCta);
  });

  var monthlyFieldsContainer = document.getElementById('monthly-fields');
  if (monthlyFieldsContainer) {
    monthlyFieldsContainer.addEventListener('input', updateCta);
    monthlyFieldsContainer.addEventListener('change', updateCta);
  }
  var timePickersContainer = document.getElementById('date-time-pickers');
  if (timePickersContainer) {
    timePickersContainer.addEventListener('input', updateCta);
    timePickersContainer.addEventListener('change', updateCta);
  }

  var daysInput   = document.getElementById('bd-days');
  var daysWrapper = document.getElementById('days-wrapper');
  var openCalBtn  = document.getElementById('open-calendar');
  var airportBtn  = document.getElementById('open-calendar-airport');
  var calModal    = document.getElementById('cal-modal');

  if (daysInput) {
    daysInput.addEventListener('input', function() {
      this.value = this.value.replace(/[^0-9]/g, '');
      var n = parseInt(this.value, 10);
      resetDateSection(false);
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
      updateCta();
    });
  }

  if (openCalBtn) {
    openCalBtn.addEventListener('click', function() {
      if (!this.disabled) openModal();
    });
  }
  if (airportBtn) {
    airportBtn.addEventListener('click', function() {
      cal.required = 1;
      openModal();
    });
  }

  var closeBtn = document.getElementById('cal-close');
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (calModal) {
    calModal.addEventListener('click', function(e) {
      if (e.target === calModal) closeModal();
    });
  }

  var backBtn = document.getElementById('bw-back');
  if (backBtn) backBtn.addEventListener('click', function() { if (bw.step > 1) goToStep(bw.step - 1); });

  var restartBtn = document.getElementById('bw-restart');
  if (restartBtn) restartBtn.addEventListener('click', restartWizard);

  var bookingForm = document.getElementById('booking-form');
  if (bookingForm) {
    bookingForm.addEventListener('submit', function(e) {
      e.preventDefault();
      if (!currentStepValid()) return;

      if (bw.step < 4) {
        goToStep(bw.step + 1);
        return;
      }

      buildMessage();

      var headerEl = document.querySelector('.bw-header');
      if (headerEl) headerEl.style.display = 'none';
      document.getElementById('bw-progress').style.display = 'none';
      bookingForm.style.display = 'none';
      document.getElementById('bw-success').style.display = 'flex';
    });
  }

  updateCta();
});
