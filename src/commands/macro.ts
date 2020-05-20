import * as Discord from 'discord.js';

import { Command } from '../lib/command';
import { Database } from '../lib/database';

export class MacroError extends Error { };
export class UnknownMacroError extends MacroError { };

export class macro extends Command {
    constructor() {
        super();

        this.name = 'macro';
        this.helpName = '!macro';
        this.description = 'Manage macros';
        this.usage = [
            '**!**__name__ [ **run** ] [ __arg__ __...__ ]',
            '**!**__name__ **define|=** __definition__',
            '**!**__name__ __remove|show__',
            '\nSee full documentation at https://some.domain/path/macros'
        ];
    }

    public execute(message: Discord.Message, args: string[], db: Database) {
        const name = args[0];

        try {
            if (!name) {
                throw new SyntaxError();
            }

            switch (args[1] ?? '<null>') {
                case 'run':
                case '<null>':
                    this.run(message, db, name);
                    break;
                case 'define':
                case '=':
                    this.define(message, db, name, args.slice(2));
                    break;
                case 'remove':
                    if (args.length > 1) throw new SyntaxError();
                    this.remove(message, db, name);
                    break;
                case 'show':
                    if (args.length > 1) throw new SyntaxError();
                    this.show(message, db, name);
                    break;
                default:
                    this.runWithArgs(message, db, name, args.slice(1));
                    break;
            }
        } catch (error) {
            if (error instanceof UnknownMacroError) {
                // TODO: write me
            } else if (error instanceof SyntaxError) {
                // TODO: write me
            } else {
                throw error;
            }
        }

        // TODO: find out how to do that "run two things and wait for both" operation using this syntax/language/libs
        // this.fetchMacro(message, db, name)
        //     .then(macro => {
        //         if (!macro) {
        //             return Promise.reject();
        //         }

        //         return macro;
        //     })
        //     .then(macro => {

        //     })
        //     .catch (() => {
        //         throw new UnknownMacroError(name);
        //     });
    }

    /****************************************************************************/

    private async fetchMacro(message: Discord.Message, db: Database, name: string) {
        const macroModel = await db.Macros.findOne({
            where: {
                guild: message.guild.id,
                user: message.author.id,
                name: name
            }
        });

        return macro;
    }

    private async deleteMacro(message: Discord.Message, db: Database, macro_id: number) {
        // TODO: write me
    }

    private async upsertMacro(message: Discord.Message, db: Database, macro: object) {
        // TODO: write me
    }

    /****************************************************************************/

    private run(message: Discord.Message, db: Database, name: string) {
        this.runWithArgs(message, db, name, []);
    }

    private define(message: Discord.Message, db: Database, name: string, args: any[]) {
        // TODO: write me
    }

    private remove(message: Discord.Message, db: Database, name: string) {
        // TODO: write me
    }

    private show(message: Discord.Message, db: Database, name: string) {
        // TODO: write me
    }

    private runWithArgs(message: Discord.Message, db: Database, name: string, args: any[]) {
        // TODO: write me
    }
}

export const instance = macro;
