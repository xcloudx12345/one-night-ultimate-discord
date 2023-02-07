import { RoleName } from '../enums/RoleName';
import { Game } from '../Game';
import { Player } from '../Player';

export abstract class Role {
  abstract readonly name: RoleName;

  abstract doTurn(game: Game, player: Player): void;
}
export function isMimicRole(roleName: RoleName): boolean {
  return [
    RoleName.Ma_sói,
    RoleName.Kẻ_phản_bội,
    RoleName.Thợ_hồ,
    RoleName.Cú_đêm,
  ].includes(roleName);
}

export function isInstantRole(roleName: RoleName): boolean {
  return [
    RoleName.Tiên_tri,
    RoleName.Đạo_tặc,
    RoleName.Kẻ_phá_hoại,
    RoleName.Bợm_nhậu,
  ].includes(roleName);
}
