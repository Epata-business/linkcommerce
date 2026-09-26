export type RoleUtilizador =
  | "ADMIN_PLATAFORMA"
  | "LOJISTA"
  | "GESTOR"
  | "OPERADOR"
  | "OPERADOR_POS"
  | "MARKETING"
  | "FINANCEIRO";

export type Recurso =
  | "dashboard"
  | "pedidos"
  | "produtos"
  | "clientes"
  | "marketing"
  | "qrcode"
  | "envios"
  | "relatorios"
  | "exportar"
  | "notificacoes"
  | "configuracoes"
  | "equipa"
  | "auditlog";

// * = acesso total ao recurso
const PERMISSOES: Record<RoleUtilizador, Recurso[] | ["*"]> = {
  ADMIN_PLATAFORMA: ["*"],
  LOJISTA:          ["*"],
  GESTOR:           ["dashboard", "pedidos", "produtos", "clientes", "marketing", "qrcode", "envios", "relatorios", "exportar", "notificacoes", "configuracoes", "auditlog"],
  OPERADOR:         ["pedidos", "produtos", "clientes", "notificacoes"],
  OPERADOR_POS:     [],
  MARKETING:        ["marketing", "qrcode", "relatorios", "notificacoes"],
  FINANCEIRO:       ["relatorios", "exportar", "pedidos", "notificacoes"],
};

export function temPermissao(role: string | undefined, recurso: Recurso): boolean {
  if (!role) return false;
  const perms = PERMISSOES[role as RoleUtilizador];
  if (!perms) return false;
  if (perms[0] === "*") return true;
  return (perms as Recurso[]).includes(recurso);
}

export function podeGerir(role: string | undefined): boolean {
  // pode gerir equipa (adicionar/remover membros)
  return role === "LOJISTA" || role === "ADMIN_PLATAFORMA";
}

export const ROLE_LABELS: Record<RoleUtilizador, string> = {
  ADMIN_PLATAFORMA: "Admin Plataforma",
  LOJISTA:          "Proprietário",
  GESTOR:           "Gestor",
  OPERADOR:         "Operador",
  OPERADOR_POS:     "Operador POS",
  MARKETING:        "Marketing",
  FINANCEIRO:       "Financeiro",
};

// Roles que um LOJISTA pode atribuir a membros da equipa
export const ROLES_ATRIBUIVEIS: RoleUtilizador[] = [
  "GESTOR", "OPERADOR", "OPERADOR_POS", "MARKETING", "FINANCEIRO",
];

// Nav links visíveis por role
export const NAV_POR_ROLE: Record<string, Recurso[]> = {
  LOJISTA:          ["dashboard", "produtos", "pedidos", "clientes", "marketing", "envios", "qrcode", "relatorios", "exportar", "equipa", "notificacoes", "configuracoes", "auditlog"],
  GESTOR:           ["dashboard", "produtos", "pedidos", "clientes", "marketing", "envios", "qrcode", "relatorios", "exportar", "notificacoes", "configuracoes", "auditlog"],
  OPERADOR:         ["pedidos", "produtos", "clientes", "notificacoes"],
  MARKETING:        ["marketing", "qrcode", "relatorios", "notificacoes"],
  FINANCEIRO:       ["relatorios", "exportar", "pedidos", "notificacoes"],
  ADMIN_PLATAFORMA: ["dashboard", "produtos", "pedidos", "clientes", "marketing", "envios", "qrcode", "relatorios", "exportar", "equipa", "notificacoes", "configuracoes", "auditlog"],
};
