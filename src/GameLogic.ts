import { Collection } from 'discord.js';
import {
  CARDS_ON_TABLE,
  FAKE_USER_TIME,
  IMG_BASE_URL,
  MAX_ROLES_COUNT,
} from './Constants';
import { AcknowledgeMessage } from './ConversationHelper';
import { RoleName } from './enums/RoleName';
import { Team } from './enums/Team';
import { Game } from './Game';
import { GameState } from './GameState';
import { Log } from './Log';
import { Player } from './Player';
import { Doppelganger } from './roles/Doppelganger';
import { Drunk } from './roles/Drunk';
import { Hunter } from './roles/Hunter';
import { Insomniac } from './roles/Insomniac';
import { Mason } from './roles/Mason';
import { Minion } from './roles/Minion';
import { Robber } from './roles/Robber';
import { isMimicRole, Role } from './roles/Role';
import { Seer } from './roles/Seer';
import { Tanner } from './roles/Tanner';
import { Troublemaker } from './roles/Troublemaker';
import { Villager } from './roles/Villager';
import { Werewolf } from './roles/Werewolf';
import { Time } from './types/Time';

export const callOrder = [
  RoleName.Kẻ_mạo_danh,
  RoleName.Ma_sói,
  RoleName.Kẻ_phản_bội,
  RoleName.Thợ_hồ,
  RoleName.Tiên_tri,
  RoleName.Đạo_tặc,
  RoleName.Kẻ_phá_hoại,
  RoleName.Bợm_nhậu,
  RoleName.Cú_đêm,
];

// Source: https://stackoverflow.com/a/2450976/2174255
export function shuffle<T>(array: T[]): T[] {
  const copy = [];
  let n = array.length;
  let i;

  // While there remain elements to shuffle…
  while (n) {
    // Pick a remaining element…
    i = Math.floor(Math.random() * array.length);

    // If not already shuffled, move it to the new array.
    if (i in array) {
      copy.push(array[i]);
      delete array[i];
      n--;
    }
  }

  return copy;
}

export function distributeRoles(
  gameState: GameState,
  players: Player[],
  chosenRoles: Role[]
): void {
  for (let index = 0; index < chosenRoles.length; index++) {
    const role = chosenRoles[index];
    if (index >= chosenRoles.length - CARDS_ON_TABLE) {
      gameState.tableRoles.push(role);
    } else {
      const player = players[index];
      gameState.playerRoles[role.name].set(player.id, player);
    }
  }
  for (const roleName of Object.values(RoleName)) {
    const roles = gameState.playerRoles[roleName];
    if (roles) {
      const tableRolesLength = gameState.tableRoles.filter(
        (role) => role.name === roleName
      ).length;
      const roleCount = roles.size + tableRolesLength;
      if (roleCount > MAX_ROLES_COUNT[roleName]) {
        throw new Error(
          `Invalid role distribution, There are ${roleCount} with role ${roleName} when there is a maximum of ${MAX_ROLES_COUNT[roleName]}`
        );
      }
    }
  }
}

export async function sendRoleMessages(
  gameState: GameState,
  players: Player[]
): Promise<string[]> {
  const roleMessages = players.map(async (player) => {
    const roleName = gameState.getRoleName(player);
    await player.send({
      files: [
        {
          attachment: `${IMG_BASE_URL}banner.png`,
          name: 'banner.png',
        },
      ],
    });
    await player.send({
      content: `A new game has started where you have the role ||**${roleName}**||.`,
      files: [
        {
          attachment: `${IMG_BASE_URL}${roleName}.png`,
          name: `SPOILER_${roleName}.png`,
        },
      ],
    });

    return AcknowledgeMessage(player, 'You fall deeply asleep.');
  });

  const invalidPlayerIDs = (await Promise.allSettled(roleMessages))
    .map((item, i) => ({ ...item, i }))
    .filter((result) => result.status === 'rejected')
    .map(({ i }) => {
      return players[i].id;
    });
  return invalidPlayerIDs;
}

export function millisToTime(millis: number): Time {
  const minutes = Math.max(0, Math.floor(millis / 60000));
  const seconds = Math.max(Math.ceil((millis % 60000) / 1000));
  return { minutes, seconds };
}

export async function playAllTurns(game: Game): Promise<void> {
  const { startGameState } = game;
  for (const roleName of callOrder) {
    const players = startGameState.playerRoles[roleName];
    if (players && players.size > 0) {
      const role = getRoleByName(roleName);
      let roles = players.map((player) => role.doTurn(game, player));
      if (
        game.newDoppelgangerRole === roleName &&
        isMimicRole(roleName) &&
        startGameState.playerRoles.Kẻ_mạo_danh.size > 0
      ) {
        const doppelGangers = startGameState.playerRoles.Kẻ_mạo_danh.map(
          (dplgnr) => role.doTurn(game, dplgnr)
        );
        roles = roles.concat(doppelGangers);
      }
      Log.info(`Now executing ${role.name}`);
      await Promise.all(roles);
    } else if (game.chosenRoles.includes(roleName)) {
      const fakeTime = FAKE_USER_TIME + Math.floor(Math.random() * 5000);
      Log.info(
        `Faking ${roleName} because it's a table role for ${fakeTime / 1000
        } seconds.`
      );
      await new Promise((resolve) => setTimeout(resolve, fakeTime));
    }
  }
}

