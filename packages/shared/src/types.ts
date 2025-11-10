export interface Territory {
    id: string;
    name: string;
    x: number;
    y: number;
    isSpawn?: boolean;
    spawnIndex?: number;
    zone?: string;
}

export interface Adjacency {
    from: string;
    to: string;
}

export interface MapData {
    id: string;
    name: string;
    territories: Territory[];
    adjacencies: [string, string][];
}

