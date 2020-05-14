import { Collection } from 'discord.js';

/****************************************************************************/

export interface Player { }

export class PC implements Player {
    public userId: number;
}

export class NPC implements Player {
    public name: string;
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

export class RoundHasStartedError extends Error { }
export class RoundHasNotStartedError extends Error { }
export class PlayerNotEnrolledError extends Error { }

// my kingdom for Swift-style enums here (methods!)
enum State {
    idle       = 1 << 0,
    started    = 1 << 1,
    restarted  = 1 << 2,
    ended      = 1 << 4,
    inProgress = started | restarted
}

export class Initiative {
    public guildId: number;
    public channelId: number;

    private _settings = new Settings();
    private _tracker  = new Collection<Player, number>();
    private _state    = State.idle;
    private _current  = 0;
    private _start    = 0;
    private _max      = 0;
    private _passes   = 1;

    /****************************************************************************/

    constructor(guildId: number, channelId: number) {
        this.guildId   = guildId;
        this.channelId = channelId;
    }

    /****************************************************************************/

    public set(player: Player, initiative: number) {
        if (this.isInProgress()) throw new RoundHasStartedError();

        this._tracker.set(player, Math.trunc(initiative));
    }

    public update(player: Player, adjustment: number) {
        if (this.isInProgress()) throw new RoundHasStartedError();
        if (!this._tracker.has(player)) throw new PlayerNotEnrolledError();

        let current = this._tracker.get(player);

        if (current === undefined) {
            throw new ReferenceError('Player exists, but somehow has no current initiative to update');
        }

        this._tracker.set(player, Math.trunc(current) + Math.trunc(adjustment));
    }

    public begin() {
        if (this.isInProgress()) throw new RoundHasStartedError();

        this._state   = State.started;
        this._max     = this.getMaximum();
        this._current = this._start;
        this._start   = this.startingValue();

        this._tracker = this._tracker.sorted((a, b) => b - a);

        this.next();
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

        this.next();
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
}
