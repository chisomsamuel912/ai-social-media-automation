-- Auto-pilot: businesses opt into AI creating plans on its own.
alter table businesses add column if not exists auto_plan boolean default true;