export function getWinner(
  chosenPlayers: { target: Player; chosenBy: Player }[],
  gameState: GameState
): {
  winner: Team;
  votingOverview: string;
  playersWhoDie: Player[];
  dyingHunters: Player[];
  hunterKillList: Player[];
} {
  const votedForPlayers: Collection<string, { count: number; player: Player }> =
    new Collection();
  for (const player of chosenPlayers) {
    const oldPlayer = votedForPlayers.get(player.target.id);
    let count = 1;
    if (oldPlayer) {
      count = oldPlayer.count + 1;
    }
    votedForPlayers.set(player.target.id, { count, player: player.target });
  }

  const highestVoteCount = votedForPlayers.reduce(
    (acc, { count }) => Math.max(acc, count),
    1
  );

  const votingOverview = votedForPlayers
    .map(({ player, count }) => `${player.name}: ${count}`)
    .join('\n');

  let winner: Team = Team.werewolves;
  let playersWhoDie: Player[] = [];
  let dyingHunters: Player[] = [];
  let hunterKillList: Player[] = [];
  // If no player receives more than one vote, no one dies.
  if (highestVoteCount === 1) {
    // If a werewolf is among the players, team werewolf wins
    if (gameState.playerRoles.Ma_sói) {
      winner = Team.werewolves;
    }
  } else {
    const playersWhoDieWithCount = votedForPlayers.filter(
      ({ count }) => count === highestVoteCount
    );
    playersWhoDie = playersWhoDieWithCount.map(({ player }) => player);

    let hunterIds: string[];
    if (gameState.playerRoles.Thợ_săn) {
      hunterIds = gameState.playerRoles.Thợ_săn.map(({ id }) => id);
    }
    dyingHunters = playersWhoDie.filter(({ id }) => hunterIds.includes(id));

    let tannerIds: string[];
    if (gameState.playerRoles.Kẻ_chán_đời) {
      tannerIds = gameState.playerRoles.Kẻ_chán_đời.map(({ id }) => id);
    }

    let werewolfIds: string[];
    if (gameState.playerRoles.Ma_sói) {
      werewolfIds = gameState.playerRoles.Ma_sói.map(({ id }) => id);
    }

    // If a hunter dies, its target also dies
    if (dyingHunters.length > 0) {
      hunterKillList = dyingHunters.map((dyingHunter) => {
        const hunterChoice = chosenPlayers.find(
          ({ chosenBy }) => chosenBy.id === dyingHunter.id
        );
        if (!hunterChoice) {
          throw new Error('');
        }
        return hunterChoice.target;
      });
      const hunterKillListRoles = hunterKillList.map((p) =>
        gameState.getRoleName(p)
      );
      if (hunterKillListRoles.includes(RoleName.Ma_sói)) {
        winner = Team.villagers;
      }
      playersWhoDie = playersWhoDie.concat(hunterKillList);
    }

    // Tanner wins if he dies
    if (playersWhoDie.find(({ id }) => tannerIds.includes(id))) {
      winner = Team.tanner;
    } else if (playersWhoDie.find(({ id }) => werewolfIds.includes(id))) {
      winner = Team.villagers;
    } else {
      winner = Team.werewolves;
    }
  }

  return {
    winner,
    votingOverview,
    playersWhoDie,
    dyingHunters,
    hunterKillList,
  };
}

export function getRoleByName(roleName: RoleName): Role {
  switch (roleName) {
    case RoleName.Kẻ_mạo_danh:
      return new Doppelganger();
    case RoleName.Bợm_nhậu:
      return new Drunk();
    case RoleName.Thợ_săn:
      return new Hunter();
    case RoleName.Cú_đêm:
      return new Insomniac();
    case RoleName.Thợ_hồ:
      return new Mason();
    case RoleName.Kẻ_phản_bội:
      return new Minion();
    case RoleName.Đạo_tặc:
      return new Robber();
    case RoleName.Tiên_tri:
      return new Seer();
    case RoleName.Kẻ_chán_đời:
      return new Tanner();
    case RoleName.Kẻ_phá_hoại:
      return new Troublemaker();
    case RoleName.Dân_làng:
      return new Villager();
    case RoleName.Ma_sói:
      return new Werewolf();
    default:
      throw new Error('invalid gamestate');
  }
}
