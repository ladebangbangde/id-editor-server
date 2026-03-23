function presentUser(user) {
  if (!user) return null;

  const plainUser = typeof user.toJSON === 'function' ? user.toJSON() : user;

  return {
    id: plainUser.id,
    openid: plainUser.openid,
    nickname: plainUser.nickname,
    avatarUrl: plainUser.avatarUrl || plainUser.avatar || null,
    status: plainUser.status,
    createdAt: plainUser.created_at || plainUser.createdAt || null,
    updatedAt: plainUser.updated_at || plainUser.updatedAt || null
  };
}

module.exports = { presentUser };
