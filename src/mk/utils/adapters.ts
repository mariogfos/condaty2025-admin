export const getTitular = (item: any) => {
  if (!item) {
    return null;
  }

  if (item.holder === "H") {
    return item.homeowner;
  }

  if (item.holder === "T") {
    return item.tenant;
  }

  // Fallback for old structure or if holder is not set
  if (item.titular?.owner) {
    return item.titular.owner;
  }

  return null;
};