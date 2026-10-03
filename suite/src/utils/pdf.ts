import {
  PDFDocument,
  PDFTextField,
  PDFCheckBox,
  PDFDropdown,
  PDFOptionList,
  PDFRadioGroup,
  PDFSignature,
} from 'pdf-lib';

export interface PdfField {
  name: string;
  kind: 'text' | 'check' | 'choice' | 'radio' | 'unsupported';
  value: string | boolean | string[];
  options?: string[];
  multiple?: boolean;
  readOnly: boolean;
}
export async function openPdf(bytes: Uint8Array) {
  const pdf = await PDFDocument.load(bytes);
  if (!pdf.getPageCount()) throw new Error('This PDF has no pages.');
  if (
    pdf
      .getForm()
      .getFields()
      .some((field) => field instanceof PDFSignature)
  )
    throw new Error(
      'This PDF contains signature fields. Editing could invalidate signatures. Use an unsigned copy.',
    );
  if (pdf.getForm().hasXFA())
    throw new Error(
      'XFA forms are not supported. Open a standard PDF or AcroForm copy.',
    );
  return pdf;
}
export function readFields(pdf: PDFDocument): PdfField[] {
  return pdf
    .getForm()
    .getFields()
    .map((field) => {
      const base = { name: field.getName(), readOnly: field.isReadOnly() };
      if (field instanceof PDFTextField)
        return { ...base, kind: 'text', value: field.getText() ?? '' };
      if (field instanceof PDFCheckBox)
        return { ...base, kind: 'check', value: field.isChecked() };
      if (field instanceof PDFDropdown || field instanceof PDFOptionList)
        return {
          ...base,
          kind: 'choice',
          value: field.isMultiselect()
            ? field.getSelected()
            : (field.getSelected()[0] ?? ''),
          options: field.getOptions(),
          multiple: field.isMultiselect(),
        };
      if (field instanceof PDFRadioGroup)
        return {
          ...base,
          kind: 'radio',
          value: field.getSelected() ?? '',
          options: field.getOptions(),
        };
      return { ...base, kind: 'unsupported', value: '' };
    });
}
export function fillFields(pdf: PDFDocument, fields: PdfField[]) {
  for (const value of fields) {
    if (value.readOnly) continue;
    const field = pdf.getForm().getField(value.name);
    if (field instanceof PDFTextField) field.setText(String(value.value));
    else if (field instanceof PDFCheckBox) {
      if (value.value) field.check();
      else field.uncheck();
    } else if (field instanceof PDFDropdown || field instanceof PDFOptionList) {
      const selected = Array.isArray(value.value)
        ? value.value
        : value.value
          ? [String(value.value)]
          : [];
      if (selected.length) field.select(selected);
      else field.clear();
    } else if (field instanceof PDFRadioGroup) {
      if (value.value) field.select(String(value.value));
      else field.clear();
    }
  }
}
export function parsePageRange(text: string, count: number) {
  const pages: number[] = [];
  for (const part of text.split(',')) {
    const match = part.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!match) throw new Error('Use page numbers or ranges, such as 1, 3-5.');
    const start = Number(match[1]),
      end = Number(match[2] ?? match[1]);
    if (start < 1 || end < start || end > count)
      throw new Error(`Choose pages between 1 and ${count}.`);
    for (let p = start; p <= end; p++)
      if (!pages.includes(p - 1)) pages.push(p - 1);
  }
  return pages;
}
