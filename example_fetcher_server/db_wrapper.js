process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const Pool = require("pg").Pool;
const pool = new Pool({
  user : "macrostrat_kg_admin",
  password : "24d6d24d-19f4-4b85-95ae-f115af96ad6d",
  host : "db.development.svc.macrostrat.org",
  port : 5432,
  database : "macrostrat",
  ssl : true
});

const getExample = async () => {
  try {
    return await new Promise(function (resolve, reject) {
      // Randomly get a source id
      pool.query(`SELECT sources.*, metadata.extraction_pipeline_id, metadata.model_id
      FROM macrostrat_kg_new.sources AS sources, macrostrat_kg_new.relationship AS relationships, macrostrat_kg_new.metadata as metadata
      WHERE sources.source_id = relationships.source_id
      AND sources.run_id = metadata.run_id
      ORDER BY random()
      LIMIT 1`, (error, results) => {
        // Check for error
        if(error) {
          reject("Got source getter error of", error);
        }

        let sources_result_row = results["rows"][0];
        let source_id = sources_result_row["source_id"];

        // Get the relationship for this source
        let relationship_query = `SELECT src_entity_table.entity_name AS src_name, dst_entity_table.entity_name AS dst_name, relationship_table.relationship_type
        FROM macrostrat_kg_new.entities AS src_entity_table, macrostrat_kg_new.relationship AS relationship_table, macrostrat_kg_new.entities AS dst_entity_table
        WHERE relationship_table.source_id = '${source_id}'
        AND relationship_table.src_entity_id = src_entity_table.entity_id
        AND relationship_table.dst_entity_id = dst_entity_table.entity_id`;
        
        pool.query(relationship_query, (error, results) => {
          if(error) {
            reject("Got relationships error of", error);
          }

          // Get the set of entities
          let relationship_rows = results["rows"];
          let relationship_entites = new Set();
          for(var relationship of relationship_rows) {
            relationship_entites.add(relationship["src_name"]);
            relationship_entites.add(relationship["dst_name"]);
          }
          
          // Get just the entities
          let just_entities = [];
          let entities_query = `SELECT entity_name, entity_type FROM macrostrat_kg_new.entities WHERE source_id = '${source_id}'`;
          pool.query(entities_query, (error, results) => {
            if(error) {
              reject("Got entities error of", error);
            }

            let entities_rows = results["rows"];
            for(var entity of entities_rows) { 
              if(!relationship_entites.has(entity["entity_name"])) {
                just_entities.push(entity);
              }
            }
          });
          
          // Remove the source and run id as we will record this as a different source
          delete sources_result_row.source_id;
          delete sources_result_row.run_id;
          result_to_run = {
            "text" : sources_result_row,
            "relationships" : relationship_rows,
            "just_entities" : just_entities
          };
          resolve(result_to_run);

        });
      });

    });
  } catch (error) {
    console.error(error);
    throw error;
  }
};

module.exports = {
  getExample
};