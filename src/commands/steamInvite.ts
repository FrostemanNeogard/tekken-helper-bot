import type {
  CommandInteraction,
  Interaction,
  MessageActionRowComponentBuilder,
} from "discord.js";
import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";
import { Discord, Slash, SlashOption } from "discordx";
import axios from "axios";
import { COLORS } from "../util/config";

const { STEAM_API_KEY } = process.env;
const steamProfileURLRegex =
  /^https:\/\/steamcommunity\.com\/(profiles|id)\/([a-zA-Z0-9_]+)\/$/;

@Discord()
export class SteamInvite {
  @Slash({
    description: "Create a clickable button to join a steam lobby.",
  })
  async steaminvite(
    @SlashOption({
      description: "Link to either your steam profile or your game session.",
      name: "steamurl",
      required: true,
      type: ApplicationCommandOptionType.String,
    })
    steamURL: string,
    @SlashOption({
      description: "Decide if you want the invite to never expire.",
      name: "neverexpire",
      required: false,
      type: ApplicationCommandOptionType.Boolean,
    })
    neverExpire: boolean,
    interaction: CommandInteraction
  ): Promise<void> {
    const steamInviteURLRegex = /^steam:\/\/joinlobby\/\d+\/\d+\/\d+$/;
    const isValidInviteLink = steamInviteURLRegex.test(steamURL);
    const isValidSteamLink = steamProfileURLRegex.test(steamURL);

    if (!isValidInviteLink && !isValidSteamLink) {
      await interaction.reply(
        "Your steam URL appears to be invalid. Please double check the URL and try again."
      );
      return;
    }

    const inviteURL = isValidInviteLink
      ? steamURL
      : await getSteamInviteLinkFromProfileUrl(steamURL);

    if (inviteURL == null) {
      await interaction.reply(
        "Something went wrong. Please make sure the user is in a joinable lobby."
      );
      return;
    }

    const redirectURL =
      "https://frostemanneogard.github.io/uri-redirector/?uri=" + inviteURL;

    const responseEmbed = new EmbedBuilder()
      .setTitle("Steam Invitation")
      .setColor(COLORS.success)
      .setTitle("You have been invited to a steam lobby!");

    const joinButton = new ButtonBuilder()
      .setLabel("Join Lobby")
      .setURL(redirectURL)
      .setStyle(ButtonStyle.Link);
    const row =
      new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        joinButton
      );
    const message = await interaction.reply({
      embeds: [responseEmbed],
      components: [row],
    });

    if (neverExpire == true) {
      return;
    }

    const collectorFilter = (i: Interaction) =>
      i.user.id === interaction.user.id;
    const timeoutEmbed = new EmbedBuilder()
      .setTitle("Steam Invitation")
      .setColor(COLORS.success)
      .setFields({
        name: "This invite has expired.",
        value: " ",
      });

    try {
      await message.awaitMessageComponent({
        filter: collectorFilter,
        time: 300_000,
      });
    } catch (e) {
      await interaction.editReply({ embeds: [timeoutEmbed], components: [] });
    }
  }
}

async function getSteamInviteLinkFromProfileUrl(steamUrl: string) {
  const match = steamUrl.match(steamProfileURLRegex);
  if (!match) {
    console.log("Invalid steam URL:", steamUrl);
    return null;
  }

  const isVanityUrl = match[1] == "id";
  const steamId64 = isVanityUrl
    ? await getSteamId64FromVanityName(match[2])
    : match[2];

  if (!steamId64 == null) {
    console.log("Couldn't get steamid64 from URL:", steamUrl);
    return null;
  }

  const response = await axios.get(
    `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${STEAM_API_KEY}&format=json&steamids=${steamId64}`
  );

  if (response.status != 200) {
    console.error("An error ocurred when fetching the Steam API.");
    return null;
  }

  const playerData = response.data.response.players[0];

  if (
    !playerData.lobbysteamid ||
    !playerData.gameid ||
    !playerData.lobbysteamid
  ) {
    console.error("The player is not currently in a lobby.");
    return null;
  }

  return `steam://joinlobby/${playerData.gameid}/${playerData.lobbysteamid}/${playerData.steamid}`;
}

async function getSteamId64FromVanityName(vanityName: string) {
  const response = await axios.get(
    `http://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=${STEAM_API_KEY}&vanityurl=${vanityName}`
  );

  if (response.status != 200) {
    console.error("An error ocurred when fetching the Steam API.");
    return null;
  }

  return response.data?.response?.steamid;
}
