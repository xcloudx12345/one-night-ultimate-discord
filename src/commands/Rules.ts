import { Message } from 'discord.js';
import { RULES_URL } from '../Constants';
import { Command } from '../types/Command';

const command: Command = {
  names: ['rules', 'r'],
  description: 'Gửi luật chơi cho bạn qua tin nhắn riêng.',
  params: [],
  execute,
  adminOnly: false,
};

async function execute(msg: Message): Promise<void> {
  try {
    await msg.author.send(`Đọc luật ở đây: ${RULES_URL}`);
  } catch (error) {
    msg.reply(
      `Tôi không thể nhắn tin riêng do bạn đã cài đặt chặn tin nhắn. Cần biết luật mới chơi được game.`
    );
  }
}
export = command;
