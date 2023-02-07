import { RoleName } from '../enums/RoleName';
import { Log } from '../Log';
import { Role } from './Role';

export class Villager extends Role {
  readonly name = RoleName.Dân_làng;

  doTurn(): void {
    Log.info('Dân làng đã xong lượt.');
  }

  clone(): Role {
    return new Villager();
  }
}
