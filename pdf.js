// Builds the signed indemnity as an A4 PDF (jsPDF). Returns a Uint8Array.
// Kept deterministic and self-contained: the PDF embeds the full waiver text and
// the signature, so each file stands alone as a record of exactly what was agreed.

const WAIVER_INTRO =
  'The following waiver of all claims, release from all liability, assumption of all risks, agreement not to sue and other terms of this agreement are entered into by me, the undersigned Student (the "Student") with and for the benefit of Triventure PTY Ltd. trading as Trident Fight Centre (a company registered in terms of the laws of the Republic of South Africa, having registration number 2013/114666/07 and address Unit 14 & 15, RosenPark Two, Bella Rosa Street, Durbanville, South Africa), its staff, volunteers, facilities, property, premises or lessees (the "Organisation"). This extends to the organisers of any competitive event in which the Student participates, while a Student of Trident Fight Centre.';

const WAIVER_CLAUSES = [
  '1. "Martial Arts Activities" includes but it is not limited to contact and non-contact martial arts activities, lessons, classes, training, use of facilities and services provided to the Student by the Organisation.',
  '2. I am aware that there are inherent and significant dangers, hazards and risks ("Risks") associated with the participation in Martial Arts Activities. I am aware that the Risks include but are not limited to injury from physical contact with other students, instructors or equipment, performing a skill incorrectly, or potentially dangerous obstacles, conditions or weapons on the mat, floor or vicinity of the Martial Arts Activities. I understand that the Risks are relative to my state of health (physical, mental or emotional), and to the awareness, care and skill with which the Student conducts him or herself while participating in Martial Arts Activities.',
  '3. I freely accept and fully assume all responsibility for all Risks and possibilities of personal injury, death, property damage or loss resulting from my participation in Martial Arts Activities. I freely assume responsibility for my own safety. I agree that although the Organisation has taken steps to reduce the Risks and increase the safety of Martial Arts Activities, it is not possible for the Organisation to assure that Martial Arts Activities are completely safe. I accept these Risks and agree to the terms of this waiver even if the Organisation is found to be negligent or in breach of any duty of care or any obligation to me in my participation in Martial Arts Activities.',
  '4. I acknowledge my obligation to consult a medical professional if I feel any pain, discomfort, excessive fatigue or any other symptoms I may suffer during or immediately after my participation in Martial Arts Activities. I understand that I may stop participating at any time, and have the right to immediately withdrawn from any exercise or drill in which the conduct of any party seems beyond the scope of training, making me uncomfortable or which I believe will be harmful to me. I, furthermore, warrant that I am sufficiently healthy to partake in the Martial Arts Activities. There is no defect or pre-existing condition preventing me from participating in the Martial Arts Activities, nor is there any such defect or condition that will cause me harm.',
  '5. In addition to consideration given to me by the Organisation for my participation in Martial Arts Activities, I and my heirs, next of kin, executors, administrators and assigns (my "Legal Representatives") agree: (a) to waive all claims that I or my Legal Representatives have or may have in the future against the Organisation; and (b) to release and forever discharge the Organisation from all liability for all personal injury, death, property damage or loss resulting from my participating in Martial Arts Activities due to any cause, including but not limited to negligence (failure to use such care as a reasonably prudent and careful person would use under similar circumstances), breach of any duty imposed by law, breach of contract or mistake or error in judgment of the Organisation, which shall, for the avoidance of doubt, in any event be limited to exclude any and all future and special damages.',
  '6. I agree to be liable for and to hold harmless and indemnify the Organisation from all proceedings, claims, damages, cost demands including court costs and costs on a attorney and own client basis, and liabilities of whatsoever nature of kind arising out of or in any way connected to my participation in Martial Arts Activities.',
  '7. I consent to the Organisation using videos, photographs, media, marketing, and renderings, taken of the Student and spectators, during events or training sessions, for the purposes of social media, marketing, and promotions.',
  '8. I agree that this waiver and all terms contained within are governed by the laws of South Africa. I hereby irrevocably submit to the jurisdiction of the courts of South Africa.',
  '9. I confirm that I have had the time to read and understand each term in this waiver in its entirety and have agreed to the terms freely and voluntarily. I understand that this waiver is binding on myself and my Legal Representatives.',
  '10. I warrant that I have had an opportunity to consult with a legal representative before entering into this indemnity, and warrant that I am familiar with the provisions and effects of this document.',
  '11. I warrant, agree, and understand that, by signing this indemnity, I agree to the terms and conditions of the Organisation’s privacy and information processing policy, which is available on request, the terms and conditions of which are incorporated herein as if by reference. In the event that the Student is under the age of 18, and this indemnity is signed by the Student’s legal guardian and/or parent, such guardian and/or parent agrees to the same, as well as the processing of the Student’s personal information, where necessary.'
];

