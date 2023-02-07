import {
  Collection,
  GuildMember,
  MessageReaction,
  TextChannel,
  User,
} from 'discord.js';
import { REACTION_WAIT_TIME, MAX_RETRIES, SETUP_WAIT_TIME } from './Constants';
import { ChoosePlayerType } from './enums/ChoosePlayer';
import { ReactionChoice } from './enums/ReactionChoice';
import { RoleName } from './enums/RoleName';
import { GameState } from './GameState';
import { Log } from './Log';
import { Player } from './Player';

const responseError = new Error(
  'Waited too long for a response from one of the players. Aborting game.'
);

export async function ChooseRoles(
  author: User,
  textChannel: TextChannel,
  amountToPick: number
): Promise<RoleName[]> {
  const specialRoles = {
    [ReactionChoice['0️⃣']]: RoleName.Kẻ_mạo_danh,
    [ReactionChoice['1️⃣']]: RoleName.Bợm_nhậu,
    [ReactionChoice['2️⃣']]: RoleName.Thợ_săn,
    [ReactionChoice['3️⃣']]: RoleName.Cú_đêm,
    [ReactionChoice['4️⃣']]: RoleName.Thợ_hồ,
    [ReactionChoice['5️⃣']]: RoleName.Thợ_hồ,
    [ReactionChoice['6️⃣']]: RoleName.Kẻ_phản_bội,
    [ReactionChoice['7️⃣']]: RoleName.Đạo_tặc,
    [ReactionChoice['8️⃣']]: RoleName.Tiên_tri,
    [ReactionChoice['9️⃣']]: RoleName.Kẻ_chán_đời,
    [ReactionChoice['🔟']]: RoleName.Kẻ_phá_hoại,
    [ReactionChoice['🇦']]: RoleName.Dân_làng,
    [ReactionChoice['🇧']]: RoleName.Dân_làng,
    [ReactionChoice['🇨']]: RoleName.Dân_làng,
  };
  const rolesText = Object.keys(specialRoles).reduce(
    (acc, emoji) =>
      acc + `\n${emoji}: ${specialRoles[emoji as ReactionChoice]}`,
    ''
  );
  const message = await textChannel.send(
    `You must pick ${amountToPick} roles, which do you want to add?${rolesText}`
  );
  for (const reaction of Object.keys(specialRoles)) {
    await message.react(reaction);
  }

  const filter = (reaction: MessageReaction, user: User) => {
    return (
      Object.keys(specialRoles).includes(reaction.emoji.name) &&
      user.id === author.id
    );
  };
  try {
    const collected = await message.awaitReactions(filter, {
      max: amountToPick,
      time: SETUP_WAIT_TIME,
      errors: ['time'],
    });
    Log.log('Collected reaction(s)');

    const roleNames = Object.values(collected.array()).map((reaction) => {
      const reactionChoice = reaction.emoji.name as ReactionChoice;
      return specialRoles[reactionChoice];
    });

    return roleNames;
  } catch (error) {
    throw new Error('Waited too long for a response. Aborting game creation.');
  }
}

export async function ChooseTableCard(
  gameState: GameState,
  player: Player,
  amountOfCardstoPick: number,
  text: string,
  retryCounter = 0
): Promise<{ [key: string]: number }[]> {
  const message = await player.send(text);
  const reactions: string[] = ['1️⃣', '2️⃣', '3️⃣'];
  for (const reaction of reactions) {
    await message.react(reaction);
  }
  const filter = (reaction: MessageReaction) => {
    return reactions.includes(reaction.emoji.name);
  };
  try {
    const collected = await message.awaitReactions(filter, {
      max: amountOfCardstoPick,
      time: REACTION_WAIT_TIME,
      errors: ['time'],
    });
    Log.log('Collected reaction(s)');

    if (amountOfCardstoPick === 1) {
      const reactionName = Object.values(collected.array())[0].emoji.name;
      const reactionIndex = reactions.indexOf(reactionName);
      return [{ [reactionName]: reactionIndex }];
    } else {
      const cardIndexes = Object.values(collected.array()).map(({ emoji }) => ({
        [emoji.name]: reactions.indexOf(emoji.name),
      }));

      return cardIndexes;
    }
  } catch (error) {
    Log.error('Reaction timed out');
    await player.send('Reaction timed out. Please make a selection.');
    if (retryCounter + 1 < MAX_RETRIES) {
      return await ChooseTableCard(
        gameState,
        player,
        amountOfCardstoPick,
        text,
        retryCounter + 1
      );
    } else {
      throw responseError;
    }
  }
}

export async function ChooseToDoAction(
  player: Player,
  text: string
): Promise<boolean> {
  const message = await player.send(text);
  const reactions: string[] = ['✅', '❌'];
  for (const reaction of reactions) {
    await message.react(reaction);
  }
  const filter = (reaction: MessageReaction) => {
    return reactions.includes(reaction.emoji.name);
  };

  try {
    const collected = await message.awaitReactions(filter, {
      max: 1,
      time: REACTION_WAIT_TIME,
      errors: ['time'],
    });
    Log.log('Collected a reaction');
    return Object.values(collected.array())[0].emoji.name === reactions[0];
  } catch (error) {
    await player.send('Reaction timed out, not doing action.');
    return false;
  }
}

