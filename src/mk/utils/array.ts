export const getArrayFromObject = (
  obj: Record<string, string>,
  added?: Record<string, string>[],
  append?: Record<string, string>[],
  keyId: string = "id",
  label: string = "name",
): Record<string, string>[] => {
  const array = Object.entries(obj).map(([key, value]) => ({
    [keyId]: key,
    [label]: value,
  }));
  if (added) {
    array.unshift(...added);
  }
  if (append) {
    array.push(...append);
  }
  return array;
};
