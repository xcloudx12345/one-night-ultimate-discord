import { RoleName } from '../enums/RoleName';
import { Log } from '../Log';
import { Role } from './Role';

export class Tanner extends Role {
  readonly name = RoleName.Kẻ_chán_đời;

  doTurn(): void {
    Log.info('Kẻ chán đời đã xong lượt.');
  }

  clone(): Role {
    return new Tanner();
  }
}
