export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-GM', {
    style: 'currency',
    currency: 'GMD',
  }).format(amount);
};

export const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

export const calculateGradeLabel = (score: number, max: number): string => {
  const pct = (score / max) * 100;
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B';
  if (pct >= 60) return 'C';
  if (pct >= 50) return 'D';
  return 'F';
};

export const getGradeColor = (score: number, max: number): string => {
  const pct = (score / max) * 100;
  if (pct >= 80) return 'text-green-600';
  if (pct >= 60) return 'text-blue-600';
  if (pct >= 50) return 'text-yellow-600';
  return 'text-red-600';
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'active':    return 'bg-green-100 text-green-700';
    case 'inactive':  return 'bg-gray-100 text-gray-700';
    case 'paid':      return 'bg-green-100 text-green-700';
    case 'partial':   return 'bg-yellow-100 text-yellow-700';
    case 'unpaid':    return 'bg-red-100 text-red-700';
    case 'overdue':   return 'bg-red-200 text-red-800';
    case 'present':   return 'bg-green-100 text-green-700';
    case 'absent':    return 'bg-red-100 text-red-700';
    case 'late':      return 'bg-yellow-100 text-yellow-700';
    case 'excused':   return 'bg-blue-100 text-blue-700';
    default:          return 'bg-gray-100 text-gray-700';
  }
};

export const cn = (...classes: (string | undefined | false | null)[]): string => {
  return classes.filter(Boolean).join(' ');
};