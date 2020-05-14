import { Sequelize, DataTypes, Model } from "sequelize";

export class Database {
    public connection: Sequelize;

    // public Characters: typeof Model;
    // public CharacterChannels: typeof Model;
    // public GMChannels: typeof Model;
    public Variables: typeof Model;
    public Macros: typeof Model;

    constructor(config) {
        this.connection = new Sequelize({
            dialect: config.database.dialect,
            logging: config.debug ? console.log : false,
            storage: config.database.storage
        });

        this.setUpTables();
    }

    public sync(): void {
        for (let modelName in this.connection.models) {
            this.connection.models[modelName].sync()
        }
    }

    private setUpTables(): void {
        // characters (server/guild, user, name, full_name, description)
        // this.Characters = this.connection.define('characters', {
        //     character_id: {
        //         type: DataTypes.BIGINT,
        //         autoIncrement: true,
        //         primaryKey: true
        //     },
        //     guild: {
        //         type: DataTypes.STRING,
        //         allowNull: false,
        //         unique: 'characters_uq'
        //     },
        //     user: {
        //         type: DataTypes.STRING,
        //         allowNull: false,
        //         unique: 'characters_uq'
        //     },
        //     name: {
        //         type: DataTypes.STRING,
        //         allowNull: false,
        //         unique: 'characters_uq'
        //     },
        //     full_name: DataTypes.STRING,
        //     description: DataTypes.TEXT
        // }, { timestamps: false });

        // // character_channels (character_id, channel)
        // this.CharacterChannels = this.connection.define('character_channels', {
        //     character_id: {
        //         type: DataTypes.BIGINT,
        //         unique: 'character_channels_uq',
        //         allowNull: false,
        //         references: {
        //             model: this.connection.models['characters'],
        //             key: 'character_id'
        //         }
        //     },
        //     channel: {
        //         type: DataTypes.STRING,
        //         allowNull: false,
        //         unique: 'character_channels_uq'
        //     }
        // }, { timestamps: false });

        // // gm_channels (user, channel)
        // this.GMChannels = this.connection.define('gm_channels', {
        //     user: {
        //         type: DataTypes.STRING,
        //         allowNull: false
        //     },
        //     channel: {
        //         type: DataTypes.STRING,
        //         primaryKey: true
        //     }
        // }, { timestamps: false });

        // variables (server/guild, user, name, value, is_numeric)
        this.Variables = this.connection.define('variables', {
            variable_id: {
                type: DataTypes.BIGINT,
                autoIncrement: true,
                primaryKey: true
            },
            guild: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: 'variables_uq'
            },
            user: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: 'variables_uq'
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: 'variables_uq'
            },
            value: DataTypes.STRING,
            is_numeric: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
                allowNull: false
            }
        }, { timestamps: false });

        // macros (server/guild, user, name, body)
        this.Macros = this.connection.define('macros', {
            macro_id: {
                type: DataTypes.BIGINT,
                autoIncrement: true,
                primaryKey: true
            },
            guild: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: 'macros_uq'
            },
            user: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: 'macros_uq'
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: 'macros_uq'
            },
            body: DataTypes.TEXT
        }, { timestamps: false });
    }
}
