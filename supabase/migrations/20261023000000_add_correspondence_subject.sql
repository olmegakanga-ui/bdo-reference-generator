alter table public.correspondences
  add column if not exists correspondence_subject text;

update public.correspondences
set correspondence_subject = 'Non renseigné'
where correspondence_subject is null
   or btrim(correspondence_subject) = '';

alter table public.correspondences
  alter column correspondence_subject set not null;

alter table public.correspondences
  drop constraint if exists correspondences_subject_not_blank;

alter table public.correspondences
  add constraint correspondences_subject_not_blank
  check (btrim(correspondence_subject) <> '');

drop index if exists public.correspondences_unique_business_rule;

create unique index if not exists correspondences_business_key_with_subject_idx
  on public.correspondences (
    lower(btrim(recipient_name)),
    department_id,
    issue_date,
    sender_id,
    lower(btrim(correspondence_subject))
  );
