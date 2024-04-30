export interface Entity {
    term_type: string;
    txt_range: number[][];
    children?: Entity[]; 
}

export interface Result {
    text: string;
    strats?: Entity[];
}

export interface TreeData {
    id: string;
    name: string;
    children : TreeData[];
}