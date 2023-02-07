import { GuildMember, Message, TextChannel } from 'discord.js';
import {
  CARDS_ON_TABLE,
  MAXIMUM_PLAYERS,
  MAX_ROLES_COUNT,
  MINIMUM_PLAYERS,
} from '../Constants';
import { ChooseRoles, getPlayerList } from '../ConversationHelper';
import { RoleName } from '../enums/RoleName';
import { getGamesManagerInstance } from '../GamesManager';
import { Log } from '../Log';
import { Command } from '../types/Command';

enum Optional {
  quick = 'quick',
  silentnight = 'silentnight',
  silent = 'silent',
}

const command: Command = {
  names: ['start'],
  description: `Bắt đầu chơi. Dùng 'start quick' để sử dụng cấu hình trước đó.
  Dùng 'start silentnight' để tắt âm thanh đêm.
  Dùng 'start silent' để tắt tất cả hiệu ứng âm thanh.`,
  params: [
    {
      optional: true,
      name: Optional.quick,
    },
    {
      optional: true,
      name: Optional.silentnight,
    },
    {
      optional: true,
      name: Optional.silent,
    },
  ],
  execute,
  adminOnly: false,
};

async function execute(msg: Message, args: string[]): Promise<void> {
  const textChannel = msg.channel as TextChannel;
  const gamesManager = getGamesManagerInstance();

  const lowerArgs = args.map((arg) => arg.toLowerCase());
  const quickStart = lowerArgs.includes(Optional.quick);
  const silentNight = lowerArgs.includes(Optional.silentnight);
  const silent = lowerArgs.includes(Optional.silent);

  const voiceChannel = msg.member?.voice.channel;
  if (!voiceChannel) {
    textChannel.send('Vui lòng vào kênh voice.');
    return;
  }

  const members = voiceChannel?.members;

  if (!members) {
    textChannel.send(`Kênh voice trống`);
    return;
  }
  const potentialPlayers = members.filter((m) => !m.user.bot).array();
  let players: GuildMember[];
  try {
    const playerTags = potentialPlayers.map((p) => `<@${p.id}>`).join(', ');
    const text = `${playerTags}\nBấm vào ✅ để tham gia.`;
    players = (await getPlayerList(textChannel, potentialPlayers, text)).map(
      ({ id }) => {
        const member = members.get(id);
        if (!member) {
          throw new Error('Một người chơi đã thoát khỏi kênh voice.');
        }
        return member;
      }
    );
  } catch (error) {
    textChannel.send((error as Error).message);
    return;
  }

  const author = msg.author;
  const amountToPick =
    players.length - MAX_ROLES_COUNT[RoleName.Ma_sói] + CARDS_ON_TABLE;
  const werewolves = Array.from(
    { length: MAX_ROLES_COUNT[RoleName.Ma_sói] },
    () => RoleName.Ma_sói
  );

  try {
    if (players.length < MINIMUM_PLAYERS || players.length > MAXIMUM_PLAYERS) {
      throw new Error(
        `Không đủ người chơi. Game cần từ ${MINIMUM_PLAYERS} đến ${MAXIMUM_PLAYERS} người.`
      );
    }
    if (quickStart) {
      await gamesManager.quickStartGame(
        players,
        msg.channel as TextChannel,
        voiceChannel,
        silentNight,
        silent
      );
    } else {
      const roles = [
        ...werewolves,
        ...(await ChooseRoles(author, textChannel, amountToPick)),
      ];
      await gamesManager.startNewGame(
        players,
        msg.channel as TextChannel,
        voiceChannel,
        silentNight,
        silent,
        roles
      );
    }
  } catch (error) {
    Log.error((error as Error).message);
    await textChannel.send((error as Error).message);
  }
}
export = command;
