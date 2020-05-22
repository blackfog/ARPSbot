import { Sequelize, DataTypes, Model, ModelCtor } from "sequelize";

export class Database {
    public connection: Sequelize;

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

    public get Macros(): ModelCtor<Model<any, any>> {
        return this.connection.models['macros'];
    }

    public get Variables(): ModelCtor<Model<any, any>> {
        return this.connection.models['variables'];
    }

    /****************************************************************************/

    private setUpTables(): void {
        // variables (server/guild, user, name, value, is_numeric)
        this.connection.define('variables', {
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
        this.connection.define('macros', {
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
