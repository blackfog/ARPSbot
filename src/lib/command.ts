import { Database } from "./database";
import * as Discord from 'discord.js';

export class Command {
    public name: string;
    public helpName: string;
    public description: string;
    public usage: string[];
    public role: RegExp;

    public showUsage(message: Discord.Message, label: string = 'Usage:', isDM: boolean = false) {
        const destination = isDM ? message.author : message.channel;
        return destination.send((isDM ? '' : '<@' + message.author.id + '>: ') + label + "\n\n" + this.usage.join("\n"));
    }

    public execute(message: Discord.Message, args: string[], db: Database, context = {}) {
        // override me
    }
}