export async function AcknowledgeMessage(
  player: Player,
  text: string
): Promise<void> {
  const message = await player.send(`${text}\nPress 👍 to acknowledge.`);
  await message.react('👍');
  const filter = (reaction: MessageReaction) => {
    return reaction.emoji.name === '👍';
  };

  try {
    await message.awaitReactions(filter, {
      max: 1,
      time: REACTION_WAIT_TIME,
      errors: ['time'],
    });
    Log.log('Collected a reaction');
  } catch (error) {
    await player.send('Reaction timed out, message was acknowledged.');
  }
}

export async function ChoosePlayer(
  allPlayers: Player[],
  player: Player,
  choosePlayerType: ChoosePlayerType = ChoosePlayerType.view,
  text: string,
  retryCounter = 0
): Promise<Player[]> {
  const otherPlayers = allPlayers.filter(
    (playerFromList) => playerFromList.id !== player.id
  );

  const reactions: string[] = [
    '1️⃣',
    '2️⃣',
    '3️⃣',
    '4️⃣',
    '5️⃣',
    '6️⃣',
    '7️⃣',
    '8️⃣',
    '9️⃣',
    '🔟',
  ].slice(0, otherPlayers.length);
  const playerList = otherPlayers.reduce(
    (acc, player, i) => acc + `\n- ${reactions[i]}: ${player.name}`,
    ''
  );

  const message = await player.send(`${text}:${playerList}`);
  for (const reaction of reactions) {
    await message.react(reaction);
  }
  const filter = (reaction: MessageReaction) => {
    return reactions.includes(reaction.emoji.name);
  };
  try {
    const max = choosePlayerType === ChoosePlayerType.switch ? 2 : 1;
    const collected = await message.awaitReactions(filter, {
      max,
      time: REACTION_WAIT_TIME,
      errors: ['time'],
    });
    Log.log('Collected a reaction');

    if (choosePlayerType === ChoosePlayerType.switch) {
      const emoji1 = Object.values(collected.array())[0].emoji.name;
      const emoji2 = Object.values(collected.array())[1].emoji.name;
      const cardIndex1 = reactions.indexOf(emoji1);
      const cardIndex2 = reactions.indexOf(emoji2);

      return [otherPlayers[cardIndex1], otherPlayers[cardIndex2]];
    }

    const emoji = Object.values(collected.array())[0].emoji.name;
    const cardIndex = reactions.indexOf(emoji);
    return [otherPlayers[cardIndex]];
  } catch (error) {
    Log.error('Reaction timed out');
    await player.send('Reaction timed out. Please make a selection.');
    if (retryCounter + 1 < MAX_RETRIES) {
      return await ChoosePlayer(
        allPlayers,
        player,
        choosePlayerType,
        text,
        retryCounter + 1
      );
    } else {
      throw responseError;
    }
  }
}

export async function ChoosePlayerOrTable(
  gameState: GameState,
  player: Player,
  text: string,
  retryCounter = 0
): Promise<boolean> {
  const message = await player.send(text);
  const reactions: string[] = ['1️⃣', '2️⃣'];
  for (const reaction of reactions) {
    await message.react(reaction);
  }
  const filter = (reaction: MessageReaction) => {
    return reactions.includes(reaction.emoji.name);
  };
  try {
    const collected = await message.awaitReactions(filter, {
      max: 1,
      time: REACTION_WAIT_TIME,
      errors: ['time'],
    });
    Log.log('Collected a reaction');
    const emoji = Object.values(collected.array())[0].emoji.name;
    const reactionIndex = reactions.indexOf(emoji);
    return reactionIndex === 0;
  } catch (error) {
    Log.error('Reaction timed out');
    await player.send('Reaction timed out. Please make a selection.');
    if (retryCounter + 1 < MAX_RETRIES) {
      return await ChoosePlayerOrTable(
        gameState,
        player,
        text,
        retryCounter + 1
      );
    } else {
      throw responseError;
    }
  }
}

export async function getPlayerList(
  textChannel: TextChannel,
  potentialPlayers: GuildMember[],
  text: string
): Promise<User[]> {
  const reactions: string[] = ['✅'];
  const filter = (reaction: MessageReaction, user: User) => {
    return (
      reactions.includes(reaction.emoji.name) &&
      !!potentialPlayers.find(({ id }) => id === user.id)
    );
  };

  const message = await textChannel.send(text);

  for (const reaction of reactions) {
    await message.react(reaction);
  }
  let collected: Collection<string, MessageReaction>;
  try {
    collected = (await message.awaitReactions(filter, {
      maxUsers: potentialPlayers.length,
      time: REACTION_WAIT_TIME,
      errors: ['time'],
    })) as Collection<string, MessageReaction>;
  } catch (errorCollected) {
    collected = errorCollected as Collection<string, MessageReaction>;
  }
  
  Log.log('Collected a reaction');
  if (collected.array().length === 0) {
    return [];
  }
  return (await collected.array()[0].users.fetch())
    .array()
    .filter(({ bot }) => !bot);
}
