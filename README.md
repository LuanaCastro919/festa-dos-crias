# Baile dos Crias — Site de ingressos

Site completo de venda de ingressos: banco de dados real (Supabase), pagamento
PIX real e automático (PagBank), QR codes reais e painel administrativo com
check-in por câmera.

## 1. Criar o banco de dados (Supabase)

1. Crie uma conta grátis em https://supabase.com e um novo projeto.
2. Vá em **SQL Editor** → **New query**, cole todo o conteúdo do arquivo
   `supabase/schema.sql` deste projeto e clique em **Run**.
   Isso cria as tabelas `lots`, `orders`, `tickets`, `admin_profiles` e já
   insere 3 lotes de exemplo (edite nomes/preços/quantidades depois, direto
   pelo painel admin do site ou pela tabela `lots` no Supabase).
3. Vá em **Settings → API** e copie:
   - `Project URL` → variável `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → variável `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role key` → variável `SUPABASE_SERVICE_ROLE_KEY`
     (⚠️ essa chave é secreta — nunca coloque no navegador ou no GitHub público)

### Criar o primeiro administrador

1. No Supabase, vá em **Authentication → Users → Add user** e crie um usuário
   com o e-mail e senha que você vai usar para logar no painel admin.
2. Vá em **SQL Editor** e rode (troque pelo e-mail que você criou):

```sql
insert into admin_profiles (user_id, role)
select id, 'admin' from auth.users where email = 'voce@bailedoscrias.com';
```

Repita esse processo para cada pessoa da organização que vai ter acesso ao
painel (use `role = 'portaria'` para quem só vai fazer check-in, se quiser
restringir a edição de lotes só para admins).

## 2. Criar a conta no PagBank e pegar o token

1. Crie/acesse sua conta PagBank (pessoa jurídica ou física) em
   https://pagbank.com.br
2. Vá em **Vendas Online → Integrações** e gere o **Token de segurança**.
3. Para testar sem mexer com dinheiro real primeiro, use o ambiente sandbox:
   crie uma conta separada em https://sandbox.pagseguro.uol.com.br e gere um
   token de sandbox.
4. Variáveis:
   - `PAGBANK_TOKEN` → o token gerado
   - `PAGBANK_ENV` → `sandbox` (testes) ou `production` (vendas reais)

## 3. Publicar na Vercel

1. Suba este projeto para um repositório no GitHub (crie um repo novo e faça
   push de todos estes arquivos).
2. Na Vercel, clique em **Add New → Project** e importe esse repositório.
3. Em **Environment Variables**, adicione todas as variáveis do arquivo
   `.env.example` com os valores reais que você pegou nos passos 1 e 2,
   **exceto** `NEXT_PUBLIC_SITE_URL`, que você só vai saber depois do primeiro
   deploy (a Vercel vai te dar uma URL do tipo `https://seu-site.vercel.app`).
4. Faça o deploy. Depois, copie a URL que a Vercel gerou, volte em
   **Settings → Environment Variables**, adicione `NEXT_PUBLIC_SITE_URL` com
   essa URL (sem barra no final) e clique em **Redeploy**.

## 4. Ligar o webhook do PagBank

O webhook já está pronto no código (`/api/webhooks/pagbank`) e é registrado
automaticamente em cada cobrança PIX criada — você não precisa configurar
nada manualmente no painel do PagBank. Só é essencial que a variável
`NEXT_PUBLIC_SITE_URL` esteja correta (passo 3.4) porque é ela que o código
usa para montar o endereço do webhook.

## 5. Testar de ponta a ponta

Com `PAGBANK_ENV=sandbox`:

1. Acesse seu site publicado → Ingressos → compre 1 ingresso.
2. Na tela de pagamento, use as credenciais de teste do PagBank sandbox para
   "pagar" o PIX simulado (o próprio painel sandbox do PagBank explica como
   simular um pagamento aprovado).
3. A página deve avançar sozinha para "Ingresso confirmado" com o QR real.
4. Entre em `/admin/checkin` (logado como admin) e escaneie o QR gerado —
   deve aparecer "Ingresso válido".

Quando tudo estiver funcionando, troque `PAGBANK_ENV` para `production`,
coloque o token de produção do PagBank, redeploy — e o site já vende
ingressos de verdade.

## Estrutura do projeto

```
app/                   páginas (Next.js App Router)
  admin/                painel administrativo (login, dashboard, lotes, compradores, check-in)
  api/                  rotas de backend (pedidos, webhook do PagBank, check-in...)
  checkout, pagamento, sucesso, meus-ingressos, verificar/  fluxo de compra público
components/            componentes React reutilizáveis
lib/                    conexão com Supabase, integração PagBank, geração de QR
supabase/schema.sql     schema completo do banco de dados
```

## Editar dados do evento

Nome, data, local, horário e classificação etária ficam em `lib/event.ts` —
edite esse arquivo e publique de novo.

## Editar lotes

Pelo painel admin (`/admin/lotes`) você pode mudar preço e status de cada
lote (ativo, aguardando, esgotado, encerrado) sem precisar mexer em código.
Para adicionar um lote novo ou mudar a quantidade, edite diretamente a
tabela `lots` no Supabase (Table Editor).
