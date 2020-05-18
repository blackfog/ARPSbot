import { Collection } from 'discord.js';

/****************************************************************************/

export interface Player {
    userId: string;
    name: string;

    identity(): string;
}

export class PC implements Player {
    public userId: string;
    public name = null;

    constructor(userId: string) {
        this.userId = userId;
    }

    identity(): string {
        return this.userId.toString();
    }
}

export class NPC implements Player {
    public userId = null;
    public name: string;

    constructor(name: string) {
        this.name = name;
    }

    identity(): string {
        return this.name;
    }
}

/****************************************************************************/

export enum Direction { up, down }
export enum Style { counted, ordered }
export enum Cycle { linear, circular }

export class Settings {
    public direction: Direction = Direction.down;
    public style: Style = Style.counted;
    public cycle: Cycle = Cycle.linear;
}

/****************************************************************************/

export interface Preset {
    direction: Direction;
    style: Style;
    cycle: Cycle;
}

export class ARPS implements Preset {
    direction: Direction = Direction.down;
    style: Style = Style.counted;
    cycle: Cycle = Cycle.linear;
}

export class DnD implements Preset { // 5e
    direction: Direction = Direction.down;
    style: Style = Style.ordered;
    cycle: Cycle = Cycle.linear;
}

export class ADnD implements Preset { // 2e
    direction: Direction = Direction.up;
    style: Style = Style.ordered;
    cycle: Cycle = Cycle.circular;
}

/****************************************************************************/

export class InitiativeError extends Error { }
export class RoundHasStartedError extends InitiativeError { }
export class RoundHasNotStartedError extends InitiativeError { }
export class PlayerNotEnrolledError extends InitiativeError { }

// my kingdom for Swift-style enums here (methods!)
enum State {
    idle       = 1 << 0,
    started    = 1 << 1,
    restarted  = 1 << 2,
    ended      = 1 << 4,
    inProgress = started | restarted
}

export class Initiative {
    public guildId: string;
    public channelId: string;

    private _settings = new Settings();
    private _tracker  = new Collection<Player, number>();
    private _state    = State.idle;
    private _current  = 0;
    private _start    = 0;
    private _max      = 0;
    private _passes   = 1;

    /****************************************************************************/

    constructor(guildId: string, channelId: string) {
        this.guildId   = guildId;
        this.channelId = channelId;
    }

    /****************************************************************************/

    public set(player: Player, initiative: number) {
        if (this.isInProgress()) throw new RoundHasStartedError();

        this.updateTracker(player, Math.trunc(initiative));
    }

    public update(player: Player, adjustment: number) {
        if (this.style !== Style.counted && this.isInProgress()) throw new RoundHasStartedError();

        let current = this._tracker.filter((_, key) => {
            return key.identity() === player.identity();
        }).first();

        if (current === undefined) throw new PlayerNotEnrolledError();

        this.updateTracker(player, Math.trunc(current) + Math.trunc(adjustment));
    }

    public begin() {
        if (this.isInProgress()) throw new RoundHasStartedError();

        this._state   = State.started;
        this._max     = this.getMaximum();
        this._start   = this.startingValue();
        this._current = this._start;

        this._tracker = this._tracker.sorted((a, b) => b - a);
    }

    public next() {
        if (!this.isInProgress()) throw new RoundHasNotStartedError();

        switch (this.direction) {
            case Direction.up:
                this.increment();

                if (this.cycle === Cycle.circular && this._current > this._max) {
                    this.reset();
                }

                break;
            case Direction.down:
                this.decrement();

                if (this.cycle === Cycle.circular && this._current <= 0) {
                    this.reset();
                }

                break;
        }
    }

    public upNow(): Collection<Player, number> {
        if (!this.isInProgress()) throw new RoundHasNotStartedError();

        return this._tracker.filter((val) => val === this._current);
    }

    public get current(): number {
        return this._current;
    }

    public get start(): number {
        return this._start;
    }

    public get max(): number {
        return this._max;
    }

    public get passes(): number {
        return this._passes;
    }

    public get tracker(): Collection<Player, number> {
        return this._tracker;
    }

    public end() {
        if (!this.isInProgress()) throw new RoundHasNotStartedError();

        this._state   = State.ended;
        this._start   = 0;
        this._current = 0;
        this._max     = 0;
        this._passes  = 1;

        this._tracker.clear();
    }

    public reset() {
        if (!this.isInProgress()) throw new RoundHasNotStartedError();

        this._state   = State.restarted;
        this._current = this._start;

        this._passes++;
    }

    public preset(preset: Preset) {
        if (this.isInProgress()) throw new RoundHasStartedError();

        this.direction = preset.direction;
        this.style     = preset.style;
        this.cycle     = preset.cycle;
    }

    public get direction(): Direction {
        return this._settings.direction;
    }

    public set direction(direction: Direction) {
        this._settings.direction = direction;
    }

    public get style(): Style {
        return this._settings.style;
    }

    public set style(style: Style) {
        this._settings.style = style;
    }

    public get cycle(): Cycle {
        return this._settings.cycle;
    }

    public set cycle(cycle: Cycle) {
        this._settings.cycle = cycle;
    }

    public get settings(): Settings {
        return this._settings;
    }

    /****************************************************************************/

    private isInProgress(): boolean {
        return (this._state & State.inProgress) !== 0;
    }

    private getMaximum(): number {
        return [...this._tracker.values()].reduce((max, cur) => Math.max(max, cur), 0);
    }

    private startingValue(): number {
        switch (this.direction) {
            case Direction.up:
                return 0;
            case Direction.down:
                return this._max;
        }
    }

    private increment(): number {
        switch (this.style) {
            case Style.counted:
                return ++this._current;
            case Style.ordered:
                const remaining = this._tracker.filter((val) => val >= this._current);
                return remaining.last();
        }
    }

    private decrement(): number {
        switch (this.style) {
            case Style.counted:
                return --this._current;
            case Style.ordered:
                const remaining = this._tracker.filter((val) => val <= this._current);
                return remaining.first();
        }
    }

    private updateTracker(player: Player, value: number) {
        const current = this._tracker.filter((_, key) => key.identity() === player.identity()).firstKey();

        if (current) {
            this._tracker.delete(current);
        }

        this._tracker.set(player, value);
    }
}
