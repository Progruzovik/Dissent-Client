export const enum ActionType {
    Move = "move",
    Shot = "shot",
    NextTurn = "nextTurn",
    BattleFinish = "battleFinish"
}

export const enum GunType {
    Artillery = "artillery",
    Beam = "beam",
    Shell = "shell"
}

export enum Status {
    Idle, Queued, InBattle
}

export const enum Side {
    None, Left, Right
}

export class Cell {
    constructor(readonly x: number, readonly y: number) {}
}

export class Gun {
    constructor(readonly id: number, readonly name: string,
                readonly shotCost: number, readonly typeName: GunType) {}
}

export class Hull {
    constructor(readonly id: number, readonly name: string, readonly actionPoints: number,
                readonly strength: number, readonly texture: Texture) {}
}

export class Move {
    constructor(readonly cost: number, readonly cells: Cell[]) {}
}

export class PathNode {
    constructor(readonly movementCost: number, readonly cell: Cell) {}
}

export class Shot {
    constructor(readonly gunId: number, readonly damage: number, readonly cell: Cell) {}
}

export class Texture {
    constructor(readonly id: number, readonly name: string) {}
}
