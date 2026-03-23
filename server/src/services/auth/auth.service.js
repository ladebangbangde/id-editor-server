const { User } = require('../../models');
const AppError = require('../../utils/app-error');
const { signUserToken } = require('../../utils/token-helper');
const { presentUser } = require('../../utils/user-presenter');
const { code2Session } = require('../../integrations/wechat/wechat-auth.client');

function normalizeProfile(profile = {}) {
  return {
    nickname: (profile.nickname || '').trim(),
    avatarUrl: (profile.avatarUrl || '').trim(),
    gender: Number.isFinite(Number(profile.gender)) ? Number(profile.gender) : 0
  };
}

function buildCreatePayload(openid, unionid, profile) {
  return {
    openid,
    unionid,
    nickname: profile.nickname || `微信用户${String(openid).slice(-6)}`,
    avatar: profile.avatarUrl || null,
    status: 1
  };
}

async function upsertWechatUser({ openid, unionid, profile }) {
  let user = await User.findOne({ where: { openid } });
  let isNewUser = false;

  if (!user) {
    user = await User.create(buildCreatePayload(openid, unionid, profile));
    isNewUser = true;
  } else {
    const updatePayload = {};

    if (unionid && unionid !== user.unionid) {
      updatePayload.unionid = unionid;
    }
    if (profile.nickname && profile.nickname !== user.nickname) {
      updatePayload.nickname = profile.nickname;
    }
    if (profile.avatarUrl && profile.avatarUrl !== user.avatar) {
      updatePayload.avatar = profile.avatarUrl;
    }

    if (Object.keys(updatePayload).length > 0) {
      await user.update(updatePayload);
    }
  }

  return { user, isNewUser };
}

async function wxLogin({ code, nickname, avatarUrl, gender }) {
  if (!code || !String(code).trim()) {
    throw new AppError('code不能为空', 400, null, 9000);
  }

  const session = await code2Session(String(code).trim());
  const profile = normalizeProfile({ nickname, avatarUrl, gender });
  const { user, isNewUser } = await upsertWechatUser({
    openid: session.openid,
    unionid: session.unionid,
    profile
  });

  const token = signUserToken({ userId: user.id, openid: user.openid });

  return {
    token,
    isNewUser,
    user: presentUser(user)
  };
}

async function me(user) {
  if (!user) {
    throw new AppError('用户不存在', 404, null, 9006);
  }

  return presentUser(user);
}

async function adminLogin() {
  return { token: 'mock-admin-token' };
}

module.exports = {
  wxLogin,
  me,
  adminLogin
};
