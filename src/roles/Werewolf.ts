import { AcknowledgeMessage, ChooseTableCard } from '../ConversationHelper';
import { RoleName } from '../enums/RoleName';
import { Game } from '../Game';
import { Log } from '../Log';
import { Player } from '../Player';
import { Role } from './Role';

export class Werewolf extends Role {
  readonly name = RoleName.Ma_sói;

  async doTurn(game: Game, player: Player): Promise<void> {
    const { tableRoles, playerRoles } = game.gameState;
    if (playerRoles.Ma_sói.size !== 1) {
      const werewolves = playerRoles.Ma_sói;
      // Assert that there are werewolves
      if (werewolves === undefined) {
        throw new Error('Trạng thái trò chơi không hợp lệ, không có ma sói trong trò chơi.');
      }
      const otherWerewolves = werewolves.filter(
        (otherPlayer) => otherPlayer.id !== player.id
      );
      const otherNames = otherWerewolves
        .map((otherWerewolf) => otherWerewolf.name)
        .join(' và ');

      const werewolfSentence =
        otherWerewolves.size === 1 ? 'ma sói là' : 'ma sói là';
      const prompt = `Bạn thức dậy và thấy đồng loại của mình là ${werewolfSentence} ${otherNames}.`;
      await AcknowledgeMessage(player, prompt);

      player.send("Các bạn nhìn nhau nở một nụ cười gian xảo rồi ngủ tiếp.");
    } else {
      player.send('Bạn thức dậy biết mình là ma sói duy nhất.');

      const chosenCard = (
        await ChooseTableCard(
          game.gameState,
          player,
          1,
          'Bạn có thể chọn một lá bài trên bàn để xem.'
        )
      )[0];
      const emoji = Object.keys(chosenCard)[0];
      const roleName = tableRoles[chosenCard[emoji]].name;
      await AcknowledgeMessage(
        player,
        `Lá ${emoji} có role là ${roleName}`
      );
      await player.send('Bạn đi ngủ tiếp.');
    }
    Log.info('Lượt của ma sói đã xong.');
  }

  clone(): Role {
    return new Werewolf();
  }
}
