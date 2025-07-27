import { hasCookie, removeCookie } from '@/utils/cookies';

const COOKIE_KEY = 'cws_user_auth';

const hasLoginCookie = () => {
  return !!hasCookie(COOKIE_KEY);
};

const clearCookie = () => {
  removeCookie(COOKIE_KEY);
};

export { clearCookie, hasLoginCookie };
