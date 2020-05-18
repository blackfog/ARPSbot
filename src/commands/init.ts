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
            '**/init** __order|show__',
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
                    break;
                case 'end':
                    if (!isGM) throw GMRequiredError;
                    this.end(message, initiative);
                    break;
                case 'next':
                    if (!isGM) throw GMRequiredError;
                    this.next(message, initiative);
                    break;
                case 'reset':
                    if (!isGM) throw GMRequiredError;
                    this.reset(message, initiative);
                    break;
                case 'preset':
                    if (!isGM) throw GMRequiredError;
                    this.preset(message, initiative, args[2]);
                    break;
                case 'set':
                    if (!isGM) throw GMRequiredError;
                    this.set(message, initiative, args[2], args[3]);
                    break;
                case 'order':
                    this.showOrder(message, initiative);
                    break;
                case 'show':
                    this.showMe(message, initiative);
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

        for (const player of players) {
            if (player instanceof Initiative.PC) {
                playerList.push(`<@!${player.identity()}>`);
            } else if (player instanceof Initiative.NPC) {
                playerList.push(`_${player.identity()}_`);
            }
        }

        message.channel.send(`The current initiative is **${current}**\n\n**Up Now:** ${playerList.length > 0 ? playerList.join(', ') : 'Nobody'}`);
    }

    private begin(message: Discord.Message, initiative: Initiative.Initiative) {
        initiative.begin();
        message.channel.send('The round has started.');
        this.show(message, initiative);
    }

    private end(message: Discord.Message, initiative: Initiative.Initiative) {
        initiative.end();
        message.channel.send('The round has ended.');
    }

    private next(message: Discord.Message, initiative: Initiative.Initiative) {
        initiative.next();
        this.show(message, initiative);
    }

    private reset(message: Discord.Message, initiative: Initiative.Initiative) {
        initiative.reset();
        message.channel.send('Initiative has restarted.');
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
            player = new Initiative.PC(message.author.id);
        }

        const value = name === null ? args[0] : args[1];
        const [operator, amount] = value.match(/([+-]?)(\d+)/).slice(1,3);

        if (!operator) {
            initiative.set(player, parseInt(amount));
        } else {
            initiative.update(player, operator === '+' ? parseInt(amount) : -parseInt(amount));
        }
    }

    private showMe(message: Discord.Message, initiative: Initiative.Initiative) {
        const myInit = initiative.tracker.filter((_, key) => {
            return key.identity() === message.author.id;
        }).first();

        message.reply(`your initiative is **${myInit}**.`);
    }

    // TODO: do I want to show all the initiative values if style = counted? Optionally?
    private showOrder(message: Discord.Message, initiative: Initiative.Initiative) {
        let lines: string[] = [];

        for (const entry of initiative.tracker.sorted((a, b) => b - a)) {
            const player = entry[0];
            const init   = entry[1];

            if (player instanceof Initiative.PC) {
                if (player.identity() === message.author.id) {
                    lines.push(`**${init}** <@!${player.identity()}>`);
                } else {
                    const username = message.client.users.cache.get(player.identity()).username;
                    lines.push(`**${init}** ${username}`);
                }
            } else if (player instanceof Initiative.NPC) {
                lines.push(`**${init}** _${player.identity()}_`);
            }
        }

        message.channel.send('__**Intiative Order:**__\n' + lines.join("\n"));
    }
}

export const instance = init;
