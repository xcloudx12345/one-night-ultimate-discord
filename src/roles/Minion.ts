import { AcknowledgeMessage } from '../ConversationHelper';
import { RoleName } from '../enums/RoleName';
import { Game } from '../Game';
import { Log } from '../Log';
import { Player } from '../Player';
import { Role } from './Role';

export class Minion extends Role {
  readonly name = RoleName.Kẻ_phản_bội;

  async doTurn(game: Game, player: Player): Promise<void> {
    const gameState = game.gameState;
    if (gameState.playerRoles.Ma_sói.size === 0) {
      const prompt = 'Bạn thức dậy và không thấy ma sói nào trong số những người chơi.';
      await AcknowledgeMessage(player, prompt);
    } else {
      const names = gameState.playerRoles.Ma_sói
        .map((otherWerewolf) => otherWerewolf.name)
        .join(' và ');
      const werewolfSentence =
        gameState.playerRoles.Ma_sói.size === 1
          ? 'là ma sói'
          : 'là ma sói';
      const prompt = `Bạn thức dậy và thấy rằng ${werewolfSentence}: ${names}`;
      await AcknowledgeMessage(player, prompt);
    }
    await player.send('Đi ngủ thôi.');

    Log.info('kẻ phản bội đã xong lượt.');
  }
}
