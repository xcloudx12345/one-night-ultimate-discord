import { Collection } from 'discord.js';
import { RoleName } from './enums/RoleName';
import { getRoleByName } from './GameLogic';
import { Player } from './Player';
import { Role } from './roles/Role';

type PlayerRoles = { [key in RoleName]: Collection<string, Player> };

export class GameState {
  playerRoles: PlayerRoles;
  tableRoles: Role[];
  
  constructor(
  playerRoles: PlayerRoles = {
  [RoleName.Kẻ_mạo_danh]: new Collection(),
  [RoleName.Ma_sói]: new Collection(),
  [RoleName.Kẻ_phản_bội]: new Collection(),
  [RoleName.Thợ_hồ]: new Collection(),
  [RoleName.Tiên_tri]: new Collection(),
  [RoleName.Đạo_tặc]: new Collection(),
  [RoleName.Kẻ_phá_hoại]: new Collection(),
  [RoleName.Bợm_nhậu]: new Collection(),
  [RoleName.Cú_đêm]: new Collection(),
  [RoleName.Dân_làng]: new Collection(),
  [RoleName.Kẻ_chán_đời]: new Collection(),
  [RoleName.Thợ_săn]: new Collection(),
  },
  tableRoles: Role[] = []
  ) {
  this.playerRoles = playerRoles;
  this.tableRoles = tableRoles;
  }

  public print(newDoppelgangerRole?: RoleName | null): string {
    let playerRoles = '';
    for (const roleName of Object.keys(this.playerRoles) as RoleName[]) {
      const players = this.playerRoles[roleName];
      if (players.size) {
        let newDoppelgangerRolePrint = '';
        if (roleName === RoleName.Kẻ_mạo_danh && newDoppelgangerRole) {
          newDoppelgangerRolePrint = ` as ${newDoppelgangerRole}`;
        }
        const playerTags = players.map(({ name: tag }) => tag).join(', ');
        playerRoles += `\n${roleName}${newDoppelgangerRolePrint}: ${playerTags}`;
      }
    }
    const tableRoles = this.tableRoles.map((role) => role.name).join(', ');
    return `Player roles:\n${playerRoles}\n\nTable roles: ${tableRoles}`;
  }

  public copy(): GameState {
    const newPlayerRoles: PlayerRoles = Object.assign({}, this.playerRoles);
    for (const roleName of Object.keys(this.playerRoles) as RoleName[]) {
      newPlayerRoles[roleName] = this.playerRoles[roleName].clone();
    }

    const newTableRoles = this.tableRoles.slice();
    return new GameState(newPlayerRoles, newTableRoles);
  }

  public getRole(player: Player): Role {
    return getRoleByName(this.getRoleName(player));
  }

  public getRoleName(player: Player): RoleName {
    for (const roleName of Object.keys(this.playerRoles) as RoleName[]) {
      const players = this.playerRoles[roleName];
      const foundPlayer = players.find((p) => player.id === p.id);
      if (foundPlayer) {
        return roleName;
      }
    }
    throw new Error('Player does not have a role');
  }

  public switchTableCard(player: Player, tableCardIndex: number): void {
    const newRole = this.tableRoles[tableCardIndex].name;
    const newTableCard = this.getRole(player);
    // move Drunk to table
    this.tableRoles[tableCardIndex] = newTableCard;
    // Remove player from drunk rol
    this.playerRoles.Bợm_nhậu = this.playerRoles.Bợm_nhậu.filter(
      (p) => p.id !== player.id
    );
    // Add player to new role
    this.playerRoles[newRole].set(player.id, player);
  }

  public switchPlayerRoles(player1: Player, player2: Player): void {
    const roleName1 = this.getRoleName(player1);
    const roleName2 = this.getRoleName(player2);

    if (!roleName1 || !roleName2) {
      throw new Error('invalid player switch');
    }

    this.playerRoles[roleName1].delete(player1.id);
    this.playerRoles[roleName1].set(player2.id, player2);

    this.playerRoles[roleName2].delete(player2.id);
    this.playerRoles[roleName2].set(player1.id, player1);
  }

  public moveDoppelGanger(name: RoleName): void {
    const doppelGangerPlayer = this.playerRoles.Kẻ_mạo_danh.array()[0];
    this.playerRoles[name].set(doppelGangerPlayer.id, doppelGangerPlayer);
    this.playerRoles.Kẻ_mạo_danh.clear();
  }
}
