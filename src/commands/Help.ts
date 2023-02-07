import { Message, MessageEmbed, TextChannel } from 'discord.js';
import { Prefix } from '../Config';
import { getDiscordInstance } from '../DiscordClient';
import { Command } from '../types/Command';

const command: Command = {
  names: ['help', 'h'],
  description: 'Thông tin trợ giúp',
  params: [],
  execute,
  adminOnly: false,
};

async function execute(msg: Message): Promise<void> {
  const client = getDiscordInstance();
  const embed = new MessageEmbed();

  embed.setTitle('One night ultimate Discord');
  embed.setDescription(
    'Visit https://github.com/DrSkunk/one-night-ultimate-discord for source code'
  );
  embed.setURL('https://github.com/DrSkunk/one-night-ultimate-discord');

  client.commands.forEach((command) => {
    let description = command.description;
    if (command.names.length > 1) {
      description += '\n Aliases: ';
      description += command.names
        .slice(1)
        .map((name) => `**${Prefix}${name}**`)
        .join(', ');
    }
    if (command.adminOnly) {
      description += '\n **Admin only**';
    }
    const parameters = command.params
      .map(({ optional, name }) => (optional ? `[${name}]` : name))
      .join(' ');
    const title = `${Prefix}${command.names[0]} ${parameters}`;
    embed.addField(title, description);
  });

  embed.setFooter(
    'Made with ❤️',
    'https://i.imgur.com/RPKkHMf.png'
  );
  const textChannel = msg.channel as TextChannel;
  textChannel.send(embed);
}
export = command;
