export function translateAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (m.includes("email not confirmed")) return "Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.";
  if (m.includes("already registered") || m.includes("already been registered"))
    return "Este e-mail já está cadastrado. Tente entrar.";
  if (m.includes("password") && (m.includes("at least") || m.includes("short")))
    return "A senha deve ter pelo menos 6 caracteres.";
  if (m.includes("weak") || m.includes("pwned") || m.includes("leaked"))
    return "Essa senha é muito comum ou já vazou. Escolha uma senha mais forte.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
  if (m.includes("invalid email") || m.includes("unable to validate email"))
    return "Informe um e-mail válido.";
  return "Não foi possível concluir. Tente novamente.";
}
