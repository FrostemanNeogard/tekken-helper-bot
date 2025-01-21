import { CommandInteraction } from "discord.js";
import { Discord, Slash } from "discordx";
import { getDefaultEmbed } from "../util/config";

@Discord()
export class Info {
  @Slash({
    description: "Get some help",
  })
  help(interaction: CommandInteraction) {
    const helpEmbed = getDefaultEmbed();
    helpEmbed
      .setTitle("HELP")
      .setDescription("Information about this bot and its commands.")
      .setFields({
        name: "/ping",
        value: `Responds with "Pong!"`,
      });
    interaction.reply({ embeds: [helpEmbed] });
  }

  @Slash({
    description: `Responds with "Pong!"`,
  })
  ping(interaction: CommandInteraction) {
    interaction.reply(`Pong!`);
  }
}
