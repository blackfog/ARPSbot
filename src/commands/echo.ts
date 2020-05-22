// That's the extent of it. I'm not worried about making it "macro only" or something since its utility outside of a
// macro is nil.

import * as Discord from 'discord.js';

import { Command } from '../lib/command';
import { Database } from '../lib/database';

export class echo extends Command {
    constructor() {
        super();

        this.name = 'echo';
        this.helpName = '/echo';
        this.description = 'Echo/print text to the channel (see: _macro_)';
        this.usage = [
            '**/echo** __text__'
        ];
    }

    public execute(message: Discord.Message, args: string[], db: Database) {
        if (args.length === 0) {
            return this.showUsage(message);
        }

        return message.channel.send(args.join(' '));
    }
}

export const instance = echo;
