import * as Discord from 'discord.js';
import * as Memstore from '../lib/memstore';
import * as Initiative from '../lib/initiative';
import * as config from '../../config.json';

import { Command } from '../lib/command';
import { Database } from '../lib/database';

export class GMRequiredError extends Initiative.InitiativeError { }
export class InvalidPresetError extends Initiative.InitiativeError { }
export class InvalidSettingError extends Initiative.InitiativeError { }
export class InvalidSettingOptionError extends InvalidSettingError { }

export class init extends Command {
    constructor() {
        super();

        this.name = 'init';
        this.helpName = '/init';
        this.description = 'Manage initiative and round sequence';
        this.usage = [
            '**/init**',
            '**/init** [ +|- ]__value__',
            '\n⚠️ For the channel GM only:\n',
            '**/init** __begin|end|next|reset__ ',
            '**/init** __name__ [ +|- ]__value__',
            '**/init** **preset** __arps|dnd|adnd__',
            '**/init** **set** **direction** __up|down__',
            '**/init** **set** **style** __counted|ordered__',
            '**/init** **set** **cycle** __linear|circular__'
        ];
    }

    public execute(message: Discord.Message, args: string[], db: Database) {
        const key      = this.getKey(message);
        let initiative = Memstore.initiative.get(key);

        if (initiative === undefined) {
            initiative = new Initiative.Initiative(message.guild.id, message.channel.id);
            Memstore.initiative.set(key, initiative);
        }

        try {
            if (args.length === 0) {
                this.show(message, initiative);
                return;
            }

            const isGM = this.isGM(message);

            switch (args[0]) {
                case 'begin':
                    if (!isGM) throw GMRequiredError;
                    this.begin(message, initiative);
                    message.channel.send('The round has started.');
                    break;
                case 'end':
                    if (!isGM) throw GMRequiredError;
                    this.end(message, initiative);
                    message.channel.send('The round has ended.');
                    break;
                case 'next':
                    if (!isGM) throw GMRequiredError;
                    this.next(message, initiative);
                    break;
                case 'reset':
                    if (!isGM) throw GMRequiredError;
                    this.reset(message, initiative);
                    message.channel.send('Initiative has restarted.');
                    break;
                case 'preset':
                    if (!isGM) throw GMRequiredError;
                    this.preset(message, initiative, args[2]);
                    break;
                case 'set':
                    if (!isGM) throw GMRequiredError;
                    this.set(message, initiative, args[2], args[3]);
                    break;
                default:
                    this.assign(message, isGM, initiative, args);
                    break;
            }

            console.log(initiative);
            Memstore.initiative.set(key, initiative);
        } catch (error) {
            if (error instanceof GMRequiredError) {
                return message.reply('you must be the GM to do that!');
            } else if (error instanceof Initiative.RoundHasStartedError) {
                return message.reply('the round has already started.');
            } else if (error instanceof Initiative.RoundHasNotStartedError) {
                return message.reply('the round hasn\'t started yet!');
            } else if (error instanceof Initiative.PlayerNotEnrolledError) {
                return message.reply('I can\'t modify a nonexistent initiative.');
            } else if (error instanceof InvalidPresetError || error instanceof InvalidSettingError) {
                return message.reply(error.message);
            } else {
                throw error;
            }
        }
    }

    /****************************************************************************/

    private isGM(message: Discord.Message): boolean {
        return message.member.roles.cache.some(role => {
            const matches = role.name.match(new RegExp(config.gm_role));
            if (matches === null) return false;
            return matches.length > 0;
        });
    }

    private getKey(message: Discord.Message): string {
        return message.guild.id + '::' + message.channel.id;
    }

    private show(message: Discord.Message, initiative: Initiative.Initiative) {
        const current = initiative.current;
        const players = initiative.upNow().keys();

        let playerList = new Array<string>();

        // FIXME: why do the mentions not work?
        // FIXME: "the round has started" should appear BEFORE we show the round info (probably need to move the message into begin())

        for (const player of players) {
            if (player instanceof Initiative.PC) {
                playerList.push(`<@${player.identity()}>`);
            } else if (player instanceof Initiative.NPC) {
                playerList.push(`_${player.identity()}_`);
            }
        }

        message.channel.send(`The current initiative is **${current}**\n\n**Up Now:** ${playerList.length > 0 ? playerList.join(', ') : 'Nobody'}`);
    }

    private begin(message: Discord.Message, initiative: Initiative.Initiative) {
        initiative.begin();
        this.show(message, initiative);
    }

    private end(message: Discord.Message, initiative: Initiative.Initiative) {
        initiative.end();
    }

    private next(message: Discord.Message, initiative: Initiative.Initiative) {
        initiative.next();
        this.show(message, initiative);
    }

    private reset(message: Discord.Message, initiative: Initiative.Initiative) {
        initiative.reset();
        this.show(message, initiative);
    }

    private preset(message: Discord.Message, initiative: Initiative.Initiative, name: string) {
        let p: Initiative.Preset

        switch (name) {
            case 'arps':
                p = new Initiative.ARPS();
                break;
            case 'dnd':
                p = new Initiative.DnD();
                break;
            case 'adnd':
                p = new Initiative.ADnD();
                break;
            default:
                throw new InvalidPresetError(`"${name}" is not a known preset.`);
        }

        initiative.preset(p);
    }

