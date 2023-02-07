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

export class Troublemaker extends Role {
  readonly name = RoleName.Kẻ_phá_hoại;

  async doTurn(game: Game, player: Player): Promise<void> {
    const text =
      'Hãy thức dậy đi. Bạn có thể hoán đổi vai trò của 2 người chơi với nhau. Bạn có muốn làm vậy không?';
    const switchRoles = await ChooseToDoAction(player, text);
    if (switchRoles) {
      const chosenPlayers = await ChoosePlayer(
        game.players,
        player,
        ChoosePlayerType.switch,
        'Chọn 2 người chơi để đổi vai trò của họ'
      );
      game.gameState.switchPlayerRoles(chosenPlayers[0], chosenPlayers[1]);
      await AcknowledgeMessage(
        player,
        `Bạn đã đổi vai trò của ${chosenPlayers[0].name} và ${chosenPlayers[1].name}`
      );
      await player.send('Bạn đi ngủ tiếp.');
    } else {
      await player.send("Bạn không đổi vai trò của ai cả và đi ngủ tiếp.");
    }
    Log.info('Kẻ gây rối đã xong lượt.');
  }

  clone(): Role {
    return new Troublemaker();
  }
}
