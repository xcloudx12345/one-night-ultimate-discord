import {
  ChooseTableCard,
  ChoosePlayer,
  ChoosePlayerOrTable,
  AcknowledgeMessage,
} from '../ConversationHelper';
import { ChoosePlayerType } from '../enums/ChoosePlayer';
import { RoleName } from '../enums/RoleName';
import { Game } from '../Game';
import { Log } from '../Log';
import { Player } from '../Player';
import { Role } from './Role';

export class Seer extends Role {
  readonly name = RoleName.Tiên_tri;

  async doTurn(game: Game, player: Player): Promise<void> {
    const gameState = game.gameState;
    const lookAtPlayerCards = await ChoosePlayerOrTable(
      gameState,
      player,
      `Bạn được chọn giữa:
- 1️⃣: Xem bài của người khác
- 2️⃣: Xem 2 lá bài trong số các lá thừa không có người chọn.`
    );
    if (lookAtPlayerCards) {
      const chosenPlayer = (
        await ChoosePlayer(
          game.players,
          player,
          ChoosePlayerType.view,
          'Chọn người để xem vai trò.'
        )
      )[0];
      const roleName = game.gameState.getRoleName(chosenPlayer);
      await AcknowledgeMessage(
        player,
        `Bạn nhìn thấy ${chosenPlayer.name} có vai trò là ${roleName}`
      );
    } else {
      const chosenCards = await ChooseTableCard(
        gameState,
        player,
        2,
        'Bạn có thể chọn 2 lá bài trên bàn để xem.'
      );
      let selectedRoles = '';
      for (const chosenCard of chosenCards) {
        const emoji = Object.keys(chosenCard)[0];
        const roleName = gameState.tableRoles[chosenCard[emoji]].name;

        selectedRoles += `\n${emoji}: ${roleName}`;
      }

      await AcknowledgeMessage(
        player,
        `Bạn xem được lá: ${selectedRoles}`
      );
    }
    await player.send('Bạn hãy ngủ tiếp.');

    Log.info('Tiên tri đã xong lượt.');
  }

  clone(): Role {
    return new Seer();
  }
}
