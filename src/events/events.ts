import { Events } from "discord.js";
import { ArgsOf, Client, Discord, On, Once } from "discordx";
import "dotenv/config";

@Discord()
export class EventListener {
  @On({ event: Events.MessageCreate })
  onMessage([message]: ArgsOf<Events.MessageCreate>) {}

  @On({ event: Events.InteractionCreate })
  onInteractionCreate(
    [interaction]: ArgsOf<Events.InteractionCreate>,
    client: Client
  ) {
    console.log(
      `\nCommand: "${interaction.toString()}"\n\b was run by: "${
        interaction.user.globalName
      }" \n\b in channel: "${interaction.channelId}" \n\b in server: "${
        interaction.guild?.name
      }" \n\b at: ${new Date().toLocaleDateString()}\n`
    );
    client.executeInteraction(interaction);
  }

  @Once({ event: Events.ClientReady })
  async onReady([_args]: ArgsOf<Events.ClientReady>, client: Client) {
    await client.initApplicationCommands();
    console.log(`Commands have been updated for ${client.user?.username}.`);
  }
}
