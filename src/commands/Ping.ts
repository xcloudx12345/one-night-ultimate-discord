import { Message } from 'discord.js';
import { Command } from '../types/Command';

const command: Command = {
  names: ['ping'],
  description: 'Kiểm tra tốc độ bản hồi của bot.',
  params: [],
  execute,
  adminOnly: false,
};

async function execute(msg: Message): Promise<void> {
  msg.reply(`Pong! \`${Date.now() - msg.createdTimestamp}ms\``);
}
export = command;
