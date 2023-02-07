import { RoleName } from '../enums/RoleName';
import { Log } from '../Log';
import { Role } from './Role';

export class Hunter extends Role {
  readonly name = RoleName.Thợ_săn;

  doTurn(): void {
    Log.info('Thợ săn đã xong lượt.');
  }
}
