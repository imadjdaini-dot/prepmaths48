// src/lib/auth-errors.ts
// يحوّل رمز الخطأ القادم من NextAuth إلى رسالة واضحة للتلميذ

export function authErrorMessage(code: string | null | undefined): string {
  switch (code) {
    case "ACCOUNT_SUSPENDED":
      return "Ton compte est suspendu. Contacte ton professeur ou l'administration Prép-Maths48 pour le réactiver.";
    case "DEVICE_LIMIT":
      return "Ton compte a été suspendu automatiquement : il a été utilisé sur plus de 2 appareils. Contacte ton professeur pour le réactiver.";
    default:
      // CredentialsSignin وأي خطأ آخر غير متوقع
      return "Email ou mot de passe incorrect.";
  }
}
