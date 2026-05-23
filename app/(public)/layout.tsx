import Footer from "@/src/shared/components/footer/Footer";
import Header from "@/src/shared/components/header/Header";


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
        <Header />
        {children}
        <Footer />
    </>
  );
}
