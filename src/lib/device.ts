// src/lib/device.ts
// أدوات مشتركة لإدارة أجهزة التلميذ

// أقصى عدد أجهزة مسموح به للتلميذ
export const MAX_DEVICES = 2;

// يحوّل User-Agent إلى وصف مقروء مثل "Chrome · Windows"
// (لا نخزّن عنوان IP عمداً: بيانات شخصية لا نحتاجها لهذه الميزة)
export function describeDevice(userAgent: string | undefined | null): string {
  if (!userAgent) return "Appareil inconnu";

  // الترتيب مهم: Edge وOpera يحتويان على "Chrome"، وChrome يحتوي على "Safari"
  const browser = /Edg\//.test(userAgent)
    ? "Edge"
    : /OPR\/|Opera/.test(userAgent)
      ? "Opera"
      : /Firefox\//.test(userAgent)
        ? "Firefox"
        : /Chrome\//.test(userAgent)
          ? "Chrome"
          : /Safari\//.test(userAgent)
            ? "Safari"
            : "Navigateur";

  // الترتيب مهم: iPhone يحتوي على "Mac OS X"، وAndroid يحتوي على "Linux"
  const os = /Windows/.test(userAgent)
    ? "Windows"
    : /Android/.test(userAgent)
      ? "Android"
      : /iPhone|iPad|iPod/.test(userAgent)
        ? "iOS"
        : /Mac OS X/.test(userAgent)
          ? "macOS"
          : /Linux/.test(userAgent)
            ? "Linux"
            : "Système inconnu";

  return `${browser} · ${os}`;
}
