# Data sheet 2

A new data sheet component for Macrostrat based on the BlueprintJS table component.
This will eventually replace the existing data sheet component.

## PostgREST table

A goal of this module is to create a generic table that can be bootstrapped on top of PostgreSQL routes, with support for filtering, sorting, and pagination.
This will be supported by the [PostgREST](https://postgrest.org/) API, which provides generic API tooling over PostgreSQL tables and views.

The design of this conceptually follows the [Supabase Grid](https://github.com/supabase/grid) component, which has been deprecated as a standalone module.
The current version of the Supabase Grid is available in the [Supabase Studio app](https://github.com/supabase/supabase/tree/master/apps/studio/components/grid),
but is in my opinion a bit tightly coupled to the Supabase ecosystem now. Still, it can be used, at minimum, as a design reference.

## Changes from Data Sheet v1

- The new data sheet will be based on BlueprintJS, a more mature and feature-rich table component library.
- In particular, the BlueprintJS table natively supports virtualization, which is
  important for performance when rendering large tables.
