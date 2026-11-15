import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Une seule adresse pour le site : www.dealbus.fr renvoie vers dealbus.fr.
  // Sans cela, Google voit deux fois chaque page.
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.dealbus.fr" }],
        destination: "https://dealbus.fr/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
