const AVATAR_COLORS = ['#6366f1', '#ec4899', '#16a34a', '#d97706', '#0891b2', '#9333ea'];

export function avatarColor(id) {
  let hash = 0;
  const str = String(id || '');
  for (let i = 0; i < str.length; i += 1) hash = (hash * 31 + str.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[hash];
}
