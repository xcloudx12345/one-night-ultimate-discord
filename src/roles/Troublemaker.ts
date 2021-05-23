import { ChoosePlayer, ChooseToDoAction } from '../ConversationHelper';
import { ChoosePlayerType } from '../enums/ChoosePlayer';
import { RoleName } from '../enums/RoleName';
import { Game } from '../Game';
import { Log } from '../Log';
import { Player } from '../Player';
import { Role } from './Role';

export class Troublemaker extends Role {
  readonly name = RoleName.troublemaker;

  async doTurn(game: Game, player: Player): Promise<void> {
    const text =
      'You wake up. You can now switch the roles of two players. Do you want to do this?';
    const switchRoles = await ChooseToDoAction(player, text);
    if (switchRoles) {
      const chosenPlayers = await ChoosePlayer(
        game.players,
        player,
        ChoosePlayerType.switch
      );
      game.gameState.switchPlayerRoles(chosenPlayers[0], chosenPlayers[1]);
    } else {
      await player.send("You don't switch roles and go back to sleep.");
    }
    Log.info('Troublemaker turn played.');
  }

  clone(): Role {
    return new Troublemaker();
  }
}
