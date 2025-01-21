import axios from "axios";
import {
  ApplicationCommandOptionType,
  CommandInteraction,
  Embed,
  EmbedBuilder,
} from "discord.js";
import { Discord, Slash, SlashOption } from "discordx";
import { EwgfPlayer } from "../__types/ewgfApiResponses";
import { COLORS } from "../util/config";

// TODO: Fix these regions. Names are incorrect (except for Europe) and I don't know how many there are.
enum RegionNamesById {
  "NA" = 1,
  "Region2" = 2,
  "Region3" = 3,
  "Europe" = 4,
  "Region5" = 5,
  "Region6" = 6,
  "Region7" = 7,
  "Region8" = 8,
  "Region9" = 9,
}

@Discord()
export class PlayerLookup {
  @Slash({
    description: "Display information for a given TEKKEN 8 player.",
  })
  async playerlookup(
    @SlashOption({
      description: "In-game player ID or name.",
      name: "playerid",
      required: true,
      type: ApplicationCommandOptionType.String,
    })
    playerId: string,
    interaction: CommandInteraction
  ): Promise<void> {
    const response = await axios.get(
      `https://ewgf.gg/api/search?query=${playerId}`
    );

    if (response.status != 200) {
      interaction.reply("Couldn't fetch data, please try again later.");
      return;
    }

    if (response.data?.length == 0) {
      interaction.reply("No players found.");
      return;
    }

    if (response.data?.length > 1) {
      const playerFields = response.data
        .map((p: EwgfPlayer) => ({
          name: `${p.name} (${p.mostPlayedCharacter}, ${
            RegionNamesById[p.regionId]
          })`,
          value: `ID: ${p.tekkenId}`,
        }))
        .slice(0, 8);

      const multiplePlayerEmbed = new EmbedBuilder()
        .setTitle("Multiple matches found")
        .setDescription("Please try again with one of these players' IDs.")
        .setColor(COLORS.warning)
        .setFields(playerFields);

      interaction.reply({ embeds: [multiplePlayerEmbed] });
      return;
    }

    const playerData: EwgfPlayer = response.data[0];
    const responseEmbed = getResponseEmbedForPlayer(playerData);

    interaction.reply({ embeds: [responseEmbed] });
  }
}

function getImageUrlFromCharacterName(characterName: string) {
  const formattedCharacterName = characterName.replaceAll(" ", "_");
  return `https://ewgf.gg/static/character-icons/${formattedCharacterName}T8.png`;
}

function getResponseEmbedForPlayer(player: EwgfPlayer): EmbedBuilder {
  const responseEmbed = new EmbedBuilder()
    .setTitle("TEKKEN 8 Player data")
    .setColor(COLORS.success)
    .setThumbnail(getImageUrlFromCharacterName(player.mostPlayedCharacter))
    .setFields(
      {
        name: "Name",
        value: player.name,
      },
      {
        name: "Tekken ID",
        value: player.tekkenId,
      },
      {
        name: "Most played character",
        value: player.mostPlayedCharacter,
      },
      {
        name: "Rank",
        value: player.danRankName,
      },
      {
        name: "Region",
        value: RegionNamesById[player.regionId],
      }
    );

  return responseEmbed;
}
