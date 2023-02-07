import { AcknowledgeMessage, ChoosePlayer } from '../ConversationHelper';
import { ChoosePlayerType } from '../enums/ChoosePlayer';
import { RoleName } from '../enums/RoleName';
import { Game } from '../Game';
import { Log } from '../Log';
import { Player } from '../Player';
import { isInstantRole, isMimicRole, Role } from './Role';

export class Doppelganger extends Role {
  readonly name = RoleName.Kẻ_mạo_danh;

  // Hành động của vai trò Doppelganger
  async doTurn(game: Game, player: Player): Promise<void> {
    // Lấy trạng thái hiện tại của trò chơi
    const gameState = game.gameState;
    
    // Chọn người chơi để sao chép vai trò
    const chosenPlayer = (
      await ChoosePlayer(
        game.players,
        player,
        ChoosePlayerType.clone,
        'Chọn một người chơi để sao chép vai trò.'
      )
    )[0];
    // Lấy vai trò của người chơi đã chọn
    const chosenPlayerRole = gameState.getRole(chosenPlayer);

    // Nếu vai trò của người chơi đã chọn là mimic role
    if (isMimicRole(chosenPlayerRole.name)) {
      gameState.moveDoppelGanger(chosenPlayerRole.name);
      await player.send(
        `Bạn nhìn thấy ${chosenPlayer.name} có vai trò ${chosenPlayerRole.name}
Giờ đây cũng có vai trò ${chosenPlayerRole.name} .
Hãy ngủ tiếp đi.`
      );
      game.newDoppelgangerRole = chosenPlayerRole.name;
      return;
    } 
    // Nếu vai trò của người chơi đã chọn là instant role
    else if (isInstantRole(chosenPlayerRole.name)) {
      await player.send(
        `Bạn nhìn thấy ${chosenPlayer.name} có vai trò ${chosenPlayerRole.name}.
Giờ bạn cũng có vai trò ${chosenPlayerRole.name} và ngay lập tức sửa dụng chức năng đó.`
      );
      await chosenPlayerRole.doTurn(game, player);
      game.newDoppelgangerRole = chosenPlayerRole.name;
      return;

      // Chỉ còn lại các vai trò chưa dậy, Villager, Hunter và Tanner
    } 
    // Vai trò còn lại
    else {
      await AcknowledgeMessage(
        player,
        `Bạn nhìn thấy ${chosenPlayer.name} có vai trò ${chosenPlayerRole.name}. Giờ Bạn cũng có vai trò ${chosenPlayerRole.name}.`
      );
      await player.send('Hãy đi ngủ đi.');
    }

    Log.info('Lượt của Kẻ mạo danh đã xong.');
  }
}
