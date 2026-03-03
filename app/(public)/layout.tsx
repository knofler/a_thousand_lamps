import NavBar from '@/components/ui/NavBar';
import Footer from '@/components/ui/Footer';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NavBar />
      <main className="pt-16">{children}</main>
      <Footer />
    </>
  );
}
