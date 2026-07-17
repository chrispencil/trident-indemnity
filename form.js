document.addEventListener('DOMContentLoaded', () => {
  const $ = (id) => document.getElementById(id);

  const studentName = $('student-name');
  const ageRadios = document.querySelectorAll('input[name="age-bracket"]');
  const guardianFields = $('guardian-fields');
  const guardianName = $('guardian-name');
  const signedBy = $('signed-by');
  const place = $('place');
  const date = $('date');
  const idNumber = $('id-number');
  const dob = $('dob');
  const email = $('email');
  const cell = $('cell');
  const nextOfKin = $('next-of-kin');
  const nextOfKinCell = $('next-of-kin-cell');

  const waiverBox = $('waiver-box');
  const scrollBar = $('scroll-progress-bar');
  const scrollStatus = $('scroll-status');

  const sigCanvas = $('sig-canvas');
  const sigStatus = $('sig-status');
  const sigClearBtn = $('sig-clear');
  const sigPad = createSignaturePad(sigCanvas);

  const submitBtn = $('submit-btn');
  const submitGate = $('submit-gate');
  const submitHint = $('submit-hint');
  const formWrap = $('form-wrap');
  const screenSuccess = $('screen-success');
  const screenError = $('screen-error');
  const errorDetail = $('error-detail');
  const mailtoLink = $('mailto-fallback');
  const downloadPdfLink = $('download-pdf');

  let waiverRead = false;

  // Defaults
  place.value = 'Trident Fight Centre, Durbanville';
  date.value = new Date().toISOString().slice(0, 10);

  // Age bracket toggle
  ageRadios.forEach((radio) => {
    radio.addEventListener('change', () => {
      document.querySelectorAll('.radio-card').forEach((c) => c.classList.remove('selected'));
      radio.closest('.radio-card').classList.add('selected');
      const isUnder18 = radio.value === 'under18';
      guardianFields.classList.toggle('show', isUnder18);
      guardianName.required = isUnder18;
      syncSignedBy();
      validate();
    });
  });

  function syncSignedBy() {
    const under18 = document.querySelector('input[name="age-bracket"]:checked')?.value === 'under18';
    if (under18) {
      if (!signedBy.dataset.userEdited) signedBy.value = guardianName.value;
    } else {
      if (!signedBy.dataset.userEdited) signedBy.value = studentName.value;
    }
  }

  studentName.addEventListener('input', syncSignedBy);
  guardianName.addEventListener('input', syncSignedBy);
  signedBy.addEventListener('input', () => { signedBy.dataset.userEdited = '1'; });

  // Waiver scroll gate
  waiverBox.addEventListener('scroll', () => {
    const scrollable = waiverBox.scrollHeight - waiverBox.clientHeight;
    const pct = scrollable <= 0 ? 100 : Math.min(100, Math.round((waiverBox.scrollTop / scrollable) * 100));
    scrollBar.style.width = pct + '%';
    if (pct >= 97 && !waiverRead) {
      waiverRead = true;
      scrollStatus.textContent = 'Read to the end';
      scrollStatus.classList.add('done');
      validate();
    }
  });

  // Signature status
  sigCanvas.addEventListener('sig:change', () => {
    sigStatus.textContent = sigPad.isEmpty() ? 'Not signed yet' : 'Signature captured';
    sigStatus.classList.toggle('done', !sigPad.isEmpty());
    validate();
  });

  sigClearBtn.addEventListener('click', () => sigPad.clear());

  // Validation
  const idPattern = /^\d{13}$/;
  const cellPattern = /^[\d+\s]{9,15}$/;

  function validate() {
    const under18 = document.querySelector('input[name="age-bracket"]:checked')?.value === 'under18';
    const ageSelected = !!document.querySelector('input[name="age-bracket"]:checked');
    const guardianOk = !under18 || guardianName.value.trim().length > 1;

    const ok =
      studentName.value.trim().length > 1 &&
      ageSelected &&
      guardianOk &&
      signedBy.value.trim().length > 1 &&
      place.value.trim().length > 1 &&
      date.value &&
      idPattern.test(idNumber.value.trim()) &&
      dob.value &&
      email.checkValidity() &&
      cellPattern.test(cell.value.trim()) &&
      nextOfKin.value.trim().length > 1 &&
      cellPattern.test(nextOfKinCell.value.trim()) &&
      waiverRead &&
      !sigPad.isEmpty();

    submitBtn.disabled = !ok;
    if (ok) hideSubmitHint();
    return ok;
  }

  // Tell the user *why* the (disabled) submit button won't respond. A disabled
  // button swallows its own clicks, so pointer-events is off on it (see CSS) and
  // the click lands on this wrapper instead.
  function hideSubmitHint() {
    submitHint.hidden = true;
  }

  function showSubmitReason() {
    if (!waiverRead) {
      submitHint.textContent = 'Please scroll to the end of the waiver above and read it in full before submitting.';
      submitHint.hidden = false;
      waiverBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
      scrollStatus.classList.remove('flash');
      // reflow so the animation restarts even if it was recently played
      void scrollStatus.offsetWidth;
      scrollStatus.classList.add('flash');
    } else {
      submitHint.textContent = 'Please complete all required fields and add your signature before submitting.';
      submitHint.hidden = false;
    }
  }

  submitGate.addEventListener('click', () => {
    if (submitBtn.disabled) showSubmitReason();
  });

  [studentName, guardianName, signedBy, place, date, idNumber, dob, email, cell, nextOfKin, nextOfKinCell]
    .forEach((el) => el.addEventListener('input', validate));

  validate();

  // Submit
  const form = $('indemnity-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validate()) return;

    submitBtn.disabled = true;
    const originalLabel = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="spinner"></span>Sending…';

    const under18 = document.querySelector('input[name="age-bracket"]:checked').value === 'under18';
    const signatureData = sigPad.toDataURL(600, 200);

    const record = {
      form_version: CONFIG.FORM_VERSION,
      submitted_at: new Date().toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' }),
      student_name: studentName.value.trim(),
      age_bracket: under18 ? 'Under 18 (Parent/Guardian signed)' : 'Over 18',
      guardian_name: under18 ? guardianName.value.trim() : '—',
      signed_by: signedBy.value.trim(),
      place: place.value.trim(),
      date: date.value,
      id_number: idNumber.value.trim(),
      dob: dob.value,
      email: email.value.trim(),
      cell: cell.value.trim(),
      next_of_kin: nextOfKin.value.trim(),
      next_of_kin_cell: nextOfKinCell.value.trim(),
      signature_image: signatureData
    };

    // Build the PDF in the browser so the exact signed document travels with the request.
    const pdfBytes = new Uint8Array(buildWaiverPdf(record, getLogoDataUrl()));
    const pdfBase64 = bytesToBase64(pdfBytes);
    const safeName = record.student_name.replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '') || 'student';
    const filename = 'Trident-Indemnity-' + safeName + '-' + record.date + '.pdf';

    try {
      const resp = await fetch(CONFIG.WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: filename,
          pdf_base64: pdfBase64,
          student_name: record.student_name,
          submitted_at: record.submitted_at
        })
      });

      if (!resp.ok) throw new Error('HTTP ' + resp.status + ' ' + (await resp.text()));

      formWrap.classList.add('hide');
      screenSuccess.classList.add('show');
    } catch (err) {
      buildFallback(record, pdfBytes, filename, err);
      formWrap.classList.add('hide');
      screenError.classList.add('show');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalLabel;
    }
  });

  function getLogoDataUrl() {
    // Reuse the logo already loaded in the header (same-origin, so canvas isn't tainted).
    // Downscale to a print-adequate width — jsPDF stores the bitmap roughly at source
    // resolution, so the full 1920px logo would bloat the PDF to several MB.
    const img = document.querySelector('header.brand img');
    if (!img || !img.complete || !img.naturalWidth) return null;
    try {
      const targetW = 300;
      const scale = targetW / img.naturalWidth;
      const c = document.createElement('canvas');
      c.width = targetW;
      c.height = Math.round(img.naturalHeight * scale);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      return c.toDataURL('image/png');
    } catch (e) {
      return null;
    }
  }

  function bytesToBase64(bytes) {
    let binary = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
  }

  function buildFallback(record, pdfBytes, filename, err) {
    errorDetail.textContent = 'Automatic send failed (' + (err.message || 'network error') + '). Nothing was lost — download the signed PDF below and email it manually.';

    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const blobUrl = URL.createObjectURL(blob);
    downloadPdfLink.href = blobUrl;
    downloadPdfLink.download = filename;

    mailtoLink.href = 'mailto:' + CONFIG.ADMIN_EMAIL +
      '?subject=' + encodeURIComponent('Indemnity form (manual send) — ' + record.student_name) +
      '&body=' + encodeURIComponent('Signed indemnity for ' + record.student_name + ' attached (download it from the form first).');
  }
});
