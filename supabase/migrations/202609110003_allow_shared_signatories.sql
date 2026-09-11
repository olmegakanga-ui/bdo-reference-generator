alter table public.signatories
drop constraint if exists signatories_document_type_check;

alter table public.signatories
add constraint signatories_document_type_check
check (document_type in ('engagement', 'correspondence', 'both'));

comment on column public.signatories.document_type is
  'Module dans lequel le signataire peut être sélectionné: engagement, correspondence ou les deux.';
