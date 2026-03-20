export function formatDateToDDMMYYYY(dateString: string): string {
  const date = new Date(dateString);

  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = date.getUTCFullYear();

  return `${day}/${month}/${year}`;
}

export function formatSequenceNumber(value: number): string {
  return String(value).padStart(3, "0");
}

export function buildEngagementReference(params: {
  departmentCode: string;
  contractDate: string;
  sequenceNumber: number;
  signatoryInitials: string;
}): string {
  const formattedDate = formatDateToDDMMYYYY(params.contractDate);
  const formattedNumber = formatSequenceNumber(params.sequenceNumber);

  return `BDO-DRC/${params.departmentCode}/${formattedDate}/${formattedNumber}/${params.signatoryInitials}`;
}

export function buildCorrespondenceReference(params: {
  departmentCode: string;
  senderInitials: string;
  issueDate: string;
  sequenceNumber: number;
}): string {
  const formattedDate = formatDateToDDMMYYYY(params.issueDate);
  const formattedNumber = formatSequenceNumber(params.sequenceNumber);

  return `BDO/${params.departmentCode}/${params.senderInitials}/${formattedDate}/${formattedNumber}`;
}

export function formatDateDisplay(dateString: string): string {
  if (!dateString) return "";

  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
}