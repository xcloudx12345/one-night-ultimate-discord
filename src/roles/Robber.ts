import {
  AcknowledgeMessage,
  ChoosePlayer,
  ChooseToDoAction,
} from '../ConversationHelper';
import { ChoosePlayerType } from '../enums/ChoosePlayer';
import { RoleName } from '../enums/RoleName';
import { Game } from '../Game';
import { Log } from '../Log';
import { Player } from '../Player';
import { Role } from './Role';

export class Robber extends Role {
  readonly name = RoleName.Đạo_tặc;

  async doTurn(game: Game, player: Player): Promise<void> {
    const text =
      'Bạn vừa thức dậy. Bây giờ bạn có thể trộm vai trò của người khác. Bạn có làm luôn không?';
    const stealRole = await ChooseToDoAction(player, text);
    if (stealRole) {
      const chosenPlayer = (
        await ChoosePlayer(
          game.players,
          player,
          ChoosePlayerType.rob,
          'Chọn một người chơi để đánh cắp vai trò của họ.'
        )
      )[0];
      const roleName = game.gameState.getRoleName(chosenPlayer);
      game.gameState.switchPlayerRoles(player, chosenPlayer);
      await AcknowledgeMessage(
        player,
        `Bạn thấy ${chosenPlayer.name} có vai trò là ${roleName}, và bà bạn đã trộm nó`
      );
      await player.send('Đi ngủ thôi.');
    } else {
      await player.send("Bạn không trộm vai trò của ai cả và ngủ tiếp.");
    }
    Log.info('Đạo tặc đã xong lượt.');
  }
}
