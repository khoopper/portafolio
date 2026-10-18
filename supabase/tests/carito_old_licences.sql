-- Run in the Supabase SQL Editor after 20261018030000_carito_old_licences.sql. Everything is rolled back at the end.
begin;

insert into public.carito_owner_pairings (code_hash, expires_at) values (public.carito_sha256('OLDPAIR'), now() + interval '15 minutes');

do $$
declare
  v_owner text;
  s jsonb;
begin
  v_owner := public.carito_owner_pair('OLDPAIR', 'Galaxy S24');

  -- A licence of before goes up with the 8 characters the friend has.
  perform public.carito_owner_import(v_owner,
    '[{"device":"N7D2R","name":"Sara","licence":"ZZZBEWZ1R","old":"TJGMZY82","until":null,"forever":true,"issued_day":20376}]'::jsonb);
  assert (select code = 'TJGMZY82' and claimable and licence_forever from public.carito_licences where device_code = 'N7D2R'),
    'sube con su texto de 8';

  -- One that went up before with the "ZZZ-…" of 2.6 takes the 8 characters, and only once.
  perform public.carito_owner_import(v_owner,
    '[{"device":"P6Q3K","name":"Davo","licence":"ZZZ4K7MQ2","until":null,"forever":true,"issued_day":20376}]'::jsonb);
  assert (select code = 'ZZZ4K7MQ2' from public.carito_licences where device_code = 'P6Q3K'), 'una app de antes sigue subiendo el ZZZ';
  perform public.carito_owner_import(v_owner,
    '[{"device":"P6Q3K","name":"Davo","licence":"ZZZ4K7MQ2","old":"4197F3JN","until":null,"forever":true,"issued_day":20376}]'::jsonb);
  perform public.carito_owner_import(v_owner,
    '[{"device":"P6Q3K","name":"Davo","licence":"ZZZ4K7MQ2","old":"4197F3JN","until":null,"forever":true,"issued_day":20376}]'::jsonb);
  assert (select count(*) = 1 and min(code) = '4197F3JN' from public.carito_licences where device_code = 'P6Q3K'), 'toma el texto de 8, sin duplicar';

  -- The friend's phone takes it on its own, or writes the 8 characters (with its dash, in lower case).
  s := public.carito_licence_claim('N7D2R', 'Galaxy A15', '2.7.5');
  assert (s->>'access')::boolean and length(s->>'token') = 64, 'el teléfono de antes la toma solo';
  s := public.carito_licence_activate('4197-f3jn', 'P6Q3K', 'Moto G', '2.7.5');
  assert (s->>'access')::boolean and s->>'reason' = 'forever', 'se escribe con sus 8 caracteres';

  -- Only on its phone, like before.
  s := public.carito_licence_activate('TJGM-ZY82', 'K7P2Q', 'Otro', '2.7.5');
  assert not (s->>'access')::boolean and s->>'reason' = 'other_device', 'en otro teléfono no abre';

  -- 8 characters someone else already has are not taken: it gets the 2.6 text.
  perform public.carito_owner_import(v_owner,
    '[{"device":"R4MCF","name":"Kat","licence":"ZZZ9QWERT","old":"TJGMZY82","until":null,"forever":true,"issued_day":0}]'::jsonb);
  assert (select code = 'ZZZ9QWERT' from public.carito_licences where device_code = 'R4MCF'), 'un texto ocupado no se repite';

  -- New licences still have 9.
  assert public.carito_owner_create(v_owner, 'Beto', null, current_date + 10, false) ~ '^[0-9A-HJKMNP-TV-Z]{9}$', 'las nuevas siguen con 9';

  -- A phone with a licence of before that is not on the list asks for a new one...
  s := public.carito_licence_claim('W2X9C', 'Redmi Note 13', '2.7.6');
  assert not (s->>'access')::boolean and s->>'reason' = 'old_licence', 'una licencia de antes sin registrar es antigua';
  assert jsonb_path_exists(public.carito_owner_licences(v_owner), '$[*]') and
    public.carito_owner_requests(v_owner) @> '[{"device_code":"W2X9C","device_model":"Redmi Note 13"}]'::jsonb, 'el dueño ve el pedido';
  -- ...the owner makes one for that phone, and the phone takes it on its own (the code is new, of 9).
  perform public.carito_owner_create(v_owner, 'Brian', 'W2X9C', null, true);
  assert jsonb_array_length(public.carito_owner_requests(v_owner)) = 0, 'con licencia ya no aparece como pedido';
  s := public.carito_licence_claim('W2X9C', 'Redmi Note 13', '2.7.6');
  assert (s->>'access')::boolean and length(s->>'token') = 64, 'el teléfono que la pidió la toma solo';
  assert not exists (select 1 from public.carito_licence_requests where device_code = 'W2X9C'), 'el pedido se borra';
  -- A licence made for a phone that did not ask is not taken without writing it.
  perform public.carito_owner_create(v_owner, 'Otra', 'M3N4P', null, true);
  assert (select not claimable from public.carito_licences where device_code = 'M3N4P'), 'sin pedido hay que escribirla';

  raise notice 'carito_old_licences: todas las comprobaciones pasaron';
end;
$$;

rollback;
