export interface NavItem {
  label: string;
  icon: string;
  route?: string;
  action?: 'logout';
  children?: NavItem[];
  /** Si es true, la opción solo se muestra a usuarios con rol "Administrador". */
  adminOnly?: boolean;
}
