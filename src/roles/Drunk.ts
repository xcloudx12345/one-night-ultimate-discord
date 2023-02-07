import { AcknowledgeMessage, ChooseTableCard } from '../ConversationHelper';
import { RoleName } from '../enums/RoleName';
import { Game } from '../Game';
import { Log } from '../Log';
import { Player } from '../Player';
import { Role } from './Role';

export class Drunk extends Role {
  readonly name = RoleName.Bợm_nhậu;

  async doTurn(game: Game, player: Player): Promise<void> {
    const gameState = game.gameState;
    await player.send('Bợm Nhậu ơi, tỉnh táo thức dậy.');
    const tableCard = (
      await ChooseTableCard(
        gameState,
        player,
        1,
        'Hãy đổi bài của mình với 1 lá ở giữa, nhớ là không được xem lá bài đã đổi!'
      )
    )[0];
    const tableCardIndex = Object.values(tableCard)[0];
    game.gameState.switchTableCard(player, tableCardIndex);
    await AcknowledgeMessage(
      player,
      'Bây giờ vai trò của bạn chính là lá bài mà bạn vừa chọn'
    );
    await player.send('Đi ngủ tiếp đi.');

    Log.info('Gã say sỉn đã hết lượt.');
  }
}
