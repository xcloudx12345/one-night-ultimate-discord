import { AcknowledgeMessage } from '../ConversationHelper';
import { RoleName } from '../enums/RoleName';
import { Game } from '../Game';
import { Log } from '../Log';
import { Player } from '../Player';
import { Role } from './Role';

export class Mason extends Role {
  readonly name = RoleName.Thợ_hồ;

  async doTurn(game: Game, player: Player): Promise<void> {
    const gameState = game.gameState;
    if (gameState.playerRoles.Thợ_hồ.size !== 1) {
      const masons = gameState.playerRoles.Thợ_hồ;
      // Assert that there are masons
      if (masons === undefined) {
        throw new Error('Trạng thái trò chơi không hợp lệ, không có thợ hồ trong trò chơi.');
      }
      const otherMasons = masons.filter(
        (otherPlayer) => otherPlayer.id !== player.id
      );
      const masonSentence = otherMasons.size === 1 ? 'Thợ hồ là' : 'Thợ hồ là';
      const otherNames = otherMasons
        .map((otherMason) => otherMason.name)
        .join(' và ');

      const prompt = `Bạn thức dậy và nhìn thấy đồng nghiệp của mình là ${masonSentence} ${otherNames}.`;
      await AcknowledgeMessage(player, prompt);
      await player.send("Các bạn nhìn vào đôi mắt nhau và đi ngủ tiếp.");
    } else {
      const prompt = 'Bạn thức dậy và thấy biết mình là thợ hồ.';
      await AcknowledgeMessage(player, prompt);
      await player.send('Bạn đi ngủ đi.');
    }
    Log.info('Thợ hồ đã xong lượt.');
  }
}
