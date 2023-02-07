import { TextChannel, VoiceChannel, GuildMember } from 'discord.js';
import {
  MAXIMUM_PLAYERS,
  MINIMUM_PLAYERS,
  NIGHT_ALMOST_OVER_REMINDER,
  ROUND_TIME_MILLISECONDS,
  ROUND_TIME_MINUTES,
} from './Constants';
import { RoleName } from './enums/RoleName';
import { getGamesManagerInstance } from './GamesManager';
import { Log } from './Log';
import { Player } from './Player';
import { GameState } from './GameState';
import { Role } from './roles/Role';
import { ChoosePlayer } from './ConversationHelper';
import { Time } from './types/Time';
import { ChoosePlayerType } from './enums/ChoosePlayer';
import {
  callOrder,
  distributeRoles,
  getRoleByName,
  getWinner,
  millisToTime,
  playAllTurns,
  sendRoleMessages,
  shuffle,
} from './GameLogic';
import { SoundManager } from './SoundManager';
import { Phase } from './enums/Phase';

export class Game {
  public readonly players: Player[];
  private readonly _textChannel: TextChannel;
  private readonly _chosenRoles: RoleName[];
  private _startGameState: GameState;
  public readonly gameState: GameState;
  private _started: boolean;
  private _startTime: Date | null;
  public newDoppelgangerRole: RoleName | null;
  private _hasVoice: boolean;
  private _soundManager: SoundManager;
  private _phase: Phase;

  constructor(
    players: GuildMember[],
    textChannel: TextChannel,
    voiceChannel: VoiceChannel,
    chosenRoles: RoleName[],
    silentNight: boolean,
    silent: boolean
  ) {
    if (players.length < MINIMUM_PLAYERS || players.length > MAXIMUM_PLAYERS) {
      throw new Error('Invalid amount of players');
    }
    this.players = players.map((player) => new Player(player));
    this._textChannel = textChannel;
    this._chosenRoles = chosenRoles;
    this._startGameState = new GameState();
    this.gameState = new GameState();
    this._started = false;
    this._startTime = null;
    this.newDoppelgangerRole = null;
    this._soundManager = new SoundManager(
      voiceChannel.guild.id,
      silentNight,
      silent
    );
    this._phase = Phase.night;

    try {
      this._soundManager.voiceChannel = voiceChannel;
      this._hasVoice = true;
      Log.info('Joining voice channel.');
    } catch (error) {
      this._hasVoice = false;
      Log.info((error as Error).message);
    }
  }

  public get startGameState(): GameState {
    return this._startGameState;
  }

  public get chosenRoles(): RoleName[] {
    return this._chosenRoles;
  }

  public get remainingTime(): Time {
    if (!this._startTime) {
      throw new Error('Countdown has not started yet.');
    }
    const now = new Date().getTime();
    const finish = this._startTime.getTime() + ROUND_TIME_MILLISECONDS;
    return millisToTime(finish - now);
  }

  public get textChannel(): TextChannel {
    return this._textChannel;
  }

  public get tagPlayersText(): string {
    return this.players.map(({ tag }) => tag).join(', ');
  }

  public get phase(): Phase {
    return this._phase;
  }

