export const getOwnerAccountStatus = (owner: any): string | undefined =>
  owner?.account_status ?? owner?.status;

export const getOwnerMembershipStatus = (owner: any): string | undefined =>
  owner?.current_membership?.status ?? owner?.membership_status;

export const getOwnerOperationalStatus = (owner: any): string | undefined => {
  if (owner?.operational_status) return owner.operational_status;

  const accountStatus = getOwnerAccountStatus(owner);
  const membershipStatus = getOwnerMembershipStatus(owner);

  if (accountStatus && !["A", "P"].includes(accountStatus)) {
    return accountStatus;
  }

  return membershipStatus ?? accountStatus;
};

export const isPendingOwner = (owner: any): boolean =>
  getOwnerOperationalStatus(owner) === "W";

export const isRecoverablePendingAccount = (owner: any): boolean =>
  getOwnerAccountStatus(owner) === "W" &&
  ["A", "P"].includes(getOwnerMembershipStatus(owner) ?? "");
