// /src/utils/friendPermissions.js

export function canViewLocation(friend) {
  return friend?.accepted === true;
}

export function grantView(friend) {
  return { ...friend, accepted: true };
}

export function revokeView(friend) {
  return { ...friend, accepted: false };
}
