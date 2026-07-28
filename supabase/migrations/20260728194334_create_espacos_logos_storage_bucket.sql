-- bucket público pra logos de espaço (URL fica em espacos.logo_url)
insert into storage.buckets (id, name, public)
values ('espacos-logos', 'espacos-logos', true)
on conflict (id) do nothing;

-- leitura pública (qualquer um vê a imagem, já que o app expõe o logo pra quem acessa a tarefa/espaço)
create policy "espacos-logos leitura publica"
on storage.objects for select
using (bucket_id = 'espacos-logos');

-- usuario so envia dentro da propria pasta (primeiro segmento do path = seu auth.uid())
create policy "espacos-logos upload proprio"
on storage.objects for insert
with check (
  bucket_id = 'espacos-logos'
  and (select auth.uid())::text = (storage.foldername(name))[1]
);

create policy "espacos-logos update proprio"
on storage.objects for update
using (
  bucket_id = 'espacos-logos'
  and (select auth.uid())::text = (storage.foldername(name))[1]
);

create policy "espacos-logos delete proprio"
on storage.objects for delete
using (
  bucket_id = 'espacos-logos'
  and (select auth.uid())::text = (storage.foldername(name))[1]
);