const NAVY = [2, 102, 127];
const INK = [18, 19, 21];
const GREY = [90, 90, 90];

function buildWaiverPdf(data, logoDataUrl) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 48;
  const contentW = pageW - margin * 2;
  let y = margin;

  function ensureSpace(needed) {
    if (y + needed > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  }

  function heading(text) {
    ensureSpace(28);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.text(text.toUpperCase(), margin, y);
    y += 6;
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(1);
    doc.line(margin, y, pageW - margin, y);
    y += 14;
  }

  function field(label, value) {
    ensureSpace(16);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(INK[0], INK[1], INK[2]);
    const labelText = label + ':  ';
    doc.text(labelText, margin, y);
    const labelW = doc.getTextWidth(labelText);
    doc.setFont('helvetica', 'normal');
    const wrapped = doc.splitTextToSize(String(value || '—'), contentW - labelW);
    doc.text(wrapped, margin + labelW, y);
    y += 14 * wrapped.length;
  }

  function paragraph(text, size, color, gap) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
    const lines = doc.splitTextToSize(text, contentW);
    const lineH = size * 1.35;
    for (const line of lines) {
      ensureSpace(lineH);
      doc.text(line, margin, y);
      y += lineH;
    }
    y += gap;
  }

  // Title block
  const headerH = 108;
  doc.setFillColor(INK[0], INK[1], INK[2]);
  doc.rect(0, 0, pageW, headerH, 'F');
  doc.setTextColor(255, 255, 255);
  if (logoDataUrl) {
    const lw = 120, lh = lw / 2; // logo is 2:1
    try { doc.addImage(logoDataUrl, 'PNG', (pageW - lw) / 2, 16, lw, lh, 'tfclogo', 'FAST'); } catch (e) { /* fall through to text */ }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text('Student Indemnity and Disclaimer', pageW / 2, 92, { align: 'center' });
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('Trident Fight Centre', margin, 40);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text('Student Indemnity and Disclaimer', margin, 60);
  }
  y = headerH + 22;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(GREY[0], GREY[1], GREY[2]);
  doc.text('Submitted ' + data.submitted_at + '  ·  Form version ' + data.form_version, margin, y);
  y += 20;

  heading('Student');
  field('Name', data.student_name);
  field('Age declaration', data.age_bracket);
  field('Parent/Guardian', data.guardian_name);
  y += 6;

  heading('Signature');
  field('Signed by', data.signed_by);
  field('At', data.place);
  field('On', data.date);
  y += 4;

  // Signature image
  const sigW = 220;
  const sigH = sigW / 3; // canvas is 600x200
  ensureSpace(sigH + 10);
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(1);
  doc.rect(margin, y, sigW, sigH);
  try {
    doc.addImage(data.signature_image, 'PNG', margin, y, sigW, sigH);
  } catch (e) { /* leave the empty box if the image fails */ }
  y += sigH + 16;

  heading('Student Info');
  field('ID Number', data.id_number);
  field('Date of Birth', data.dob);
  field('e-mail', data.email);
  field('Cell', data.cell);
  field('Next of Kin', data.next_of_kin);
  field('Next of Kin Cell', data.next_of_kin_cell);
  y += 8;

  heading('Waiver Text Agreed To');
  paragraph(WAIVER_INTRO, 8.5, [68, 68, 68], 8);
  for (const clause of WAIVER_CLAUSES) {
    paragraph(clause, 8.5, [68, 68, 68], 7);
  }

  return doc.output('arraybuffer');
}

window.buildWaiverPdf = buildWaiverPdf;
