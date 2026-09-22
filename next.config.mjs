/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  // Requis par react-pdf/pdfjs-dist : le module optionnel "canvas" (rendu
  // PDF côté Node) n'est utilisé que dans un environnement serveur sans
  // navigateur. On désactive sa résolution pour que Webpack ne tente pas de
  // l'empaqueter (il ne sert à rien ici : le rendu se fait dans le
  // navigateur du visiteur, jamais côté serveur).
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
