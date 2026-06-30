import BreadcrumbSchema from "@/components/BreadcrumbSchema";
import BreadcrumbNav from "@/components/BreadcrumbNav";

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://minhair.vercel.app';
  return (
    <>
      <BreadcrumbSchema items={[
        { name: "Trang chủ", url: baseUrl },
        { name: "Blog", url: `${baseUrl}/blog` },
      ]} />
      <div className="max-w-5xl mx-auto px-3 sm:px-6 pt-4">
        <BreadcrumbNav items={[
          { name: "Trang chủ", url: "/" },
          { name: "Blog", url: "/blog" },
        ]} />
      </div>
      {children}
    </>
  );
}
