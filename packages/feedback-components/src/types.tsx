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

export interface ServerRelationship {
    src_name: string;
    dst_name: string;
    relationship_type: string; 
};

export interface ServerEntity {
    entity_name: string;
    entity_type: string;
}

export interface ServerResponse {
    paragraph: string;
    relationships: ServerRelationship[];
    just_entities: ServerEntity[];
}