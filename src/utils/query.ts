const extractScalar = (value: unknown): string | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return extractScalar(value[0]);
  }

  if (typeof value === 'object') {
    return undefined;
  }

  const stringValue = String(value).trim();
  return stringValue.length > 0 ? stringValue : undefined;
};

export const parseNumberParam = (value: unknown): number | undefined => {
  const scalar = extractScalar(value);
  if (scalar === undefined) {
    return undefined;
  }

  const parsed = Number(scalar);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const parseBooleanParam = (value: unknown): boolean | undefined => {
  const scalar = extractScalar(value);
  if (scalar === undefined) {
    return undefined;
  }

  const normalised = scalar.toLowerCase();
  if (normalised === 'true') {
    return true;
  }
  if (normalised === 'false') {
    return false;
  }

  return undefined;
};

export const parseStringParam = (value: unknown): string | undefined => {
  return extractScalar(value);
};

export const parseOrderParam = (value: unknown): 'asc' | 'desc' | undefined => {
  const scalar = extractScalar(value);
  if (!scalar) {
    return undefined;
  }

  const normalised = scalar.toLowerCase();
  return normalised === 'asc' || normalised === 'desc' ? (normalised as 'asc' | 'desc') : undefined;
};

