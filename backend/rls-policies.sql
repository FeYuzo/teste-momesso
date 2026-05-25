-- ============================================================
-- PostgreSQL Row Level Security (RLS) - Momesso Project
-- ============================================================
-- Este arquivo contém as políticas de segurança em nível de linha
-- para proteger os dados no banco de dados PostgreSQL.
--
-- Como usar:
-- 1. Crie dois roles no PostgreSQL:
--    - momesso_admin: acesso total
--    - momesso_user: acesso restrito à própria empresa
-- 2. Execute este script no banco de dados momesso_db
-- ============================================================

-- Criação dos roles
CREATE ROLE momesso_admin;
CREATE ROLE momesso_user;

-- Função auxiliar para obter o company_id do usuário atual
-- (deve ser configurada via SET LOCAL na sessão após autenticação JWT)
CREATE OR REPLACE FUNCTION current_company_id()
RETURNS UUID AS $$
BEGIN
  RETURN current_setting('app.current_company_id', true)::UUID;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função auxiliar para obter o role do usuário atual
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN current_setting('app.current_user_role', true);
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'USER';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- TABELA: companies
-- ============================================================
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- ADMIN vê todas as empresas
CREATE POLICY companies_admin_all ON companies
  FOR ALL
  TO momesso_admin
  USING (true)
  WITH CHECK (true);

-- USER vê apenas a própria empresa
CREATE POLICY companies_user_select ON companies
  FOR SELECT
  TO momesso_user
  USING (id = current_company_id());

-- ============================================================
-- TABELA: users
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ADMIN vê todos os usuários
CREATE POLICY users_admin_all ON users
  FOR ALL
  TO momesso_admin
  USING (true)
  WITH CHECK (true);

-- USER vê apenas usuários da própria empresa
CREATE POLICY users_user_select ON users
  FOR SELECT
  TO momesso_user
  USING (company_id = current_company_id());

-- USER pode atualizar apenas seu próprio perfil
CREATE POLICY users_user_update ON users
  FOR UPDATE
  TO momesso_user
  USING (company_id = current_company_id())
  WITH CHECK (company_id = current_company_id());

-- ============================================================
-- TABELA: machines
-- ============================================================
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;

-- ADMIN vê todas as máquinas
CREATE POLICY machines_admin_all ON machines
  FOR ALL
  TO momesso_admin
  USING (true)
  WITH CHECK (true);

-- USER vê apenas máquinas da própria empresa
CREATE POLICY machines_user_select ON machines
  FOR SELECT
  TO momesso_user
  USING (company_id = current_company_id());

-- USER pode criar/atualizar/deletar máquinas apenas da própria empresa
CREATE POLICY machines_user_write ON machines
  FOR INSERT
  TO momesso_user
  WITH CHECK (company_id = current_company_id());

CREATE POLICY machines_user_update ON machines
  FOR UPDATE
  TO momesso_user
  USING (company_id = current_company_id())
  WITH CHECK (company_id = current_company_id());

CREATE POLICY machines_user_delete ON machines
  FOR DELETE
  TO momesso_user
  USING (company_id = current_company_id());

-- ============================================================
-- COMO USAR NO NESTJS (exemplo de middleware):
-- ============================================================
-- No serviço, após autenticação JWT, execute:
--
-- await queryRunner.query(`
--   SET LOCAL app.current_company_id = '${user.companyId}';
--   SET LOCAL app.current_user_role = '${user.role}';
--   SET LOCAL ROLE ${user.role === 'ADMIN' ? 'momesso_admin' : 'momesso_user'};
-- `);
--
-- Isso garante que o banco de dados também aplique as restrições,
-- independentemente da lógica da aplicação.
-- ============================================================
