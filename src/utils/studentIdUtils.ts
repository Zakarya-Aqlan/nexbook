export function getStudentIdDigits(value: string) {
  return value.replace(/[^0-9]/g, '').slice(0, 6)
}

export function formatStudentIdForStorage(digits: string) {
  return `TP${digits}`
}

export function formatStudentIdForDisplay(studentId: string) {
  const trimmedStudentId = studentId.trim()

  if (/^TP[0-9]{6}$/.test(trimmedStudentId)) {
    return trimmedStudentId
  }

  if (/^[0-9]+$/.test(trimmedStudentId)) {
    return `TP${trimmedStudentId}`
  }

  return trimmedStudentId
}
