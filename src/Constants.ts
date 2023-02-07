import { RoleName } from './enums/RoleName';

export const IMG_BASE_URL =
  'https://raw.githubusercontent.com/DrSkunk/one-night-ultimate-discord/main/assets/imgs/';
export const RULES_URL =
  'http://cloud-3.steamusercontent.com/ugc/1788471362465556315/4214EC45E12DF09CD40CF84DC7A00C1744412402/';
export const MINIMUM_PLAYERS = 3;
export const MAXIMUM_PLAYERS = 10;
export const CARDS_ON_TABLE = 3;
export const MAX_RETRIES = 5;
export const SETUP_WAIT_TIME = 60000;
export const REACTION_WAIT_TIME = 25000;
export const FAKE_USER_TIME = 10000;
export const ROUND_TIME_MINUTES = 5;
export const ROUND_TIME_MILLISECONDS = ROUND_TIME_MINUTES * 60000;
export const NIGHT_ALMOST_OVER_REMINDER = 30000;
export const EMPTY_VOICE_CHECK_TIME = 10000;
export const MAX_ROLES_COUNT: { [key in keyof typeof RoleName]: number } = {
  Kẻ_mạo_danh: 1,
  Ma_sói: 2,
  Kẻ_phản_bội: 2,
  Thợ_hồ: 2,
  Tiên_tri: 1,
  Đạo_tặc: 1,
  Kẻ_phá_hoại: 1,
  Bợm_nhậu: 1,
  Cú_đêm: 1,
  Dân_làng: 3,
  Thợ_săn: 1,
  Kẻ_chán_đời: 1,
};