  public async start(): Promise<void> {
    if (this._started) {
      throw new Error('Game has already started');
    }

    this.sendChannelMessage(
      `Starting new game with players: ${this.tagPlayersText}
And with these roles: ${this._chosenRoles.join(', ')}`
    );
    this._started = true;

    const chosenRoles = shuffle(
      this._chosenRoles.map((roleName) => getRoleByName(roleName))
    ) as Role[];

    distributeRoles(this.gameState, this.players, chosenRoles);

    this._startGameState = this.gameState.copy();

    if (this._hasVoice) {
      this._soundManager.startNightLoop();
    }

    const invalidPlayerIDs = await sendRoleMessages(
      this.gameState,
      this.players
    );

    if (invalidPlayerIDs.length !== 0) {
      Log.warn(
        'Unable to start game due to privacy settings for some player(s)'
      );
      const playerNames = invalidPlayerIDs.reduce(
        (acc, id) => `${acc}- <@${id}>\n`,
        ''
      );
      this.sendChannelMessage(
        `Unable to start game because I cannot send a DM to the following player(s):
${playerNames}
Please check your privacy settings.`
      );
      this.stopGame();
      return;
    }
    // start game
    try {
      await playAllTurns(this);
    } catch (error) {
      Log.error(error);
      this.sendChannelMessage((error as Error).message);
      this.stopGame();
      return;
    }
    await Promise.all(
      this.players.map((p) =>
        p.send('You wake up! Go to the discussion text channel to continue.')
      )
    );
    this._phase = Phase.discussion;
    Log.info('Night over');

    if (this._hasVoice) {
      this._soundManager.stopNightLoop();
    }
    if (this._hasVoice) {
      this._soundManager.playGong();
    }

    this._startTime = new Date();

    await this.sendChannelMessage(
      `${this.tagPlayersText}: The night is over! You now have ${ROUND_TIME_MINUTES} minutes to figure out what has happened!`
    );
    const wakeUpOrder = callOrder
      .filter((roleName) => this._chosenRoles.includes(roleName))
      .map((roleName, i) => `${i + 1}: ${roleName}`)
      .join('\n');
    await this.sendChannelMessage(`Wakeup order:\n${wakeUpOrder}`);
    await new Promise((resolve) =>
      setTimeout(resolve, ROUND_TIME_MILLISECONDS - NIGHT_ALMOST_OVER_REMINDER)
    );

    if (this.phase === Phase.ending) {
      return;
    }
    await this.sendChannelMessage(
      `${this.tagPlayersText} ${
        NIGHT_ALMOST_OVER_REMINDER / 1000
      } seconds remaining!`
    );

    if (this._hasVoice) {
      this._soundManager.playGong();
    }

    setTimeout(() => this.endGame(), NIGHT_ALMOST_OVER_REMINDER);
  }

  private sendChannelMessage(text: string) {
    return this._textChannel.send(text);
  }

  public async endGame(): Promise<void> {
    if (this._phase === Phase.ending) {
      return;
    }
    this._phase = Phase.ending;
    if (this._hasVoice) {
      this._soundManager.playGong();
    }
    await this.sendChannelMessage(
      `Everybody stop talking! That means you ${this.tagPlayersText}
Reply to the DM you just received to vote for who to kill.`
    );

    const choosePromises = this.players.map(async (player) => {
      const toKill = (
        await ChoosePlayer(
          this.players,
          player,
          ChoosePlayerType.kill,
          'Choose a player to kill'
        )
      )[0];
      player.send(`You chose to kill ${toKill.name}`);
      return toKill;
    });
    const chooseResult = (await Promise.all(choosePromises)).flat();
    const chosenPlayers = chooseResult.map((target, i) => ({
      target,
      chosenBy: this.players[i],
    }));

    const winState = await getWinner(chosenPlayers, this.gameState);
    let winText = `Voting overview:\n${winState.votingOverview}`;
    if (winState.playersWhoDie.length === 0) {
      winText += '\nNobody dies!';
    } else {
      const playersWhoDieNames = winState.playersWhoDie
        .map((player) => player.name)
        .join(', ');
      winText += `\nThe following player(s) die: ${playersWhoDieNames}`;

      const hunterKillListNames = winState.hunterKillList
        .map(({ name }) => name)
        .join(' and ');
      const dyingHuntersNames = winState.dyingHunters
        .map(({ name }) => name)
        .join(' and ');
      if (winState.dyingHunters.length === 1) {
        winText += `\nSince ${winState.dyingHunters[0].name} was a hunter, ${winState.hunterKillList[0].name} also dies.`;
      } else if (winState.dyingHunters.length > 1) {
        winText += `\nSince ${dyingHuntersNames} were hunters, ${hunterKillListNames} also die.`;
      }
    }

    winText += `\nThis means **team ${winState.winner}** has won!`;
    const winMessage = await this.sendChannelMessage(winText);
    await winMessage.react('🥳');

    const stateText = `Results\n**Roles before the night**:
${this._startGameState.print()}

**Roles after the night**:
${this.gameState.print(this.newDoppelgangerRole)}`;
    await this.sendChannelMessage(stateText);
    Log.info('Game has ended');
    this.stopGame();
  }

  private stopGame() {
    if (this._hasVoice) {
      this._soundManager.stop();
    }
    getGamesManagerInstance().stopGame(this._textChannel);
  }
}
