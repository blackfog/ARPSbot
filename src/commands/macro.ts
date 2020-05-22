import * as Discord from 'discord.js';
import * as config from '../../config.json';

import { Command } from '../lib/command';
import { Database } from '../lib/database';
import { DatabaseError } from 'sequelize';
import { CLI } from '../lib/cli';

export class MacroError extends Error { };
export class UnknownMacroError extends MacroError { };
export class TooManyRowsDeletedError extends DatabaseError { };
export class InvalidDatabaseStateError extends DatabaseError { };

export class macro extends Command {
    constructor() {
        super();

        this.name = 'macro';
        this.helpName = '!macro';
        this.description = 'Manage macros';
        this.usage = [
            '**!**__name__ [ __arg__ __...__ ]',
            '\n**!!define** __name__ __command__ [ __command__ __...__ ]',
            '**!!remove|show** __name__',
            `**!!list**`,
            `\nSee full documentation at ${config.docs.baseUrl}/macros`
        ];
    }

    /*
        TODO: Nowhere in here (or in this file!) did I address the whole macro arguments thing. This idea that you can call a
        macro like this:

        !foo bar baz

        And inside the macro, bar and baz are available as $0 and $1. So, they'd be treated as and have the same limitations as
        VARIABLES do functionality-wise, but are just locally scoped to that macro's execution. They would be evaluated to string
        BEFORE the macro is executed (like other variables most likely), so it's possible to do something like:

        !!define foo $$set Trauma $0
        !foo 2
        (Internally executes: $$set Trauma 2)

        I think I'll also want to make $* available, too, which will splat the entire args list.
    */

    public execute(message: Discord.Message, args: string[], db: Database, context) {
        try {
            const identifier = /^[_A-Za-z][_A-Za-z0-9]*$/;
            const subCommand = (args[0] ?? '').toLocaleLowerCase();
            const name       = (args[1] ?? '').toLocaleLowerCase();

            if (!subCommand) throw new SyntaxError();
            if (name && !name.match(identifier)) throw new SyntaxError();

            switch (subCommand) {
                case '!define':
                    if (!name) throw new SyntaxError();
                    this.define(message, db, name, args.slice(2));
                    break;
                case '!remove':
                    if (!name) throw new SyntaxError();
                    this.remove(message, db, name);
                    break;
                case '!show':
                    if (!name) throw new SyntaxError();
                    this.show(message, db, name);
                    break;
                case '!list':
                    if (name) throw new SyntaxError();
                    this.list(message, db);
                    break;
                default:
                    if (!subCommand.match(identifier)) throw new SyntaxError();
                    this.run(message, db, subCommand, context.client, context.cli, args.slice(1));
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
    }

    /****************************************************************************/

    private async fetchAllMacros(message: Discord.Message, db: Database) {
        const models = await db.Macros.findAll({
            where: {
                guild: message.guild.id,
                user: message.author.id
            }
        });

        return models;
    }

    private async fetchMacro(message: Discord.Message, db: Database, name: string) {
        const macroModel = await db.Macros.findOne({
            where: {
                guild: message.guild.id,
                user: message.author.id,
                name: name
            }
        });

        return macroModel;
    }

    private async deleteMacro(message: Discord.Message, db: Database, name: string) {
        const deleted = await db.Macros.destroy({
            where: {
                guild: message.guild.id,
                user: message.author.id,
                name: name
            }
        });

        return deleted;
    }

    private async upsertMacro(db: Database, macro: object) {
        return await db.Macros.upsert(macro);
    }

    /****************************************************************************/

    private define(message: Discord.Message, db: Database, name: string, args: any[]) {
        const newMacro = {
            guild: message.guild.id,
            user: message.author.id,
            name: name,
            body: args.join(' ')
        };

        // The Sequelize SQLite upsert doesn't return a success/fail flag (boo)
        this.upsertMacro(db, newMacro)
            .then(() => {
                return message.reply(`the definition for macro "${name}" has been updated.`);
            });
    }

    private remove(message: Discord.Message, db: Database, name: string) {
        this.deleteMacro(message, db, name)
            .then(deletedCount => {
                if (deletedCount == 0) {
                    Promise.reject(new UnknownMacroError(name));
                } else if (deletedCount > 1) {
                    Promise.reject(
                        new InvalidDatabaseStateError(
                            new TooManyRowsDeletedError(
                                new Error(deletedCount + ' rows deleted')
                            )
                        )
                    );
                }
            })
            .then(() => {
                return message.reply(`the macro named "${name}" has been removed.`);
            })
            .catch(error => {
                throw error;
            });
    }

    private show(message: Discord.Message, db: Database, name: string) {
        this.fetchMacro(message, db, name)
            .then(macro => {
                if (!macro) {
                    return Promise.reject();
                }

                return macro;
            })
            .then(macro => {
                return message.reply(`the definition for "${name}" is:\n\`${macro.body}\``);
            })
            .catch (() => {
                throw new UnknownMacroError(name);
            });
    }

    private list(message: Discord.Message, db: Database) {
        this.fetchAllMacros(message, db)
            .then(macros => {
                if (macros.length === 0) {
                    return message.reply('you have no macros defined.');
                }

                const names = macros.map(m => m.name).sort().join(', ');

                return message.reply(`your available macros are: ${names}`);
            })
            .catch(() => {
                // TODO: handle stuff?
            });
    }

    private run(message: Discord.Message, db: Database, name: string, client: Discord.Client, cli: CLI, args: any[]) {
        this.fetchMacro(message, db, name)
            .then(macro => {
                if (!macro) {
                    return Promise.reject();
                }

                return macro;
            })
            .then(macro => {
                // FIXME: Need to make sure the macro isn't calling ITSELF and creating an infinite loop; that's bad
                // Problem is, need to check downstream, too, say if I set it here to call !foo and !foo later calls !foo or calls !bar which calls !foo.
                // But, we DO want the ability to call a macro from a macro, so we can't just disallow that.
                const commands = macro.body.split(/\s*;\s*/);

                for (const command of commands) {
                    console.log(command);

                    const msg = new Discord.Message(client, {
                        author: message.author,
                        content: command
                    }, message.channel as Discord.TextChannel);

                    cli.interpret(msg, client, db);
                }
            })
            .catch (() => {
                throw new UnknownMacroError(name);
            });
    }
}

export const instance = macro;