    private set(message: Discord.Message, initiative: Initiative.Initiative, setting: string, value: string) {
        switch (setting) {
            case "direction":
                switch (value) {
                    case "up":
                        initiative.direction = Initiative.Direction.up;
                        break;
                    case "down":
                        initiative.direction = Initiative.Direction.down;
                        break;
                    default:
                        throw new InvalidSettingOptionError(`"${value}" is not a valid direction.`);
                }

                break;
            case "style":
                switch (value) {
                    case "counted":
                        initiative.style = Initiative.Style.counted;
                        break;
                    case "ordered":
                        initiative.style = Initiative.Style.ordered;
                        break;
                    default:
                        throw new InvalidSettingOptionError(`"${value}" is not a valid style.`);
                }

                break;
            case "cycle":
                switch (value) {
                    case "linear":
                        initiative.cycle = Initiative.Cycle.linear;
                        break;
                    case "circular":
                        initiative.cycle = Initiative.Cycle.circular;
                        break;
                    default:
                        throw new InvalidSettingOptionError(`"${value}" is not a valid cycle.`);
                }

                break;
            default:
                throw new InvalidSettingError(`"${setting}" is not a valid setting.`);
        }
    }

    private assign(message: Discord.Message, isGM: boolean, initiative: Initiative.Initiative, args: string[]) {
        const name = !args[0].match(/^[+-]?\d+$/) ? args[0] : null;

        if (name !== null && !isGM) {
            throw new GMRequiredError();
        }

        let player: Initiative.Player;

        if (name !== null) {
            player = new Initiative.NPC(name);
        } else {
            player = new Initiative.PC(parseInt(message.author.id));
        }

        const value = name === null ? args[0] : args[1];
        const [operator, amount] = value.match(/([+-]?)(\d+)/).slice(1,3);

        if (!operator) {
            initiative.set(player, parseInt(amount));
        } else {
            initiative.update(player, operator === '+' ? parseInt(amount) : -parseInt(amount));
        }
    }
}

export const instance = init;

/*
            This one is really temporary; not sure this belongs in the database, per se.

            It needs some kind of temporary storage, and probably nothing fancier than a
            JSON file, TBH. But, let's think about the need.

            It does basically work like I wrote up, except that we won't have a character
            involved, just a user(id). That's OK, though, since if we go back to characters
            being a thing, if we know what the user's current character is for the channel,
            we can just look it up. So, doesn't box us in.

            In fact, at some level, being able to do a user mention might be better here since
            it will help draw their attention to the fact it's their turn in the round.

            /taps                         --> display the current segment (again)
            /taps [ <name> ] <value>      --> sets the poster's (or NPC's) TAPs for the round
            /taps [ <name> ] <+|-><value> --> updates the poster's (or NPC's) TAPs for the round
            /taps begin                   --> [GM] initiates the first segment (alias to /begin?)
            /taps end                     --> [GM] clears the TAP counts and ends the round (alias to /end?)
            /taps next                    --> [GM] does what /next does; in fact, /next should be an alias for this

            NOTE: TAPs are _guild_- + _channel_-specific.

            NOTE: The GM doesn't need to set the maximum TAPs for the round since the system already knows
            everyone's value; it can find the max and start there. (See the settings below to know what
            direction to go in.)

            NOTE: As noted in the writeup, the values can be a macro or variable, which makes it easy
            to enter your TAPs, i.e., `/taps !initiative`.

            NOTE: _Setting_ one's TAPs is disallowed between calls to `/taps begin` and `/taps end`.

            NOTE: `/next` and `/taps next` is disallowed outside of a begin/end block.

            NOTE: <name> requires the user to have GM rights. (Set it properly in config.json this time)
            If <name> is used, it still associates the TAPs to the GM's user_id, but also sets an override
            field with the NPC's name for tracking purposes.

            I think I might rename `/taps` to `/init` (for initiative). The real difference between, say,
            ARPS initiative and D&D initiative is how you count down (and that you'd never modify the value in
            D&D). In ARPS, we want _each_ segment. In D&D, we just want to move to the next initiative. If I
            can find a way to do count up vs count down, that'd also be good and allow a number of other
            games to work with it, too.

            So, feels like there are some "settings" commands the GM can run for his channel:

            /init set direction up|down (default: down)
            /init set style counted|ordered (default: counted)

            These can make an easy macro for the GM to just run when setting things up. However, I'm going
            to include a couple "presets" so the GM doesn't have to do that.

            /init set arps --> sets direction=down, style=counted
            /init set d&d  --> sets direction=down, style=ordered
            /init set ad&d --> sets direction=up,   style=ordered

            Others may be added later.

            Under this settings model, the ability to _modify_ one's initiative after the round begins is only
            valid if the direction is `counted`.

            Going to add one more: `/init reset` which is like `end`, but it doesn't clear any of the
            initiatives, just resets the round counter back to the top. This is for games where the rolled
            initiative doesn't change over the course of combat. A call to `end` will terminate the combat
            sequence completely and clear the values.

            Given also how 2e does things, I think I also need a setting to say what to do at the end of
            the round. There, if you're using individual initative with multiple attacks, you loop through
            the initiatives and take one attack at each pass until no one has actions left. At that point,
            the round ends. The difference between this and `reset` is that it changes the behavior of
            `next` which will either terminate at its limit (0 or the maximum among all players) or it will
            loop around to the top again for another pass. So:

            /init set next linear|circular

            I think that'll cover _most_ use cases, at least for now.

            ---

            So, having said all *that*, what type of storage should this use?
 */
