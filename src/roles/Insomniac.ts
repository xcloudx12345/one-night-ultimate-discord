import { AcknowledgeMessage } from '../ConversationHelper';
import { RoleName } from '../enums/RoleName';
import { Game } from '../Game';
import { Log } from '../Log';
import { Player } from '../Player';
import { Role } from './Role';

export class Insomniac extends Role {
  readonly name = RoleName.Cú_đêm;

  async doTurn(game: Game, player: Player): Promise<void> {
    const gameState = game.gameState;
    const role = gameState.getRoleName(player);

    await AcknowledgeMessage(
      player,
      `Bạn đã biết vai trò của mình là ${role}.`
    );
    await player.send('Đi ngủ đi.');
    Log.info('Kẻ mất ngủ đã xong lượt.');
  }
}
